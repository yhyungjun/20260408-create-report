import { WebClient } from '@slack/web-api';

function getSlack() {
  return new WebClient(process.env.SLACK_BOT_TOKEN);
}
const CHANNEL_ID = process.env.SLACK_CHANNEL_ID || '';

/** 새 결제 알림 */
export async function notifyNewPayment(
  companyName: string,
  amount: number,
  contactEmail: string,
) {
  if (!CHANNEL_ID) return;
  await getSlack().chat.postMessage({
    channel: CHANNEL_ID,
    text: `새 결제가 접수되었습니다: ${companyName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*새 결제 접수*\n기업: *${companyName}*\n금액: ${amount.toLocaleString()}원\n담당자: ${contactEmail}`,
        },
      },
    ],
  });
}

/** 설문 완료 알림 */
export async function notifyQuestionnaireComplete(
  companyName: string,
  contactEmail: string,
) {
  if (!CHANNEL_ID) return;
  await getSlack().chat.postMessage({
    channel: CHANNEL_ID,
    text: `설문이 완료되었습니다: ${companyName}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*설문 완료*\n기업: *${companyName}*\n담당자: ${contactEmail}\n\n미팅 일정을 잡아주세요.`,
        },
      },
    ],
  });
}

/** PDF 리포트 Slack 공유 (Phase 4에서 구현 예정) */
export async function sharePdfToSlack(
  companyName: string,
  pdfBuffer: Buffer,
  contactEmail: string,
) {
  if (!CHANNEL_ID) return;
  await getSlack().filesUploadV2({
    channel_id: CHANNEL_ID,
    file: pdfBuffer,
    filename: `${companyName}_사전기업진단리포트.pdf`,
    title: `${companyName} 사전 기업 진단 리포트`,
    initial_comment: `*${companyName}* 리포트가 생성되었습니다.\n담당자: ${contactEmail}\n\nOpenClaw에서 이메일을 작성해주세요.`,
  });
}
