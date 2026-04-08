import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { ReportFields, ExtractMetadata } from './report-schema';
import { getExtractionPromptSection, getToolSchemaDescriptions, validateAllFields, EXTRACTION_CONFIG } from './field-extraction-config';
import type { ValidationError } from './field-extraction-config';

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

const SYSTEM_PROMPT = `당신은 AX(AI Transformation) 기업 진단 미팅 노트에서 구조화된 데이터를 추출하는 전문가입니다.

오늘 날짜: ${getTodayString()}

컨설팅 미팅 노트가 주어지면, 다음 데이터를 최대한 정확하게 추출하세요:

## 기본 추출 규칙
- 노트에 명시된 정보 → 그대로 추출
- 노트에 없는 정보 → null 반환
- 애매한 정보 → 최선의 추정값 입력 + lowConfidenceFields에 해당 필드명 추가
- 점수(1.0~5.0) → 노트 내용 기반으로 판단, 근거 부족 시 lowConfidenceFields에 추가
- 모든 텍스트는 한국어로 작성
- diagnosisDate: 노트에 연도가 생략된 경우(예: "4월 3일", "04.03") 올해 연도(${new Date().getFullYear()}년)를 적용하세요

## 사전 설문 응답 활용 규칙
입력에 [사전 설문 구조화 데이터] 섹션이 있으면 다음 규칙을 따르세요:
- [직접매핑완료] 표시된 필드(companyName, industry, revenue, customerType, employees, aiBudget, aiSpecialists, aiStage, scores, targetDepts.phase1, collaborationTool)는 이미 별도 처리됨 → 해당 필드는 null로 반환해도 됩니다 (서버에서 설문값으로 대체됨)
- [LLM 판단 필요] 표시된 설문 데이터는 미팅 노트와 결합하여 다음 필드를 생성하세요:
  - C1(희망영역) + C2(상황서술) + I8(핵심반복업무) + I3(반복업무시간) → painPoints 배열 생성
  - D1(장벽순위) + D2(규제) + D3(보안우려) + J4~J6(보안 관련) → swot.weaknesses + swot.threats
  - J1(경쟁사) + J2(정부지원) + J3(환경변화) → externalEnv 3개 필드 + swot.opportunities
  - I4(보고서시간) + J8(월간건수) + J9(데이터취합시간) + I3(반복업무시간) → KPI ROI 수치 계산에 반영
  - J11(가상인턴업무) + C4(자동화희망) → innovationTasks 최우선 과제(P1)로 반영
  - J14(성공기준) + G1(기대효과) → kpis 항목 맞춤화
  - J17(미래비전) → Executive Summary 도입 문구 및 로드맵 방향에 반영
  - J12(퇴사자수) + J13(온보딩기간) → 지식관리/온보딩 자동화 과제 필요성 판단
  - J15(최근도입경험) + B10(변화수용문화) → 변화관리 전략 강도 결정
  - J16(인간업무경계) → AI 도입 범위 제한 사항으로 swot, crossStrategies에 반영

## 추출 순서 규칙
반드시 아래 순서대로 추출하세요. 복합계산 필드는 의존 필드가 먼저 완성된 후 생성해야 합니다.
${getExtractionPromptSection()}`;

const toolDescs = getToolSchemaDescriptions();

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_report_data',
  description: 'Extract structured report data from meeting notes',
  input_schema: {
    type: 'object' as const,
    properties: {
      companyName: { type: ['string', 'null'], description: toolDescs.companyName || '기업명 (정식 법인명)' },
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
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            module: { type: 'string', description: '대응 모듈 (A~F)' },
            urgency: { type: 'string', description: '높음/중간/낮음' },
          },
        },
      },
      recommendedPath: { type: ['array', 'null'], items: { type: 'string' }, description: '권장 모듈 순서' },
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
      diagnosisDate: { type: ['string', 'null'], description: toolDescs.diagnosisDate || 'YYYY.MM.DD' },
      consultantName: { type: ['string', 'null'], description: toolDescs.consultantName || '컨설턴트명' },
      interviewInfo: {
        type: ['object', 'null'],
        properties: {
          participants: { type: 'string' },
          date: { type: 'string' },
        },
      },
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
        description: toolDescs.crossStrategies || 'SWOT 교차 전략',
        properties: {
          so: { type: 'string', description: '강점×기회 공격 전략 (2~3문장)' },
          wo: { type: 'string', description: '약점×기회 개선 전략 (2~3문장)' },
          st: { type: 'string', description: '강점×위협 방어 전략 (2~3문장)' },
          wt: { type: 'string', description: '약점×위협 생존 전략 (2~3문장)' },
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

export async function analyzeMeetingNotes(
  notes: string
): Promise<{ fields: ReportFields; metadata: ExtractMetadata }> {
  const client = new Anthropic({
    apiKey: getApiKey(),
  });

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    tools: [EXTRACT_TOOL],
    tool_choice: { type: 'tool', name: 'extract_report_data' },
    messages: [
      {
        role: 'user',
        content: `다음 미팅 노트에서 AX 기업 진단 리포트에 필요한 데이터를 추출해주세요. 기본 정보뿐 아니라, 부서별 Pain Point, 내부 역량 진단, SWOT 교차 전략, Gap 분석, 혁신 과제, 세부 추진 계획, 간트 차트 일정까지 모두 생성해주세요:\n\n${notes}`,
      },
    ],
  });

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

  // diagnosisDate 연도 보정: 연도 누락 또는 현재 연도와 동떨어진 경우 현재 연도 적용
  if (fields.diagnosisDate) {
    const currentYear = new Date().getFullYear();
    const dateMatch = fields.diagnosisDate.match(/^(\d{4})\.(\d{2})\.(\d{2})$/);
    if (dateMatch) {
      const extractedYear = parseInt(dateMatch[1], 10);
      // 현재 연도와 1년 이상 차이나면 현재 연도로 보정
      if (Math.abs(extractedYear - currentYear) > 1) {
        fields.diagnosisDate = `${currentYear}.${dateMatch[2]}.${dateMatch[3]}`;
      }
    } else {
      // MM.DD 또는 M월 D일 형식만 추출된 경우 현재 연도 붙이기
      const shortMatch = fields.diagnosisDate.match(/^(\d{1,2})\.(\d{1,2})$/);
      if (shortMatch) {
        fields.diagnosisDate = `${currentYear}.${shortMatch[1].padStart(2, '0')}.${shortMatch[2].padStart(2, '0')}`;
      }
    }
  } else {
    // diagnosisDate가 null이면 오늘 날짜로 기본 설정
    fields.diagnosisDate = getTodayString();
  }

  // 기본값 보정: null인 필드에 config의 defaultValue 적용
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
