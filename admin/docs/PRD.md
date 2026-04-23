# Admin Portal PRD

제품 범위, 기능 명세, 우선순위.

## 제품 비전
조코딩 AX 파트너스 내부 팀이 B2B 컨설팅 파이프라인(결제→설문→미팅→리포트)을 **한 곳에서 관리·자동화**하는 어드민 포털.

## 사용자
- **Primary**: 컨설턴트 (`@jocodingax.ai` 도메인 계정 다수)
- **Secondary**: 대표/운영 (KPI/통계 조회)

## 접근 권한
Google OAuth + `@jocodingax.ai` 도메인 한정 → `admin` 역할.
([auth.ts](../../auth.ts), [middleware.ts](../../middleware.ts) 이미 구현 완료)

---

## 기능 리스트

### F1. 리포트 생성기 [P1, 외부 제공 — 추후 통합]
- **URL**: `/admin/report`
- **현재 상태**: 별도 서비스로 운영 중. **이 레포에서는 구현하지 않음.**
- **방침**: 사용자가 생성기 전체 소스코드와 컨텍스트 파일을 별도로 첨부할 예정. 그때 **통합 플랜을 별도 논의 후 진행**.
- **지금 구현**: `/admin/report`에 "곧 통합됩니다" 안내 페이지 + (추후) 외부 링크 버튼
- **참고**: `claude/musing-lichterman` 브랜치에 과거 구현이 존재하나 이식하지 않음. [admin/docs/generator-design.md](generator-design.md)에 원 설계 아카이브.

### F2. 고객 응답 관리 [P1, 기본 완료]
- **URL**: `/admin/customers`
- AppHub `pipelines` + `payments` + `questionnaires` 조인 테이블
- **개선 필요 (P1)**:
  - 상세 페이지(`/admin/customers/[id]`)에 파이프라인 상태 변경 버튼 추가
  - 리포트 링크 / 생성된 PDF 표시
  - 리마인드 트리거 수동 발송 (이메일/Slack)

### F3. 대시보드 [P1, 미구현]
- **URL**: `/admin`
- **컴포넌트**:
  - 파이프라인 단계별 현황 카운트 (9개 상태 × 건수)
  - 최근 N일 결제/설문 완료 추이 라인 차트
  - **리마인드 필요** 섹션: `FORM_SENT` 후 3일 경과 & 미제출 / `MEETING_COMPLETE` 후 5일 경과 & 미발송 등
  - 완료·미완료·리마인드 시각화 (사용자 요청 원문)
- **데이터 소스**: AppHub pipelines (list → 클라이언트 집계)

### F4. 설문지 설정 [P2]
- **URL**: `/admin/questions`
- **현재**: 질문 목록 읽기 전용
- **목표**:
  - 질문 CRUD (`lib/questionnaire/question-guide.ts` 외부화 필요 — 현재 하드코딩)
  - 노출 토글 (라이브/숨김)
  - 응답 통계 (질문별 분포)
  - 공유 링크 생성 (특정 세트로 한정)
  - 권한 설정 (누가 편집 가능)
- **기술 부채**: 구글폼→구글시트→AppHub 흐름을 자체 questionnaire 페이지로 완전 이관 (일부 진행됨: `app/questionnaire/[token]`)

### F5. 미팅 전 숙지안 [P2, 미구현]
- **URL**: `/admin/pre-meeting/[pipelineId]`
- **목표**: 설문 답변 + 기업 페르소나 + 레퍼런스 분석으로 미팅 전 컨설턴트 필독안 생성
- **AI**: Claude Sonnet, 전용 프롬프트 (F1과 별도)
- **파이프라인 전이**: `FORM_COMPLETE` → `PRE_MEETING_REPORT_GENERATING` → `PRE_MEETING_REPORT_READY`
- **출력 형식**: 마크다운 또는 PDF (미정)

### F6. 유저 통계 [P3, 미구현]
- **URL**: `/admin/stats`
- **지표**:
  - 단계별 전환율 (결제→설문→미팅→리포트)
  - 이탈 지점 분석
  - 평균 소요시간 (결제→제출, 제출→미팅, 미팅→리포트)
  - AI 에이전트 데이터 검증용 부통계 (추출 필드 누락률, 확신도 분포)

---

## Non-Goals (이번 대주기)
- 모바일 최적화 (데스크톱 전제)
- 다국어 (한국어 한정)
- 어드민 권한 세분화 (현재는 전원 동일 `admin`)
- 결제 모듈 수정 (파트너 영역, PG 승인 후 논의)

## 성공 기준
| 지표 | 목표 |
|---|---|
| 리포트 생성 소요시간 (노트 입력 ~ PDF 다운로드) | < 2분 |
| 필드 추출 정확도 (`lowConfidenceFields` < 3/25) | > 88% |
| 대시보드에서 파이프라인 이상 건 포착 지연 | < 1 영업일 |
| 어드민 주간 활성 사용자 | 컨설턴트 전원 |

---

## 현재 스프린트 — 어드민 UI 정적 구현
진행 상황은 [DEV-PLAN.md](DEV-PLAN.md)의 Phase 체크리스트 참조.

**목표**: F2~F6의 정적 UI(스켈레톤) 완성 + F1은 플레이스홀더로 대기.
데이터 연동(AppHub 실호출)은 대시보드·customers 일부만 유지, 나머지는 목업 값으로 구성. 기능 로직은 UI 확정 후 단계적 도입.
