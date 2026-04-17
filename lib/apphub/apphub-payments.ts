/**
 * AppHub payments 테이블 CRUD
 */

import { createRow, updateRow, listRows, findRows, getRow } from './apphub-tables';

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export interface Payment {
  id: string;
  toss_payment_key: string | null;
  toss_order_id: string;
  amount: number;
  product_type: string;
  status: PaymentStatus;
  company_name: string;
  contact_email: string;
  contact_name: string | null;
  contact_phone: string | null;
  confirmed_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export async function listPayments(): Promise<Payment[]> {
  return listRows<Payment>('payments');
}

export async function getPayment(id: string): Promise<Payment> {
  return getRow<Payment>('payments', id);
}

export async function getPaymentByOrderId(orderId: string): Promise<Payment | null> {
  const results = await findRows<Payment>('payments', r => r.toss_order_id === orderId);
  return results[0] || null;
}

export async function createPayment(input: {
  toss_order_id: string;
  amount: number;
  product_type: string;
  company_name: string;
  contact_email: string;
  contact_name?: string;
  contact_phone?: string;
}): Promise<Payment> {
  return createRow<Payment>('payments', {
    ...input,
    status: 'PENDING',
    toss_payment_key: null,
    confirmed_at: null,
    metadata: null,
  });
}

export async function confirmPaymentRecord(
  id: string,
  tossPaymentKey: string,
  metadata?: Record<string, unknown>,
): Promise<Payment> {
  return updateRow<Payment>('payments', id, {
    status: 'CONFIRMED',
    toss_payment_key: tossPaymentKey,
    confirmed_at: new Date().toISOString(),
    metadata: metadata || null,
  });
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
): Promise<Payment> {
  return updateRow<Payment>('payments', id, { status });
}
