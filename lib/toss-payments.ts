/**
 * 토스페이먼츠 서버 사이드 API 클라이언트
 * 결제 승인, 조회, 취소 처리
 */

const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`;
}

async function tossApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${TOSS_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new TossPaymentError(
      data.code || 'UNKNOWN_ERROR',
      data.message || '결제 처리 중 오류가 발생했습니다.',
      res.status,
    );
  }

  return data as T;
}

export class TossPaymentError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'TossPaymentError';
  }
}

/** 결제 승인 요청 */
export interface ConfirmPaymentParams {
  paymentKey: string;
  orderId: string;
  amount: number;
}

export interface TossPaymentResponse {
  paymentKey: string;
  orderId: string;
  orderName: string;
  status: string;
  totalAmount: number;
  method: string;
  requestedAt: string;
  approvedAt: string;
  card?: {
    amount: number;
    company: string;
    number: string;
    installmentPlanMonths: number;
  };
  receipt?: { url: string };
}

export async function confirmPayment(
  params: ConfirmPaymentParams,
): Promise<TossPaymentResponse> {
  return tossApiFetch<TossPaymentResponse>('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/** 결제 조회 (paymentKey로) */
export async function getPayment(
  paymentKey: string,
): Promise<TossPaymentResponse> {
  return tossApiFetch<TossPaymentResponse>(`/payments/${paymentKey}`);
}

/** 결제 조회 (orderId로) */
export async function getPaymentByOrderId(
  orderId: string,
): Promise<TossPaymentResponse> {
  return tossApiFetch<TossPaymentResponse>(`/payments/orders/${orderId}`);
}

/** 결제 취소 */
export async function cancelPayment(
  paymentKey: string,
  reason: string,
): Promise<TossPaymentResponse> {
  return tossApiFetch<TossPaymentResponse>(`/payments/${paymentKey}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ cancelReason: reason }),
  });
}
