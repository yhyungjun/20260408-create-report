import { analyzeMeetingNotesStream } from '@/lib/claude-prompt';
import type { ReportFields, ExtractMetadata } from '@/lib/report-schema';
import { computeCacheKey, getCached, setCached } from '@/lib/analysis-cache';
import { extractMetadata, type ExtractedMeta } from '@/lib/meta-extractor';

export const maxDuration = 120;

function writeLine(controller: ReadableStreamDefaultController, obj: object) {
  controller.enqueue(new TextEncoder().encode(JSON.stringify(obj) + '\n'));
}

/**
 * 라벨에서 추출한 메타데이터를 fields에 덮어쓰기 (in-place).
 * 우선순위: 메타데이터 > surveyFields > Claude 추출값
 */
function applyMetadataToFields(fields: ReportFields, meta: ExtractedMeta): void {
  if (meta.companyName) fields.companyName = meta.companyName;
  if (meta.consultantName) fields.consultantName = meta.consultantName;
  if (meta.diagnosisDate) {
    fields.diagnosisDate = meta.diagnosisDate;
    // interviewInfo.date도 동일하게 업데이트
    if (!fields.interviewInfo) {
      fields.interviewInfo = { participants: '', date: meta.diagnosisDate };
    } else {
      fields.interviewInfo.date = meta.diagnosisDate;
    }
  }
  if (meta.participants) {
    if (!fields.interviewInfo) {
      fields.interviewInfo = { participants: meta.participants, date: '' };
    } else {
      fields.interviewInfo.participants = meta.participants;
    }
  }
}

function recountMetadata(fields: ReportFields, metadata: ExtractMetadata): void {
  const fieldKeys = Object.keys(fields) as (keyof ReportFields)[];
  metadata.fieldsExtracted = fieldKeys.filter((k) => fields[k] != null).length;
  metadata.fieldsMissing = fieldKeys.length - metadata.fieldsExtracted;
}

export async function POST(request: Request) {
  let meetingNotes: string;
  let surveyFields: Partial<ReportFields> | null;

  try {
    const body = await request.json();
    meetingNotes = body.meetingNotes;
    surveyFields = body.surveyFields || null;
  } catch {
    return new Response(
      JSON.stringify({ type: 'error', message: '잘못된 요청입니다.' }) + '\n',
      { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } },
    );
  }

  if (!meetingNotes || typeof meetingNotes !== 'string') {
    return new Response(
      JSON.stringify({ type: 'error', message: '미팅 노트를 입력해주세요.' }) + '\n',
      { status: 400, headers: { 'Content-Type': 'application/x-ndjson' } },
    );
  }

  // ── 1. 라벨 메타데이터 추출 + 본문에서 제거 ──
  const { meta, strippedNotes } = extractMetadata(meetingNotes);

  // ── 2. 제거된 본문으로 캐시 키 생성 (메타데이터는 제외됨) ──
  const cacheKey = computeCacheKey(strippedNotes, surveyFields);
  const cached = getCached(cacheKey);

  if (cached) {
    const stream = new ReadableStream({
      start(controller) {
        writeLine(controller, { type: 'progress', message: '캐시된 결과 사용 — AI 호출 생략' });
        // 캐시된 결과를 복제한 후 현재 요청의 메타데이터를 적용
        const fields = JSON.parse(JSON.stringify(cached.fields)) as ReportFields;
        const metadata = JSON.parse(JSON.stringify(cached.metadata)) as ExtractMetadata;
        applyMetadataToFields(fields, meta);
        recountMetadata(fields, metadata);
        writeLine(controller, { type: 'result', data: { fields, metadata } });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  const stream = new ReadableStream({
    start(controller) {
      (async () => {
        try {
          // Claude에는 메타데이터가 제거된 본문과 메타 객체 전달
          // → 프롬프트의 금지어 룰로 분석 필드 내 메타 재진술 방지
          const result = await analyzeMeetingNotesStream(
            strippedNotes,
            (message) => {
              writeLine(controller, { type: 'progress', message });
            },
            meta,
          );

          // 설문 직접 매핑 필드 머지
          if (surveyFields && typeof surveyFields === 'object') {
            const surveyKeys = Object.keys(surveyFields) as (keyof ReportFields)[];
            for (const key of surveyKeys) {
              const sv = surveyFields[key];
              if (sv != null) {
                (result.fields as unknown as Record<string, unknown>)[key] = sv;
                result.metadata.lowConfidenceFields = result.metadata.lowConfidenceFields.filter(
                  (f: string) => f !== key,
                );
              }
            }
          }

          // 캐시에는 메타데이터 적용 전 상태 저장 (다음 요청에서 다른 메타데이터를 적용할 수 있도록)
          setCached(cacheKey, result.fields, result.metadata);

          // 현재 요청의 메타데이터 적용
          applyMetadataToFields(result.fields, meta);
          recountMetadata(result.fields, result.metadata);

          writeLine(controller, { type: 'result', data: result });
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          console.error('Analyze error:', msg);
          writeLine(controller, { type: 'error', message: `분석 중 오류: ${msg}` });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
