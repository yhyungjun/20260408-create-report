import { analyzeMeetingNotesStream } from '@/lib/claude-prompt';
import type { ReportFields, ExtractMetadata } from '@/lib/report-schema';
import { computeCacheKey, getCached, setCached } from '@/lib/analysis-cache';
import { extractMetadata, type ExtractedMeta } from '@/lib/meta-extractor';
import { extractMissingMetaViaHaiku } from '@/lib/meta-haiku';

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

/**
 * Haiku로 추출된 필드를 metadata.lowConfidenceFields에 추가합니다.
 * 리뷰페이지에서 "확인 필요" 뱃지로 표시되어 리뷰어의 주의를 환기합니다.
 *
 * ExtractedMeta 키 → ReportFields 키 매핑:
 * - companyName, consultantName, diagnosisDate: 동일한 키 사용
 * - participants: interviewInfo의 자식 필드 → 부모 키(interviewInfo) 사용
 */
function addHaikuLowConfidence(
  metadata: ExtractMetadata,
  haikuFilledFields: string[],
): void {
  const fieldKeyMap: Record<string, string> = {
    companyName: 'companyName',
    consultantName: 'consultantName',
    diagnosisDate: 'diagnosisDate',
    participants: 'interviewInfo',
  };
  for (const key of haikuFilledFields) {
    const mapped = fieldKeyMap[key];
    if (mapped && !metadata.lowConfidenceFields.includes(mapped)) {
      metadata.lowConfidenceFields.push(mapped);
    }
  }
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

  // ── 1. 라벨 메타데이터 추출 + 본문에서 제거 (정규식) ──
  const { meta, strippedNotes } = extractMetadata(meetingNotes);

  // ── 1.5. 정규식이 놓친 필드를 Haiku로 보강 (Layer 3) ──
  // - 원본 노트를 Haiku에 전달 (strippedNotes 아님) → 자연어 맥락 활용
  // - 정규식이 찾은 값은 절대 덮어쓰지 않음 (missingKeys만 요청)
  // - API 에러는 swallow → 정규식 결과만으로 계속 진행
  const missingKeys = (Object.keys(meta) as (keyof ExtractedMeta)[]).filter(
    (k) => meta[k] == null,
  );
  const haikuFilledFields: string[] = [];
  if (missingKeys.length > 0) {
    try {
      const haikuMeta = await extractMissingMetaViaHaiku(meetingNotes, missingKeys);
      for (const k of missingKeys) {
        const v = haikuMeta[k];
        if (v != null) {
          meta[k] = v;
          haikuFilledFields.push(k);
        }
      }
    } catch (err) {
      console.warn('[Haiku fallback] 실패, 정규식 결과만 사용:', err);
    }
  }

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
        addHaikuLowConfidence(metadata, haikuFilledFields);
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
          addHaikuLowConfidence(result.metadata, haikuFilledFields);
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
