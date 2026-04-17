export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">이용약관</h1>

        <div className="prose prose-sm prose-gray max-w-none space-y-6 text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">제1조 (목적)</h2>
            <p>본 약관은 주식회사 조코딩에이엑스파트너스(이하 &quot;회사&quot;)가 제공하는 사전 기업 진단 컨설팅 서비스(이하 &quot;서비스&quot;)의 이용 조건 및 절차에 관한 사항을 규정함을 목적으로 합니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">제2조 (서비스 내용)</h2>
            <p>회사는 다음의 서비스를 제공합니다.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>AI 기반 사전 기업 진단 설문 분석</li>
              <li>AI 기업 진단 리포트 (15페이지) 제작 및 전달</li>
              <li>컨설턴트 1:1 화상 미팅</li>
              <li>맞춤 진단 결과 이메일 전달</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">제3조 (서비스 이용 절차)</h2>
            <ol className="list-decimal list-inside space-y-1">
              <li>온라인 결제</li>
              <li>사전 진단 설문 작성</li>
              <li>컨설턴트 1:1 화상 미팅 (일정 별도 안내)</li>
              <li>진단 리포트 이메일 전달</li>
            </ol>
            <p>서비스 제공 기간은 결제일로부터 30일 이내입니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">제4조 (결제 및 환불)</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>본 서비스는 전자상거래법 제17조에 따른 디지털 콘텐츠로, 결제 완료 시점부터 서비스 제공이 시작되므로 청약철회(환불)가 불가합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">제5조 (면책)</h2>
            <p>회사는 천재지변, 전쟁, 정전, 시스템 장애 등 불가항력적인 사유로 인하여 서비스를 제공할 수 없는 경우 그 책임이 면제됩니다.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">제6조 (분쟁 해결)</h2>
            <p>본 약관에 관한 분쟁은 대한민국 법률을 적용하며, 관할 법원은 회사 소재지 관할 법원으로 합니다.</p>
          </section>

          <p className="text-xs text-gray-400 mt-8">시행일: 2026년 4월 16일</p>
        </div>
      </div>
    </div>
  );
}
