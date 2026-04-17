'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId');
  const amount = searchParams.get('amount');
  const isValid = !!(paymentKey && orderId && amount);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(isValid ? 'loading' : 'error');
  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    orderName: string;
    totalAmount: number;
    method: string;
    questionnaireToken?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState(isValid ? '' : '결제 정보가 유효하지 않습니다.');

  useEffect(() => {
    if (!isValid) return;

    fetch('/api/payment/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '결제 승인에 실패했습니다.');
        setOrderInfo(data);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message);
      });
  }, [isValid, paymentKey, orderId, amount]);

  if (status === 'loading') {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">결제를 확인하고 있습니다...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-3xl">&#10007;</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">결제 승인 실패</h1>
        <p className="text-gray-500 mb-6">{errorMessage}</p>
        <a href="/pay" className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          다시 시도하기
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-green-500 text-3xl">&#10003;</span>
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">결제가 완료되었습니다</h1>
      <p className="text-gray-500 mb-4">사전 진단 설문지 작성 안내를 이메일로 보내드렸습니다.</p>

      {orderInfo?.questionnaireToken && (
        <a
          href={`/questionnaire/${orderInfo.questionnaireToken}`}
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors mb-6"
        >
          지금 바로 설문 작성하기
        </a>
      )}

      {orderInfo && (
        <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">상품</span>
              <span className="text-gray-900 font-medium">{orderInfo.orderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 금액</span>
              <span className="text-gray-900 font-medium">{orderInfo.totalAmount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">결제 수단</span>
              <span className="text-gray-900 font-medium">{orderInfo.method}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">주문 번호</span>
              <span className="text-gray-900 font-medium text-xs">{orderInfo.orderId}</span>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">문의사항이 있으시면 contact@jocodingax.ai로 연락해주세요.</p>
    </div>
  );
}

export default function PaySuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense
        fallback={
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">로딩 중...</p>
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </div>
  );
}
