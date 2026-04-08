import { NextResponse } from 'next/server';
import { analyzeMeetingNotes } from '@/lib/claude-prompt';
import type { ReportFields } from '@/lib/report-schema';

export async function POST(request: Request) {
  try {
    const { meetingNotes, surveyFields } = await request.json();
    if (!meetingNotes || typeof meetingNotes !== 'string') {
      return NextResponse.json(
        { error: '미팅 노트를 입력해주세요.' },
        { status: 400 }
      );
    }
    const result = await analyzeMeetingNotes(meetingNotes);

    // 설문 직접 매핑 필드 머지: surveyFields 값이 LLM 결과보다 우선
    if (surveyFields && typeof surveyFields === 'object') {
      const surveyKeys = Object.keys(surveyFields) as (keyof ReportFields)[];
      for (const key of surveyKeys) {
        const sv = surveyFields[key];
        if (sv != null) {
          (result.fields as unknown as Record<string, unknown>)[key] = sv;
          // 설문 기반 필드는 confidence 높음 → lowConfidence에서 제거
          result.metadata.lowConfidenceFields = result.metadata.lowConfidenceFields.filter(
            (f: string) => f !== key
          );
        }
      }
      // 머지 후 필드 카운트 재계산
      const fieldKeys = Object.keys(result.fields) as (keyof ReportFields)[];
      result.metadata.fieldsExtracted = fieldKeys.filter((k) => result.fields[k] != null).length;
      result.metadata.fieldsMissing = fieldKeys.length - result.metadata.fieldsExtracted;
    }

    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Analyze error:', msg);
    return NextResponse.json(
      { error: `분석 중 오류: ${msg}` },
      { status: 500 }
    );
  }
}
