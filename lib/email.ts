import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || '');
}
const EMAIL_FROM = process.env.EMAIL_FROM || '조코딩 AX 파트너스 <noreply@jocodingax.ai>';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://ax.jocodingax.ai';

/** 결제 확인 + 설문 링크 이메일 */
export async function sendPaymentConfirmEmail(
  to: string,
  companyName: string,
  questionnaireToken: string,
) {
  const questionnaireUrl = `${BASE_URL}/questionnaire/${questionnaireToken}`;

  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `[조코딩 AX 파트너스] ${companyName} 사전 기업 진단 - 결제가 완료되었습니다`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #111827; margin-bottom: 8px;">결제가 완료되었습니다</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">${companyName} 사전 기업 진단 컨설팅</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #374151; margin: 0 0 16px 0;">
            안녕하세요, ${companyName} 담당자님.<br/>
            결제가 정상적으로 처리되었습니다.
          </p>
          <p style="color: #374151; margin: 0 0 16px 0;">
            아래 링크를 클릭하여 <strong>사전 진단 설문</strong>을 작성해 주세요.<br/>
            설문 완료 후 컨설턴트와의 1:1 미팅이 진행됩니다.
          </p>
          <a href="${questionnaireUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            설문 작성하기
          </a>
        </div>

        <p style="color: #9ca3af; font-size: 13px;">
          문의: contact@jocodingax.ai<br/>
          조코딩 AX 파트너스
        </p>
      </div>
    `,
  });
}

/** 설문 접수 확인 + 미팅 안내 이메일 */
export async function sendQuestionnaireCompleteEmail(
  to: string,
  companyName: string,
) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `[조코딩 AX 파트너스] ${companyName} 사전 진단 설문이 접수되었습니다`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #111827; margin-bottom: 8px;">설문이 접수되었습니다</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">${companyName} 사전 기업 진단 컨설팅</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <p style="color: #374151; margin: 0 0 16px 0;">
            안녕하세요, ${companyName} 담당자님.<br/>
            사전 진단 설문이 정상적으로 접수되었습니다.
          </p>
          <p style="color: #374151; margin: 0 0 16px 0;">
            설문 내용을 바탕으로 사전 분석을 진행한 뒤,<br/>
            <strong>컨설턴트와의 1:1 미팅 일정</strong>을 별도로 안내드리겠습니다.
          </p>
          <p style="color: #374151; margin: 0;">
            미팅은 화상(Caret AI)으로 진행되며,<br/>
            미팅 완료 후 맞춤 진단 리포트가 이메일로 전달됩니다.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 13px;">
          문의: contact@jocodingax.ai<br/>
          조코딩 AX 파트너스
        </p>
      </div>
    `,
  });
}
