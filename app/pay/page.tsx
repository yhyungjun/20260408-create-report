'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { loadTossPayments } from '@tosspayments/payment-sdk';

const PRODUCT = {
  id: 'pre_diagnosis',
  name: '사전 기업 진단 컨설팅',
  description: 'AI 기반 사전 진단 리포트 + 컨설턴트 1:1 미팅',
  price: 440000,
  features: [
    '사전 진단 설문 분석',
    'AI 기업 진단 리포트 (15페이지)',
    '컨설턴트 1:1 미팅',
    '맞춤 진단 결과 이메일 전달',
  ],
};

export default function PayPage() {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    if (!companyName || !contactEmail || !contactName) {
      setError('기업명, 담당자명, 이메일은 필수 항목입니다.');
      return;
    }
    if (!agreedTerms) {
      setError('이용약관 및 환불규정에 동의해주세요.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // 1. 서버에서 주문 생성 (orderId 발급 + DB 저장)
      const createRes = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: PRODUCT.price,
          productType: PRODUCT.id,
          companyName,
          contactEmail,
          contactName,
          contactPhone,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json();
        throw new Error(data.error || '주문 생성에 실패했습니다.');
      }

      const { orderId } = await createRes.json();

      // 2. 토스 결제 SDK 초기화 + 결제창 호출
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error('결제 설정이 올바르지 않습니다.');
      }

      const tossPayments = await loadTossPayments(clientKey);

      await tossPayments.requestPayment('카드', {
        amount: PRODUCT.price,
        orderId,
        orderName: PRODUCT.name,
        customerName: contactName,
        customerEmail: contactEmail,
        successUrl: `${window.location.origin}/pay/success`,
        failUrl: `${window.location.origin}/pay/fail`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/">
            <Image src="/images/logo.png" alt="조코딩 AX 파트너스" width={160} height={40} className="h-8 w-auto" />
          </Link>
          <p className="text-sm text-gray-500 mt-1">사전 기업 진단 컨설팅</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* 상품 정보 */}
        <section className="mb-10">
          <div className="bg-white rounded-xl border-2 border-blue-500 p-6">
            <h3 className="text-lg font-semibold text-gray-900">{PRODUCT.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{PRODUCT.description}</p>
            <p className="text-2xl font-bold text-blue-600 mt-3">
              {PRODUCT.price.toLocaleString()}원
              <span className="text-sm font-normal text-gray-400 ml-1">(VAT 포함)</span>
            </p>
            <ul className="mt-4 space-y-1">
              {PRODUCT.features.map((feature) => (
                <li key={feature} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">&#10003;</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* 서비스 상세 설명 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">서비스 상세</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>AI 기반 사전 기업 진단 컨설팅 서비스는 기업의 AI Transformation(AX) 준비도를 진단하고 맞춤 전략을 제안하는 디지털 콘텐츠 서비스입니다.</p>
              <p><strong>서비스 제공 범위:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>사전 진단 설문 분석 (AI 성숙도 5대 영역: 전략, 데이터, 프로세스, 인재, 기술)</li>
                <li>AI 기업 진단 리포트 15페이지 (SWOT, Gap 분석, 혁신 과제, 로드맵 포함)</li>
                <li>컨설턴트 1:1 화상 미팅 (Caret AI)</li>
                <li>맞춤 진단 결과 이메일 전달 (PDF)</li>
              </ul>
              <p><strong>서비스 제공 절차:</strong> 결제 완료 → 사전 설문 작성 (온라인) → 컨설턴트 1:1 미팅 → 진단 리포트 이메일 전달</p>
              <p><strong>서비스 제공 기간:</strong> 결제일로부터 30일 이내</p>
            </div>
          </div>

          {/* 취소/환불 규정 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">취소/환불 규정</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <span>본 서비스는 전자상거래법 제17조에 따른 디지털 콘텐츠로, 결제 완료 시점부터 서비스 제공이 시작되므로 청약철회(환불)가 불가합니다.</span>
            </div>
          </div>
        </section>

        {/* 주문자 정보 */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">주문자 정보</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기업명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="예: 주식회사 그린푸드"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  담당자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="example@company.com"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 (선택)
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </section>

        {/* 결제 버튼 */}
        <section>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* 이용약관 동의 */}
            <label className="flex items-start gap-2.5 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 accent-blue-600"
              />
              <span className="text-sm text-gray-600">
                <a href="/terms" target="_blank" className="text-blue-600 underline">이용약관</a>,{' '}
                <a href="/privacy" target="_blank" className="text-blue-600 underline">개인정보 처리방침</a> 및{' '}
                위 취소/환불 규정에 동의합니다.
                <span className="text-red-500 ml-0.5">*</span>
              </span>
            </label>

            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700">결제 금액</span>
              <span className="text-2xl font-bold text-gray-900">
                {PRODUCT.price.toLocaleString()}원
              </span>
            </div>
            <button
              onClick={handlePayment}
              disabled={loading || !agreedTerms}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? '처리 중...' : '결제하기'}
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              결제 완료 후 사전 진단 설문지 작성 안내가 제공됩니다.
            </p>
          </div>
        </section>
      </main>

      {/* 사업자 정보 푸터 */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-10">
        <div className="max-w-4xl mx-auto px-6 py-6 text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">주식회사 조코딩에이엑스파트너스</p>
          <p>대표: 조동근, 문경원 | 사업자등록번호: 497-81-04077</p>

          <p>주소: 서울특별시 서초구 서초대로 397, B동 1401호(서초동, 부띠크 모나코)</p>
          <p>전화: 070-4280-6588 | 이메일: contact@jocodingax.ai</p>
          <div className="flex gap-3 mt-2">
            <a href="/terms" className="underline hover:text-gray-700">이용약관</a>
            <a href="/privacy" className="underline hover:text-gray-700">개인정보 처리방침</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
