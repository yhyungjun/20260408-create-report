import type { ReportFields, DerivedMetrics } from './report-schema';

// ── 구글폼 ID → 내부 표준 ID 리매핑 ──
// 구글폼과 매핑표(공통질문리스트v5)의 질문 번호가 다른 경우를 처리
const FORM_ID_REMAP: Record<string, string> = {
  // 구글폼 C2(반복업무) = 매핑표 C3, 구글폼 C3(Pain Point서술) = 매핑표 C2
  'C2': 'C3',
  'C3': 'C2',
};

export function remapFormIds(answers: Record<string, string>): Record<string, string> {
  const remapped: Record<string, string> = {};
  for (const [formId, value] of Object.entries(answers)) {
    const internalId = FORM_ID_REMAP[formId] || formId;
    remapped[internalId] = value;
  }
  return remapped;
}

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

// ── 구간 답변 → 중간값 변환 유틸 (질문별 매핑) ──

const QUESTION_MIDPOINTS: Record<string, Array<[string, number]>> = {
  // I3: 주당 반복 업무 소요 시간
  I3: [['5시간 미만', 2.5], ['5~10', 7.5], ['10~20', 15], ['20~30', 25], ['30시간 이상', 35]],
  // I4: 보고서 작성 소요 시간
  I4: [['30분 미만', 0.25], ['30분~1시간', 0.75], ['1~3', 2], ['3~5', 4], ['5시간 이상', 6]],
  // J8: 월간 보고서·문서 작성 건수
  J8: [['0건', 0], ['1~3', 2], ['4~10', 7], ['11~20', 15], ['20건 이상', 25]],
  // J9: 데이터 취합·정리 월간 소요 시간
  J9: [['2시간 미만', 1], ['2~5', 3.5], ['5~10', 7.5], ['10~20', 15], ['20시간 이상', 25]],
};

function toMidpoint(value: string | undefined, questionId?: string): number | null {
  if (!value) return null;
  // 질문별 매핑 테이블이 있으면 우선 사용
  if (questionId && QUESTION_MIDPOINTS[questionId]) {
    for (const [key, mid] of QUESTION_MIDPOINTS[questionId]) {
      if (value.includes(key)) return mid;
    }
  }
  // ① 형식인 경우 순서대로 매핑
  const n = parseCircledNumber(value);
  return n !== null ? n : null;
}

// ── Layer 2: 파생 계산 — 복수 질문 조합으로 중간값 산출 ──

export function computeDerivedMetrics(
  answers: Record<string, string>,
): DerivedMetrics {
  const metrics: DerivedMetrics = {
    reportWritingMonthlyHours: null,
    repetitiveMonthlyHours: null,
    dataProcessingMonthlyHours: null,
    changeReadiness: null,
    securityRisk: null,
    communicationLoad: null,
    competitiveThreat: null,
    budgetTier: null,
    pilotScale: null,
    decisionAuthority: null,
    shadowAIRisk: null,
    onboardingAutomationNeed: null,
  };

  // 3-1. ROI 계산 엔진
  const i4Mid = toMidpoint(answers.I4, 'I4');
  const j8Mid = toMidpoint(answers.J8, 'J8');
  if (i4Mid !== null && j8Mid !== null) {
    metrics.reportWritingMonthlyHours = Math.round(i4Mid * j8Mid * 10) / 10;
  }
  const i3Mid = toMidpoint(answers.I3, 'I3');
  if (i3Mid !== null) {
    metrics.repetitiveMonthlyHours = Math.round(i3Mid * 4.3 * 10) / 10;
  }
  metrics.dataProcessingMonthlyHours = toMidpoint(answers.J9, 'J9');

  // 3-2. 변화준비도 지수: B9(경영진 의지) + B10(조직 수용도)
  const b9 = parseCircledNumber(answers.B9);
  const b10 = parseCircledNumber(answers.B10);
  if (b9 !== null && b10 !== null) {
    const avg = (b9 + b10) / 2;
    metrics.changeReadiness = avg >= 3.5 ? 'high' : avg >= 2.5 ? 'medium' : 'low';
  } else if (b9 !== null || b10 !== null) {
    const val = (b9 ?? b10)!;
    metrics.changeReadiness = val >= 4 ? 'high' : val >= 3 ? 'medium' : 'low';
  }

  // 3-3. 보안 리스크 지수: J4 + J5 + J6
  const j4 = parseCircledNumber(answers.J4);
  const j5 = parseCircledNumber(answers.J5);
  const j6 = parseCircledNumber(answers.J6);
  const secScores = [j4, j5, j6].filter((v): v is number => v !== null);
  if (secScores.length > 0) {
    const avg = secScores.reduce((a, b) => a + b, 0) / secScores.length;
    metrics.securityRisk = avg >= 3.5 ? 'low' : avg >= 2 ? 'medium' : 'high';
  }

  // 3-4. 커뮤니케이션 부하 지수: I2 + J7 보정
  const i2 = parseCircledNumber(answers.I2);
  if (i2 !== null) {
    let load: DerivedMetrics['communicationLoad'] = 'low';
    if (i2 >= 5) load = 'very_high';
    else if (i2 >= 4) load = 'high';
    else if (i2 >= 3) load = 'medium';
    // J7에 "전화·구두" 포함 시 디지털 협업수준 낮음 → 한 단계 상향
    if (answers.J7 && (answers.J7.includes('전화') || answers.J7.includes('구두'))) {
      if (load === 'low') load = 'medium';
      else if (load === 'medium') load = 'high';
      else if (load === 'high') load = 'very_high';
    }
    metrics.communicationLoad = load;
  }

  // 3-5. 경쟁위협도: J1
  if (answers.J1) {
    const j1val = answers.J1;
    if (j1val.includes('대다수') || j1val.includes('뒤처짐')) {
      metrics.competitiveThreat = 'high';
    } else if (j1val.includes('일부 시작')) {
      metrics.competitiveThreat = 'medium';
    } else {
      metrics.competitiveThreat = 'low';
    }
  }

  // A3 → 의사결정 권한
  const a3 = parseCircledNumber(answers.A3);
  if (a3 !== null) {
    metrics.decisionAuthority = a3 <= 2 ? 'high' : a3 === 3 ? 'medium' : 'low';
  }

  // F2 → 예산 티어
  if (answers.F2) {
    const f2 = answers.F2;
    if (f2.includes('1억') || f2.includes('5천~1억')) {
      metrics.budgetTier = 'enterprise';
    } else if (f2.includes('1천~5천')) {
      metrics.budgetTier = 'professional';
    } else {
      metrics.budgetTier = 'standard';
    }
  }

  // F3 → 파일럿 규모
  const f3 = parseCircledNumber(answers.F3);
  if (f3 !== null) {
    metrics.pilotScale = f3 <= 1 ? 'pilot' : f3 <= 2 ? 'team' : f3 <= 4 ? 'department' : 'enterprise';
  }

  // H8 → Shadow AI 위험도
  const h8 = parseCircledNumber(answers.H8);
  if (h8 !== null) {
    metrics.shadowAIRisk = h8 <= 1 ? 'none' : h8 <= 3 ? 'low' : h8 <= 4 ? 'medium' : 'high';
  }

  // J13 → 온보딩 자동화 필요성
  const j13 = parseCircledNumber(answers.J13);
  if (j13 !== null) {
    metrics.onboardingAutomationNeed = j13 >= 4 ? 'high' : j13 >= 3 ? 'medium' : 'low';
  }

  return metrics;
}

// ── Layer 1: 직접 매핑 — 설문 → Partial<ReportFields> ──

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

  // A2 → interviewInfo (담당자명)
  if (answers.A2) {
    fields.interviewInfo = {
      participants: answers.A2,
      date: '',
    };
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

// LLM 추론 근거별 그룹 — 각 질문이 리포트 어떤 필드에 영향을 미치는지 명시
interface LLMContextGroup {
  label: string;
  hint: string;
  targetFields: string[];
  fieldHints: Record<string, string>;
  ids: string[];
}

const LLM_CONTEXT_GROUPS: LLMContextGroup[] = [
  {
    label: 'Pain Point & 자동화 희망',
    hint: '→ painPoints 배열, innovationTasks P1 과제 후보, findings 핵심 발견사항',
    targetFields: ['painPoints', 'innovationTasks', 'findings', 'coreProblem'],
    fieldHints: {
      'C1': '→ innovationTasks 우선순위 결정 + painPoints.aiApplicability 평가',
      'C2': '→ painPoints 상세 분석의 핵심 서술 데이터 (정성)',
      'C3': '→ painPoints 주당시간 + ROI 산출 기초 (정량)',
      'I2': '→ 커뮤니케이션 병목 painPoint 항목 생성 여부 판단',
      'I3': '→ 반복업무 시간 총량 → 자동화 ROI 핵심 데이터',
      'I4': '→ J8과 결합하여 보고서 자동화 ROI 정량 계산',
      'I5': '→ 결재 병목 painPoint + SWOT 약점 항목',
      'J11': '→ Quick Win 과제 최우선 후보 (고객이 직접 정의한 과제)',
    },
    ids: ['C1', 'C2', 'C3', 'I2', 'I3', 'I4', 'I5', 'J11'],
  },
  {
    label: '장벽 & 보안/규제',
    hint: '→ swot.weaknesses, swot.threats, internalCapabilities 중 보안 영역',
    targetFields: ['swot', 'internalCapabilities'],
    fieldHints: {
      'D1': '→ SWOT 약점/위협 항목 (복수선택 기반)',
      'D2': '→ 규제 환경 → externalEnv + SWOT threats',
      'D3': '→ 보안 우려 → internalCapabilities 보안 영역 이슈',
      'J4': '→ AI 가이드라인 미비 시 SWOT weakness + 과제 제안',
      'J5': '→ 인프라 안정성 → gapAnalysis 기술환경 영역',
      'J6': '→ 엔드포인트 보안 → internalCapabilities IT인프라',
      'H8': '→ Shadow AI 위험도 → SWOT threats',
    },
    ids: ['D1', 'D2', 'D3', 'J4', 'J5', 'J6', 'H8'],
  },
  {
    label: '협업 & 지식관리',
    hint: '→ painPoints 중 협업 관련, internalCapabilities 조직문화 영역',
    targetFields: ['painPoints', 'internalCapabilities', 'crossStrategies'],
    fieldHints: {
      'E1': '→ 지식관리 painPoint + gapAnalysis 데이터 영역',
      'E2': '→ 부서간 협업 병목 → painPoints + SWOT weakness',
      'J7': '→ 디지털 협업수준 판정 → internalCapabilities',
    },
    ids: ['E1', 'E2', 'J7'],
  },
  {
    label: '외부 환경 & 경쟁',
    hint: '→ externalEnv 3개 하위필드, swot.opportunities, swot.threats',
    targetFields: ['externalEnv', 'swot'],
    fieldHints: {
      'J1': '→ externalEnv.competitors + SWOT threats 경쟁 강도',
      'J2': '→ externalEnv.govSupport + 보조금 기회 활용 제안',
      'J3': '→ SWOT opportunities/threats 맥락 보강 (정성)',
    },
    ids: ['J1', 'J2', 'J3'],
  },
  {
    label: '조직 & 인력',
    hint: '→ internalCapabilities 인적역량/조직문화, gapAnalysis 인재역량',
    targetFields: ['internalCapabilities', 'gapAnalysis', 'sponsor'],
    fieldHints: {
      'A2': '→ sponsor 후보 (담당자명)',
      'A3': '→ 의사결정 구조 판단 → sponsor 필드',
      'A5': '→ 응답자 관점 기반 교육 트랙 편향 고려',
      'F3': '→ 파일럿 규모 → gapAnalysis 인재역량 목표',
      'J12': '→ 퇴사율 → 지식이탈 리스크 → SWOT weakness',
      'J13': '→ 온보딩 기간 → 자동화 과제 후보',
      'J15': '→ 변화수용 패턴 정성검증 (B10 교차검증)',
    },
    ids: ['A2', 'A3', 'A5', 'F3', 'J12', 'J13', 'J15'],
  },
  {
    label: '예산 & KPI',
    hint: '→ kpis 7개 하위필드, recommendedPath 패키지 매칭',
    targetFields: ['kpis', 'recommendedPath'],
    fieldHints: {
      'F1': '→ 솔루션 제안 우선순위 (복수선택 기반)',
      'F2': '→ 패키지 매칭 (standard/professional/enterprise)',
      'G1': '→ kpis 성공 지표 설계 근거',
      'J8': '→ I4와 결합 → 보고서 자동화 ROI 정량 계산',
      'J9': '→ 데이터 자동화 ROI → kpis.costSaving 근거',
      'J14': '→ 고객 성공 기준 → kpis 포커스 커스터마이징',
    },
    ids: ['F1', 'F2', 'G1', 'J8', 'J9', 'J14'],
  },
  {
    label: '비전 & 전략 방향',
    hint: '→ coreProblem 한줄 정의, topTasks, recommendedPath, crossStrategies',
    targetFields: ['coreProblem', 'topTasks', 'recommendedPath', 'crossStrategies'],
    fieldHints: {
      'G2': '→ topTasks P1 과제 부서, recommendedPath 1단계',
      'J10': '→ 핵심 시스템 → innovationTasks 연동 과제 설계',
      'J16': '→ AI 수용 경계선 → crossStrategies WT 전략',
      'J17': '→ Executive Summary 비전 문구, recommendedPath 최종목표',
    },
    ids: ['G2', 'J10', 'J16', 'J17'],
  },
];

export function formatSurveyForLLM(
  answers: Record<string, string>,
  derivedMetrics?: DerivedMetrics,
): string {
  const lines: string[] = [];

  // 직접 매핑 완료 안내
  const directMapped = Object.keys(answers).filter((id) => DIRECT_MAPPED_IDS.has(id));
  if (directMapped.length > 0) {
    lines.push('[직접매핑완료] 다음 필드는 설문 응답에서 자동 추출 완료 (별도 처리됨):');
    lines.push(`companyName, industry, revenue, customerType, employees, aiBudget, aiSpecialists, aiStage, scores, interviewInfo, collaborationTool`);
    lines.push('');
  }

  // 파생 계산 결과 섹션
  if (derivedMetrics) {
    lines.push('[파생 계산 결과 — 설문 응답 기반 자동 산출]');
    if (derivedMetrics.reportWritingMonthlyHours !== null) {
      lines.push(`- 월간 보고서 작성 소요: ${derivedMetrics.reportWritingMonthlyHours}시간 (I4×J8)`);
    }
    if (derivedMetrics.repetitiveMonthlyHours !== null) {
      lines.push(`- 월간 반복업무 소요: ${derivedMetrics.repetitiveMonthlyHours}시간 (I3×4.3주)`);
    }
    if (derivedMetrics.dataProcessingMonthlyHours !== null) {
      lines.push(`- 월간 데이터 취합 소요: ${derivedMetrics.dataProcessingMonthlyHours}시간 (J9)`);
    }
    if (derivedMetrics.changeReadiness !== null) {
      lines.push(`- 변화준비도: ${derivedMetrics.changeReadiness} (B9+B10 평균)`);
    }
    if (derivedMetrics.securityRisk !== null) {
      lines.push(`- 보안리스크: ${derivedMetrics.securityRisk} (J4+J5+J6 종합)`);
    }
    if (derivedMetrics.communicationLoad !== null) {
      lines.push(`- 커뮤니케이션 부하: ${derivedMetrics.communicationLoad} (I2+J7)`);
    }
    if (derivedMetrics.competitiveThreat !== null) {
      lines.push(`- 경쟁위협도: ${derivedMetrics.competitiveThreat} (J1 기반)`);
    }
    if (derivedMetrics.budgetTier !== null) {
      lines.push(`- 예산 티어: ${derivedMetrics.budgetTier} (F2 기반)`);
    }
    if (derivedMetrics.shadowAIRisk !== null) {
      lines.push(`- Shadow AI 위험: ${derivedMetrics.shadowAIRisk} (H8 기반)`);
    }
    if (derivedMetrics.onboardingAutomationNeed !== null) {
      lines.push(`- 온보딩 자동화 필요성: ${derivedMetrics.onboardingAutomationNeed} (J13 기반)`);
    }
    lines.push('');
    lines.push('위 수치를 참조하여:');
    lines.push('1. painPoints의 weeklyHours는 실제 계산값과 일치시키세요');
    lines.push('2. kpis의 costSaving은 ROI 계산값을 근거로 산출하세요');
    lines.push('3. SWOT의 threats 강도는 competitiveThreat+securityRisk를 반영하세요');
    lines.push('');
  }

  // LLM 판단 필요 데이터 그룹별 출력 (fieldHints 포함)
  lines.push('[LLM 판단 필요] 아래 설문 응답을 미팅 노트와 결합하여 리포트 필드를 생성하세요:');
  lines.push('');

  for (const group of LLM_CONTEXT_GROUPS) {
    const groupAnswers = group.ids
      .filter((id) => answers[id] && !DIRECT_MAPPED_IDS.has(id))
      .map((id) => {
        const hint = group.fieldHints[id] || '';
        return `  ${id}. ${QUESTION_LABELS[id] || id}: ${answers[id]}${hint ? ` ${hint}` : ''}`;
      });

    if (groupAnswers.length > 0) {
      lines.push(`## ${group.label} ${group.hint}`);
      lines.push(`   [대상 필드: ${group.targetFields.join(', ')}]`);
      lines.push(...groupAnswers);
      lines.push('');
    }
  }

  return lines.join('\n');
}
