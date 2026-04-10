import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ReportFields, ExtractMetadata } from './report-schema';
import { getExtractionPromptSection, getToolSchemaDescriptions, validateAllFields, EXTRACTION_CONFIG } from './field-extraction-config';
import type { ValidationError } from './field-extraction-config';
import type { ExtractedMeta } from './meta-extractor';

function getApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const envPath = join(process.cwd(), '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch {}
  throw new Error('ANTHROPIC_API_KEY not found');
}

function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

function getBaseSystemPrompt(): string {
  return `당신은 AX(AI Transformation) 기업 진단 미팅 노트에서 구조화된 데이터를 추출하는 전문가입니다.

오늘 날짜: ${getTodayString()}

컨설팅 미팅 노트가 주어지면, 다음 데이터를 최대한 정확하게 추출하세요:

## 기본 추출 규칙
- 노트에 명시된 정보 → 그대로 추출
- 노트에 없는 정보 → null 반환
- 애매한 정보 → 최선의 추정값 입력 + lowConfidenceFields에 해당 필드명 추가
- 점수(1.0~5.0) → 노트 내용 기반으로 판단, 근거 부족 시 lowConfidenceFields에 추가
- 모든 텍스트는 한국어로 작성

## 사전 설문 응답 활용 규칙
입력에 [사전 설문 구조화 데이터] 섹션이 있으면 다음 규칙을 따르세요:
- [직접매핑완료] 표시된 필드(industry, revenue, customerType, employees, aiBudget, aiSpecialists, aiStage, scores, collaborationTool)는 이미 별도 처리됨 → 해당 필드는 null로 반환해도 됩니다 (서버에서 설문값으로 대체됨)
- [파생 계산 결과] 섹션의 수치를 반드시 참조하여 다음 필드에 반영하세요:
  - reportWritingMonthlyHours → painPoints의 보고서 관련 weeklyHours 및 kpis.costSaving 산출 근거
  - repetitiveMonthlyHours → painPoints 정량화, innovationTasks 효과 추정
  - securityRisk → swot.weaknesses에 보안 항목 강도, internalCapabilities 보안 수준
  - competitiveThreat → swot.threats에 경쟁 항목 강도, externalEnv.competitors
  - changeReadiness → gapAnalysis 인재역량 GAP 수준, 교육 강도 판단
  - communicationLoad → painPoints에 커뮤니케이션 병목 항목 포함 여부
- [LLM 판단 필요] 표시된 설문 데이터는 각 질문 옆에 명시된 [대상 필드]와 힌트를 참조하여 생성하세요:
  - Pain Point 그룹 (C1+C2+C3+I2+I3+I4+I5+J11) → painPoints, innovationTasks, findings, coreProblem
  - 장벽/보안 그룹 (D1+D2+D3+J4+J5+J6+H8) → swot.weaknesses, swot.threats, internalCapabilities
  - 협업 그룹 (E1+E2+J7) → painPoints(협업), internalCapabilities(조직문화)
  - 외부환경 그룹 (J1+J2+J3) → externalEnv, swot.opportunities, swot.threats
  - 조직/인력 그룹 (A2+A3+A5+F3+J12+J13+J15) → internalCapabilities, gapAnalysis, sponsor
  - 예산/KPI 그룹 (F1+F2+G1+J8+J9+J14) → kpis, recommendedPath
  - 비전 그룹 (G2+J10+J16+J17) → coreProblem, topTasks, recommendedPath, crossStrategies

## 추출 순서 규칙
반드시 아래 순서대로 추출하세요. 복합계산 필드는 의존 필드가 먼저 완성된 후 생성해야 합니다.
${getExtractionPromptSection()}`;
}

/**
 * 메타데이터(기업명/진단일/컨설턴트명/참여자)가 이미 정규식으로 추출되었음을 Claude에 알리고,
 * 이 값들이 분석 필드(businessDesc, findings, crossStrategies 등)에 재진술되지 않도록
 * 금지어 규칙을 프롬프트에 주입합니다.
 */
function buildSystemPrompt(meta: ExtractedMeta | null): string {
  const base = getBaseSystemPrompt();
  if (!meta) return base;

  const forbidden: string[] = [];
  if (meta.companyName) forbidden.push(`- 기업명: "${meta.companyName}"`);
  if (meta.consultantName) forbidden.push(`- 컨설턴트명: "${meta.consultantName}"`);
  if (meta.diagnosisDate) forbidden.push(`- 진단일: "${meta.diagnosisDate}"`);
  if (meta.participants) forbidden.push(`- 인터뷰 참여자: "${meta.participants}"`);

  if (forbidden.length === 0) return base;

  return base + `

## 🚫 재진술 금지 규칙 (엄격)
아래 값들은 이미 별도 메타데이터로 관리되고 있으며, 표지·헤더 등에서 직접 렌더링됩니다.
이 추출 작업에서는 어떤 필드에도 아래 값들을 포함하지 마세요:

${forbidden.join('\n')}

준수 사항:
- businessDesc, findings, coreProblem, painPoints, crossStrategies, swot, gapAnalysis, innovationTasks, detailedPlans 등 **모든 분석 필드**에 위 값들을 직접 언급하거나 재진술하지 말 것
- 기업을 지칭할 때는 "귀사", "해당 기업", "조직" 등 대명사 사용
- 날짜를 지칭할 때는 "진단 시점", "최근", "현재" 등 상대 표현 사용
- 컨설턴트나 참여자를 지칭할 때는 "담당자", "경영진", "실무진" 등 직책 기반 표현 사용

위 규칙을 어기면 후속 렌더링 단계에서 표지와 본문에 동일 정보가 중복되어 리포트 품질이 저하됩니다.`;
}

const toolDescs = getToolSchemaDescriptions();

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_report_data',
  description: 'Extract structured report data from meeting notes',
  input_schema: {
    type: 'object' as const,
    properties: {
      // companyName 제거 — 정규식(meta-extractor)으로 서버 주입
      industry: { type: ['string', 'null'], description: toolDescs.industry || '업종/산업군' },
      employees: {
        type: ['object', 'null'],
        properties: {
          total: { type: 'number' },
          regular: { type: 'number' },
          contract: { type: 'number' },
        },
      },
      revenue: { type: ['string', 'null'], description: toolDescs.revenue || '연매출 규모' },
      businessDesc: { type: ['string', 'null'], description: toolDescs.businessDesc || '주요 사업 내용' },
      customerType: { type: ['string', 'null'], description: toolDescs.customerType || '고객 유형' },
      aiStage: { type: ['number', 'null'], description: toolDescs.aiStage || 'AI 도입 단계 (1-5)' },
      scores: {
        type: ['object', 'null'],
        properties: {
          strategy: { type: 'number', description: 'AI 전략 점수 (1.0~5.0)' },
          data: { type: 'number', description: '데이터 인프라 점수' },
          process: { type: 'number', description: '프로세스 AI화 점수' },
          talent: { type: 'number', description: '인재/조직 역량 점수' },
          tech: { type: 'number', description: '기술 환경 점수' },
        },
      },
      coreProblem: { type: ['string', 'null'], description: toolDescs.coreProblem || '핵심 문제 키워드' },
      aiBudget: {
        type: ['object', 'null'],
        properties: {
          toolSubscription: { type: 'string', description: 'AI 도구 구독료 (월)' },
          educationBudget: { type: 'string', description: 'AI 교육 예산 (연)' },
        },
      },
      aiSpecialists: { type: ['number', 'null'], description: toolDescs.aiSpecialists || 'AI 전담 인력 수' },
      topTasks: {
        type: ['array', 'null'],
        description: '우선 과제 (정확히 4개). 각 과제는 name, module, urgency를 가져야 하며, 4개의 module 값은 서로 달라야 하며 논리적 도입 순서([A]→[B]→[C]→[D] 또는 유사)로 배열할 것. 권장 경로가 이 module 순서 그대로 렌더링됨.',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            module: { type: 'string', description: '대응 모듈 ([A] 워크숍 / [B] 컨설팅 / [C] 교육 / [D] 해커톤 / [E] 고도화 / [F] 운영)' },
            urgency: { type: 'string', description: '높음/중간/낮음' },
          },
        },
      },
      recommendedPath: { type: ['array', 'null'], items: { type: 'string' }, description: '사용하지 않음 — topTasks의 module 값 4개가 권장 경로로 자동 렌더링됨. null 반환 가능.' },
      swot: {
        type: ['object', 'null'],
        properties: {
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
          opportunities: { type: 'array', items: { type: 'string' } },
          threats: { type: 'array', items: { type: 'string' } },
        },
      },
      externalEnv: {
        type: ['object', 'null'],
        properties: {
          industryAiRate: { type: 'string' },
          competitors: { type: 'string' },
          govSupport: { type: 'string' },
        },
      },
      targetDepts: {
        type: ['object', 'null'],
        properties: {
          phase1: { type: 'string' },
          phase2: { type: 'string' },
        },
      },
      sponsor: { type: ['string', 'null'], description: toolDescs.sponsor || '스폰서 (대표/C-Level)' },
      kpis: {
        type: ['object', 'null'],
        properties: {
          automationRate: { type: 'string', description: '자동화율 목표 (예: 5%→30%)' },
          aiLeaders: { type: 'string', description: 'AX 리더 양성 수 (숫자만)' },
          costSaving: { type: 'string', description: '비용 절감 목표 (예: 월 200만원)' },
          aiServices: { type: 'string', description: 'AI 서비스 론칭 수 (숫자만)' },
          devLeadTime: { type: 'string', description: '개발 리드타임 단축 (예: 5일→2일)' },
          dataDecisions: { type: 'string', description: '월간 데이터 의사결정 건수 (예: 10건)' },
          aiUsers: { type: 'string', description: 'AI 활용 인력 확대 (예: 5명→40명)' },
        },
      },
      // diagnosisDate, consultantName, interviewInfo 제거 — 정규식(meta-extractor)으로 서버 주입
      // ── 확장 필드 ──
      painPoints: {
        type: ['array', 'null'],
        description: toolDescs.painPoints || '부서별 업무 Pain Point 분석',
        items: {
          type: 'object',
          properties: {
            dept: { type: 'string', description: '부서명' },
            task: { type: 'string', description: '핵심 업무' },
            painPoint: { type: 'string', description: '문제점' },
            weeklyHours: { type: 'string', description: '주당 소요 시간 (예: 15h)' },
            aiApplicability: { type: 'string', description: 'AI 적용 가능성 (★1~5개)' },
            priority: { type: 'string', description: '우선순위 (높음/중간/낮음)' },
          },
        },
      },
      findings: {
        type: ['array', 'null'],
        items: { type: 'string' },
        description: toolDescs.findings || '핵심 인사이트 3~5개',
      },
      internalCapabilities: {
        type: ['array', 'null'],
        description: toolDescs.internalCapabilities || '내부 역량 진단',
        items: {
          type: 'object',
          properties: {
            area: { type: 'string', description: '진단 영역 (경영진 리더십/조직 문화/인적 역량/데이터 자산/IT 인프라/업무 프로세스/재무 여력)' },
            summary: { type: 'string', description: '현황 요약' },
            level: { type: 'string', description: '수준 (양호/보통/미흡)' },
            issue: { type: 'string', description: '핵심 이슈' },
          },
        },
      },
      collaborationTool: { type: ['string', 'null'], description: toolDescs.collaborationTool || '협업 도구' },
      aiApplicationAreas: { type: ['string', 'null'], description: toolDescs.aiApplicationAreas || '업종별 AI 적용 영역' },
      crossStrategies: {
        type: ['object', 'null'],
        description: toolDescs.crossStrategies || 'SWOT 교차 전략 — 반드시 조코딩 AX 파트너스의 서비스([A] 워크숍, [B] 컨설팅, [C] 교육, [D] 해커톤, [E] 고도화)를 활용한 해결책 중심으로 작성. 정부 지원 프로그램, 외부 교육기관, 타사 컨설팅 등 조코딩 AX 파트너스와 무관한 솔루션은 절대 언급하지 말 것.',
        properties: {
          so: { type: 'string', description: '강점×기회 공격 전략 (2~3문장). 조코딩 AX 파트너스의 서비스를 활용한 구체적 실행 방안 중심으로 작성' },
          wo: { type: 'string', description: '약점×기회 개선 전략 (2~3문장). 조코딩 AX 파트너스의 교육·컨설팅으로 약점을 보완하는 방안 중심으로 작성' },
          st: { type: 'string', description: '강점×위협 방어 전략 (2~3문장). 조코딩 AX 파트너스와 함께 위협에 대응하는 방안 중심으로 작성' },
          wt: { type: 'string', description: '약점×위협 생존 전략 (2~3문장). 조코딩 AX 파트너스의 장기 내재화 프로그램을 통한 체질 전환 중심으로 작성' },
        },
      },
      gapAnalysis: {
        type: ['array', 'null'],
        description: toolDescs.gapAnalysis || 'Gap As-Is/To-Be 분석',
        items: {
          type: 'object',
          properties: {
            area: { type: 'string', description: '영역 (AI 전략/데이터/프로세스/인재역량/기술환경)' },
            asIs: { type: 'string', description: '현재 상태 서술' },
            toBe: { type: 'string', description: '목표 상태 서술' },
            action: { type: 'string', description: '핵심 전환 액션' },
          },
        },
      },
      innovationTasks: {
        type: ['array', 'null'],
        description: toolDescs.innovationTasks || 'AX 혁신 과제 리스트',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '과제명' },
            dept: { type: 'string', description: '담당 부서' },
            type: { type: 'string', description: '유형 (자동화/생성AI/챗봇/데이터/인프라 등)' },
            difficulty: { type: 'string', description: '난이도 (상/중/하)' },
            effect: { type: 'string', description: '효과 (★1~5개)' },
            priority: { type: 'string', description: '우선순위 (P1/P2/P3)' },
          },
        },
      },
      detailedPlans: {
        type: ['array', 'null'],
        description: toolDescs.detailedPlans || 'P1 과제 세부 추진 계획',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '과제명' },
            method: { type: 'string', description: '추진 방법 (1~2문장)' },
            owner: { type: 'string', description: '담당 (예: 재무 챔피언 + AX Master)' },
            duration: { type: 'string', description: '기간 (예: 4주)' },
            criteria: { type: 'string', description: '성공 기준 (예: 작성 시간 70%↓)' },
          },
        },
      },
      ganttTasks: {
        type: ['array', 'null'],
        description: toolDescs.ganttTasks || '간트 차트 일정',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: '과제명' },
            priority: { type: 'string', description: 'P1/P2/P3' },
            startWeek: { type: 'number', description: '시작 주차 (1~16)' },
            durationWeeks: { type: 'number', description: '소요 주수' },
          },
        },
      },
      milestones: {
        type: ['array', 'null'],
        description: toolDescs.milestones || '마일스톤 (M1~M4)',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: '시점 (예: M1 말, M2 말)' },
            items: { type: 'string', description: '달성 항목 (줄바꿈으로 구분, 예: P1 과제 1건+ PoC 완료\\n전 직원 워크숍 완료)' },
          },
        },
      },
      lowConfidenceFields: {
        type: 'array',
        items: { type: 'string' },
        description: '추정값을 넣은 필드명 목록',
      },
    },
    required: ['lowConfidenceFields'],
  },
};

// ── 후처리: tool_use 응답 → ReportFields + metadata ──

function processToolResponse(
  response: Anthropic.Message,
): { fields: ReportFields; metadata: ExtractMetadata } {
  const toolBlock = response.content.find((b) => b.type === 'tool_use');
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude API did not return tool_use response');
  }

  const raw = toolBlock.input as Record<string, unknown>;
  const lowConfidenceFields = (raw.lowConfidenceFields as string[]) || [];

  const fields: ReportFields = {
    companyName: (raw.companyName as string) ?? null,
    industry: (raw.industry as string) ?? null,
    employees: (raw.employees as ReportFields['employees']) ?? null,
    revenue: (raw.revenue as string) ?? null,
    businessDesc: (raw.businessDesc as string) ?? null,
    customerType: (raw.customerType as string) ?? null,
    aiStage: (raw.aiStage as number) ?? null,
    scores: (raw.scores as ReportFields['scores']) ?? null,
    coreProblem: (raw.coreProblem as string) ?? null,
    aiBudget: (raw.aiBudget as ReportFields['aiBudget']) ?? null,
    aiSpecialists: (raw.aiSpecialists as number) ?? null,
    topTasks: (raw.topTasks as ReportFields['topTasks']) ?? null,
    recommendedPath: (raw.recommendedPath as string[]) ?? null,
    swot: (raw.swot as ReportFields['swot']) ?? null,
    externalEnv: (raw.externalEnv as ReportFields['externalEnv']) ?? null,
    targetDepts: (raw.targetDepts as ReportFields['targetDepts']) ?? null,
    sponsor: (raw.sponsor as string) ?? null,
    kpis: (raw.kpis as ReportFields['kpis']) ?? null,
    diagnosisDate: (raw.diagnosisDate as string) ?? null,
    consultantName: (raw.consultantName as string) ?? null,
    interviewInfo: (raw.interviewInfo as ReportFields['interviewInfo']) ?? null,
    painPoints: (raw.painPoints as ReportFields['painPoints']) ?? null,
    findings: (raw.findings as string[]) ?? null,
    internalCapabilities: (raw.internalCapabilities as ReportFields['internalCapabilities']) ?? null,
    collaborationTool: (raw.collaborationTool as string) ?? null,
    aiApplicationAreas: (raw.aiApplicationAreas as string) ?? null,
    crossStrategies: (raw.crossStrategies as ReportFields['crossStrategies']) ?? null,
    gapAnalysis: (raw.gapAnalysis as ReportFields['gapAnalysis']) ?? null,
    innovationTasks: (raw.innovationTasks as ReportFields['innovationTasks']) ?? null,
    detailedPlans: (raw.detailedPlans as ReportFields['detailedPlans']) ?? null,
    ganttTasks: (raw.ganttTasks as ReportFields['ganttTasks']) ?? null,
    milestones: (raw.milestones as ReportFields['milestones']) ?? null,
  };

  // diagnosisDate 연도 보정
  if (fields.diagnosisDate) {
    const currentYear = new Date().getFullYear();
    const dateMatch = fields.diagnosisDate.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    if (dateMatch) {
      const extractedYear = parseInt(dateMatch[1], 10);
      if (Math.abs(extractedYear - currentYear) > 1) {
        fields.diagnosisDate = `${currentYear}.${dateMatch[2]}.${dateMatch[3]}`;
      }
    } else {
      const shortMatch = fields.diagnosisDate.match(/^(\d{1,2})\.(\d{1,2})$/);
      if (shortMatch) {
        fields.diagnosisDate = `${currentYear}.${shortMatch[1].padStart(2, '0')}.${shortMatch[2].padStart(2, '0')}`;
      }
    }
  } else {
    fields.diagnosisDate = getTodayString();
  }

  // 기본값 보정
  for (const cfg of EXTRACTION_CONFIG) {
    const key = cfg.key as keyof ReportFields;
    if (fields[key] == null && cfg.defaultValue !== undefined) {
      (fields as unknown as Record<string, unknown>)[cfg.key] = cfg.defaultValue;
    }
  }

  // 유효성 검증
  const validationErrors = validateAllFields(fields);
  const validationFieldNames = validationErrors.map((e: ValidationError) => e.field);
  const mergedLow = [...new Set([...lowConfidenceFields, ...validationFieldNames])];

  const fieldKeys = Object.keys(fields) as (keyof ReportFields)[];
  const fieldsExtracted = fieldKeys.filter((k) => fields[k] != null).length;
  const fieldsMissing = fieldKeys.length - fieldsExtracted;

  return {
    fields,
    metadata: {
      fieldsExtracted,
      fieldsMissing,
      lowConfidenceFields: mergedLow,
      validationErrors: validationErrors.map((e: ValidationError) => ({ field: e.field, message: e.message })),
    },
  };
}

const USER_MESSAGE = '다음 미팅 노트에서 AX 기업 진단 리포트에 필요한 데이터를 추출해주세요. 기본 정보뿐 아니라, 부서별 Pain Point, 내부 역량 진단, SWOT 교차 전략, Gap 분석, 혁신 과제, 세부 추진 계획, 간트 차트 일정까지 모두 생성해주세요:\n\n';

function buildModelParams(meta: ExtractedMeta | null) {
  return {
    model: 'claude-sonnet-4-20250514' as const,
    max_tokens: 8192,
    temperature: 0,
    system: buildSystemPrompt(meta),
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool' as const, name: 'extract_report_data' },
  };
}

export async function analyzeMeetingNotes(
  notes: string,
  meta?: ExtractedMeta | null,
): Promise<{ fields: ReportFields; metadata: ExtractMetadata }> {
  const client = new Anthropic({ apiKey: getApiKey() });

  const response = await client.messages.create({
    ...buildModelParams(meta ?? null),
    messages: [{ role: 'user', content: USER_MESSAGE + notes }],
  });

  return processToolResponse(response);
}

export async function analyzeMeetingNotesStream(
  notes: string,
  onProgress: (message: string) => void,
  meta?: ExtractedMeta | null,
): Promise<{ fields: ReportFields; metadata: ExtractMetadata }> {
  const client = new Anthropic({ apiKey: getApiKey() });

  onProgress('Claude API 연결 중...');

  const stream = client.messages.stream({
    ...buildModelParams(meta ?? null),
    messages: [{ role: 'user', content: USER_MESSAGE + notes }],
  });

  const estimatedTotal = 8000;
  let lastProgressTime = Date.now();
  let accumulatedLength = 0;

  stream.on('inputJson', (_partialJson: string, snapshot: unknown) => {
    const now = Date.now();
    if (now - lastProgressTime >= 5000) {
      accumulatedLength = typeof snapshot === 'string' ? snapshot.length : JSON.stringify(snapshot).length;
      const pct = Math.min(95, Math.round(accumulatedLength / estimatedTotal * 100));
      onProgress(`데이터 추출 중... (${pct}%)`);
      lastProgressTime = now;
    }
  });

  const finalMessage = await stream.finalMessage();

  onProgress('후처리 중...');

  return processToolResponse(finalMessage);
}
