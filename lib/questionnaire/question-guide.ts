export type AnswerType = 'single' | 'multi' | 'rank' | 'text' | 'number';

export interface SurveyQuestion {
  id: string;
  part: string;
  partLabel: string;
  questionText: string;
  answerType: AnswerType;
  options?: string[];
  purpose: string;
  reportSections: string[];
  reportFieldKeys: string[];
}

export interface MeetingGuideQuestion {
  id: string;
  phase: 1 | 2 | 3 | 4;
  phaseLabel: string;
  phaseDuration: string;
  questionTemplate: string;
  purpose: string;
  reportSections: string[];
  relatedSurveyIds: string[];
}

// ---------------------------------------------------------------------------
// SURVEY_QUESTIONS — A1..J17, S1..S10
// ---------------------------------------------------------------------------

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // ── Part A: 기본 정보 ──────────────────────────────────────────────────
  {
    id: 'A1',
    part: 'A',
    partLabel: '기본 정보',
    questionText: '귀사의 정식 회사명을 입력해주세요.',
    answerType: 'text',
    purpose: '기업 식별 및 리포트 표지, 기업 개요 작성 기반',
    reportSections: ['P1', 'P3'],
    reportFieldKeys: ['companyName'],
  },
  {
    id: 'A2',
    part: 'A',
    partLabel: '기본 정보',
    questionText: '이번 진단을 주도하실 분의 성함을 입력해주세요.',
    answerType: 'text',
    purpose: '담당자 식별 및 향후 커뮤니케이션',
    reportSections: ['P3'],
    reportFieldKeys: ['interviewInfo'],
  },
  {
    id: 'A3',
    part: 'A',
    partLabel: '기본 정보',
    questionText: '현재 직급 또는 직책을 선택해주세요.',
    answerType: 'single',
    options: [
      'C-Level (CEO, CTO, CFO 등)',
      '임원 (이사, 부사장)',
      '부장',
      '과장/팀장',
      '대리/사원',
    ],
    purpose: '의사결정 권한 레벨 파악 → CRM 등급 판정 기준①',
    reportSections: ['P3', 'CRM'],
    reportFieldKeys: ['sponsor'],
  },
  {
    id: 'A4',
    part: 'A',
    partLabel: '기본 정보',
    questionText: '현재 회사의 총 임직원 수를 선택해주세요.',
    answerType: 'single',
    options: ['1~50명', '51~100명', '101~300명', '301~1000명', '1000명 이상'],
    purpose: '조직 복잡도 파악 → 모듈 및 교육 규모 추천 기준',
    reportSections: ['P3', 'P9', 'P12'],
    reportFieldKeys: ['employees'],
  },
  {
    id: 'A5',
    part: 'A',
    partLabel: '기본 정보',
    questionText: '본인의 주요 업무 영역을 선택해주세요.',
    answerType: 'single',
    options: [
      '경영/기획',
      '재무/회계',
      '영업/마케팅',
      'HR/조직',
      '기술/IT',
      '운영/CS',
      '기타',
    ],
    purpose: '응답자 관점 파악 → 교육 트랙 및 Quick Win 분기',
    reportSections: ['P3', 'P13'],
    reportFieldKeys: [],
  },

  // ── Part B: 프로세스 & 도구 & 데이터 성숙도 ────────────────────────────
  {
    id: 'B1',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '귀사의 핵심 업무 프로세스는 얼마나 표준화되어 있습니까?',
    answerType: 'single',
    options: ['비표준', '부분 표준화', '표준화 정착', '지속 개선', '최적화'],
    purpose: '프로세스 체계화 수준 정량화',
    reportSections: ['P4 지표1', 'P2'],
    reportFieldKeys: ['scores'],
  },
  {
    id: 'B2',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '일상 업무 중 병목 현상이나 반복적으로 시간이 많이 드는 부분이 있습니까?',
    answerType: 'single',
    options: ['매우 심함', '자주 발생', '때때로', '거의 없음', '최적화됨'],
    purpose: 'B1 정성 검증 및 Pain Point 우선순위 도출',
    reportSections: ['P4 지표1', 'P5'],
    reportFieldKeys: ['scores', 'painPoints'],
  },
  {
    id: 'B3',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '업무 자동화(RPA, 매크로, 스크립트 등)를 지원할 기술 인프라가 충분합니까?',
    answerType: 'single',
    options: ['없음', '극소', '부분', '구축', '고도화'],
    purpose: '자동화 기반 인프라 평가 → 과제 추천 범위 결정',
    reportSections: ['P4 지표2', 'P10'],
    reportFieldKeys: ['scores'],
  },
  {
    id: 'B4',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '일상적으로 반복되는 보고서 작성, 데이터 수집, 통합 작업이 얼마나 수동으로 이루어집니까?',
    answerType: 'single',
    options: [
      '거의 전부 수동',
      '대부분 수동',
      '혼합',
      '대부분 자동',
      '거의 전부 자동',
    ],
    purpose: '반복 업무 자동화 현황 파악 → 과제 발굴',
    reportSections: ['P4 지표2', 'P5', 'P10'],
    reportFieldKeys: ['scores', 'painPoints'],
  },
  {
    id: 'B5',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '업무에 사용하는 도구들(이메일, CRM, ERP, 협업 도구 등)이 얼마나 효과적으로 활용되고 있습니까?',
    answerType: 'single',
    options: ['낮음', '부분적', '중간', '높음', '최적화'],
    purpose: '도구 표준화 및 통합 수준 평가',
    reportSections: ['P4 지표3'],
    reportFieldKeys: ['scores'],
  },
  {
    id: 'B6',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: 'ChatGPT, Claude, 업무 AI 도구 등을 활용할 수 있는 환경과 문화가 있습니까?',
    answerType: 'single',
    options: ['없음', '시기', '시범', '운영', '고도화'],
    purpose: 'AI 도입 단계 판정 → 교육/솔루션 강도 결정',
    reportSections: ['P3', 'P4 지표3', 'P13'],
    reportFieldKeys: ['aiStage', 'scores'],
  },
  {
    id: 'B7',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '업무 데이터가 어디에 저장되고 있습니까?',
    answerType: 'single',
    options: ['매우 분산', '분산', '부분 통합', '중앙화', '완전 통합'],
    purpose: '데이터 분산도 평가 → 데이터 통합 과제 도출',
    reportSections: ['P4 지표4', 'P6'],
    reportFieldKeys: ['scores'],
  },
  {
    id: 'B8',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '데이터를 수집, 관리, 활용하기 위한 정책이나 체계가 있습니까?',
    answerType: 'single',
    options: ['없음', '초기', '부분', '공식', '고도화'],
    purpose: '데이터 거버넌스 수준 파악 → 내부 역량 평가',
    reportSections: ['P4 지표4', 'P6', 'P9'],
    reportFieldKeys: ['scores'],
  },
  {
    id: 'B9',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '경영진이 업무 자동화와 AI 활용에 대해 얼마나 적극적으로 추진하려고 합니까?',
    answerType: 'single',
    options: ['관심 없음', '인식', '계획', '추진', '전략'],
    purpose: '경영진 의지 평가 → 추진 강도 및 리스크 결정',
    reportSections: ['P4 지표5', 'P9'],
    reportFieldKeys: ['scores'],
  },
  {
    id: 'B10',
    part: 'B',
    partLabel: '프로세스 & 도구 & 데이터 성숙도',
    questionText: '새로운 도구나 프로세스 변화를 조직이 얼마나 쉽게 수용합니까?',
    answerType: 'single',
    options: ['저항 높음', '부분 저항', '중립', '수용', '주도적'],
    purpose: '조직 변화 수용도 평가 → 교육 강도 및 change mgmt 필요성',
    reportSections: ['P4 지표5', 'P13'],
    reportFieldKeys: ['scores'],
  },

  // ── Part C: Pain Point & 자동화 희망 ────────────────────────────────────
  {
    id: 'C1',
    part: 'C',
    partLabel: 'Pain Point & 자동화 희망',
    questionText: '현재 AI(ChatGPT, Claude 등)를 활용해 가장 먼저 개선하고 싶은 업무는 무엇입니까?',
    answerType: 'multi',
    options: [
      '문서 작성/정보 검색',
      '데이터 분석/통계',
      '고객 응대/상담',
      '이메일/문서 작성 자동화',
      '업무 자동화(RPA)',
      '교육/교재 개발',
      '기획/전략 수립',
      '기타',
    ],
    purpose: 'Quick Win 영역 후보 직접 도출',
    reportSections: ['P5', 'P10'],
    reportFieldKeys: ['painPoints', 'innovationTasks'],
  },
  {
    id: 'C2',
    part: 'C',
    partLabel: 'Pain Point & 자동화 희망',
    questionText: '현재 업무에서 가장 답답하거나 시간이 많이 드는 상황을 구체적으로 설명해주세요.',
    answerType: 'text',
    purpose: "Pain Point 정성 데이터 → 리포트 '현황 분석' 섹션 작성 근거",
    reportSections: ['P5'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'C3',
    part: 'C',
    partLabel: 'Pain Point & 자동화 희망',
    questionText: '한 주에 많은 시간이 소요되는 반복 업무는 무엇입니까?',
    answerType: 'multi',
    options: [
      '데이터 입력/정리',
      '보고서 작성',
      '이메일/문서 처리',
      '회의/미팅 준비',
      '승인/검토 프로세스',
      '기타',
    ],
    purpose: '자동화 ROI 산출의 핵심 데이터',
    reportSections: ['P5', 'P10', 'P14'],
    reportFieldKeys: ['painPoints', 'innovationTasks'],
  },
  {
    id: 'C4',
    part: 'C',
    partLabel: 'Pain Point & 자동화 희망',
    questionText: '만약 한 가지 업무만 자동화할 수 있다면 무엇을 선택하시겠습니까? 그 이유는?',
    answerType: 'text',
    purpose: '고객이 직접 제시하는 과제 → 참여도 높고 현실성 높은 과제',
    reportSections: ['P10'],
    reportFieldKeys: ['innovationTasks'],
  },

  // ── Part D: 장벽 & 규제/보안 ───────────────────────────────────────────
  {
    id: 'D1',
    part: 'D',
    partLabel: '장벽 & 규제/보안',
    questionText: '자동화 도입 시 가장 큰 장벽은 무엇입니까?',
    answerType: 'rank',
    options: [
      '비용/예산 부족',
      '조직 내 저항/문화',
      '기술/인프라 미흡',
      '인력 부족',
      '성과 측정의 어려움',
    ],
    purpose: '1단계 해결 과제 도출 → 컨설팅 전략 결정',
    reportSections: ['P7', 'P10'],
    reportFieldKeys: ['swot'],
  },
  {
    id: 'D2',
    part: 'D',
    partLabel: '장벽 & 규제/보안',
    questionText: '업무 수행 시 반드시 준수해야 할 규제나 인증은 무엇입니까?',
    answerType: 'multi',
    options: [
      'GDPR/개인정보보호법',
      '금융감독 규제',
      'ISO 인증',
      '보안 기준(SOC2 등)',
      '의료 규제',
      '없음',
      '기타',
    ],
    purpose: '보안/컴플라이언스 요구사항 파악 → 솔루션 선택 기준',
    reportSections: ['P6', 'P7'],
    reportFieldKeys: ['swot', 'externalEnv'],
  },
  {
    id: 'D3',
    part: 'D',
    partLabel: '장벽 & 규제/보안',
    questionText: 'AI나 자동화 도입 시 가장 우려하는 보안 또는 개인정보 문제는 무엇입니까?',
    answerType: 'multi',
    options: [
      '데이터 유출 위험',
      'AI 모델의 신뢰성',
      '규정 위반 가능성',
      '내부 정보 노출',
      '감시/모니터링 우려',
      '특별한 우려 없음',
    ],
    purpose: '데이터 보안 전략 설계 근거 → Trust building',
    reportSections: ['P6', 'P7', 'P9'],
    reportFieldKeys: ['swot', 'internalCapabilities'],
  },

  // ── Part E: 협업 & 지식관리 ─────────────────────────────────────────────
  {
    id: 'E1',
    part: 'E',
    partLabel: '협업 & 지식관리',
    questionText: '조직 내 지식과 정보 관리에서 가장 큰 문제는 무엇입니까?',
    answerType: 'multi',
    options: [
      '정보가 여러 곳에 흩어져 있음',
      '찾아야 할 정보를 찾기 어려움',
      '정보가 최신으로 유지되지 않음',
      '부서 간 정보 공유 미흡',
      '문서화 미흡',
      '특별한 문제 없음',
    ],
    purpose: '협업 도구 및 지식관리 시스템 Pain Point 도출',
    reportSections: ['P5', 'P9'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'E2',
    part: 'E',
    partLabel: '협업 & 지식관리',
    questionText: '다른 부서와의 협업 시 가장 큰 애로사항은 무엇입니까?',
    answerType: 'multi',
    options: [
      '소통 지연/단절',
      '승인 프로세스 복잡',
      '중복된 업무',
      '책임 소재 불명확',
      '도구 불일치',
      '특별한 애로 없음',
    ],
    purpose: '부서간 소통 장벽 파악 → 협업 도구 및 프로세스 개선 근거',
    reportSections: ['P5', 'P6'],
    reportFieldKeys: ['painPoints', 'internalCapabilities'],
  },

  // ── Part F: 도입 기준 & 예산 & 인원 ─────────────────────────────────────
  {
    id: 'F1',
    part: 'F',
    partLabel: '도입 기준 & 예산 & 인원',
    questionText: '솔루션을 선택할 때 가장 중요한 기준을 선택해주세요.',
    answerType: 'rank',
    options: [
      '비용',
      '도입 속도',
      '사용 편의성',
      '보안/규정 준수',
      '지원/교육 품질',
      '확장성/유연성',
    ],
    purpose: '솔루션 제안 우선순위 결정 → 패키지 매칭',
    reportSections: ['P14', 'P15'],
    reportFieldKeys: ['kpis'],
  },
  {
    id: 'F2',
    part: 'F',
    partLabel: '도입 기준 & 예산 & 인원',
    questionText: 'AX 솔루션 도입에 할당할 수 있는 예산 범위는 어느 정도입니까?',
    answerType: 'single',
    options: [
      '미정/논의 필요',
      '1천만원 이하',
      '1천~5천만원',
      '5천~1억원',
      '1억원 이상',
    ],
    purpose: '서비스 패키지 매칭 → CRM 등급 판정 기준②',
    reportSections: ['P14', 'P15'],
    reportFieldKeys: ['kpis', 'recommendedPath'],
  },
  {
    id: 'F3',
    part: 'F',
    partLabel: '도입 기준 & 예산 & 인원',
    questionText: '솔루션 도입 1단계에서 사용할 인원은 몇 명입니까?',
    answerType: 'single',
    options: ['1~5명', '6~20명', '21~50명', '51~100명', '100명 이상'],
    purpose: '교육 규모 및 로드맵 설계 근거',
    reportSections: ['P9', 'P12', 'P13'],
    reportFieldKeys: ['targetDepts'],
  },

  // ── Part G: 기대 효과 & 파일럿 ─────────────────────────────────────────
  {
    id: 'G1',
    part: 'G',
    partLabel: '기대 효과 & 파일럿',
    questionText: 'AX 도입으로 가장 기대하는 효과는 무엇입니까?',
    answerType: 'multi',
    options: [
      '업무 시간 단축',
      '비용 절감',
      '인력 재배치 가능',
      '오류/휴먼에러 감소',
      '직원 만족도 향상',
      '의사결정 속도 향상',
      '고객 만족도 향상',
    ],
    purpose: 'KPI 프레임워크 설계 근거 → 성과 측정 기준',
    reportSections: ['P14', 'P15'],
    reportFieldKeys: ['kpis'],
  },
  {
    id: 'G2',
    part: 'G',
    partLabel: '기대 효과 & 파일럿',
    questionText: 'AX 1단계 파일럿을 어느 부서 또는 업무부터 시작하고 싶으신가요? 그 이유는?',
    answerType: 'text',
    purpose: '1단계 실행 범위 설정 → 실행계획 수립',
    reportSections: ['P10', 'P12'],
    reportFieldKeys: ['targetDepts', 'innovationTasks'],
  },

  // ── Part H: 기업 현황 & AI 투자 ────────────────────────────────────────
  {
    id: 'H1',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: '귀사의 업종/산업군은?',
    answerType: 'single',
    options: [
      '제조업',
      'IT·소프트웨어',
      '유통·커머스',
      '금융·보험',
      '교육·연구',
      '의료·바이오',
      '건설·부동산',
      '미디어·콘텐츠',
      '전문서비스',
      '기타',
    ],
    purpose: '산업별 AI 트렌드·경쟁 현황 비교 및 외부 환경분석 기반 데이터',
    reportSections: ['P3', 'P6'],
    reportFieldKeys: ['industry'],
  },
  {
    id: 'H2',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: '귀사의 연 매출 규모가 어느 정도입니까?',
    answerType: 'single',
    options: ['10억 미만', '10~50억', '50~100억', '100~500억', '500억 이상'],
    purpose:
      '기업 규모 파악 → CRM 등급 가중치 및 AX 솔루션 패키지 매칭 기준',
    reportSections: ['P3', 'P14'],
    reportFieldKeys: ['revenue'],
  },
  {
    id: 'H3',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: '귀사의 주요 고객층은?',
    answerType: 'multi',
    options: [
      'B2B (기업 대상)',
      'B2C (소비자 대상)',
      'B2G (공공기관 대상)',
      '기타',
    ],
    purpose: '고객 특성에 따른 AI 활용 방향 차별화',
    reportSections: ['P3', 'P6', 'P7'],
    reportFieldKeys: ['customerType'],
  },
  {
    id: 'H4',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: '정규직 비율은?',
    answerType: 'single',
    options: ['90% 이상', '70~90%', '50~70%', '50% 미만', '파악 안 됨'],
    purpose: '조직 안정성 및 교육 대상 인원 산정 기반 데이터',
    reportSections: ['P3', 'P13'],
    reportFieldKeys: ['employees'],
  },
  {
    id: 'H5',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: '현재 전사 AI 도구 구독에 월 얼마를 지출합니까?',
    answerType: 'single',
    options: [
      '0원 (미사용)',
      '10만원 미만',
      '10~50만원',
      '50~100만원',
      '100~300만원',
      '300만원 이상',
    ],
    purpose: '현재 AI 투자 규모 파악 → AX 도입 ROI 비교 기준선 설정',
    reportSections: ['P3', 'P14'],
    reportFieldKeys: ['aiBudget'],
  },
  {
    id: 'H6',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: 'AI 관련 교육에 연간 얼마를 지출합니까?',
    answerType: 'single',
    options: [
      '0원',
      '100만원 미만',
      '100~500만원',
      '500~1000만원',
      '1000만원 이상',
    ],
    purpose: '교육 투자 의지 및 예산 규모 파악 → 교육 모듈 설계 강도 결정',
    reportSections: ['P3', 'P13'],
    reportFieldKeys: ['aiBudget'],
  },
  {
    id: 'H7',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: 'AI/디지털 전담 인력은 몇 명입니까?',
    answerType: 'single',
    options: ['0명', '1명', '2~3명', '4~5명', '6명 이상'],
    purpose: 'AI 전담 조직 유무 파악 → 추진 조직 구성 전략 결정',
    reportSections: ['P3', 'P9'],
    reportFieldKeys: ['aiSpecialists'],
  },
  {
    id: 'H8',
    part: 'H',
    partLabel: '기업 현황 & AI 투자',
    questionText: '직원 개인별 AI 도구 지출은? (개인 결제 포함)',
    answerType: 'single',
    options: [
      '0원',
      '월 2만원 미만',
      '월 2~5만원',
      '월 5~10만원',
      '월 10만원 이상',
    ],
    purpose:
      '비공식 AI 지출(Shadow IT) 규모 파악 → 전사 표준화 필요성 판단',
    reportSections: ['P3', 'P6', 'P7'],
    reportFieldKeys: [],
  },

  // ── Part I: 업무 운영 & 병목 진단 ───────────────────────────────────────
  {
    id: 'I1',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '사용 중인 주요 업무 도구를 모두 선택해주세요.',
    answerType: 'multi',
    options: [
      'Slack',
      'Teams',
      '카카오워크',
      '노션',
      'Google Workspace',
      'MS 365',
      'Jira / Asana',
      'Figma',
      'GitHub',
      'SAP / ERP',
      '기타',
    ],
    purpose: '현재 도구 생태계 파악 → 연동 가능성·자동화 난이도 평가',
    reportSections: ['P4', 'P6', 'P10'],
    reportFieldKeys: ['collaborationTool'],
  },
  {
    id: 'I2',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '하루 평균 업무 알림(메신저, 이메일 등) 건수?',
    answerType: 'single',
    options: [
      '10건 미만',
      '10~30건',
      '30~50건',
      '50~100건',
      '100건 이상',
    ],
    purpose:
      '커뮤니케이션 오버로드 수준 측정 → 협업 도구 자동화 필요성 판단',
    reportSections: ['P5', 'P10'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'I3',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '주당 반복 업무 소요 시간?',
    answerType: 'single',
    options: [
      '5시간 미만',
      '5~10시간',
      '10~20시간',
      '20~30시간',
      '30시간 이상',
    ],
    purpose: '자동화 ROI 산출 핵심 데이터 — 절감 가능 시간 계산 기반',
    reportSections: ['P5', 'P14'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'I4',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '한 건의 보고서 작성 소요 시간?',
    answerType: 'single',
    options: [
      '30분 미만',
      '30분~1시간',
      '1~3시간',
      '3~5시간',
      '5시간 이상',
    ],
    purpose:
      '보고서 자동화 ROI 산출 — 보고서 작성이 Quick Win 과제 선정 핵심 기준',
    reportSections: ['P5', 'P10', 'P14'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'I5',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '승인·결재 대기 지연 빈도?',
    answerType: 'single',
    options: [
      '거의 없음',
      '월 1~2회',
      '주 1~2회',
      '거의 매일',
      '하루에도 여러 번',
    ],
    purpose:
      '워크플로우 자동화 필요성 판단 — 결재 병목이 핵심 Pain Point일 경우 우선 과제화',
    reportSections: ['P5', 'P10', 'P7'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'I6',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: 'AX를 가장 먼저 도입하고 싶은 부서? (최대 3개)',
    answerType: 'multi',
    options: [
      '경영지원',
      '영업',
      '마케팅',
      '재무·회계',
      '인사',
      '개발',
      '디자인',
      '고객지원',
      '생산·제조',
      '물류',
      '기타',
    ],
    purpose: '파일럿 1단계 범위 설정 → 로드맵 Phase 1 부서 확정',
    reportSections: ['P9', 'P10', 'P12'],
    reportFieldKeys: ['targetDepts'],
  },
  {
    id: 'I7',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '해당 부서의 인원 수?',
    answerType: 'text',
    purpose:
      '파일럿 대상 인원 확정 → 교육 규모 및 라이선스 비용 산정 근거',
    reportSections: ['P9', 'P12', 'P13'],
    reportFieldKeys: ['targetDepts'],
  },
  {
    id: 'I8',
    part: 'I',
    partLabel: '업무 운영 & 병목 진단',
    questionText: '해당 부서에서 가장 시간이 많이 소요되는 Top 3 업무?',
    answerType: 'text',
    purpose:
      '과제 발굴의 핵심 원천 데이터 — 구체 업무명이 혁신 과제 제목으로 직접 연결',
    reportSections: ['P5', 'P10'],
    reportFieldKeys: ['painPoints', 'innovationTasks'],
  },

  // ── Part J: 시장·보안·문화 심층 진단 ────────────────────────────────────
  {
    id: 'J1',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '경쟁사의 AI 활용 수준은 어느 정도로 판단하십니까?',
    answerType: 'single',
    options: [
      '전혀 사용 안 함',
      '일부 시작',
      '대다수가 활용',
      '우리가 뒤처짐',
      '잘 모르겠음',
    ],
    purpose:
      '경쟁 압박 수준 → SWOT 위협(T) 강도 결정 + 도입 긴박감 레버 활용',
    reportSections: ['P6', 'P7'],
    reportFieldKeys: ['externalEnv', 'swot'],
  },
  {
    id: 'J2',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: 'AI 관련 정부 지원(AI 바우처 등) 현황?',
    answerType: 'single',
    options: [
      '받고 있음',
      '검토 중',
      '관심 있으나 미신청',
      '해당없음',
      '제도를 모름',
    ],
    purpose:
      '정부 보조금 활용 가능성 파악 → ROI 개선 기회 및 제안 시 레버리지',
    reportSections: ['P6', 'P14'],
    reportFieldKeys: ['externalEnv'],
  },
  {
    id: 'J3',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '최근 1년간 가장 큰 사업 환경 변화는 무엇이었습니까?',
    answerType: 'text',
    purpose:
      '외부 환경 변화 정성 데이터 → SWOT 기회(O)/위협(T) 맥락 보강',
    reportSections: ['P6', 'P7'],
    reportFieldKeys: ['externalEnv', 'swot'],
  },
  {
    id: 'J4',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '사내 데이터의 외부 AI 입력 가이드라인은?',
    answerType: 'single',
    options: [
      '없음',
      '비공식 권고',
      '공식 가이드라인',
      '기술적 차단',
      '전사 DLP 적용',
    ],
    purpose:
      '보안 거버넌스 수준 파악 → AI 거버넌스 수립 과제 도출 여부 결정',
    reportSections: ['P6', 'P7', 'P9'],
    reportFieldKeys: ['swot', 'internalCapabilities'],
  },
  {
    id: 'J5',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '데이터 백업·복구 체계는 어떻게 됩니까?',
    answerType: 'single',
    options: [
      '없음',
      '부분적',
      '정기 백업',
      '자동 백업 + 복구 테스트',
      '재해복구 (DR) 체계',
    ],
    purpose:
      'IT 인프라 안정성 평가 → B3/B7 보완 데이터, AX 도입 선행 조건 점검',
    reportSections: ['P6', 'P7', 'P8'],
    reportFieldKeys: ['swot', 'internalCapabilities'],
  },
  {
    id: 'J6',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '직원 PC 보안 정책은?',
    answerType: 'single',
    options: [
      '별도 없음',
      '백신만',
      'MDM 도입',
      'DLP 적용',
      'Zero Trust 아키텍처',
    ],
    purpose:
      '엔드포인트 보안 수준 파악 → AI 도구 도입 시 보안 전략 강도 결정',
    reportSections: ['P6', 'P7', 'P9'],
    reportFieldKeys: ['internalCapabilities'],
  },
  {
    id: 'J7',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '부서 간 주요 소통 방식은?',
    answerType: 'multi',
    options: [
      '메신저 (Slack, Teams 등)',
      '이메일',
      '전화·구두',
      '화상회의',
      '대면회의',
      '공유문서',
      '기타',
    ],
    purpose:
      '협업 도구 현황 파악 → 커뮤니케이션 자동화·AI 요약 도입 적합성 판단',
    reportSections: ['P4', 'P5', 'P6'],
    reportFieldKeys: ['internalCapabilities'],
  },
  {
    id: 'J8',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '월간 정기 보고서·문서 작성 건수?',
    answerType: 'single',
    options: ['0건', '1~3건', '4~10건', '11~20건', '20건 이상'],
    purpose: 'I4와 결합하여 보고서 자동화 ROI 정량 계산',
    reportSections: ['P5', 'P14'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'J9',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '데이터 취합·정리 월간 소요 시간?',
    answerType: 'single',
    options: [
      '2시간 미만',
      '2~5시간',
      '5~10시간',
      '10~20시간',
      '20시간 이상',
    ],
    purpose:
      '데이터 작업 자동화 ROI 산출 기반 데이터 — B4(보고서 수동처리)와 교차검증',
    reportSections: ['P5', 'P10', 'P14'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'J10',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '해당 부서의 핵심 도구/시스템은 무엇입니까?',
    answerType: 'text',
    purpose:
      'I1 복수선택 보완 — 구체 시스템명 확보 → 연동 과제 설계 정밀도 향상',
    reportSections: ['P6', 'P10'],
    reportFieldKeys: ['internalCapabilities'],
  },
  {
    id: 'J11',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: 'AI가 24시간 일하는 가상 인턴을 배정하면, 어떤 업무를 시키겠습니까?',
    answerType: 'text',
    purpose:
      '응답자가 직접 정의하는 Quick Win 과제 — 창의적·현실적 과제 발굴의 핵심 질문',
    reportSections: ['P5', 'P10'],
    reportFieldKeys: ['innovationTasks'],
  },
  {
    id: 'J12',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '지난 1년간 퇴사 직원 수?',
    answerType: 'single',
    options: ['0명', '1~2명', '3~5명', '6~10명', '10명 이상'],
    purpose:
      '조직 안정성 및 지식 이탈 리스크 파악 → 지식 관리 과제 긴급도 결정',
    reportSections: ['P6', 'P7', 'P10'],
    reportFieldKeys: ['internalCapabilities', 'swot'],
  },
  {
    id: 'J13',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '신규 입사자 업무 적응 기간?',
    answerType: 'single',
    options: [
      '1주 이내',
      '2~4주',
      '1~3개월',
      '3~6개월',
      '6개월 이상',
    ],
    purpose:
      '온보딩 비효율 측정 → AI 기반 온보딩 자동화 과제 필요성 판단 (B1 보완)',
    reportSections: ['P6', 'P10'],
    reportFieldKeys: ['internalCapabilities'],
  },
  {
    id: 'J14',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '"성공적인 AI 도입"이란 귀사에서 어떤 의미인가요?',
    answerType: 'text',
    purpose:
      '고객사 고유 성공 기준 파악 → KPI 프레임워크 맞춤화의 핵심 입력값',
    reportSections: ['P13', 'P14'],
    reportFieldKeys: ['kpis'],
  },
  {
    id: 'J15',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '가장 최근 도입한 새 도구/시스템과 그 경험은?',
    answerType: 'text',
    purpose:
      '변화 수용도 정성 검증 (B10 교차검증) → 도입 방식 맞춤화 근거',
    reportSections: ['P4', 'P6', 'P9'],
    reportFieldKeys: ['internalCapabilities'],
  },
  {
    id: 'J16',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '"이건 꼭 사람이 해야 한다"고 생각하는 업무가 있다면?',
    answerType: 'text',
    purpose:
      'AI 도입 경계선 파악 → 조직의 AI 수용 범위 및 저항 지점 사전 식별',
    reportSections: ['P7', 'P9'],
    reportFieldKeys: ['swot', 'crossStrategies'],
  },
  {
    id: 'J17',
    part: 'J',
    partLabel: '시장·보안·문화 심층 진단',
    questionText: '1년 후 이상적인 업무 방식을 상상한다면?',
    answerType: 'text',
    purpose:
      '고객사의 AX 비전 수립 → Executive Summary 도입 문구 및 로드맵 방향성',
    reportSections: ['P2', 'P12', 'P15'],
    reportFieldKeys: ['coreProblem'],
  },

  // ── Part S: 직원 개별 설문 ──────────────────────────────────────────────
  {
    id: 'S1',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: '바이코딩 인지 여부',
    answerType: 'single',
    options: [
      '처음 들어봄',
      '들어봤지만 잘 모름',
      '대략 알고 있음',
      '직접 해본 적 있음',
      '현재 활용 중',
    ],
    purpose: '직원 AI 기술 트렌드 인지도 파악 → 교육 난이도·출발점 설정',
    reportSections: ['P13', 'P6'],
    reportFieldKeys: [],
  },
  {
    id: 'S2',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: '코딩/프로그래밍 지식 수준',
    answerType: 'single',
    options: [
      '전혀 모름',
      'HTML 정도는 봤음',
      '간단한 스크립트 가능',
      '실무 코딩 사용',
      '개발자 수준',
    ],
    purpose: '직원 기술 역량 분포 파악 → 교육 트랙 설계 근거',
    reportSections: ['P13', 'P6'],
    reportFieldKeys: [],
  },
  {
    id: 'S3',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: 'AI로 만들고 싶은 업무 도구',
    answerType: 'text',
    purpose:
      '직원 관점의 Quick Win 아이디어 직접 수집 → 과제 발굴 원천 데이터',
    reportSections: ['P10', 'P13'],
    reportFieldKeys: ['innovationTasks'],
  },
  {
    id: 'S4',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: '현재 업무 도구 활용도',
    answerType: 'single',
    options: [
      '기본만 사용',
      '절반 정도 활용',
      '대부분 활용',
      '고급 기능·매크로까지',
      '자동화 스크립트 직접 작성',
    ],
    purpose:
      '도구 활용 성숙도 측정 → B5 담당자 응답과 교차검증, 교육 우선순위 결정',
    reportSections: ['P4', 'P13'],
    reportFieldKeys: [],
  },
  {
    id: 'S5',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: '현재 업무의 가장 큰 병목',
    answerType: 'text',
    purpose:
      '직원 관점 Pain Point 수집 → 담당자 C2/C3 응답과 비교·검증',
    reportSections: ['P5', 'P10'],
    reportFieldKeys: ['painPoints'],
  },
  {
    id: 'S6',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: 'AI 업무 활용 빈도',
    answerType: 'single',
    options: [
      '사용 안 함',
      '주 1회 미만',
      '주 1~3회',
      '거의 매일',
      '업무 필수 도구',
    ],
    purpose: '직원 AI 활용률 측정 → AI 도입 단계 판정 근거',
    reportSections: ['P3', 'P4 지표3', 'P6'],
    reportFieldKeys: [],
  },
  {
    id: 'S7',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: '사용 중인 AI 서비스',
    answerType: 'multi',
    options: [
      'ChatGPT 무료',
      'ChatGPT Plus',
      'Claude 무료',
      'Claude Pro',
      'Gemini 무료',
      'Gemini Advanced',
      'Copilot',
      '기타',
      '사용 안 함',
    ],
    purpose:
      'Shadow AI(비공식 개인 구독) 현황 파악 → H8 담당자 응답과 교차검증',
    reportSections: ['P3', 'P6', 'P7'],
    reportFieldKeys: [],
  },
  {
    id: 'S8',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: 'AI로 실제 해본 업무',
    answerType: 'text',
    purpose:
      '현장 AI 활용 사례 수집 → Quick Win 과제 설계 시 현실성 기반 데이터',
    reportSections: ['P5', 'P10'],
    reportFieldKeys: ['innovationTasks'],
  },
  {
    id: 'S9',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: 'AI 교육에서 배우고 싶은 것',
    answerType: 'multi',
    options: [
      '프롬프트 작성법',
      'AI 도구 비교·선택',
      '업무 자동화 워크플로우',
      '바이코딩으로 앱 만들기',
      '데이터 분석',
      'AI 에이전트 구축',
      '클로드코드 활용',
      '기타',
    ],
    purpose:
      '직원 교육 니즈 정량화 → 커리큘럼 모듈 우선순위 결정 핵심 데이터',
    reportSections: ['P13'],
    reportFieldKeys: [],
  },
  {
    id: 'S10',
    part: 'S',
    partLabel: '직원 개별 설문',
    questionText: 'AI 전환에 대한 기대 또는 우려',
    answerType: 'text',
    purpose:
      '직원 감성 데이터 수집 → 변화 관리(Change Management) 전략 설계 근거',
    reportSections: ['P7', 'P9', 'P13'],
    reportFieldKeys: ['swot'],
  },
];

// ---------------------------------------------------------------------------
// ONLINE_MEETING_GUIDE — Phase 1..4
// ---------------------------------------------------------------------------

export const ONLINE_MEETING_GUIDE: MeetingGuideQuestion[] = [
  // ── Phase 1: 아이스브레이킹 (5분) ──────────────────────────────────────
  {
    id: 'phase1-q1',
    phase: 1,
    phaseLabel: '아이스브레이킹',
    phaseDuration: '5분',
    questionTemplate:
      '혹시 조코딩 유튜브 채널이나 저희 컨설팅을 통해 알게 되셨나요?',
    purpose: '유입 경로 확인 + 브랜드 인지도',
    reportSections: ['CRM'],
    relatedSurveyIds: [],
  },
  {
    id: 'phase1-q2',
    phase: 1,
    phaseLabel: '아이스브레이킹',
    phaseDuration: '5분',
    questionTemplate:
      '현재 AI 도구 중 개인적으로 가장 자주 쓰시는 게 있으신가요? 팀·부서 전체에서 AI 도구를 일상적으로 사용하는 직원은 몇 명이고, 전체 인원 대비 몇 %로 보시나요?',
    purpose: 'AI 친숙도 및 선호도 레벨 파악 + 전사 AI 도입률 정량화',
    reportSections: ['P3', 'P6', 'P13'],
    relatedSurveyIds: ['B6', 'S6', 'S7'],
  },
  {
    id: 'phase1-q3',
    phase: 1,
    phaseLabel: '아이스브레이킹',
    phaseDuration: '5분',
    questionTemplate:
      '직원분들 중에 AI를 특별히 잘 활용하거나 새로운 것을 먼저 시도하시는 분이 계시나요?',
    purpose: 'AX 챔피언 후보 파악 → 1단계 리더 선정',
    reportSections: ['P9'],
    relatedSurveyIds: ['B10'],
  },

  // ── Phase 2: 현황 파악 (10분) ──────────────────────────────────────────
  {
    id: 'phase2-q1',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      "설문에서 '프로세스 표준화'에 {B1.label}이라고 하셨는데, 업무 프로세스가 문서화되어 있나요? 가장 표준화되지 않은 프로세스는 무엇인가요?",
    purpose: 'B1 정성 검증 + 프로세스 문서화 수준 + 핵심 병목 특정',
    reportSections: ['P4 지표1', 'P5', 'P8'],
    relatedSurveyIds: ['B1', 'B2'],
  },
  {
    id: 'phase2-q2',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '가장 오래 걸리는 반복 업무 하나를 기준으로, 월간 총 소요 시간(h)과 담당 인원(명)을 알려주실 수 있나요? 만약 이 업무가 50% 자동화된다면 월 몇 시간을 절약할 수 있을까요?',
    purpose: 'C3 정성 검증 + 자동화 ROI 정량 계산 근거 확보',
    reportSections: ['P5', 'P10', 'P14'],
    relatedSurveyIds: ['C3', 'I3'],
  },
  {
    id: 'phase2-q3',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '부서 간 정보 공유는 보통 어떤 방식으로 이루어지나요?',
    purpose: '데이터 사일로 현황 및 협업 도구 생태 파악',
    reportSections: ['P4 지표4', 'P6'],
    relatedSurveyIds: ['E1', 'E2', 'J7'],
  },
  {
    id: 'phase2-q4',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '데이터가 어디에 흩어져 있나요? 몇 개의 별도 시스템에 분산되어 있나요?',
    purpose: '데이터 통합 수준 정성 검증 + 분산 시스템 수 정량화 (B7 교차검증)',
    reportSections: ['P4 지표4', 'P6'],
    relatedSurveyIds: ['B7'],
  },
  {
    id: 'phase2-q6',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '현재 사용하시는 주요 업무 도구들은 어떤 것들이 있나요? 잘 연동되어 있나요?',
    purpose: '도구 최적화 수준 및 통합도 정성 파악 (B5 검증)',
    reportSections: ['P4 지표3', 'P6'],
    relatedSurveyIds: ['B5', 'I1'],
  },
  {
    id: 'phase2-q8',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '현재 사용 중인 SaaS·도구의 월 구독료 합계가 대략 어느 정도 되나요? 또는 팀 IT/디지털 운영 비용 규모가 어떻게 되나요?',
    purpose: '현행 IT 비용 파악 → AX 도입 시 비용 절감 ROI 비교 기준선',
    reportSections: ['P14', 'P3'],
    relatedSurveyIds: ['H5'],
  },
  {
    id: 'phase2-q9',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '현재 업무에서 가장 답답하거나 시간이 많이 드는 상황을 구체적으로 설명해주세요. 해당 부서의 핵심 반복 업무 Top 3는 무엇인가요?',
    purpose: 'Pain Point 정성 데이터 + 혁신 과제 원천 데이터 (구체 업무명)',
    reportSections: ['P5', 'P10'],
    relatedSurveyIds: ['C2', 'I8'],
  },
  {
    id: 'phase2-q10',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '보고서 한 건 작성에 보통 몇 시간 걸리나요? 승인·결재 대기로 업무가 지연되는 경우가 얼마나 자주 있나요?',
    purpose: '보고서 자동화 ROI + 결재 병목 정량 확인',
    reportSections: ['P5', 'P10', 'P14'],
    relatedSurveyIds: ['I4', 'I5'],
  },
  {
    id: 'phase2-q11',
    phase: 2,
    phaseLabel: '현황 파악',
    phaseDuration: '10분',
    questionTemplate:
      '해당 부서에서 매일 사용하는 핵심 도구·시스템은 무엇인가요? (ERP, CRM, Salesforce 등)',
    purpose: '구체 시스템명 확보 → 연동 과제 설계 정밀도 향상',
    reportSections: ['P6', 'P10'],
    relatedSurveyIds: ['J10'],
  },

  // ── Phase 3: 니즈/장벽 심화 (10분) ─────────────────────────────────────
  {
    id: 'phase3-q1',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      'AI 도입 시 가장 먼저 자동화하고 싶은 업무는 구체적으로 뭔가요?',
    purpose: 'Quick Win 과제 직접 도출 + 실현 가능성 평가',
    reportSections: ['P10'],
    relatedSurveyIds: ['C1', 'C4'],
  },
  {
    id: 'phase3-q2',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      '자동화 도입 시 가장 걱정되는 부분은 뭔가요?',
    purpose: 'SWOT 약점/위험 데이터 + Risk 파악',
    reportSections: ['P7', 'P9'],
    relatedSurveyIds: ['D1', 'D3'],
  },
  {
    id: 'phase3-q3',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      'AI 관련 교육이나 교수·학습 경험이 있으신가요? 어떤 부분이 아쉬웠나요?',
    purpose: '교육 모듈 설계 근거 + 학습 니즈 파악',
    reportSections: ['P13'],
    relatedSurveyIds: ['S9'],
  },
  {
    id: 'phase3-q4',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      '조직 내에서 변화나 새로운 도구 도입을 잘 주도하는 분들이 있나요? 그분들의 직급은?',
    purpose: 'AX 전담 조직 구성 및 리더 확보',
    reportSections: ['P9'],
    relatedSurveyIds: ['B10'],
  },
  {
    id: 'phase3-q5',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      '현재 조직 내 AI 도구 활용률을 10점 만점으로 셀프 평가한다면 몇 점이라고 생각하세요? 이유도 함께 설명해 주세요.',
    purpose: 'AI 성숙도 셀프 점수 수집 → 설문 B섹션 평균 점수와 교차검증',
    reportSections: ['P4', 'P2'],
    relatedSurveyIds: [
      'B1',
      'B2',
      'B3',
      'B4',
      'B5',
      'B6',
      'B7',
      'B8',
      'B9',
      'B10',
    ],
  },
  {
    id: 'phase3-q6',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      'AI/디지털 교육에 연간 투자할 수 있는 예산이 대략 얼마인가요? (1인당 기준이어도 좋습니다)',
    purpose: '교육 모듈 설계 규모 결정 + H6 설문 교차검증',
    reportSections: ['P13', 'P14', 'P15'],
    relatedSurveyIds: ['H6'],
  },
  {
    id: 'phase3-q7',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      '업무 오류(재작업, 실수 수정)로 인해 월 평균 몇 시간을 추가로 쓰고 있다고 느끼시나요? 이로 인한 재작업 시간은 얼마나 되나요?',
    purpose:
      "오류 비용 정량화 → SWOT 약점(W) 데이터 + P14 KPI '오류율 감소' 목표 설정 근거",
    reportSections: ['P5', 'P7', 'P14'],
    relatedSurveyIds: ['B4'],
  },
  {
    id: 'phase3-q8',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      '업무 수행 시 반드시 준수해야 할 규제나 인증이 있나요? 사내 AI 데이터 가이드라인, 데이터 백업 체계, PC 보안 정책은 어느 수준인가요?',
    purpose: '컴플라이언스 + AI 거버넌스 + 보안 인프라 수준 종합 파악',
    reportSections: ['P6', 'P7', 'P9'],
    relatedSurveyIds: ['D2', 'J4', 'J5', 'J6'],
  },
  {
    id: 'phase3-q9',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      '사내에 AI/디지털 전담 인력이 있나요? 직원들이 개인적으로 AI 도구를 구독해서 쓰고 있나요?',
    purpose: 'AI 전담 조직 유무 + Shadow IT(비공식 AI 지출) 실태 파악',
    reportSections: ['P3', 'P6', 'P7', 'P9'],
    relatedSurveyIds: ['H7', 'H8'],
  },
  {
    id: 'phase3-q10',
    phase: 3,
    phaseLabel: '니즈/장벽 심화',
    phaseDuration: '10분',
    questionTemplate:
      'AI가 24시간 일하는 가상 인턴을 배정한다면 어떤 업무를 시키겠나요? 성공적인 AI 도입이란 귀사에서 어떤 의미인가요? 반드시 사람이 해야 한다고 생각하는 업무는?',
    purpose: 'Quick Win 과제 발굴 + 고객 성공 기준 + AI 수용 경계선 파악',
    reportSections: ['P5', 'P7', 'P9', 'P10', 'P13', 'P14'],
    relatedSurveyIds: ['J11', 'J14', 'J16', 'J17'],
  },

  // ── Phase 4: 의사결정/예산 (5분) ───────────────────────────────────────
  {
    id: 'phase4-q1',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      '예산은 대략 어느 정도를 생각하고 계세요?',
    purpose: 'F2 정성 검증 + 예산 현실성 평가 → CRM 등급②',
    reportSections: ['P14', 'P15'],
    relatedSurveyIds: ['F2'],
  },
  {
    id: 'phase4-q2',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      '도입 시기는 급한 편인가요? 아니면 천천히 준비해도 괜찮으신가요?',
    purpose: '실행 시급성 평가 → CRM S등급③',
    reportSections: ['P12'],
    relatedSurveyIds: [],
  },
  {
    id: 'phase4-q3',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      '이번 미팅이나 결정사항을 대표님께 직접 보고하실 건가요, 아니면 먼저 검토하시고 올리실 건가요?',
    purpose: '의사결정 구조 파악 → CRM S등급①, 추진 전략 결정',
    reportSections: ['P9', 'CRM'],
    relatedSurveyIds: ['A3'],
  },
  {
    id: 'phase4-q4',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      '도입 시기는 급한 편인가요? 3개월 내 도입이 가능할까요?',
    purpose:
      '도입 긴박성 정량 확인 → CRM S등급 조건③ 구체적 도입 일정 판정',
    reportSections: ['P12', 'P15'],
    relatedSurveyIds: [],
  },
  {
    id: 'phase4-q5',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      'AI 도입으로 기대하는 효율 개선 목표치가 있으신가요? (예: 특정 업무 처리 시간 __% 단축, 오류 건수 __건 감소, 월 절감 비용 ___만원)',
    purpose:
      'KPI 수치 현장 합의 → P14 KPI 프레임워크의 가장 중요한 입력값',
    reportSections: ['P13', 'P14', 'P15'],
    relatedSurveyIds: ['G1'],
  },
  {
    id: 'phase4-q6',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      'AX를 가장 먼저 도입하고 싶은 부서와 인원은 몇 명인가요? 그 부서를 선택한 이유는? 솔루션 선택 시 가장 중요한 기준은 무엇인가요?',
    purpose: '파일럿 범위 확정 + 로드맵 Phase 1 + 솔루션 제안 우선순위',
    reportSections: ['P9', 'P10', 'P12', 'P14', 'P15'],
    relatedSurveyIds: ['I6', 'I7', 'G2', 'F3', 'F1'],
  },
  {
    id: 'phase4-q7',
    phase: 4,
    phaseLabel: '의사결정/예산',
    phaseDuration: '5분',
    questionTemplate:
      '경쟁사의 AI 활용 수준이나 정부 지원 현황, 최근 사업 환경 변화가 AX 도입 결정에 영향을 주고 있나요?',
    purpose: '외부 환경(경쟁, 정책, 시장) 정성 맥락 → SWOT 기회/위협 보강',
    reportSections: ['P6', 'P7'],
    relatedSurveyIds: ['J1', 'J2', 'J3'],
  },
];

// ---------------------------------------------------------------------------
// FIELD_TO_SURVEY_MAP — report field group → related survey IDs
// ---------------------------------------------------------------------------

export const FIELD_TO_SURVEY_MAP: Record<string, string[]> = {
  '표지 & 메타': ['A1', 'A2'],
  '기업 프로필': ['H1', 'H2', 'H3', 'A4', 'H4'],
  'AI 성숙도 진단': [
    'B1',
    'B2',
    'B3',
    'B4',
    'B5',
    'B6',
    'B7',
    'B8',
    'B9',
    'B10',
  ],
  'AI 예산 & 전문인력': ['H5', 'H6', 'H7'],
  '핵심 과제': ['C1', 'C4', 'G2'],
  '전략 경로': ['F1', 'F2', 'F3'],
  'SWOT 분석': ['D1', 'D2', 'D3', 'J1', 'J3', 'J16'],
  '외부 환경': ['J1', 'J2', 'J3'],
  '전환 체계': ['A3', 'I6', 'I7'],
  'KPI 프레임워크': ['G1', 'F2', 'J14'],
  'Pain Point 분석': ['C2', 'C3', 'I3', 'I4', 'I8'],
  '내부 역량': [
    'E1',
    'E2',
    'J4',
    'J5',
    'J6',
    'J7',
    'J10',
    'J12',
    'J13',
    'J15',
  ],
  '혁신 과제': ['C1', 'C4', 'J11', 'G2'],
};

// ---------------------------------------------------------------------------
// Gap Analysis utilities
// ---------------------------------------------------------------------------

export type GapStatus = 'answered' | 'unclear' | 'missing';

export interface SurveyGapResult {
  id: string;
  status: GapStatus;
  answer?: string;
  impact: string[]; // affected report sections
}

export function analyzeSurveyGaps(
  surveyAnswers: Record<string, string>,
): SurveyGapResult[] {
  // S(직원 개별 설문)은 담당자 미팅 대상이 아니므로 제외
  return SURVEY_QUESTIONS.filter((q) => q.part !== 'S').map((q) => {
    const answer = surveyAnswers[q.id];
    let status: GapStatus = 'missing';
    if (answer && answer.trim()) {
      // Text answers shorter than 5 chars are "unclear"
      if (q.answerType === 'text' && answer.trim().length < 5) {
        status = 'unclear';
      } else {
        status = 'answered';
      }
    }
    return {
      id: q.id,
      status,
      answer: answer || undefined,
      impact: q.reportSections,
    };
  });
}

export function getRelevantMeetingQuestions(
  gaps: SurveyGapResult[],
): MeetingGuideQuestion[] {
  const gapIds = new Set(
    gaps.filter((g) => g.status !== 'answered').map((g) => g.id),
  );

  // Sort: questions related to gaps first, then the rest
  return [...ONLINE_MEETING_GUIDE].sort((a, b) => {
    const aHasGap = a.relatedSurveyIds.some((id) => gapIds.has(id));
    const bHasGap = b.relatedSurveyIds.some((id) => gapIds.has(id));
    if (aHasGap && !bHasGap) return -1;
    if (!aHasGap && bHasGap) return 1;
    // Within same priority, maintain phase order
    if (a.phase !== b.phase) return a.phase - b.phase;
    return 0;
  });
}

// Render dynamic question text by inserting survey answer values
export function renderQuestionText(
  question: MeetingGuideQuestion,
  surveyAnswers: Record<string, string>,
): string {
  let text = question.questionTemplate;
  // Replace {B1.label} patterns with actual answer labels
  const slotPattern = /\{([A-Z]\d+)\.label\}/g;
  text = text.replace(slotPattern, (_, id) => {
    const answer = surveyAnswers[id];
    if (!answer) return '[미응답]';
    return answer;
  });
  return text;
}

// Get survey question by ID
export function getSurveyQuestion(id: string): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find((q) => q.id === id);
}

// Get questions for a specific part
export function getQuestionsByPart(part: string): SurveyQuestion[] {
  return SURVEY_QUESTIONS.filter((q) => q.part === part);
}

// 설문 ID → 관련 미팅 가이드 질문 역매핑
export type MeetingFollowUpType = '교차검증' | '정성 심화';

export interface MeetingFollowUp {
  type: MeetingFollowUpType;
  question: string; // 미팅에서 물을 질문 요약
}

export function getMeetingFollowUps(surveyId: string): MeetingFollowUp[] {
  const results: MeetingFollowUp[] = [];
  for (const mq of ONLINE_MEETING_GUIDE) {
    if (!mq.relatedSurveyIds.includes(surveyId)) continue;
    // purpose에 "검증", "교차" 포함 → 교차검증, 아니면 정성 심화
    const type: MeetingFollowUpType =
      mq.purpose.includes('검증') || mq.purpose.includes('교차') ? '교차검증' : '정성 심화';
    // 질문 템플릿에서 {ID.label} 제거하고 간결하게
    const short = mq.questionTemplate.replace(/\{[^}]+\}/g, '___').slice(0, 50);
    results.push({ type, question: short + (mq.questionTemplate.length > 50 ? '…' : '') });
  }
  return results;
}

// All parts with labels
export const SURVEY_PARTS = [
  { part: 'A', label: '기본 정보' },
  { part: 'B', label: '프로세스 & 도구 & 데이터 성숙도' },
  { part: 'C', label: 'Pain Point & 자동화 희망' },
  { part: 'D', label: '장벽 & 규제/보안' },
  { part: 'E', label: '협업 & 지식관리' },
  { part: 'F', label: '도입 기준 & 예산 & 인원' },
  { part: 'G', label: '기대 효과 & 파일럿' },
  { part: 'H', label: '기업 현황 & AI 투자' },
  { part: 'I', label: '업무 운영 & 병목 진단' },
  { part: 'J', label: '시장·보안·문화 심층 진단' },
  { part: 'S', label: '직원 개별 설문' },
];

// 공통질문리스트 4페이지 그룹
export const QUESTION_PAGES = [
  { page: 1, label: '기업 프로필', desc: '기본 정보 & 기업 현황', parts: ['A', 'H'] },
  { page: 2, label: '업무 & 성숙도', desc: '프로세스·도구·데이터 성숙도 & 운영 현황', parts: ['B', 'I'] },
  { page: 3, label: 'Pain Point & 장벽', desc: '자동화 희망·장벽·협업·지식관리', parts: ['C', 'D', 'E'] },
  { page: 4, label: '전략 & 환경', desc: '예산·기대효과·시장·보안·문화', parts: ['F', 'G', 'J'] },
];

export const MEETING_PHASES = [
  { phase: 1, label: '아이스브레이킹', duration: '5분' },
  { phase: 2, label: '현황 파악', duration: '15분' },
  { phase: 3, label: '니즈/장벽 심화', duration: '10분' },
  { phase: 4, label: '의사결정/예산', duration: '5분' },
];
