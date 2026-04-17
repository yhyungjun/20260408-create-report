'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') ?? '알 수 없음';
  const message = searchParams.get('message') ?? '결제가 취소되었거나 오류가 발생했습니다.';

  return (
    <>
      <h1 className="text-xl font-bold text-gray-900 mb-2">결제 실패</h1>
      <p className="text-gray-500 mb-2">{message}</p>
      <p className="text-xs text-gray-400 mb-6">오류 코드: {code}</p>
    </>
  );
}

export default function PayFailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-red-500 text-3xl">&#10007;</span>
        </div>
        <Suspense fallback={<p className="text-gray-500">로딩 중...</p>}>
          <FailContent />
        </Suspense>
        <a
          href="/pay"
          className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          다시 시도하기
        </a>
      </div>
    </div>
  );
}
