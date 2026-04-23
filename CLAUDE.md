# 프로젝트 맥락

조코딩 AX 파트너스 — **사전 기업 진단 컨설팅 사이트**. 고객이 결제 → 설문 → 미팅 → AI 리포트(8p PDF) 수령하는 B2B 파이프라인.

## 스택
- **Next.js 16.2.2** (App Router, `src/` 미사용 — 루트 `app/`), React 19, TypeScript, Tailwind v4
- **NextAuth v5 beta** (Google) — `@jocodingax.ai` 이메일 → `admin` 역할 자동 부여 ([auth.ts](auth.ts), [middleware.ts](middleware.ts))
- **외부 DB/백엔드**: AppHub (`hub-api.jocodingax.ai`, App ID `10`) — [lib/apphub/](lib/apphub/)에 CRUD 클라이언트
- **AI**: `@anthropic-ai/sdk` (Claude Sonnet/Haiku, `ANTHROPIC_API_KEY`)
- **PDF**: Puppeteer + `@sparticuz/chromium`
- **미팅 노트**: Caret 앱 API
- **설문 데이터**: 자체 questionnaire 페이지 + 기존 Google Sheets/Apps Script 연동

## 코드 영역 분업 ⚠️ 중요
| 영역 | 경로 | 담당 | 규칙 |
|---|---|---|---|
| 유저 페이지 | `app/{login,pay,questionnaire,privacy,terms,page.tsx}`, 관련 `components/`, `lib/{email,slack,toss-payments}` | **파트너** | **수정 금지** (결제 PG 승인 대기 중, 명시적 요청 없으면 건드리지 않음) |
| 어드민 | `app/admin/**/*.tsx`, `admin/**/*` | 사용자 + Claude | 신규 기능은 여기 |

## `admin/` 대폴더 규칙
- **라우트**는 Next.js 규약상 `app/admin/**/*.tsx`에 둠
- **그 외 어드민 자산**(lib, components, context, docs, samples) 전부 **`admin/` 루트 폴더**
- 유저페이지 파일과 경로가 겹치지 않게 분리 → 파트너와 git 병렬 작업 충돌 최소화

## 금지사항
- 기존 파일 수정 전 **사용자 컨펌 필수**
- 유저페이지 영역 파일 수정 (명시적 요청 없으면 절대)
- `.mcp.json` 커밋 (AppHub API Key 평문 노출 전례 있음 — `.gitignore` 확인)
- 유저페이지 라우트/API 경로 변경

## 주요 파일 지도
| 역할 | 경로 |
|---|---|
| 인증 | [auth.ts](auth.ts), [middleware.ts](middleware.ts) |
| AppHub 제네릭 CRUD | [lib/apphub/apphub-tables.ts](lib/apphub/apphub-tables.ts) (TABLE_IDS 포함) |
| 파이프라인 상태머신 | [lib/apphub/apphub-pipelines.ts](lib/apphub/apphub-pipelines.ts) |
| 설문 스키마 | [lib/questionnaire/question-guide.ts](lib/questionnaire/question-guide.ts), [lib/questionnaire/report-schema.ts](lib/questionnaire/report-schema.ts) |
| 리포트 생성기 (이식 중) | `admin/{lib,components,context}/`, `app/admin/report/*`, `app/api/report/*` |
| 어드민 전용 문서 | [admin/docs/](admin/docs/) — PRD, DEV-PLAN, CLAUDE(admin), APPHUB-INTEGRATION |

## 작업 원칙
1. 큰 작업 전에 **플랜 제시 → 사용자 OK → 실행**
2. 파일 추가 시 경로 분리로 파트너 충돌 최소화
3. 코드 수정은 사용자 컨펌 후에만
4. `/clear` 후에도 이 문서 + [admin/docs/](admin/docs/)만 있으면 다시 맥락 잡을 수 있게 유지

## 현재 진행 중인 작업
**어드민 UI 정적 구현**: `admin/integrate-generator` 브랜치에서 어드민 페이지 5종(대시보드, 설문지 설정, 미팅 숙지안, 리포트 생성기 플레이스홀더, 통계)의 UI 스켈레톤을 구축 중. 디자인: lucide-react + Tailwind v4 + 브랜드 보라 (`#7C3AED`). 데이터 연동/기능 로직은 다음 단계.

**리포트 생성기(F1)**: 사용자가 별도 소스코드를 추후 첨부 예정 → 현 단계에서는 플레이스홀더 페이지만. 과거 구현은 `claude/musing-lichterman` 브랜치에 아카이브.

상세 플랜: [admin/docs/DEV-PLAN.md](admin/docs/DEV-PLAN.md)
