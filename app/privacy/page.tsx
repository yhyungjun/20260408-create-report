export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">개인정보 처리방침</h1>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">1. 수집하는 개인정보 항목</h2>
            <p>회사는 서비스 제공을 위해 다음의 개인정보를 수집합니다.</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>필수 항목:</strong> 기업명, 담당자명, 이메일 주소</li>
              <li><strong>선택 항목:</strong> 연락처 (전화번호)</li>
              <li><strong>결제 시:</strong> 결제 정보 (토스페이먼츠를 통해 처리, 회사가 직접 저장하지 않음)</li>
              <li><strong>설문 응답:</strong> 기업 현황 및 AI 도입 관련 응답 데이터</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">2. 개인정보 수집 및 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>서비스 제공 및 계약 이행 (진단 리포트 생성, 미팅 일정 조율)</li>
              <li>결제 처리 및 환불</li>
              <li>서비스 관련 안내 및 공지사항 전달</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">3. 개인정보 보유 및 이용 기간</h2>
            <p>서비스 제공 완료 후 1년간 보관하며, 이후 지체 없이 파기합니다. 단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>전자상거래법에 따른 계약/결제 기록: 5년</li>
              <li>소비자 불만 처리 기록: 3년</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">4. 개인정보의 제3자 제공</h2>
            <p>회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우는 예외로 합니다.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>법령에 따른 요청이 있는 경우</li>
              <li>결제 처리를 위한 토스페이먼츠 제공 (결제 정보에 한함)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">5. 개인정보의 파기</h2>
            <p>보유 기간이 만료되거나 처리 목적이 달성된 경우, 지체 없이 해당 개인정보를 파기합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">6. 이용자의 권리</h2>
            <p>이용자는 언제든지 자신의 개인정보에 대한 열람, 수정, 삭제를 요청할 수 있습니다.</p>
            <p>요청 방법: contact@jocodingax.ai</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">7. 개인정보 보호 책임자</h2>
            <p>성명: 조동근, 문경원<br />연락처: contact@jocodingax.ai</p>
          </section>

          <p className="text-xs text-gray-400 mt-8">시행일: 2026년 4월 16일</p>
        </div>
      </div>
    </div>
  );
}
