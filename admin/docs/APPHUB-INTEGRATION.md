# AppHub 외부 API 스펙

**할루 방지 고정 문서**. AppHub 관련 하드코딩 값 변경 시 이 문서부터 업데이트.

## 접속 정보
- **Base URL**: `https://hub-api.jocodingax.ai`
- **인증**: `X-Api-Key` 헤더 (env: `APPHUB_API_KEY` 또는 `APPHUB_APP_KEY`)
- **App ID**: `10`
- **DB Schema**: `jocodingax_ai_app_2_2` (env `APPHUB_DB_SCHEMA`로 override 가능)

## 테이블 ID (필수 고정값)
| 테이블명 | ID | 용도 | 스키마 정의 파일 |
|---|---|---|---|
| `reports` | `36` | 생성된 리포트 (ReportFields JSON) | `admin/lib/report-db.ts` (이식 후) |
| `payments` | `40` | 결제 내역 | [lib/apphub/apphub-payments.ts](../../lib/apphub/apphub-payments.ts) |
| `pipelines` | `41` | 고객 상태머신 | [lib/apphub/apphub-pipelines.ts](../../lib/apphub/apphub-pipelines.ts) |
| `questionnaires` | `42` | 설문 응답 | [lib/apphub/apphub-questionnaires.ts](../../lib/apphub/apphub-questionnaires.ts) |

소스: [lib/apphub/apphub-tables.ts](../../lib/apphub/apphub-tables.ts) 상수 `TABLE_IDS`.

## API 엔드포인트 패턴
```
GET    /api/v1/apps/10/tables/{ID}/rows?db_schema=jocodingax_ai_app_2_2
GET    /api/v1/apps/10/tables/{ID}/rows/{rowId}?db_schema=...
POST   /api/v1/apps/10/tables/{ID}/rows?db_schema=...
PATCH  /api/v1/apps/10/tables/{ID}/rows/{rowId}?db_schema=...
DELETE /api/v1/apps/10/tables/{ID}/rows/{rowId}?db_schema=...
```

응답 포맷:
```json
{ "success": true, "data": <row or { rows: [...] }>, "error": "..." }
```

## ⚠️ 서버측 필터 API 버그 — 우회 방법
AppHub의 필터 쿼리 파라미터가 일부 케이스에서 잘못된 row를 반환함. 따라서 `lib/apphub/apphub-tables.ts`의 `getRow(id)`/`findRows(predicate)`는 **list-and-filter** 방식을 유지:

```typescript
// ❌ 서버측 필터 사용하지 말 것
// ✅ 전체 조회 후 클라이언트에서 find
const rows = await listRows<T>(tableName);
const row = rows.find(r => r.id === id);
```

이 패턴은 생성기 이식 시에도 유지. 성능 문제 시 `reports` 테이블 row 수 모니터링 후 페이지네이션 도입 검토.

## 파이프라인 상태머신
```
PAYMENT_COMPLETE
  → FORM_SENT               (설문 링크 이메일 발송)
  → FORM_COMPLETE           (설문 제출)
  → PRE_MEETING_REPORT_GENERATING
  → PRE_MEETING_REPORT_READY (미팅 숙지안 완성, F5)
  → MEETING_COMPLETE        (실제 미팅 종료)
  → REPORT_GENERATING
  → REPORT_REVIEW           (내부 리뷰 대기)
  → REPORT_DELIVERED        (고객 이메일 전달)
```

소스: [lib/apphub/apphub-pipelines.ts](../../lib/apphub/apphub-pipelines.ts) `PipelineStatus` 타입.

## `pipelines` 행 스키마
```typescript
{
  id: string;
  company_name: string;
  contact_email: string;
  contact_name: string | null;
  payment_id: string;
  questionnaire_token: string;
  questionnaire_id: string | null;
  status: PipelineStatus;
  caret_note_id: string | null;      // Caret 미팅 노트 참조
  meeting_notes: string | null;       // 미팅 transcript/요약
  report_fields: Record<string, unknown> | null;  // 생성된 ReportFields
  pdf_url: string | null;
  slack_message_ts: string | null;
  email_sent_at: string | null;
  created_at: string;
  updated_at: string;
}
```

## `reports` 행 스키마 (이식 대상)
`admin/lib/report-db.ts`에 정의. 현 상태에서 예상 구조:
```typescript
{
  id: string;
  title: string;                     // "기업명-YYYY.MM.DD" 자동 생성
  fields: ReportFields;              // 리포트 본문 (JSON)
  meeting_notes: string;
  survey_csv: string | null;
  metadata: ExtractMetadata;         // 추출 통계 + lowConfidenceFields
  created_at: string;
  updated_at: string;
}
```
⚠️ 이식 시 확정 스키마를 이 문서에 업데이트할 것.

## MCP 서버 (개발자 보조용)
AppHub은 MCP HTTP 서버로도 노출됨: `https://hub-api.jocodingax.ai/mcp`.
- 용도: Claude Code에서 AppHub DB를 직접 조회/편집하며 개발할 때
- **런타임 아님** (app 실행 시 MCP 거치지 않음, 직접 REST 호출)
- **⚠️ `.mcp.json`에 API Key 평문 기입 금지** — `claude/musing-lichterman` 브랜치에서 실수로 커밋된 전례 있음. 키 로테이션 필요

## Slack / Email 알림 연계
- 리포트 생성 완료 → `pipelines.slack_message_ts`에 Slack 메시지 ts 저장 → [lib/slack.ts](../../lib/slack.ts)
- 고객 이메일 전달 → `pipelines.email_sent_at` 타임스탬프 → [lib/email.ts](../../lib/email.ts) (Resend)
