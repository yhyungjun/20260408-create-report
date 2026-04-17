import { NextResponse } from 'next/server';
import { getPipelineByToken, updatePipelineStatus } from '@/lib/apphub-pipelines';
import { getQuestionnaireByToken, submitQuestionnaire } from '@/lib/apphub-questionnaires';
import { sendQuestionnaireCompleteEmail } from '@/lib/email';
import { notifyQuestionnaireComplete } from '@/lib/slack';

/** 설문 최종 제출 */
export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: '토큰이 필요합니다.' }, { status: 400 });
    }

    const pipeline = await getPipelineByToken(token);
    if (!pipeline) {
      return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 });
    }

    const questionnaire = await getQuestionnaireByToken(token);
    if (!questionnaire) {
      return NextResponse.json({ error: '설문 데이터를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (questionnaire.status === 'SUBMITTED') {
      return NextResponse.json({ error: '이미 제출된 설문입니다.' }, { status: 400 });
    }

    // 설문 상태 업데이트
    await submitQuestionnaire(questionnaire.id);

    // 파이프라인 상태 전환
    await updatePipelineStatus(pipeline.id, 'FORM_COMPLETE', {
      questionnaire_id: questionnaire.id,
    });

    // 이메일 + Slack 알림 (실패해도 제출 응답은 정상 반환)
    try {
      await Promise.all([
        sendQuestionnaireCompleteEmail(pipeline.contact_email, pipeline.company_name),
        notifyQuestionnaireComplete(pipeline.company_name, pipeline.contact_email),
      ]);
    } catch (notifyErr) {
      console.error('알림 발송 실패:', notifyErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '제출 실패' },
      { status: 500 },
    );
  }
}
