# AX 사전 기업 진단 리포트 자동 생성기

## 개요

미팅 노트를 붙여넣으면 Claude API가 구조화된 데이터를 추출하고, 사람이 리뷰/수정한 뒤, 기존 report.html 템플릿에 값을 주입하여 PDF를 생성하는 Next.js 웹앱.

**사용자:** 조코딩 AX 파트너스 컨설턴트 + 클라이언트 기업 (공유 용도)
**배포:** 로컬 개발 우선 (추후 Vercel 배포 가능)

## 유저 플로우

```
미팅 노트 텍스트 붙여넣기
    ↓ POST /api/report/analyze
Claude API → 25개 필드 JSON 추출
    ↓ 클라이언트 state
리뷰 폼에서 확인/수정 (빈 필드 직접 입력)
    ↓ POST /api/report/pdf
report.html 템플릿에 값 주입 → Puppeteer PDF 렌더링 → 다운로드
```

## 기술 스택

- **프레임워크:** Next.js 16 (App Router, TypeScript)
- **스타일링:** Tailwind CSS v4
- **AI:** Claude API (Anthropic SDK, `@anthropic-ai/sdk`)
- **PDF 생성:** Puppeteer (headless Chrome으로 report.html 렌더링)
- **상태 관리:** React Context (DB 없음, 세션 내에서만 데이터 유지)

## 페이지 구조

### `/report` — 미팅 노트 입력

- 텍스트 영역 (textarea) — 미팅 노트 붙여넣기용
- "리포트 생성" 버튼
- 로딩 상태 표시 (Claude API 호출 중 스피너)
- 에러 처리 (API 실패 시 메시지)

### `/report/review` — 리뷰 & 수정

- AI가 추출한 값을 6개 섹션 폼으로 표시
- 각 필드는 편집 가능한 input/textarea
- `null` 값(노트에 없던 정보)은 빈 필드로 표시 + 노란색 경고 배지
- `confidence: "low"` 필드는 주황색 표시로 "확인 필요" 안내
- "리포트 확정" 버튼 → preview 페이지로 이동

### `/report/preview` — 미리보기 & PDF 다운로드

- 클라이언트에서 template-engine으로 report.html 플레이스홀더를 치환한 HTML string을 iframe의 `srcdoc`으로 렌더링
- "PDF 다운로드" 버튼 → `/api/report/pdf` 호출 → PDF 파일 다운로드
- "다시 수정" 버튼 → review 페이지로 돌아가기

## API 엔드포인트

### `POST /api/report/analyze`

**입력:**
```json
{ "meetingNotes": "미팅 노트 전문 텍스트..." }
```

**동작:** Claude API에 미팅 노트를 전달하고 구조화된 데이터 추출. tool_use (structured output)로 JSON 형식 보장.

**출력:**
```json
{
  "fields": {
    "companyName": "주식회사 예시",
    "industry": "IT서비스",
    "employees": { "total": 45, "regular": 40, "contract": 5 },
    ...
  },
  "metadata": {
    "fieldsExtracted": 20,
    "fieldsMissing": 5,
    "lowConfidenceFields": ["aiStage", "revenue"]
  }
}
```

### `POST /api/report/pdf`

**입력:**
```json
{ "fields": { ... } }
```

**동작:**
1. report.html 파일을 읽어서 플레이스홀더를 실제 값으로 치환
2. Puppeteer로 headless Chrome 실행
3. 치환된 HTML을 로드하여 PDF 렌더링

**출력:** `application/pdf` 바이너리

## 데이터 스키마

6개 그룹, 25개 필드:

### 1. 기업 기본정보

| 필드 | 키 | 타입 | 매핑되는 템플릿 플레이스홀더 |
|------|-----|------|---------------------------|
| 기업명 | `companyName` | string | `{기업명}`, `{정식 법인명}` |
| 업종/산업군 | `industry` | string | `{예: 제조업 / IT서비스 / 유통}` |
| 임직원 수 | `employees` | object `{total, regular, contract}` | `{N}명` (기업개요 섹션) |
| 연매출 규모 | `revenue` | string | `{10억 미만 / 10~50억 / ...}` |
| 주요 사업 내용 | `businessDesc` | string | `{핵심 사업 서술}` |
| 고객 유형 | `customerType` | string | `{B2B / B2C / B2G}` |

### 2. AI 성숙도 진단

| 필드 | 키 | 타입 | 설명 |
|------|-----|------|------|
| AI 도입 단계 | `aiStage` | number (1-5) | 현재 단계 판정 |
| 5개 영역 점수 | `scores` | object `{strategy, data, process, talent, tech}` | 각 1.0~5.0 |
| 핵심 문제 키워드 | `coreProblem` | string | Executive Summary용 |
| AI 관련 예산 | `aiBudget` | object `{toolSubscription, educationBudget}` | 월/연 금액 |
| AI 전담 인력 | `aiSpecialists` | number \| null | 전담 인력 수 |

### 3. 우선 과제 & 로드맵

| 필드 | 키 | 타입 | 설명 |
|------|-----|------|------|
| Top 3 과제 | `topTasks` | array `[{name, module, urgency}]` | 우선 과제 3건 |
| 권장 경로 | `recommendedPath` | array of strings | 모듈 순서 (예: `["A", "B", "C", "D"]`) |

### 4. SWOT & 환경 분석

| 필드 | 키 | 타입 | 설명 |
|------|-----|------|------|
| SWOT | `swot` | object `{strengths, weaknesses, opportunities, threats}` | 각 3~5개 항목 배열 |
| 외부 환경 | `externalEnv` | object `{industryAiRate, competitors, govSupport}` | 업계 현황 |

### 5. AX 전환 범위

| 필드 | 키 | 타입 | 설명 |
|------|-----|------|------|
| 대상 부서 | `targetDepts` | object `{phase1, phase2}` | 1차/2차 대상 부서명 |
| 스폰서 | `sponsor` | string | 대표이사/C-Level |
| 목표 KPI | `kpis` | object `{automationRate, aiLeaders, costSaving, aiServices}` | 정량 목표 |

### 6. 메타 정보

| 필드 | 키 | 타입 | 설명 |
|------|-----|------|------|
| 진단일 | `diagnosisDate` | string (YYYY.MM.DD) | 리포트 표지용 |
| 컨설턴트명 | `consultantName` | string | 담당자명 |
| 인터뷰 정보 | `interviewInfo` | object `{participants, date}` | 참석자 수, 일시 |

## Claude API 프롬프트 전략

### System Prompt 구조

1. 역할 정의: "AX 기업 진단 데이터 추출 전문가"
2. JSON 스키마 전체 정의 (위 필드 목록)
3. 각 필드의 설명과 예시값
4. 추출 규칙:
   - 노트에 명시된 정보 → 그대로 추출
   - 노트에 없는 정보 → `null` 반환
   - 애매한 정보 → 최선의 추정 + 해당 필드를 `lowConfidenceFields`에 추가
   - 점수(1.0~5.0) → 노트 내용 기반으로 판단, 근거가 부족하면 low confidence

### 응답 형식

Claude API의 tool_use를 사용하여 JSON 구조 보장. tool의 input_schema로 위 스키마를 정의.

## 상태 관리

- React Context (`ReportContext`)로 페이지 간 데이터 전달
- DB 없음 — 브라우저 세션 내에서만 유지
- Context에 저장되는 상태:
  - `meetingNotes: string` — 원본 미팅 노트
  - `fields: ReportFields` — 추출/수정된 필드 데이터
  - `metadata: ExtractMetadata` — 추출 메타 정보 (missing fields, low confidence 등)

## 에러 처리

- **Claude API 실패:** 입력 페이지에서 에러 메시지 + 재시도 버튼
- **PDF 생성 실패:** preview 페이지에서 에러 메시지 + 재시도
- **빈 미팅 노트:** 입력 시 버튼 비활성화
- **필수 필드 누락:** review 페이지에서 경고 표시 (생성은 허용 — 템플릿에 빈 값 노출)

## 파일 구조

```
src/app/
├── report/
│   ├── page.tsx              # 미팅 노트 입력
│   ├── review/
│   │   └── page.tsx          # 리뷰 & 수정 폼
│   └── preview/
│       └── page.tsx          # 미리보기 & PDF 다운로드
├── api/report/
│   ├── analyze/
│   │   └── route.ts          # Claude API 호출
│   └── pdf/
│       └── route.ts          # Puppeteer PDF 생성
├── context/
│   └── ReportContext.tsx      # 상태 관리
├── lib/
│   ├── report-schema.ts      # 필드 스키마 & 타입 정의
│   ├── template-engine.ts    # report.html 플레이스홀더 치환 로직
│   └── claude-prompt.ts      # Claude API 프롬프트 & tool 정의
└── layout.tsx
```

## 스키마 확장성

필드 구조 변경 시 수정 포인트는 3곳으로 집중:

1. `lib/report-schema.ts` — 필드 정의 (타입, 기본값, 그룹, 표시명)
2. `lib/claude-prompt.ts` — Claude API tool 스키마에 반영
3. `lib/template-engine.ts` — report.html 플레이스홀더 매핑 추가

리뷰 폼(`/report/review`)은 report-schema.ts를 기반으로 동적 렌더링하므로 별도 UI 수정 불필요.

## 범위 외 (YAGNI)

- 사용자 인증/로그인
- 리포트 저장/히스토리
- 실시간 협업
- 다국어 지원
- Figma 연동
