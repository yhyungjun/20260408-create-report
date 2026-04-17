import { NextResponse } from 'next/server';
import { getPipelineByToken } from '@/lib/apphub-pipelines';
import {
  getQuestionnaireByToken,
  createQuestionnaire,
  updateQuestionnaireAnswers,
} from '@/lib/apphub-questionnaires';

/** 설문 자동 저장 (디바운스) */
export async function POST(req: Request) {
  try {
    const { token, answers } = await req.json();

    if (!token) {
      return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    }

    // 파이프라인 유효성 확인
    const pipeline = await getPipelineByToken(token);
    if (!pipeline) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 });
    }

    // 기존 설문 조회 또는 새로 생성
    let questionnaire = await getQuestionnaireByToken(token);
    if (!questionnaire) {
      questionnaire = await createQuestionnaire({
        pipeline_token: token,
        company_name: pipeline.company_name,
        respondent_email: pipeline.contact_email,
      });
    }

    // 답변 업데이트
    if (answers && typeof answers === 'object') {
      await updateQuestionnaireAnswers(questionnaire.id, answers);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '저장 실패' },
      { status: 500 },
    );
  }
}
