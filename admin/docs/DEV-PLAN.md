# 개발 플랜 — 어드민 UI 정적 구현 → 데이터 연동 → 기능 확장

## 목적
1. **어드민 페이지 UI를 "깔끔하고 최적화된" 스켈레톤으로 정적 구현** (F1 생성기 제외)
2. 생성기(F1)는 사용자가 별도 소스코드를 첨부할 예정 → 그때 통합 플랜 별도 수립
3. UI 확정 후 데이터 연동(AppHub 실호출) → 기능 로직(F4 CRUD, F5 AI, F6 통계) 단계적 개발
4. `/clear` 후에도 Claude Code가 일관되게 작업 이어갈 수 있도록 **최소한의 하네스** 유지

---

## Claude Code 하네스 (최소 구성, 유지)

### 자동 로드
- 프로젝트 루트 [CLAUDE.md](../../CLAUDE.md) — 매 세션
- `app/admin/**` 또는 `admin/**` 작업 시 경로 컨텍스트로 [admin/docs/CLAUDE.md](CLAUDE.md) 참조

### 필요 시 Read
- [PRD.md](PRD.md) — 기능 스펙/우선순위
- [DEV-PLAN.md](DEV-PLAN.md) — 이 문서
- [APPHUB-INTEGRATION.md](APPHUB-INTEGRATION.md) — 외부 API 스펙 고정 (할루 방지)
- [generator-design.md](generator-design.md) — F1 외부 생성기의 설계(참고용 아카이브)
- [AGENTS.md](AGENTS.md) — Next.js 16 주의

### 의도적 생략
- 커스텀 hooks / 서브에이전트 / 스킬 — 반복 실수 관찰되면 그때 추가

---

## 기술 스택 결정 (이번 스프린트)

| 선택 | 이유 |
|---|---|
| **lucide-react** | 아이콘 (tree-shakeable, 모던 SaaS 어드민 표준) |
| **Tailwind v4** | 기존 스택 유지 |
| **Noto Sans KR** | 기존 루트 layout 유지 |
| **브랜드 보라** `#7C3AED` | 리포트 템플릿과 일관 |
| **차트**: SVG/CSS 플레이스홀더 | 정적 단계, Recharts/Chart.js는 실데이터 연동 시 도입 |
| **Dark mode** | 미지원 (요구 없음) |

---

## 파일 구조 (완성 시)

```
app/admin/
├─ layout.tsx                    ← 리라이트 (AdminShell 사용)
├─ page.tsx                      ← 리라이트 (대시보드, 허브→시각화형)
├─ customers/
│  ├─ page.tsx                   ← 리라이트 (AppHub 로직 보존)
│  └─ [id]/page.tsx              ← 리라이트 (AppHub 로직 보존)
├─ questionnaires/
│  └─ page.tsx                   ← 신규 (F4 설문지 설정, 기존 /admin/questions 대체)
├─ pre-meeting/
│  ├─ page.tsx                   ← 신규 (F5 목록)
│  └─ [pipelineId]/page.tsx      ← 신규 (F5 상세)
├─ report/
│  └─ page.tsx                   ← 신규 (F1 플레이스홀더, "곧 통합됩니다")
└─ stats/
   └─ page.tsx                   ← 신규 (F6)

admin/components/                ← 신규 디자인 시스템
├─ AdminShell.tsx                ← 사이드바 + 헤더 + main 래퍼
├─ Sidebar.tsx                   ← 네비 (lucide 아이콘 + 현재 경로 하이라이트)
├─ PageHeader.tsx                ← 타이틀 + 서브 + 액션 슬롯
├─ StatCard.tsx                  ← 숫자/변화율 카드
├─ StatusBadge.tsx               ← 상태 뱃지
├─ EmptyState.tsx                ← 빈 상태 공용
└─ DataTable.tsx                 ← 표 공용

삭제:
app/admin/questions/             ← 삭제 (/admin/questionnaires로 대체)
```

---

## 이식 작업 순서

### Phase 0 — 스캐폴드 ✅
- [x] 브랜치 `admin/integrate-generator` 생성
- [x] `admin/docs/*` 5개 + 루트 `CLAUDE.md` 작성
- [x] 원본 `generator-design.md` + `AGENTS.md` 이식

### Phase 1 — 어드민 UI 정적 구현 🔄 진행 중
- [x] `lucide-react` 설치 (package.json 업데이트)
- [ ] `admin/components/` 공통 컴포넌트 7개 작성
- [ ] `app/admin/layout.tsx` 리라이트 (AdminShell 사용)
- [ ] `app/admin/page.tsx` 리라이트 (대시보드)
- [ ] `app/admin/customers/{page,[id]/page}.tsx` 리라이트 (AppHub 로직 보존)
- [ ] `app/admin/questionnaires/page.tsx` 신규 (F4)
- [ ] `app/admin/pre-meeting/{page,[pipelineId]/page}.tsx` 신규 (F5)
- [ ] `app/admin/report/page.tsx` 신규 (F1 플레이스홀더)
- [ ] `app/admin/stats/page.tsx` 신규 (F6)
- [ ] 기존 `app/admin/questions/` 삭제
- **검증**: `npm run build` 통과 + 로컬 dev server 각 페이지 접근 확인
- **커밋**: `feat(admin): 어드민 UI 정적 구현 (대시보드/고객/설문/미팅/리포트/통계)`

### Phase 2 — 데이터 연동 (나중)
- [ ] 대시보드 KPI 계산 로직 (pipelines 상태별 집계)
- [ ] customers 상세의 리마인드 트리거 버튼
- [ ] questionnaires 실데이터 연결 (읽기)
- [ ] stats 실데이터 연결

### Phase 3 — F4 설문지 설정 CRUD (나중)
- 질문 데이터 외부화 (현재 하드코딩 `lib/questionnaire/question-guide.ts`)
- CRUD API + UI
- 권한/노출/공유 설정

### Phase 4 — F5 미팅 전 숙지안 (나중)
- Claude 프롬프트 전용 설계
- 설문 + 기업 페르소나 + 레퍼런스 분석 → 숙지안 생성

### Phase 5 — F6 유저 통계 (나중)
- 단계별 전환율, 이탈 분석

### Phase 6 — F1 리포트 생성기 통합 (사용자 별도 첨부 대기)
- 사용자가 새 소스코드 첨부 시 통합 플랜 별도 수립

### Phase 7 — PR → main 머지

---

## 병렬 작업 원칙 (파트너 충돌 방지)

### 브랜치 분리
- 본 작업: `admin/integrate-generator`
- 파트너: `main` 또는 `user/*`

### 공유 파일 수정 내역 (파트너에게 공지 필요)
- `package.json` — `lucide-react` 추가 (devDep 아님)
- `CLAUDE.md` (루트) — 신규
- 그 외: admin 영역만 수정, 유저페이지 영향 없음

### 겹칠 가능성 있는 파일 (건드리지 않음)
- `auth.ts`, `middleware.ts` — 이미 admin 보호됨
- `app/{login,pay,questionnaire,privacy,terms,page.tsx}` — 파트너 유저페이지

---

## 디자인 시스템 (Phase 1 UI 규칙)

### 레이아웃
- **Shell**: 좌측 사이드바 256px(`w-64`) 고정 + 상단 헤더 56px(`h-14`) + 본문
- **본문 max-width**: `max-w-7xl`, 좌우 패딩 `px-6`, 상하 `py-8`

### 색상
- 배경: `bg-gray-50`
- 카드: `bg-white border border-gray-200 rounded-xl`
- 사이드바: `bg-white border-r border-gray-200` (헤더와 구분)
- 브랜드: `text-violet-600`, `bg-violet-50`, 강조: `bg-violet-600 text-white`
- 텍스트: `text-gray-900` (본문) / `text-gray-500` (서브) / `text-gray-400` (미응답)

### 타이포
- 페이지 타이틀: `text-2xl font-bold text-gray-900`
- 섹션 타이틀: `text-lg font-semibold`
- 본문: `text-sm` 기본, 표는 `text-sm`

### 상호작용
- 호버: `hover:bg-gray-50`, 링크는 `hover:text-violet-600`
- 포커스: Tailwind 기본 ring

### 반응형
- 데스크톱 우선, 사이드바는 태블릿 미만(`md:`)에서 숨김 + 햄버거 대체 (Phase 1 범위)

### 아이콘 (lucide-react)
- 사이드바: LayoutDashboard, Users, FileText, ClipboardList, Sparkles, BarChart3
- 상태: CheckCircle2, Clock, AlertCircle, XCircle
- 액션: Plus, Edit3, Trash2, ExternalLink
