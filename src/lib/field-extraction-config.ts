import type { ReportFields } from './report-schema';

// ── 타입 정의 ──

export type ExtractionMethod = '직접추출' | '컨텍스트판단' | '추론생성' | '복합계산';

export interface FieldThreshold {
  format?: string;
  range?: [number, number];
  requiredCount?: number;
  maxLength?: number;
  enumValues?: string[];
  required?: boolean;
}

export interface FieldExtractionConfig {
  key: string;
  extractionMethod: ExtractionMethod;
  source: string;
  rawDataNeeded: string[];
  threshold: FieldThreshold;
  collectionIntent: string;
  templateUsage: string[];
  dependencies: string[];
  defaultValue?: unknown;
  confidenceSignals: { high: string; low: string };
  reviewerHint: string;
}

// ── 34개 필드 설정 ──

export const EXTRACTION_CONFIG: FieldExtractionConfig[] = [
  // ━━ 그룹 1: 기업 기본정보 ━━
  {
    key: 'companyName',
    extractionMethod: '직접추출',
    source: '미팅노트 내 회사명/법인명 직접 언급',
    rawDataNeeded: ['회사명 또는 법인명 표기', '브랜드명과 법인명이 다를 경우 법인명 우선'],
    threshold: { required: true, maxLength: 50 },
    collectionIntent: '리포트 전 페이지 헤더, 커버 타이틀, 조직도 제목에 사용',
    templateUsage: ['P1 커버', 'P2 Executive Summary', 'P9 조직도', '전 페이지 헤더'],
    dependencies: [],
    confidenceSignals: {
      high: '노트에 "(주)OOO" 또는 "주식회사 OOO" 형태로 명시',
      low: '브랜드명만 언급되고 법인명 불분명',
    },
    reviewerHint: '정식 법인명인지 확인. 브랜드명과 다를 수 있음',
  },
  {
    key: 'industry',
    extractionMethod: '직접추출',
    source: '미팅노트 내 업종/산업군 언급 또는 사업 설명에서 추론',
    rawDataNeeded: ['업종 직접 언급 (예: "식품 제조업")', '주요 사업 내용에서 산업 분류'],
    threshold: { required: true, maxLength: 20 },
    collectionIntent: '업종별 AI 적용 영역 판단, 벤치마크 비교 기준',
    templateUsage: ['P1 커버', 'P2 기업 개요'],
    dependencies: [],
    confidenceSignals: {
      high: '"제조업", "IT서비스", "유통" 등 직접 명시',
      low: '사업 내용만 언급되어 업종 분류가 애매한 경우',
    },
    reviewerHint: '표준산업분류 기준 업종과 일치하는지 확인',
  },
  {
    key: 'employees',
    extractionMethod: '직접추출',
    source: '미팅노트 내 인원 수 관련 언급',
    rawDataNeeded: ['전체 임직원 수', '정규직 수', '비정규직/계약직 수', '정규직+비정규직=전체 성립 여부'],
    threshold: { required: true },
    collectionIntent: '조직 규모 파악, AX 전환 범위 산정, 전 부서 전 직원 수 표시',
    templateUsage: ['P2 기업 개요', 'P9 전환 대상 (총 N명)'],
    dependencies: [],
    confidenceSignals: {
      high: '정확한 숫자로 명시 (예: "62명, 정규직 55명")',
      low: '"약 60명" 등 대략적 수치만 언급',
    },
    reviewerHint: 'total = regular + contract 합산이 맞는지 확인',
  },
  {
    key: 'revenue',
    extractionMethod: '직접추출',
    source: '미팅노트 내 매출 규모 언급',
    rawDataNeeded: ['연매출 규모 (억 단위)', '매출 범위 표현'],
    threshold: { enumValues: ['10억 미만', '10~50억', '50~100억', '100억 이상'] },
    collectionIntent: '재무 여력 진단, AI 투자 규모 추정 근거',
    templateUsage: ['P2 기업 개요'],
    dependencies: [],
    confidenceSignals: {
      high: '"연매출 약 80억" 등 구체 수치 언급',
      low: '매출 관련 언급 없음',
    },
    reviewerHint: '4개 범주 중 하나로 매핑되었는지 확인',
  },
  {
    key: 'businessDesc',
    extractionMethod: '직접추출',
    source: '미팅노트 내 주요 사업/서비스 설명',
    rawDataNeeded: ['주요 제품/서비스명', '핵심 비즈니스 모델', '사업 영역 설명'],
    threshold: { maxLength: 200 },
    collectionIntent: '커버 페이지 사업 서술, AX 적용 방향 이해',
    templateUsage: ['P1 커버', 'P2 기업 개요'],
    dependencies: [],
    confidenceSignals: {
      high: '사업 내용이 2~3문장으로 충분히 서술됨',
      low: '사업 언급이 단편적이거나 추상적',
    },
    reviewerHint: '핵심 사업을 1~3문장으로 명확히 서술했는지 확인',
  },
  {
    key: 'customerType',
    extractionMethod: '직접추출',
    source: '미팅노트 내 고객/거래 유형 언급',
    rawDataNeeded: ['주요 거래 대상 (기업/소비자/정부)', '거래 형태 키워드'],
    threshold: { enumValues: ['B2B', 'B2C', 'B2G', 'B2B/B2C', 'B2B/B2G'] },
    collectionIntent: '고객 유형별 AI 적용 방향 판단 (고객응대 챗봇 vs 내부 최적화)',
    templateUsage: ['P2 기업 개요'],
    dependencies: [],
    confidenceSignals: {
      high: '"B2B 위주", "일반 소비자 대상" 등 명확한 언급',
      low: '거래 유형 직접 언급 없이 사업 내용에서 추론해야 하는 경우',
    },
    reviewerHint: '복합 유형인 경우 주요 유형을 먼저 표기 (예: B2B/B2C)',
  },

  // ━━ 그룹 2: AI 성숙도 진단 ━━
  {
    key: 'aiStage',
    extractionMethod: '컨텍스트판단',
    source: 'AI 도구 사용 현황, 조직 인식도 종합 판단',
    rawDataNeeded: [
      'AI 도구 현재 사용 여부 및 종류',
      'AI 도입 이력 (시도 경험, 파일럿 등)',
      '조직 내 AI 인식 수준 (관심/실험/활용/내재화)',
      '경영진의 AI에 대한 태도',
    ],
    threshold: { range: [1, 5], required: true },
    collectionIntent: '5단계 성숙도 시각화 (P2 도트 표시), 등급 산출의 보조 지표',
    templateUsage: ['P2 AI 성숙도 스테이지'],
    dependencies: [],
    confidenceSignals: {
      high: '"ChatGPT 개인적으로 사용", "조직적 도입은 없음" 등 구체 현황 파악 가능',
      low: 'AI 관련 언급이 거의 없어 단계 판단 근거 부족',
    },
    reviewerHint: '1=미인지, 2=개별실험, 3=부분도입, 4=조직확산, 5=AI-First. 현황과 맞는지 확인',
  },
  {
    key: 'scores',
    extractionMethod: '컨텍스트판단',
    source: '5개 영역별 미팅 내용 종합 판단',
    rawDataNeeded: [
      '[전략] AI 비전/전략 문서 유무, 경영진 의지, 로드맵 존재 여부',
      '[데이터] 데이터 수집/관리 체계, DB 현황, 데이터 품질',
      '[프로세스] 업무 자동화 수준, AI 적용된 프로세스 유무',
      '[인재] AI 전담 인력, 교육 이력, 내부 역량',
      '[기술] IT 인프라, 클라우드 사용, AI 도구 보유',
    ],
    threshold: { range: [1, 5], required: true },
    collectionIntent: '레이더 차트(P2), 갭 차트(P4), 등급(A/B/C/D) 산출, Gap 분석 입력',
    templateUsage: ['P2 레이더 차트', 'P4 성숙도 상세', 'P4 벤치마크', 'P10 Gap 분석'],
    dependencies: [],
    confidenceSignals: {
      high: '각 영역별 구체적 현황이 언급되어 점수 근거 충분',
      low: '일부 영역 언급이 없어 추정치 비중 높음',
    },
    reviewerHint: '5개 영역 점수가 미팅 내용과 일치하는지 개별 확인. 총점으로 등급(A≥20/B≥15/C≥10/D) 산출됨',
  },
  {
    key: 'coreProblem',
    extractionMethod: '컨텍스트판단',
    source: '미팅 전반에서 가장 빈번하게 언급된 문제 키워드',
    rawDataNeeded: ['반복적으로 언급된 문제/과제', '가장 시급한 이슈 키워드'],
    threshold: { maxLength: 30 },
    collectionIntent: 'P2 Executive Summary에서 핵심 문제 한 줄 표시',
    templateUsage: ['P2 인사이트'],
    dependencies: [],
    confidenceSignals: {
      high: '특정 키워드가 3회 이상 반복 언급',
      low: '다양한 문제가 산발적으로 언급되어 핵심 선별 어려움',
    },
    reviewerHint: '10자 이내 키워드로 핵심 문제를 압축했는지 확인',
  },
  {
    key: 'aiBudget',
    extractionMethod: '직접추출',
    source: '미팅노트 내 AI 관련 비용/예산 언급',
    rawDataNeeded: ['AI 도구 구독료 (월단위)', 'AI 교육 예산 (연단위)', '관련 지출 계획'],
    threshold: {},
    collectionIntent: '재무 여력 진단 항목, 투자 가능 규모 파악',
    templateUsage: ['P2 기업 개요'],
    dependencies: [],
    defaultValue: { toolSubscription: '없음', educationBudget: '없음' },
    confidenceSignals: {
      high: '"월 30만원 ChatGPT 구독" 등 구체 금액 언급',
      low: '예산 관련 언급 전혀 없음',
    },
    reviewerHint: '금액이 없으면 "없음"으로 표시. 계획 중인 예산도 포함 가능',
  },
  {
    key: 'aiSpecialists',
    extractionMethod: '직접추출',
    source: '미팅노트 내 AI 전담 인력 언급',
    rawDataNeeded: ['AI/데이터 전담 인력 수', 'AI 관련 직무자 유무'],
    threshold: { range: [0, 1000] },
    collectionIntent: '인재역량 진단 근거, 인력 확대 KPI 산정 기준',
    templateUsage: ['P2 기업 개요'],
    dependencies: [],
    defaultValue: 0,
    confidenceSignals: {
      high: '"AI 전담 인력 0명", "데이터팀 2명" 등 명시',
      low: '인력 관련 언급 없음',
    },
    reviewerHint: '0명이면 null이 아닌 0으로 설정. IT담당자와 AI전담을 구분',
  },

  // ━━ 그룹 3: 우선 과제 & 로드맵 ━━
  {
    key: 'topTasks',
    extractionMethod: '추론생성',
    source: '미팅에서 논의된 과제/이슈를 우선순위별 정리',
    rawDataNeeded: [
      '미팅에서 논의된 주요 과제/이슈 목록',
      '각 과제의 긴급도 관련 언급 (시급, 중요 등)',
      '과제별 대응 가능 모듈 (A~F) 매핑 근거',
    ],
    threshold: { requiredCount: 3 },
    collectionIntent: 'P3 Top 3 과제 테이블, 혁신 과제 확장의 기반',
    templateUsage: ['P3 Top 3 과제 테이블'],
    dependencies: [],
    confidenceSignals: {
      high: '미팅에서 3개 이상 과제가 구체적으로 논의됨',
      low: '과제가 명확히 정의되지 않아 AI가 대부분 추론',
    },
    reviewerHint: '정확히 3개 과제, 긴급도(높음/중간/낮음), 모듈(A~F) 확인',
  },
  {
    key: 'recommendedPath',
    extractionMethod: '추론생성',
    source: '도입 순서 논의 또는 과제 우선순위 기반 경로 생성',
    rawDataNeeded: ['단계별 도입 계획 언급', '우선 영역 → 확장 영역 순서'],
    threshold: { requiredCount: 3 },
    collectionIntent: 'P3 권장 경로 시각화 (화살표 흐름)',
    templateUsage: ['P3 권장 경로'],
    dependencies: ['topTasks'],
    confidenceSignals: {
      high: '도입 순서가 미팅에서 직접 논의됨',
      low: 'topTasks 기반으로 AI가 순서를 추론',
    },
    reviewerHint: '모듈 순서가 논리적인지 확인 (기반→확장→고도화)',
  },

  // ━━ 그룹 4: SWOT & 환경 분석 ━━
  {
    key: 'swot',
    extractionMethod: '추론생성',
    source: '미팅 내용에서 강점/약점/기회/위협 요인 분류',
    rawDataNeeded: [
      '[S] 기술 강점, 시장 위치, 인적 자산, 재무 건전성',
      '[W] 부족 역량, 인프라 미비, 인력 부족, 체계 미흡',
      '[O] 정부 정책, 시장 성장, 기술 발전, 경쟁 공백',
      '[T] 경쟁 심화, 규제 변화, 인력 유출, 기술 격차',
    ],
    threshold: { requiredCount: 2 },
    collectionIntent: 'P5 SWOT 매트릭스, 교차 전략(P8) 생성의 입력',
    templateUsage: ['P5 SWOT 매트릭스'],
    dependencies: [],
    confidenceSignals: {
      high: '각 SWOT 영역별 2개 이상 근거가 미팅에서 언급됨',
      low: '일부 영역 언급이 없어 AI가 업종 일반론으로 채움',
    },
    reviewerHint: 'S/W/O/T 각 2~4개. 업종/기업 특성에 맞는 구체적 내용인지 확인',
  },
  {
    key: 'externalEnv',
    extractionMethod: '컨텍스트판단',
    source: '업계 동향, 경쟁사, 정부 정책 관련 언급 종합',
    rawDataNeeded: [
      '동종업계 AI 도입률 (% 또는 정성 표현)',
      '경쟁사 AI 활용 현황',
      '정부 지원 프로그램 (AI바우처, 스마트공장 등)',
    ],
    threshold: {},
    collectionIntent: 'P5 외부 환경 분석 섹션',
    templateUsage: ['P5 외부 환경'],
    dependencies: ['industry'],
    confidenceSignals: {
      high: '업계 트렌드나 경쟁사 사례가 구체적으로 언급됨',
      low: '외부 환경 관련 언급이 거의 없어 업종 일반론으로 추정',
    },
    reviewerHint: '업계 AI 도입률은 최신 데이터인지, 경쟁사 현황이 정확한지 확인',
  },

  // ━━ 그룹 5: AX 전환 범위 ━━
  {
    key: 'targetDepts',
    extractionMethod: '직접추출',
    source: '미팅에서 논의된 AX 대상 부서',
    rawDataNeeded: ['1차 전환 대상 부서', '2차 확대 대상 부서', '전환 우선순위 근거'],
    threshold: { required: true },
    collectionIntent: 'P9 조직도 시각화, 전환 범위 설정',
    templateUsage: ['P9 조직도', 'P9 전환 범위'],
    dependencies: [],
    confidenceSignals: {
      high: '"영업팀, 재무팀 우선 도입" 등 부서별 명시',
      low: '"전사적" 등 추상적 표현만 있고 구체 부서 미지정',
    },
    reviewerHint: 'phase1은 즉시 전환, phase2는 확대 대상. 부서명이 정확한지 확인',
  },
  {
    key: 'sponsor',
    extractionMethod: '직접추출',
    source: '미팅노트 내 의사결정권자/스폰서 언급',
    rawDataNeeded: ['대표이사/CTO/CDO 등 직급', '이름', 'AX 추진 의지 관련 발언'],
    threshold: { maxLength: 30 },
    collectionIntent: 'P9 스폰서 표시, 실행력 담보의 근거',
    templateUsage: ['P9 스폰서'],
    dependencies: [],
    confidenceSignals: {
      high: '"대표이사 김OO" 등 직급+이름 명시',
      low: '스폰서 관련 언급 없음',
    },
    reviewerHint: '직급 + 이름 형식이 바람직 (예: 대표이사 김OO)',
  },
  {
    key: 'kpis',
    extractionMethod: '추론생성',
    source: '미팅에서 논의된 목표치 + 현황 기반 KPI 추론',
    rawDataNeeded: [
      '현재 자동화율 및 목표',
      'AI 리더/챔피언 양성 계획',
      '비용 절감 목표 (월단위)',
      'AI 서비스 론칭 계획',
      '개발 리드타임 현재/목표',
      '데이터 기반 의사결정 빈도',
      'AI 활용 인력 현재/목표',
    ],
    threshold: {},
    collectionIntent: 'P9 KPI 카드 3종 (조직/인재 관점, 경영 성과 관점, 서비스 혁신 관점)',
    templateUsage: ['P9 KPI 카드'],
    dependencies: ['employees', 'aiSpecialists', 'targetDepts'],
    confidenceSignals: {
      high: '목표 수치가 미팅에서 직접 논의됨',
      low: '대부분의 KPI를 AI가 업종 평균 기반으로 추정',
    },
    reviewerHint: '각 KPI가 "현재→목표" 형식인지 확인. 비현실적 목표치는 조정',
  },

  // ━━ 그룹 6: 업무 프로세스 분석 ━━
  {
    key: 'painPoints',
    extractionMethod: '추론생성',
    source: '미팅에서 언급된 부서별 업무 문제점, 수작업 이슈',
    rawDataNeeded: [
      '각 부서에서 언급한 업무 불만/비효율',
      '수작업으로 처리하는 반복 업무',
      '시간 소요가 큰 업무 (주단위)',
      'AI로 개선 가능한 업무 영역',
      '우선 해결이 필요한 업무',
    ],
    threshold: { requiredCount: 4 },
    collectionIntent: 'P6 Pain Point 테이블, 시간절감 계산(hours×0.6), ROI 산출',
    templateUsage: ['P6 Pain Point 테이블', 'P6 시간절감/ROI'],
    dependencies: ['targetDepts'],
    confidenceSignals: {
      high: '부서별로 구체적 업무 문제와 소요 시간이 언급됨',
      low: '문제가 추상적으로만 언급되어 시간/부서 추정 필요',
    },
    reviewerHint: 'weeklyHours는 "15h" 형식, aiApplicability는 ★1~5개, priority는 높음/중간/낮음',
  },
  {
    key: 'findings',
    extractionMethod: '추론생성',
    source: '미팅 전체 내용에서 핵심 인사이트 도출',
    rawDataNeeded: ['미팅 전반의 주요 발견사항', '예상 밖의 인사이트', '구조적 문제점'],
    threshold: { requiredCount: 3 },
    collectionIntent: 'P2 Executive Summary 인사이트 섹션',
    templateUsage: ['P2 인사이트'],
    dependencies: [],
    confidenceSignals: {
      high: '미팅에서 다양한 관점의 정보가 풍부하게 제공됨',
      low: '미팅 내용이 제한적이어서 인사이트 도출이 어려움',
    },
    reviewerHint: '3~5개 문장. 일반론이 아닌 해당 기업 특수한 인사이트인지 확인',
  },

  // ━━ 그룹 7: 내부 역량 진단 ━━
  {
    key: 'internalCapabilities',
    extractionMethod: '추론생성',
    source: '미팅 내용 기반 7개 영역 종합 진단',
    rawDataNeeded: [
      '[경영진 리더십] AI에 대한 경영진 태도, 의지, 비전',
      '[조직 문화] 변화 수용성, 디지털 리터러시, 혁신 분위기',
      '[인적 역량] AI/데이터 인력, 학습 의지, 교육 이력',
      '[데이터 자산] 데이터 수집/관리 체계, DB 현황, 품질',
      '[IT 인프라] 서버, 클라우드, 네트워크, 보안 수준',
      '[업무 프로세스] 표준화 수준, 자동화 정도, 문서화',
      '[재무 여력] AI 투자 가능 예산, 재무 건전성',
    ],
    threshold: { requiredCount: 7 },
    collectionIntent: 'P7 내부 역량 진단 테이블 (7행)',
    templateUsage: ['P7 내부 역량 테이블'],
    dependencies: ['scores', 'aiBudget', 'aiSpecialists'],
    confidenceSignals: {
      high: '7개 영역 대부분에 대해 구체적 현황이 파악됨',
      low: '일부 영역 정보 부재로 업종 일반론 기반 추정',
    },
    reviewerHint: 'level은 양호/보통/미흡 중 택1. 7개 영역 모두 채워졌는지 확인',
  },
  {
    key: 'collaborationTool',
    extractionMethod: '직접추출',
    source: '미팅노트 내 협업 도구 언급',
    rawDataNeeded: ['사용 중인 메신저/협업 플랫폼', 'Slack/Teams/카카오워크/잔디 등'],
    threshold: { maxLength: 50 },
    collectionIntent: 'P7 협업 환경 현황 표시, 기술환경 진단 보조',
    templateUsage: ['P7 협업 도구'],
    dependencies: [],
    defaultValue: '미확인',
    confidenceSignals: {
      high: '"Slack 사용 중", "카카오워크로 소통" 등 직접 언급',
      low: '협업 도구 관련 언급 없음',
    },
    reviewerHint: '도구명을 정확히 기재. 미확인이면 그대로 두어도 됨',
  },
  {
    key: 'aiApplicationAreas',
    extractionMethod: '컨텍스트판단',
    source: '업종 특성 + 미팅에서 언급된 AI 활용 가능 영역',
    rawDataNeeded: ['업종에서 일반적으로 AI 적용 가능한 영역', '미팅에서 언급된 AI 활용 아이디어'],
    threshold: { maxLength: 100 },
    collectionIntent: 'P7 업종별 AI 적용 영역 표시',
    templateUsage: ['P7 AI 적용 영역'],
    dependencies: ['industry'],
    confidenceSignals: {
      high: 'AI 적용 영역이 미팅에서 구체적으로 논의됨',
      low: '업종 일반론 기반으로 AI가 추정',
    },
    reviewerHint: '해당 업종에 실제로 적용 가능한 영역인지 확인',
  },

  // ━━ 그룹 8: SWOT 교차 전략 ━━
  {
    key: 'crossStrategies',
    extractionMethod: '복합계산',
    source: 'swot 필드의 S/W/O/T 조합으로 4가지 전략 생성',
    rawDataNeeded: [
      'swot.strengths + swot.opportunities → SO 공격 전략',
      'swot.weaknesses + swot.opportunities → WO 개선 전략',
      'swot.strengths + swot.threats → ST 방어 전략',
      'swot.weaknesses + swot.threats → WT 생존 전략',
    ],
    threshold: {},
    collectionIntent: 'P8 SWOT 교차 전략 매트릭스 (2×2 그리드)',
    templateUsage: ['P8 교차 전략 매트릭스'],
    dependencies: ['swot'],
    confidenceSignals: {
      high: 'swot 필드가 충분히 구체적이어서 전략 도출 근거 충분',
      low: 'swot 필드가 추상적이어서 전략도 일반론에 가까움',
    },
    reviewerHint: 'SO/WO/ST/WT 각 2~3문장. swot 내용과 논리적으로 연결되는지 확인',
  },

  // ━━ 그룹 9: Gap 분석 ━━
  {
    key: 'gapAnalysis',
    extractionMethod: '복합계산',
    source: 'scores 필드의 현재값과 목표값(전략4.0/데이터3.5/프로세스4.0/인재4.0/기술4.0) 차이 분석',
    rawDataNeeded: [
      'scores.strategy 현재값 → 목표 4.0과 비교',
      'scores.data 현재값 → 목표 3.5와 비교',
      'scores.process 현재값 → 목표 4.0과 비교',
      'scores.talent 현재값 → 목표 4.0과 비교',
      'scores.tech 현재값 → 목표 4.0과 비교',
      '각 영역별 현재 상태 서술, 목표 상태 서술, 전환 액션',
    ],
    threshold: { requiredCount: 5 },
    collectionIntent: 'P10 Gap 분석 테이블 + 색상 배지 (높은Gap/중간Gap/낮은Gap)',
    templateUsage: ['P10 Gap 분석 테이블'],
    dependencies: ['scores'],
    confidenceSignals: {
      high: 'scores가 구체적 근거 기반이고 영역별 현황 서술 가능',
      low: 'scores 자체가 추정치여서 Gap 분석도 신뢰도 낮음',
    },
    reviewerHint: '5개 영역 모두 채워졌는지, As-Is/To-Be/Action이 구체적인지 확인',
  },

  // ━━ 그룹 10: AX 혁신 과제 ━━
  {
    key: 'innovationTasks',
    extractionMethod: '복합계산',
    source: 'topTasks + painPoints 기반 확장, P1/P2/P3 우선순위 배분',
    rawDataNeeded: [
      'topTasks의 3개 과제 (P1 후보)',
      'painPoints에서 도출된 추가 과제',
      '각 과제의 담당 부서, 유형(자동화/생성AI/챗봇/데이터/인프라)',
      '난이도(상/중/하), 효과(★1~5), 우선순위(P1/P2/P3)',
    ],
    threshold: { requiredCount: 8 },
    collectionIntent: 'P11 혁신 과제 테이블, Gantt 차트 및 세부 계획의 입력',
    templateUsage: ['P11 혁신 과제 테이블'],
    dependencies: ['topTasks', 'painPoints'],
    confidenceSignals: {
      high: 'topTasks와 painPoints가 충실하여 과제 도출 근거 충분',
      low: '기반 데이터가 부족하여 AI가 대부분 생성',
    },
    reviewerHint: '8~10개 과제, P1 3~4개/P2 3개/P3 2~3개 균형 배분 확인',
  },

  // ━━ 그룹 11: 세부 추진 계획 ━━
  {
    key: 'detailedPlans',
    extractionMethod: '복합계산',
    source: 'innovationTasks의 P1 과제에 대해 세부 계획 구체화',
    rawDataNeeded: [
      'P1 과제 목록 (innovationTasks에서 priority="P1")',
      '각 과제의 추진 방법 (1~2문장)',
      '담당자/팀 (예: 재무 챔피언 + AX Master)',
      '기간 (예: 4주)',
      '성공 기준 (정량적 지표)',
    ],
    threshold: { requiredCount: 2 },
    collectionIntent: 'P12 P1 세부 추진 계획 테이블',
    templateUsage: ['P12 세부 계획 테이블'],
    dependencies: ['innovationTasks'],
    confidenceSignals: {
      high: '미팅에서 구체적 실행 계획이 논의됨',
      low: 'AI가 과제명 기반으로 일반적 계획을 생성',
    },
    reviewerHint: 'P1 과제 수만큼 행이 있는지, 성공 기준이 정량적인지 확인',
  },
  {
    key: 'ganttTasks',
    extractionMethod: '복합계산',
    source: 'innovationTasks 전체 과제의 16주 일정 배치',
    rawDataNeeded: [
      '전체 과제 목록 + 우선순위',
      'P1: 1~6주차 배치 (즉시 실행)',
      'P2: 5~12주차 배치 (단기)',
      'P3: 10~16주차 배치 (중장기)',
      '과제 간 의존성/순서 관계',
    ],
    threshold: { requiredCount: 8 },
    collectionIntent: 'P13 Gantt 차트 시각화 (16주 타임라인)',
    templateUsage: ['P13 Gantt 차트'],
    dependencies: ['innovationTasks'],
    confidenceSignals: {
      high: '과제별 일정이 미팅에서 논의됨',
      low: '우선순위 기반으로 AI가 자동 배치',
    },
    reviewerHint: 'startWeek 1~16, durationWeeks 2~8 범위. P1/P2/P3 시기 겹침 확인',
  },
  {
    key: 'milestones',
    extractionMethod: '복합계산',
    source: 'ganttTasks 기반 4개월(M1~M4) 마일스톤 도출',
    rawDataNeeded: [
      'M1(1개월차): 초기 성과, 환경 구축 완료 항목',
      'M2(2개월차): P1 과제 완료, 조직 교육 완료 항목',
      'M3(3개월차): P2 과제 진행, 중간 성과 항목',
      'M4(4개월차): 전체 완료, 성과 평가 항목',
    ],
    threshold: { requiredCount: 4 },
    collectionIntent: 'P13 마일스톤 타임라인 카드 (M1~M4)',
    templateUsage: ['P13 마일스톤 타임라인'],
    dependencies: ['ganttTasks', 'innovationTasks'],
    confidenceSignals: {
      high: '구체적 달성 항목이 과제와 연결됨',
      low: '일반적 마일스톤 표현',
    },
    reviewerHint: '4개 마일스톤, 각각 2~3개 달성 항목. ganttTasks 일정과 일치하는지 확인',
  },

  // ━━ 그룹 12: 메타 정보 ━━
  {
    key: 'diagnosisDate',
    extractionMethod: '직접추출',
    source: '미팅 날짜 또는 진단일 표기',
    rawDataNeeded: ['미팅 실시 날짜', '진단 보고서 작성일'],
    threshold: { format: 'YYYY.MM.DD', required: true },
    collectionIntent: '커버 페이지 진단일, 전 페이지 날짜 표시',
    templateUsage: ['P1 커버', '전 페이지 헤더'],
    dependencies: [],
    confidenceSignals: {
      high: '"2026년 4월 3일" 등 명확한 날짜 표기',
      low: '날짜 표기 없음',
    },
    reviewerHint: 'YYYY.MM.DD 형식 확인. 미팅일과 진단일이 다를 수 있음',
  },
  {
    key: 'consultantName',
    extractionMethod: '직접추출',
    source: '미팅노트 내 컨설턴트/진행자 이름',
    rawDataNeeded: ['컨설턴트 이름', '진단 담당자'],
    threshold: { maxLength: 20 },
    collectionIntent: '커버 페이지 컨설턴트명 표시',
    templateUsage: ['P1 커버'],
    dependencies: [],
    confidenceSignals: {
      high: '컨설턴트 이름이 명시됨',
      low: '담당자 이름 언급 없음',
    },
    reviewerHint: '실제 컨설턴트 이름과 일치하는지 확인',
  },
  {
    key: 'interviewInfo',
    extractionMethod: '직접추출',
    source: '미팅노트 내 참석자 수, 일시 정보',
    rawDataNeeded: ['미팅 참석자 수 (명)', '인터뷰 실시 일자'],
    threshold: {},
    collectionIntent: 'P2 인터뷰 정보 표시 ("참여자 N명, YYYY.MM.DD 실시")',
    templateUsage: ['P2 인터뷰 정보'],
    dependencies: [],
    confidenceSignals: {
      high: '"5명 참석", "4월 3일 실시" 등 명시',
      low: '참석자 수나 일시가 불분명',
    },
    reviewerHint: 'participants는 숫자만, date는 날짜 형식 확인',
  },
];

// ── 유틸리티: config 조회 ──

const configMap = new Map(EXTRACTION_CONFIG.map((c) => [c.key, c]));

export function getFieldConfig(key: string): FieldExtractionConfig | undefined {
  return configMap.get(key);
}

// ── Tool Schema Description 동적 생성 ──

export function getToolSchemaDescriptions(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const cfg of EXTRACTION_CONFIG) {
    const parts: string[] = [cfg.collectionIntent];
    if (cfg.threshold.required) parts.push('필수');
    if (cfg.threshold.maxLength) parts.push(`최대 ${cfg.threshold.maxLength}자`);
    if (cfg.threshold.range) parts.push(`범위: ${cfg.threshold.range[0]}~${cfg.threshold.range[1]}`);
    if (cfg.threshold.format) parts.push(`형식: ${cfg.threshold.format}`);
    if (cfg.threshold.enumValues) parts.push(`허용값: ${cfg.threshold.enumValues.join('/')}`);
    if (cfg.threshold.requiredCount) parts.push(`최소 ${cfg.threshold.requiredCount}개`);
    if (cfg.extractionMethod === '복합계산') parts.push(`의존: ${cfg.dependencies.join(', ')}`);
    result[cfg.key] = parts.join('. ');
  }
  return result;
}

// ── 프롬프트 생성 ──

function buildThresholdTags(cfg: FieldExtractionConfig): string {
  const tags: string[] = [];
  if (cfg.threshold.required) tags.push('⚠️필수');
  if (cfg.threshold.requiredCount) tags.push(`최소${cfg.threshold.requiredCount}개`);
  if (cfg.threshold.range) tags.push(`${cfg.threshold.range[0]}~${cfg.threshold.range[1]}`);
  return tags.length > 0 ? ` [${tags.join(', ')}]` : '';
}

export function getExtractionPromptSection(): string {
  const groups: Record<ExtractionMethod, FieldExtractionConfig[]> = {
    '직접추출': [],
    '컨텍스트판단': [],
    '추론생성': [],
    '복합계산': [],
  };

  for (const cfg of EXTRACTION_CONFIG) {
    groups[cfg.extractionMethod].push(cfg);
  }

  const lines: string[] = [
    '\n\n## 필드별 추출 규칙 (추출 순서대로)',
    '',
    '### 1단계: 직접추출 — 미팅노트에 명시된 정보를 그대로 추출',
  ];

  for (const cfg of groups['직접추출']) {
    const tags = buildThresholdTags(cfg);
    lines.push(`- **${cfg.key}**${tags}: ${cfg.source}`);
    lines.push(`  필요 데이터: ${cfg.rawDataNeeded.join(', ')}`);
    if (cfg.threshold.format) lines.push(`  형식: ${cfg.threshold.format}`);
    if (cfg.threshold.enumValues) lines.push(`  허용값: ${cfg.threshold.enumValues.join('/')}`);
    if (cfg.threshold.range) lines.push(`  범위: ${cfg.threshold.range[0]}~${cfg.threshold.range[1]}`);
  }

  lines.push('', '### 2단계: 컨텍스트판단 — 미팅 맥락에서 종합적으로 판단');
  for (const cfg of groups['컨텍스트판단']) {
    const tags = buildThresholdTags(cfg);
    lines.push(`- **${cfg.key}**${tags}: ${cfg.source}`);
    lines.push(`  판단 근거: ${cfg.rawDataNeeded.join(', ')}`);
    lines.push(`  신뢰도 높음: ${cfg.confidenceSignals.high}`);
    lines.push(`  신뢰도 낮음: ${cfg.confidenceSignals.low}`);
  }

  lines.push('', '### 3단계: 추론생성 — 미팅 내용 기반으로 AI가 구조화하여 생성');
  for (const cfg of groups['추론생성']) {
    const tags = buildThresholdTags(cfg);
    lines.push(`- **${cfg.key}**${tags}: ${cfg.source}`);
    lines.push(`  필요 데이터: ${cfg.rawDataNeeded.join(', ')}`);
  }

  lines.push('', '### 4단계: 복합계산 — 앞서 추출된 필드를 조합하여 생성 (의존 필드 먼저 완성할 것)');
  for (const cfg of groups['복합계산']) {
    const tags = buildThresholdTags(cfg);
    lines.push(`- **${cfg.key}**${tags} (의존: ${cfg.dependencies.join(', ')}): ${cfg.source}`);
    lines.push(`  생성 규칙: ${cfg.rawDataNeeded.join('; ')}`);
  }

  return lines.join('\n');
}

// ── 리뷰 가이드 ──

export interface ReviewGuidance {
  extractionMethod: ExtractionMethod;
  collectionIntent: string;
  reviewerHint: string;
  threshold: FieldThreshold;
  dependencies: string[];
  confidenceSignals: { high: string; low: string };
}

export function getReviewGuidance(fieldKey: string): ReviewGuidance | null {
  const cfg = configMap.get(fieldKey);
  if (!cfg) return null;
  return {
    extractionMethod: cfg.extractionMethod,
    collectionIntent: cfg.collectionIntent,
    reviewerHint: cfg.reviewerHint,
    threshold: cfg.threshold,
    dependencies: cfg.dependencies,
    confidenceSignals: cfg.confidenceSignals,
  };
}

// ── 유효성 검증 ──

export interface ValidationError {
  field: string;
  message: string;
}

export function validateField(key: string, value: unknown): ValidationError | null {
  const cfg = configMap.get(key);
  if (!cfg) return null;
  const { threshold } = cfg;

  if (threshold.required && (value == null || value === '')) {
    return { field: key, message: '필수 입력 항목입니다' };
  }

  if (value == null) return null;

  if (threshold.range && typeof value === 'number') {
    const [min, max] = threshold.range;
    if (value < min || value > max) {
      return { field: key, message: `${min}~${max} 범위여야 합니다 (현재: ${value})` };
    }
  }

  if (threshold.maxLength && typeof value === 'string') {
    if (value.length > threshold.maxLength) {
      return { field: key, message: `최대 ${threshold.maxLength}자 (현재: ${value.length}자)` };
    }
  }

  if (threshold.enumValues && typeof value === 'string') {
    if (!threshold.enumValues.some((e) => value.includes(e))) {
      return { field: key, message: `허용값: ${threshold.enumValues.join(', ')}` };
    }
  }

  if (threshold.requiredCount && Array.isArray(value)) {
    if (value.length < threshold.requiredCount) {
      return { field: key, message: `최소 ${threshold.requiredCount}개 항목 필요 (현재: ${value.length}개)` };
    }
  }

  if (threshold.format === 'YYYY.MM.DD' && typeof value === 'string') {
    if (!/^\d{4}\.\d{2}\.\d{2}$/.test(value)) {
      return { field: key, message: 'YYYY.MM.DD 형식이어야 합니다' };
    }
  }

  return null;
}

export function validateAllFields(fields: ReportFields): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const cfg of EXTRACTION_CONFIG) {
    const value = (fields as unknown as Record<string, unknown>)[cfg.key];
    const err = validateField(cfg.key, value);
    if (err) errors.push(err);
  }
  return errors;
}

// ── 의존성 체크 ──

export function getDependentFields(changedKey: string): string[] {
  return EXTRACTION_CONFIG
    .filter((c) => c.dependencies.includes(changedKey))
    .map((c) => c.key);
}
