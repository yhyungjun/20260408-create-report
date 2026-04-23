import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPipeline } from '@/lib/apphub/apphub-pipelines';
import { listPayments } from '@/lib/apphub/apphub-payments';
import { getQuestionnaireByToken } from '@/lib/apphub/apphub-questionnaires';
import { SURVEY_QUESTIONS, QUESTION_PAGES } from '@/lib/questionnaire/question-guide';
import PageHeader from '@/admin/components/PageHeader';
import StatusBadge, { type StatusVariant } from '@/admin/components/StatusBadge';

const PIPELINE_STAGES = [
  'PAYMENT_COMPLETE',
  'FORM_SENT',
  'FORM_COMPLETE',
  'PRE_MEETING_REPORT_GENERATING',
  'PRE_MEETING_REPORT_READY',
  'MEETING_COMPLETE',
  'REPORT_GENERATING',
  'REPORT_REVIEW',
  'REPORT_DELIVERED',
] as const;

const STAGE_LABELS: Record<string, string> = {
  PAYMENT_COMPLETE: '결제완료',
  FORM_SENT: '설문발송',
  FORM_COMPLETE: '설문완료',
  PRE_MEETING_REPORT_GENERATING: '숙지안 생성중',
  PRE_MEETING_REPORT_READY: '숙지안 완료',
  MEETING_COMPLETE: '미팅완료',
  REPORT_GENERATING: '리포트 생성중',
  REPORT_REVIEW: '리포트 검토',
  REPORT_DELIVERED: '리포트 전달',
};

function paymentVariant(status?: string): StatusVariant {
  if (status === 'CONFIRMED') return 'success';
  if (status === 'FAILED') return 'danger';
  return 'pending';
}

function questionnaireVariant(status?: string): StatusVariant {
  if (status === 'SUBMITTED') return 'success';
  if (status === 'IN_PROGRESS') return 'pending';
  return 'neutral';
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const pipeline = await getPipeline(id);
  const payments = await listPayments();
  const payment = payments.find((p) => p.id === pipeline.payment_id);
  const questionnaire = await getQuestionnaireByToken(pipeline.questionnaire_token);

  const answers = (questionnaire?.answers ?? {}) as Record<string, string>;
  const currentStageIdx = PIPELINE_STAGES.indexOf(
    pipeline.status as (typeof PIPELINE_STAGES)[number],
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link
        href="/admin/customers"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        고객 목록
      </Link>

      <PageHeader
        title={pipeline.company_name}
        description={`${pipeline.contact_name ?? '담당자 미등록'} · ${pipeline.contact_email}`}
      />

      {/* 파이프라인 진행 상태 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">파이프라인 진행</h2>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const done = currentStageIdx >= 0 && idx < currentStageIdx;
            const active = idx === currentStageIdx;
            return (
              <div key={stage} className="flex items-center gap-1 shrink-0">
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                    active
                      ? 'bg-violet-600 text-white'
                      : done
                        ? 'bg-violet-50 text-violet-700'
                        : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  {STAGE_LABELS[stage] ?? stage}
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div
                    className={`w-3 h-px shrink-0 ${done ? 'bg-violet-300' : 'bg-gray-200'}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 기본 정보 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">기본 정보</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div>
            <dt className="text-xs text-gray-500 mb-1">결제 상태</dt>
            <dd>
              <StatusBadge
                variant={paymentVariant(payment?.status)}
                label={payment?.status ?? '-'}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 mb-1">설문 상태</dt>
            <dd>
              <StatusBadge
                variant={questionnaireVariant(questionnaire?.status)}
                label={questionnaire?.status ?? '미시작'}
              />
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 mb-1">결제일</dt>
            <dd className="text-gray-900">
              {payment?.confirmed_at
                ? new Date(payment.confirmed_at).toLocaleString('ko-KR')
                : '-'}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 mb-1">설문 제출일</dt>
            <dd className="text-gray-900">
              {questionnaire?.submitted_at
                ? new Date(questionnaire.submitted_at).toLocaleString('ko-KR')
                : '-'}
            </dd>
          </div>
        </dl>
      </section>

      {/* 설문 응답 */}
      {questionnaire ? (
        <div className="space-y-4">
          {QUESTION_PAGES.map((page) => {
            const partsSet = new Set(page.parts);
            const pageQuestions = SURVEY_QUESTIONS.filter((q) => partsSet.has(q.part));

            return (
              <section
                key={page.page}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <h2 className="text-sm font-semibold text-gray-900">
                  페이지 {page.page}: {page.label}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5 mb-4">{page.desc}</p>
                <div className="space-y-3">
                  {pageQuestions.map((q) => {
                    const answer = answers[q.id];
                    return (
                      <div
                        key={q.id}
                        className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                      >
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-mono text-gray-700 mr-1">{q.id}</span>
                          {q.questionText}
                        </p>
                        <p className="text-sm text-gray-900">
                          {answer ? (
                            answer
                          ) : (
                            <span className="text-gray-400 italic">미응답</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="bg-white border border-dashed border-gray-200 rounded-xl p-12 text-center">
          <p className="text-sm text-gray-400">아직 설문 응답이 없습니다.</p>
        </section>
      )}
    </div>
  );
}
