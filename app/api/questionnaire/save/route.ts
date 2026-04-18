import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getPipelineByToken } from '@/lib/apphub/apphub-pipelines';
import {
  getQuestionnaireByToken,
  getQuestionnaireByUserEmail,
  createQuestionnaire,
  updateQuestionnaireAnswers,
} from '@/lib/apphub/apphub-questionnaires';

/** 설문 자동 저장 (디바운스) */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { token, answers } = await req.json();

    if (!token) {
      return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    }

    // 파이프라인 유효성 확인
    const pipeline = await getPipelineByToken(token);
    if (!pipeline) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 });
    }

    // 기존 설문 조회: email → token 순서로 시도
    let questionnaire = await getQuestionnaireByUserEmail(session.user.email);
    if (!questionnaire) {
      questionnaire = await getQuestionnaireByToken(token);
    }

    if (!questionnaire) {
      questionnaire = await createQuestionnaire({
        pipeline_token: token,
        company_name: pipeline.company_name,
        respondent_email: pipeline.contact_email,
        user_email: session.user.email,
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
