import { SURVEY_QUESTIONS, QUESTION_PAGES } from '@/lib/questionnaire/question-guide';

const typeLabel: Record<string, string> = {
  text: '주관식',
  single: '단일 선택',
  multi: '복수 선택',
  rank: '우선순위',
  number: '숫자',
};

export default function QuestionsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">질문 관리</h1>
      <p className="text-gray-500 mb-6">총 {SURVEY_QUESTIONS.length}개 질문</p>

      {QUESTION_PAGES.map((page) => {
        const partsSet = new Set(page.parts);
        const pageQuestions = SURVEY_QUESTIONS.filter((q) => partsSet.has(q.part));

        return (
          <div key={page.page} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              페이지 {page.page}: {page.label}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{page.desc}</p>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 w-16">ID</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 w-24">유형</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700">질문</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 w-32">선택지</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pageQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{q.id}</td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                          {typeLabel[q.answerType] || q.answerType}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-900">{q.questionText}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">
                        {q.options ? `${q.options.length}개` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
        질문 수정 기능은 향후 업데이트 예정입니다.
      </div>
    </div>
  );
}
