import { NextResponse } from 'next/server';
import { createPayment } from '@/lib/apphub-payments';

/**
 * 결제 주문 생성 API
 * 클라이언트에서 결제 시작 전에 호출하여 orderId를 발급받고 AppHub에 PENDING 레코드 생성
 */
export async function POST(req: Request) {
  try {
    const { amount, productType, companyName, contactEmail, contactName, contactPhone } =
      await req.json();

    if (!amount || !productType || !companyName || !contactEmail) {
      return NextResponse.json(
        { error: '필수 항목(amount, productType, companyName, contactEmail)을 입력해주세요.' },
        { status: 400 },
      );
    }

    // 고유 orderId 생성
    const orderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const payment = await createPayment({
      toss_order_id: orderId,
      amount: Number(amount),
      product_type: productType,
      company_name: companyName,
      contact_email: contactEmail,
      contact_name: contactName,
      contact_phone: contactPhone,
    });

    return NextResponse.json({
      orderId,
      paymentId: payment.id,
      amount: payment.amount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '주문 생성 실패' },
      { status: 500 },
    );
  }
}
