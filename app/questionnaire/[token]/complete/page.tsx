export default function QuestionnaireCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-green-500 text-3xl">&#10003;</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">설문이 접수되었습니다</h1>
        <p className="text-gray-500 mb-6">
          답변 내용을 바탕으로 사전 분석을 진행하겠습니다.<br />
          컨설턴트와의 1:1 미팅 일정은 별도로 안내드립니다.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 text-left text-sm text-gray-600 space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">1.</span>
            <span>설문 분석 기반 사전 리포트 생성</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">2.</span>
            <span>컨설턴트 1:1 화상 미팅 (Caret AI)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">3.</span>
            <span>최종 진단 리포트 이메일 전달</span>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6">
          문의: contact@jocodingax.ai
        </p>
      </div>
    </div>
  );
}
