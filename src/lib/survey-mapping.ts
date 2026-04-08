import type { ReportFields } from './report-schema';

// ── 설문 응답 파싱: 헤더 [ID] 매칭 → { A1: "값", B1: "3", ... } ──

export function parseSurveyAnswers(
  headers: string[],
  dataRow: string[],
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const value = dataRow[i]?.trim();
    if (!value) continue;
    const idMatch = headers[i].match(/\[([A-Z]\d+)\]/);
    if (idMatch) {
      answers[idMatch[1]] = value;
    } else if (
      headers[i].includes('타임스탬프') ||
      headers[i].includes('timestamp')
    ) {
      answers['_timestamp'] = value;
    }
  }
  return answers;
}

// ── 숫자 파싱 유틸 ──

function parseNumericAnswer(value: string | undefined): number | null {
  if (!value) return null;
  // ①②③④⑤ → 1~5
  const circled = '①②③④⑤⑥⑦⑧⑨⑩'.indexOf(value.charAt(0));
  if (circled >= 0) return Math.floor(circled / 1) + 1; // ①=0→1, ②=1→2
  // 숫자 추출
  const num = parseFloat(value.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? null : num;
}

function parseCircledNumber(value: string | undefined): number | null {
  if (!value) return null;
  const map: Record<string, number> = {
    '①': 1, '②': 2, '③': 3, '④': 4, '⑤': 5,
    '⑥': 6, '⑦': 7, '⑧': 8, '⑨': 9, '⑩': 10,
  };
  // "③ 부분 표준화" → 3
  for (const [k, v] of Object.entries(map)) {
    if (value.includes(k)) return v;
  }
  // "3" or just number
  const n = parseInt(value, 10);
  return isNaN(n) ? null : n;
}

// ── 구간 → 중간값 매핑 ──

const EMPLOYEE_RANGE_MAP: Record<string, number> = {
  '1~50명': 25, '1~50': 25,
  '51~100명': 75, '51~100': 75,
  '101~300명': 200, '101~300': 200,
  '301~1000명': 650, '301~1000': 650,
  '1000명 이상': 1500, '1000': 1500,
};

const REGULAR_RATIO_MAP: Record<string, number> = {
  '90% 이상': 0.95,
  '70~90%': 0.8,
  '50~70%': 0.6,
  '50% 미만': 0.4,
};

function matchEmployeeRange(value: string): number | null {
  for (const [key, mid] of Object.entries(EMPLOYEE_RANGE_MAP)) {
    if (value.includes(key)) return mid;
  }
  const n = parseCircledNumber(value);
  if (n !== null) {
    const ranges = [25, 75, 200, 650, 1500];
    return ranges[n - 1] ?? null;
  }
  return null;
}

function matchRegularRatio(value: string): number {
  for (const [key, ratio] of Object.entries(REGULAR_RATIO_MAP)) {
    if (value.includes(key)) return ratio;
  }
  // ① 90% 이상, ② 70~90%, ...
  const n = parseCircledNumber(value);
  if (n !== null) {
    const ratios = [0.95, 0.8, 0.6, 0.4];
    return ratios[n - 1] ?? 0.8;
  }
  return 0.8; // 기본값
}

// ── B1~B10 → 5개 도메인 점수 계산 ──

export function computeScoresFromSurvey(
  answers: Record<string, string>,
): ReportFields['scores'] | null {
  const b: Record<string, number | null> = {};
  for (let i = 1; i <= 10; i++) {
    b[`B${i}`] = parseCircledNumber(answers[`B${i}`]);
  }

  // 최소 5개 이상의 B 질문에 응답해야 점수 계산
  const answered = Object.values(b).filter((v) => v !== null).length;
  if (answered < 5) return null;

  const avg = (...keys: string[]): number => {
    const vals = keys.map((k) => b[k]).filter((v): v is number => v !== null);
    if (vals.length === 0) return 2.5;
    return Math.round((vals.reduce((a, c) => a + c, 0) / vals.length) * 10) / 10;
  };

  return {
    strategy: b.B9 ?? 2.5,       // AI 전략 & 리더십
    data: avg('B7', 'B8'),        // 데이터 인프라
    process: avg('B1', 'B2', 'B4'), // 업무 프로세스 AI 적용도
    talent: b.B10 ?? 2.5,         // 인재 & 조직 역량
    tech: avg('B3', 'B5', 'B6'),  // 기술 환경 & 도구
  };
}

// ── 직접 매핑: 설문 → Partial<ReportFields> ──

export function prefillFieldsFromSurvey(
  answers: Record<string, string>,
): Partial<ReportFields> {
  const fields: Partial<ReportFields> = {};

  // A1 → companyName
  if (answers.A1) fields.companyName = answers.A1;

  // H1 → industry
  if (answers.H1) fields.industry = answers.H1;

  // H2 → revenue
  if (answers.H2) fields.revenue = answers.H2;

  // H3 → customerType
  if (answers.H3) fields.customerType = answers.H3;

  // A4 + H4 → employees
  const a4 = answers.A4;
  if (a4) {
    const total = matchEmployeeRange(a4);
    if (total !== null) {
      const ratio = answers.H4 ? matchRegularRatio(answers.H4) : 0.8;
      const regular = Math.round(total * ratio);
      fields.employees = { total, regular, contract: total - regular };
    }
  }

  // H5 → aiBudget.toolSubscription, H6 → aiBudget.educationBudget
  if (answers.H5 || answers.H6) {
    fields.aiBudget = {
      toolSubscription: answers.H5 || '미응답',
      educationBudget: answers.H6 || '미응답',
    };
  }

  // H7 → aiSpecialists
  if (answers.H7) {
    const n = parseNumericAnswer(answers.H7);
    if (n !== null) fields.aiSpecialists = n;
  }

  // B6 → aiStage
  if (answers.B6) {
    const stage = parseCircledNumber(answers.B6);
    if (stage !== null && stage >= 1 && stage <= 5) fields.aiStage = stage;
  }

  // B1~B10 → scores
  const scores = computeScoresFromSurvey(answers);
  if (scores) fields.scores = scores;

  // I6 → targetDepts.phase1
  if (answers.I6) {
    fields.targetDepts = {
      phase1: answers.I6,
      phase2: '',
    };
  }

  // G2 → targetDepts 보강 (I6가 없으면 G2를 phase1로)
  if (answers.G2 && !fields.targetDepts) {
    fields.targetDepts = { phase1: answers.G2, phase2: '' };
  } else if (answers.G2 && fields.targetDepts && !fields.targetDepts.phase1) {
    fields.targetDepts.phase1 = answers.G2;
  }

  // I1 → collaborationTool
  if (answers.I1) fields.collaborationTool = answers.I1;

  return fields;
}

// ── LLM 컨텍스트용 구조화 텍스트 생성 ──

const QUESTION_LABELS: Record<string, string> = {
  A1: '회사명', A2: '담당자 성함', A3: '직급/직책', A4: '회사 규모', A5: '주요 업무 영역',
  B1: '프로세스 표준화 수준', B2: '병목 현상과 반복 업무', B3: '자동화/RPA 인프라',
  B4: '보고서/데이터 처리', B5: '도구 활용 수준', B6: 'AI 도구 인프라 및 활용',
  B7: '데이터 저장 및 관리', B8: '데이터 수집 및 거버넌스', B9: 'AX 비전 및 전략',
  B10: '조직 내 학습 및 변화 수용 문화',
  C1: 'AI 활용 희망 업무 영역', C2: '가장 힘든 상황/Pain Point', C3: '시간 많이 드는 업무',
  C4: '자동화 희망 업무',
  D1: '자동화 도입 장벽 순위', D2: '규제/인증 요구사항', D3: '보안/개인정보 우려',
  E1: '지식/정보 관리 문제', E2: '부서 간 협업 애로사항',
  F1: '솔루션 도입 기준 순위', F2: '예산 규모', F3: '최초 사용 인원',
  G1: 'AX 기대 효과', G2: '파일럿 부서/업무',
  H1: '업종/산업군', H2: '연 매출 규모', H3: '주요 고객층', H4: '정규직 비율',
  H5: '전사 AI 도구 구독료', H6: 'AI 교육 연간 지출', H7: 'AI/디지털 전담 인력',
  H8: '직원 개인별 AI 지출',
  I1: '사용 중인 주요 업무 도구', I2: '하루 평균 업무 알림 건수', I3: '주당 반복 업무 소요 시간',
  I4: '보고서 작성 소요 시간', I5: '승인/결재 대기 지연 빈도', I6: 'AX 우선 도입 부서',
  I7: '해당 부서 인원 수', I8: '부서 핵심 반복 업무 Top 3',
  J1: '경쟁사 AI 활용 수준', J2: 'AI 관련 정부 지원 현황', J3: '최근 사업 환경 변화',
  J4: '사내 AI 데이터 가이드라인', J5: '데이터 백업/복구 체계', J6: '직원 PC 보안 정책',
  J7: '부서 간 주요 소통 방식', J8: '월간 보고서/문서 작성 건수', J9: '데이터 취합/정리 월간 소요 시간',
  J10: '핵심 도구/시스템', J11: 'AI 가상 인턴 배정 업무', J12: '지난 1년간 퇴사 직원 수',
  J13: '신규 입사자 업무 적응 기간', J14: '성공적인 AI 도입의 의미', J15: '최근 도구 도입 경험',
  J16: '사람이 반드시 해야 할 업무', J17: '1년 후 이상적인 업무 방식',
};

// 직접 매핑 완료된 필드 목록 (LLM이 무시해도 되는 필드)
const DIRECT_MAPPED_IDS = new Set([
  'A1', 'H1', 'H2', 'H3', 'A4', 'H4', 'H5', 'H6', 'H7', 'B6',
  'B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'B8', 'B9', 'B10',
  'I6', 'I1',
]);

// LLM 추론 근거별 그룹
interface LLMContextGroup {
  label: string;
  hint: string;
  ids: string[];
}

const LLM_CONTEXT_GROUPS: LLMContextGroup[] = [
  {
    label: 'Pain Point & 자동화 희망',
    hint: '→ painPoints, innovationTasks, findings 생성 근거',
    ids: ['C1', 'C2', 'C3', 'C4', 'I2', 'I3', 'I4', 'I5', 'I8', 'J11'],
  },
  {
    label: '장벽 & 보안/규제',
    hint: '→ swot.weaknesses, swot.threats, internalCapabilities 근거',
    ids: ['D1', 'D2', 'D3', 'J4', 'J5', 'J6', 'H8'],
  },
  {
    label: '협업 & 지식관리',
    hint: '→ painPoints, internalCapabilities, collaborationTool 근거',
    ids: ['E1', 'E2', 'J7'],
  },
  {
    label: '외부 환경 & 경쟁',
    hint: '→ externalEnv, swot.opportunities, swot.threats 근거',
    ids: ['J1', 'J2', 'J3'],
  },
  {
    label: '조직 & 인력',
    hint: '→ internalCapabilities, 변화관리 전략 근거',
    ids: ['A2', 'A3', 'A5', 'F3', 'I7', 'J12', 'J13', 'J15'],
  },
  {
    label: '예산 & KPI',
    hint: '→ kpis 설계, 패키지 매칭 근거',
    ids: ['F1', 'F2', 'G1', 'J8', 'J9', 'J14'],
  },
  {
    label: '비전 & 전략 방향',
    hint: '→ Executive Summary, 로드맵 방향, coreProblem 근거',
    ids: ['G2', 'J10', 'J16', 'J17'],
  },
];

export function formatSurveyForLLM(
  answers: Record<string, string>,
): string {
  const lines: string[] = [];

  // 직접 매핑 완료 안내
  const directMapped = Object.keys(answers).filter((id) => DIRECT_MAPPED_IDS.has(id));
  if (directMapped.length > 0) {
    lines.push('[직접매핑완료] 다음 필드는 설문 응답에서 자동 추출 완료 (별도 처리됨):');
    lines.push(`companyName, industry, revenue, customerType, employees, aiBudget, aiSpecialists, aiStage, scores, targetDepts.phase1, collaborationTool`);
    lines.push('');
  }

  // LLM 판단 필요 데이터 그룹별 출력
  lines.push('[LLM 판단 필요] 아래 설문 응답을 미팅 노트와 결합하여 리포트 필드를 생성하세요:');
  lines.push('');

  for (const group of LLM_CONTEXT_GROUPS) {
    const groupAnswers = group.ids
      .filter((id) => answers[id] && !DIRECT_MAPPED_IDS.has(id))
      .map((id) => `  ${id}. ${QUESTION_LABELS[id] || id}: ${answers[id]}`);

    if (groupAnswers.length > 0) {
      lines.push(`## ${group.label} ${group.hint}`);
      lines.push(...groupAnswers);
      lines.push('');
    }
  }

  return lines.join('\n');
}
