import { NextResponse } from 'next/server';
import { getPaymentByOrderId, updatePaymentStatus } from '@/lib/apphub-payments';

/**
 * 토스페이먼츠 웹훅 수신
 * 결제 취소, 환불 등 비동기 상태 변경 처리
 * 토스 대시보드에서 웹훅 URL 등록 필요: {BASE_URL}/api/payment/webhook
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { eventType, data } = body;

    // 웹훅 이벤트 타입에 따라 처리
    if (eventType === 'PAYMENT_STATUS_CHANGED') {
      const { orderId, status } = data;

      const payment = await getPaymentByOrderId(orderId);
      if (!payment) {
        // 해당 결제가 없으면 무시 (다른 서비스의 결제일 수 있음)
        return NextResponse.json({ success: true });
      }

      // 토스 상태 → 내부 상태 매핑
      const statusMap: Record<string, string> = {
        CANCELED: 'CANCELLED',
        PARTIAL_CANCELED: 'CANCELLED',
        ABORTED: 'FAILED',
        EXPIRED: 'FAILED',
      };

      const mappedStatus = statusMap[status];
      if (mappedStatus) {
        await updatePaymentStatus(
          payment.id,
          mappedStatus as 'CANCELLED' | 'FAILED',
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('웹훅 처리 오류:', err);
    // 웹훅은 항상 200 반환 (재시도 방지)
    return NextResponse.json({ success: true });
  }
}
