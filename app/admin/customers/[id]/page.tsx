import Link from 'next/link';
import { getPipeline } from '@/lib/apphub/apphub-pipelines';
import { listPayments } from '@/lib/apphub/apphub-payments';
import { getQuestionnaireByToken } from '@/lib/apphub/apphub-questionnaires';
import { SURVEY_QUESTIONS, QUESTION_PAGES } from '@/lib/questionnaire/question-guide';

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const pipeline = await getPipeline(id);
  const payments = await listPayments();
  const payment = payments.find((p) => p.id === pipeline.payment_id);
  const questionnaire = await getQuestionnaireByToken(pipeline.questionnaire_token);

  const answers = questionnaire?.answers || {};

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/admin/customers" className="text-sm text-blue-600 hover:underline mb-4 inline-block">
        &larr; 고객 목록
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{pipeline.company_name}</h1>

      {/* 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">담당자</span>
            <p className="text-gray-900 font-medium">{pipeline.contact_name || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">이메일</span>
            <p className="text-gray-900 font-medium">{pipeline.contact_email}</p>
          </div>
          <div>
            <span className="text-gray-500">결제 상태</span>
            <p className="text-gray-900 font-medium">{payment?.status || '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">설문 상태</span>
            <p className="text-gray-900 font-medium">{questionnaire?.status || '미시작'}</p>
          </div>
          <div>
            <span className="text-gray-500">결제일</span>
            <p className="text-gray-900 font-medium">
              {payment?.confirmed_at ? new Date(payment.confirmed_at).toLocaleString('ko-KR') : '-'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">설문 제출일</span>
            <p className="text-gray-900 font-medium">
              {questionnaire?.submitted_at ? new Date(questionnaire.submitted_at).toLocaleString('ko-KR') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* 설문 응답 */}
      {questionnaire ? (
        <div className="space-y-6">
          {QUESTION_PAGES.map((page) => {
            const partsSet = new Set(page.parts);
            const pageQuestions = SURVEY_QUESTIONS.filter((q) => partsSet.has(q.part));

            return (
              <div key={page.page} className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-1">
                  페이지 {page.page}: {page.label}
                </h2>
                <p className="text-sm text-gray-500 mb-4">{page.desc}</p>

                <div className="space-y-4">
                  {pageQuestions.map((q) => (
                    <div key={q.id} className="border-b border-gray-100 pb-3 last:border-0">
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-medium text-gray-700">{q.id}</span> — {q.questionText}
                      </p>
                      <p className="text-sm text-gray-900">
                        {answers[q.id] || <span className="text-gray-400 italic">미응답</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400">아직 설문 응답이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
