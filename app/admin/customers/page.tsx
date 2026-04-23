import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { listPipelines } from '@/lib/apphub/apphub-pipelines';
import { listPayments } from '@/lib/apphub/apphub-payments';
import { listQuestionnaires } from '@/lib/apphub/apphub-questionnaires';
import PageHeader from '@/admin/components/PageHeader';
import DataTable, { type Column } from '@/admin/components/DataTable';
import StatusBadge, { type StatusVariant } from '@/admin/components/StatusBadge';

interface CustomerRow {
  pipelineId: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  paymentStatus: string;
  questionnaireStatus: string;
  submittedAt: string | null;
  createdAt: string;
}

const PAYMENT_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  CONFIRMED: { label: '결제완료', variant: 'success' },
  PENDING: { label: '대기', variant: 'pending' },
  FAILED: { label: '실패', variant: 'danger' },
};

const QUESTIONNAIRE_MAP: Record<string, { label: string; variant: StatusVariant }> = {
  SUBMITTED: { label: '제출완료', variant: 'success' },
  IN_PROGRESS: { label: '작성중', variant: 'pending' },
  NOT_STARTED: { label: '미시작', variant: 'neutral' },
};

function renderStatus(
  status: string,
  map: Record<string, { label: string; variant: StatusVariant }>,
) {
  const info = map[status] ?? { label: status, variant: 'neutral' as const };
  return <StatusBadge variant={info.variant} label={info.label} />;
}

export default async function CustomersPage() {
  const [pipelines, payments, questionnaires] = await Promise.all([
    listPipelines(),
    listPayments(),
    listQuestionnaires(),
  ]);

  const rows: CustomerRow[] = pipelines
    .map((p) => {
      const payment = payments.find((x) => x.id === p.payment_id);
      const questionnaire = questionnaires.find(
        (q) => q.pipeline_token === p.questionnaire_token,
      );
      return {
        pipelineId: p.id,
        companyName: p.company_name,
        contactName: p.contact_name ?? '-',
        contactEmail: p.contact_email,
        paymentStatus: payment?.status ?? 'UNKNOWN',
        questionnaireStatus: questionnaire?.status ?? 'NOT_STARTED',
        submittedAt: questionnaire?.submitted_at ?? null,
        createdAt: p.created_at,
      };
    })
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const columns: Column<CustomerRow>[] = [
    {
      key: 'company',
      header: '회사',
      render: (r) => <span className="font-medium text-gray-900">{r.companyName}</span>,
    },
    {
      key: 'contact',
      header: '담당자',
      render: (r) => <span className="text-gray-700">{r.contactName}</span>,
    },
    {
      key: 'email',
      header: '이메일',
      render: (r) => <span className="text-gray-600 text-xs">{r.contactEmail}</span>,
    },
    {
      key: 'payment',
      header: '결제',
      render: (r) => renderStatus(r.paymentStatus, PAYMENT_MAP),
    },
    {
      key: 'form',
      header: '설문',
      render: (r) => renderStatus(r.questionnaireStatus, QUESTIONNAIRE_MAP),
    },
    {
      key: 'submit',
      header: '제출일',
      render: (r) =>
        r.submittedAt ? (
          <span className="text-gray-500 text-xs">
            {new Date(r.submittedAt).toLocaleDateString('ko-KR')}
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '100px',
      render: (r) => (
        <Link
          href={`/admin/customers/${r.pipelineId}`}
          className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          상세 <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="고객 응답 관리"
        description={`총 ${rows.length}명의 고객 파이프라인을 관리합니다.`}
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.pipelineId}
        emptyMessage="아직 고객 데이터가 없습니다."
      />
    </div>
  );
}
