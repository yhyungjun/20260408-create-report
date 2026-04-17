import { NextResponse } from 'next/server';
import {
  confirmPayment,
  TossPaymentError,
} from '@/lib/toss-payments';
import {
  getPaymentByOrderId,
  confirmPaymentRecord,
} from '@/lib/apphub-payments';
import { createPipeline } from '@/lib/apphub-pipelines';
import { sendPaymentConfirmEmail } from '@/lib/email';
import { notifyNewPayment } from '@/lib/slack';

/**
 * 결제 승인 API
 * 토스 SDK가 결제 완료 후 리다이렉트하면, 클라이언트가 이 API를 호출하여 서버에서 최종 승인
 */
export async function POST(req: Request) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: 'paymentKey, orderId, amount가 필요합니다.' },
        { status: 400 },
      );
    }

    // 1. AppHub에서 결제 레코드 조회 (orderId로)
    const payment = await getPaymentByOrderId(orderId);
    if (!payment) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    // 2. 금액 검증 (위변조 방지)
    if (payment.amount !== Number(amount)) {
      return NextResponse.json(
        { error: '결제 금액이 일치하지 않습니다.' },
        { status: 400 },
      );
    }

    // 3. 토스 결제 승인 API 호출
    const tossResult = await confirmPayment({
      paymentKey,
      orderId,
      amount: Number(amount),
    });

    // 4. AppHub 결제 레코드 업데이트
    await confirmPaymentRecord(payment.id, paymentKey, {
      method: tossResult.method,
      approvedAt: tossResult.approvedAt,
      card: tossResult.card,
      receipt: tossResult.receipt,
    });

    // 5. 파이프라인 생성 + 설문 토큰 발급
    const questionnaireToken = crypto.randomUUID();
    await createPipeline({
      company_name: payment.company_name,
      contact_email: payment.contact_email,
      contact_name: payment.contact_name || undefined,
      payment_id: payment.id,
      questionnaire_token: questionnaireToken,
    });

    // 6. 이메일 + Slack 알림 (실패해도 결제 응답은 정상 반환)
    try {
      await Promise.all([
        sendPaymentConfirmEmail(payment.contact_email, payment.company_name, questionnaireToken),
        notifyNewPayment(payment.company_name, payment.amount, payment.contact_email),
      ]);
    } catch (notifyErr) {
      console.error('알림 발송 실패:', notifyErr);
    }

    return NextResponse.json({
      success: true,
      orderId: tossResult.orderId,
      orderName: tossResult.orderName,
      method: tossResult.method,
      totalAmount: tossResult.totalAmount,
      questionnaireToken,
    });
  } catch (err) {
    if (err instanceof TossPaymentError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '결제 승인 실패' },
      { status: 500 },
    );
  }
}
