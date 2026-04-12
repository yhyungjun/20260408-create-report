export interface ReportFields {
  companyName: string | null;
  industry: string | null;
  employees: { total: number; regular: number; contract: number } | null;
  revenue: string | null;
  businessDesc: string | null;
  customerType: string | null;
  aiStage: number | null;
  scores: { strategy: number; data: number; process: number; talent: number; tech: number } | null;
  coreProblem: string | null;
  aiBudget: { toolSubscription: string; educationBudget: string } | null;
  aiSpecialists: number | null;
  topTasks: Array<{ name: string; module: string; urgency: string }> | null;
  recommendedPath: string[] | null;
  swot: { strengths: string[]; weaknesses: string[]; opportunities: string[]; threats: string[] } | null;
  externalEnv: { industryAiRate: string; competitors: string; govSupport: string } | null;
  targetDepts: { phase1: string; phase2: string } | null;
  sponsor: string | null;
  kpis: { automationRate: string; aiLeaders: string; costSaving: string; aiServices: string; devLeadTime: string; dataDecisions: string; aiUsers: string } | null;
  diagnosisDate: string | null;
  consultantName: string | null;
  interviewInfo: { participants: string; date: string } | null;
  // ── 확장 필드 ──
  painPoints: Array<{ dept: string; task: string; painPoint: string; weeklyHours: string; aiApplicability: string; priority: string }> | null;
  findings: string[] | null;
  internalCapabilities: Array<{ area: string; summary: string; level: string; issue: string }> | null;
  collaborationTool: string | null;
  aiApplicationAreas: string | null;
  crossStrategies: { so: string; wo: string; st: string; wt: string } | null;
  gapAnalysis: Array<{ area: string; asIs: string; toBe: string; action: string }> | null;
  innovationTasks: Array<{ name: string; dept: string; type: string; difficulty: string; effect: string; priority: string }> | null;
  detailedPlans: Array<{ name: string; method: string; owner: string; duration: string; criteria: string }> | null;
  ganttTasks: Array<{ name: string; priority: string; startWeek: number; durationWeeks: number }> | null;
  milestones: Array<{ label: string; items: string }> | null;
}

// ── 파생 계산 메트릭: 설문 복수 답변 조합으로 산출 ──
export interface DerivedMetrics {
  // ROI 계산 엔진
  reportWritingMonthlyHours: number | null;  // I4(보고서 소요시간) × J8(월간 보고서 건수)
  repetitiveMonthlyHours: number | null;     // I3(주당 반복업무 시간) × 4.3
  dataProcessingMonthlyHours: number | null; // J9(데이터 취합 월간 시간) 중간값
  // 복합 지수
  changeReadiness: 'low' | 'medium' | 'high' | null;  // B9(경영진 의지) + B10(조직 수용도) 평균
  securityRisk: 'low' | 'medium' | 'high' | null;     // J4 + J5 + J6 평균
  communicationLoad: 'low' | 'medium' | 'high' | 'very_high' | null; // I2 + J7 종합
  competitiveThreat: 'low' | 'medium' | 'high' | null; // J1 기반
  // 분류값
  budgetTier: 'standard' | 'professional' | 'enterprise' | null; // F2 → 패키지 매칭
  pilotScale: 'pilot' | 'team' | 'department' | 'enterprise' | null; // F3 → 교육규모
  decisionAuthority: 'high' | 'medium' | 'low' | null; // A3 → 의사결정 권한
  shadowAIRisk: 'none' | 'low' | 'medium' | 'high' | null; // H8 → Shadow IT 위험도
  onboardingAutomationNeed: 'low' | 'medium' | 'high' | null; // J13 → 온보딩 자동화 필요성
}

export interface ExtractMetadata {
  fieldsExtracted: number;
  fieldsMissing: number;
  lowConfidenceFields: string[];
  validationErrors: Array<{ field: string; message: string }>;
}

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'object' | 'array';
  subFields?: FieldDef[];
}

export interface FieldGroup {
  name: string;
  color: string;
  fields: FieldDef[];
}

export const FIELD_GROUPS: FieldGroup[] = [
  {
    name: '표지 메타 정보',
    color: '#1F2937',
    fields: [
      { key: 'companyName', label: '기업명', type: 'text' },
      { key: 'diagnosisDate', label: '진단일 (YYYY.MM.DD)', type: 'text' },
      { key: 'consultantName', label: '컨설턴트명', type: 'text' },
      { key: 'interviewInfo', label: '인터뷰 정보', type: 'object', subFields: [
        { key: 'participants', label: '참석자 수', type: 'text' },
        { key: 'date', label: '인터뷰 일시', type: 'text' },
      ]},
    ],
  },
  {
    name: '기업 기본정보',
    color: '#7C3AED',
    fields: [
      { key: 'industry', label: '업종/산업군', type: 'text' },
      { key: 'employees', label: '임직원 수', type: 'object', subFields: [
        { key: 'total', label: '전체', type: 'number' },
        { key: 'regular', label: '정규직', type: 'number' },
        { key: 'contract', label: '비정규직', type: 'number' },
      ]},
      { key: 'revenue', label: '연매출 규모', type: 'text' },
      { key: 'businessDesc', label: '주요 사업 내용', type: 'textarea' },
      { key: 'customerType', label: '고객 유형 (B2B/B2C/B2G)', type: 'text' },
    ],
  },
  {
    name: 'AI 성숙도 진단',
    color: '#F59E0B',
    fields: [
      { key: 'aiStage', label: 'AI 도입 단계 (1-5)', type: 'number' },
      { key: 'scores', label: '5개 영역 점수 (1.0~5.0)', type: 'object', subFields: [
        { key: 'strategy', label: 'AI 전략', type: 'number' },
        { key: 'data', label: '데이터', type: 'number' },
        { key: 'process', label: '프로세스', type: 'number' },
        { key: 'talent', label: '인재역량', type: 'number' },
        { key: 'tech', label: '기술환경', type: 'number' },
      ]},
      { key: 'coreProblem', label: '핵심 문제 키워드', type: 'text' },
      { key: 'aiBudget', label: 'AI 관련 예산', type: 'object', subFields: [
        { key: 'toolSubscription', label: 'AI 도구 구독료 (월)', type: 'text' },
        { key: 'educationBudget', label: 'AI 교육 예산 (연)', type: 'text' },
      ]},
      { key: 'aiSpecialists', label: 'AI 전담 인력 수', type: 'number' },
    ],
  },
  {
    name: '우선 과제 & 로드맵',
    color: '#3B82F6',
    fields: [
      { key: 'topTasks', label: 'Top 3 우선 과제', type: 'array', subFields: [
        { key: 'name', label: '과제명', type: 'text' },
        { key: 'module', label: '대응 모듈', type: 'text' },
        { key: 'urgency', label: '긴급도', type: 'text' },
      ]},
      { key: 'recommendedPath', label: '권장 경로 (쉼표 구분)', type: 'text' },
    ],
  },
  {
    name: 'SWOT & 환경 분석',
    color: '#22C55E',
    fields: [
      { key: 'swot', label: 'SWOT 분석', type: 'object', subFields: [
        { key: 'strengths', label: '강점 (S) - 줄바꿈 구분', type: 'textarea' },
        { key: 'weaknesses', label: '약점 (W) - 줄바꿈 구분', type: 'textarea' },
        { key: 'opportunities', label: '기회 (O) - 줄바꿈 구분', type: 'textarea' },
        { key: 'threats', label: '위협 (T) - 줄바꿈 구분', type: 'textarea' },
      ]},
      { key: 'externalEnv', label: '외부 환경', type: 'object', subFields: [
        { key: 'industryAiRate', label: '업계 AI 도입률', type: 'text' },
        { key: 'competitors', label: '경쟁사 현황', type: 'textarea' },
        { key: 'govSupport', label: '정부 지원 프로그램', type: 'textarea' },
      ]},
    ],
  },
  {
    name: 'AX 전환 범위',
    color: '#EC4899',
    fields: [
      { key: 'targetDepts', label: '대상 부서', type: 'object', subFields: [
        { key: 'phase1', label: '1차 대상', type: 'text' },
        { key: 'phase2', label: '2차 대상', type: 'text' },
      ]},
      { key: 'sponsor', label: '스폰서 (대표이사/C-Level)', type: 'text' },
      { key: 'kpis', label: '목표 KPI', type: 'object', subFields: [
        { key: 'automationRate', label: '자동화율 목표 (예: 5%→30%)', type: 'text' },
        { key: 'aiLeaders', label: 'AI 리더 양성 수', type: 'text' },
        { key: 'costSaving', label: '비용 절감 목표 (월)', type: 'text' },
        { key: 'aiServices', label: 'AI 서비스 론칭 수', type: 'text' },
        { key: 'devLeadTime', label: '개발 리드타임 단축 (예: 5일→2일)', type: 'text' },
        { key: 'dataDecisions', label: '월간 데이터 의사결정 건수', type: 'text' },
        { key: 'aiUsers', label: 'AI 활용 인력 (예: 5명→40명)', type: 'text' },
      ]},
    ],
  },
  {
    name: '업무 프로세스 분석',
    color: '#EF4444',
    fields: [
      { key: 'painPoints', label: '부서별 Pain Point', type: 'array', subFields: [
        { key: 'dept', label: '부서', type: 'text' },
        { key: 'task', label: '핵심 업무', type: 'text' },
        { key: 'painPoint', label: 'Pain Point', type: 'text' },
        { key: 'weeklyHours', label: '주당 시간', type: 'text' },
        { key: 'aiApplicability', label: 'AI 적용 가능성', type: 'text' },
        { key: 'priority', label: '순위', type: 'text' },
      ]},
      { key: 'findings', label: '핵심 발견 사항 (줄바꿈 구분)', type: 'textarea' },
    ],
  },
  {
    name: '내부 역량 진단',
    color: '#6366F1',
    fields: [
      { key: 'internalCapabilities', label: '내부 역량 진단', type: 'array', subFields: [
        { key: 'area', label: '진단 영역', type: 'text' },
        { key: 'summary', label: '현황 요약', type: 'text' },
        { key: 'level', label: '수준 (양호/보통/미흡)', type: 'text' },
        { key: 'issue', label: '핵심 이슈', type: 'text' },
      ]},
      { key: 'collaborationTool', label: '협업 도구 (Slack/Teams 등)', type: 'text' },
      { key: 'aiApplicationAreas', label: '업종별 AI 적용 영역', type: 'text' },
    ],
  },
  {
    name: 'SWOT 교차 전략',
    color: '#14B8A6',
    fields: [
      { key: 'crossStrategies', label: 'SWOT 교차 전략', type: 'object', subFields: [
        { key: 'so', label: 'SO (강점×기회) 공격 전략', type: 'textarea' },
        { key: 'wo', label: 'WO (약점×기회) 개선 전략', type: 'textarea' },
        { key: 'st', label: 'ST (강점×위협) 방어 전략', type: 'textarea' },
        { key: 'wt', label: 'WT (약점×위협) 생존 전략', type: 'textarea' },
      ]},
    ],
  },
  {
    name: 'Gap 분석',
    color: '#F97316',
    fields: [
      { key: 'gapAnalysis', label: 'Gap As-Is / To-Be', type: 'array', subFields: [
        { key: 'area', label: '영역', type: 'text' },
        { key: 'asIs', label: '현재 (As-Is)', type: 'text' },
        { key: 'toBe', label: '목표 (To-Be)', type: 'text' },
        { key: 'action', label: '핵심 전환 액션', type: 'text' },
      ]},
    ],
  },
  {
    name: 'AX 혁신 과제',
    color: '#8B5CF6',
    fields: [
      { key: 'innovationTasks', label: '혁신 과제 리스트', type: 'array', subFields: [
        { key: 'name', label: '과제명', type: 'text' },
        { key: 'dept', label: '부서', type: 'text' },
        { key: 'type', label: '유형', type: 'text' },
        { key: 'difficulty', label: '난이도 (상/중/하)', type: 'text' },
        { key: 'effect', label: '효과 (★)', type: 'text' },
        { key: 'priority', label: '우선순위 (P1/P2/P3)', type: 'text' },
      ]},
    ],
  },
  {
    name: '세부 추진 계획',
    color: '#0EA5E9',
    fields: [
      { key: 'detailedPlans', label: 'P1 과제 세부 계획', type: 'array', subFields: [
        { key: 'name', label: '과제명', type: 'text' },
        { key: 'method', label: '추진 방법', type: 'textarea' },
        { key: 'owner', label: '담당', type: 'text' },
        { key: 'duration', label: '기간', type: 'text' },
        { key: 'criteria', label: '성공 기준', type: 'text' },
      ]},
      { key: 'ganttTasks', label: '간트 차트 과제', type: 'array', subFields: [
        { key: 'name', label: '과제명', type: 'text' },
        { key: 'priority', label: '우선순위 (P1/P2/P3)', type: 'text' },
        { key: 'startWeek', label: '시작 주차 (1~16)', type: 'number' },
        { key: 'durationWeeks', label: '기간 (주)', type: 'number' },
      ]},
      { key: 'milestones', label: '마일스톤 (M1~M4)', type: 'array', subFields: [
        { key: 'label', label: '시점 (예: M1 말)', type: 'text' },
        { key: 'items', label: '달성 항목', type: 'text' },
      ]},
    ],
  },
];

export function getDefaultFields(): ReportFields {
  return {
    companyName: null, industry: null, employees: null, revenue: null,
    businessDesc: null, customerType: null, aiStage: null, scores: null,
    coreProblem: null, aiBudget: null, aiSpecialists: null, topTasks: null,
    recommendedPath: null, swot: null, externalEnv: null, targetDepts: null,
    sponsor: null, kpis: null, diagnosisDate: null, consultantName: null,
    interviewInfo: null, painPoints: null, findings: null,
    internalCapabilities: null, collaborationTool: null, aiApplicationAreas: null,
    crossStrategies: null, gapAnalysis: null, innovationTasks: null,
    detailedPlans: null, ganttTasks: null, milestones: null,
  };
}
