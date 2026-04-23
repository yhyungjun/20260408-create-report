# Admin 범위 작업 컨텍스트

루트 [CLAUDE.md](../../CLAUDE.md)의 연장. `app/admin/**` 또는 `admin/**` 수정 시 이 문서 참조.

## Admin 기능 범위 (PRD 요약)
| ID | 기능 | 상태 | 경로 |
|---|---|---|---|
| F1 | 리포트 생성기 | 🟡 이식 중 | `/admin/report` (입력→리뷰→프리뷰) |
| F2 | 고객 응답 관리 | 🟢 기본 완료 | `/admin/customers` |
| F3 | 대시보드 | 🔴 미구현 | `/admin` (현재 링크 허브) |
| F4 | 설문지 설정 | 🟡 읽기 전용 | `/admin/questions` |
| F5 | 미팅 전 숙지안 | 🔴 미구현 | `/admin/pre-meeting/[pipelineId]` (예정) |
| F6 | 유저 통계 | 🔴 미구현 | `/admin/stats` (예정) |

상세: [PRD.md](PRD.md).

## 생성기 아키텍처 요약
```
입력 → /admin/report (page.tsx)
  ├─ 미팅노트: 직접 텍스트 / Caret API / 파일 업로드(PDF 파싱)
  └─ 설문: 직접 CSV / 구글시트 / Apps Script URL
  ↓
/api/report/analyze (NDJSON 스트리밍)
  1. meta-extractor.ts  — 정규식 메타(기업명/일시) 추출
  2. meta-haiku.ts      — 누락분 Haiku fallback
  3. analysis-cache.ts  — 캐시 hit 시 재호출 생략
  4. claude-prompt.ts   — Sonnet + tool_use로 ReportFields JSON 추출
  ↓
/admin/report/review (필드 수동 편집)
  └─ /api/report/db PATCH → AppHub `reports` 테이블
  ↓
/admin/report/preview
  └─ template-engine.ts: public/report.html의 {placeholder} 치환 → iframe srcdoc
  ↓
PDF 다운로드 → /api/report/pdf
  └─ Puppeteer + chart.umd.js 인라인 → application/pdf
```

## 상태 관리
- **React Context**: `admin/context/ReportContext.tsx` — `sessionStorage` 기반, 3페이지 이동 중 `fields`/`metadata`/`meetingNotes`/`surveyAnswers`/`reportId`/`reportTitle` 유지
- **Scope**: `admin/report/layout.tsx`에서만 `ReportProvider`로 감싸므로 다른 admin 페이지엔 영향 없음

## 외부 API 연동 (환경변수)
| API | 파일 | env 키 |
|---|---|---|
| Anthropic Claude | `admin/lib/claude-prompt.ts`, `admin/lib/meta-haiku.ts` | `ANTHROPIC_API_KEY` |
| AppHub DB | `admin/lib/report-db.ts` + `lib/apphub/apphub-tables.ts` | `APPHUB_API_KEY`, `APPHUB_API_URL`, `APPHUB_DB_SCHEMA` |
| Caret (미팅노트) | `admin/lib/caret.ts`, `app/api/report/fetch-caret/route.ts` | `CARET_API_KEY` |
| Google Sheets | `admin/lib/google-sheets.ts`, `app/api/report/fetch-sheet/route.ts` | `APPS_SCRIPT_URL`, `APPS_SCRIPT_TOKEN`, `GOOGLE_FORM_URL` |

## 핵심 스키마 (할루 방지용 고정값)
- **AppHub reports 테이블 ID**: `36` (apphub-tables.ts 내 `TABLE_IDS.reports`)
- **Claude tool 이름**: `extract_report_data` (claude-prompt.ts)
- **Report 필드 개수**: 25+ (scores 5개, SWOT 4개, KPI 7개, painPoints 등 배열)
- 상세 스키마: [lib/questionnaire/report-schema.ts](../../lib/questionnaire/report-schema.ts) (`ReportFields`, `DerivedMetrics`, `FIELD_GROUPS`)

## 리뷰 페이지 UX 규칙
- `metadata.lowConfidenceFields`에 포함된 필드 → 주황색 표시 (Haiku로 보충된 추정값)
- 사용자는 수동 편집 가능, 저장 시 `/api/report/db` PATCH

## 캐시 동작
- 키: `computeCacheKey(strippedMeetingNotes, surveyFieldsHash)` — 메타 제거된 노트 해시
- 동일 입력 재호출 시 Claude 스킵, 즉시 반환

## 파이프라인 연계 (향후)
생성된 리포트 → `pipelines.status = REPORT_DELIVERED` 전이. 현재 이식본은 pipelines 테이블과 연결 안 됨(독립 reports 테이블만 씀). F3 대시보드 구현 시 연결 고려.

## 외부 참조 문서
- [generator-design.md](generator-design.md) — 원 설계자의 의도
- [AGENTS.md](AGENTS.md) — Next.js 16 변경점 주의 (training data와 다름)
- [APPHUB-INTEGRATION.md](APPHUB-INTEGRATION.md) — 외부 API 스펙 고정
