import Link from 'next/link';
import { ExternalLink, Calendar } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import StatusBadge, { type StatusVariant } from '@/admin/components/StatusBadge';
import DataTable, { type Column } from '@/admin/components/DataTable';

// 목업 — Phase 2에서 AppHub pipelines(FORM_COMPLETE ~ MEETING_COMPLETE) 필터로 교체
interface PreMeetingRow {
  pipelineId: string;
  company: string;
  contact: string;
  meetingDate: string;
  briefingStatus: 'NOT_STARTED' | 'GENERATING' | 'READY';
}

const MOCK_ROWS: PreMeetingRow[] = [
  {
    pipelineId: 'pl-001',
    company: '그린푸드',
    contact: '김대표',
    meetingDate: '2026-04-23',
    briefingStatus: 'READY',
  },
  {
    pipelineId: 'pl-002',
    company: '메디코어',
    contact: '박이사',
    meetingDate: '2026-04-25',
    briefingStatus: 'GENERATING',
  },
  {
    pipelineId: 'pl-003',
    company: '스마트홈즈',
    contact: '이팀장',
    meetingDate: '2026-04-28',
    briefingStatus: 'NOT_STARTED',
  },
];

const BRIEFING_MAP: Record<
  PreMeetingRow['briefingStatus'],
  { label: string; variant: StatusVariant }
> = {
  NOT_STARTED: { label: '미생성', variant: 'neutral' },
  GENERATING: { label: '생성중', variant: 'pending' },
  READY: { label: '완료', variant: 'success' },
};

export default function PreMeetingListPage() {
  const columns: Column<PreMeetingRow>[] = [
    {
      key: 'company',
      header: '기업',
      render: (r) => <span className="font-medium text-gray-900">{r.company}</span>,
    },
    {
      key: 'contact',
      header: '담당자',
      render: (r) => <span className="text-gray-700">{r.contact}</span>,
    },
    {
      key: 'meeting',
      header: '미팅 일정',
      render: (r) => (
        <span className="inline-flex items-center gap-1.5 text-gray-700">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {new Date(r.meetingDate).toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </span>
      ),
    },
    {
      key: 'briefing',
      header: '숙지안',
      render: (r) => {
        const info = BRIEFING_MAP[r.briefingStatus];
        return <StatusBadge variant={info.variant} label={info.label} />;
      },
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      width: '120px',
      render: (r) => (
        <Link
          href={`/admin/pre-meeting/${r.pipelineId}`}
          className="inline-flex items-center gap-1 text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          {r.briefingStatus === 'NOT_STARTED' ? '생성하기' : '열기'}
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="미팅 전 숙지안"
        description="설문 응답 + 기업 페르소나 + 레퍼런스를 바탕으로 미팅 필독안을 생성합니다."
      />

      <p className="mb-4 text-xs text-gray-400">
        설문 완료 후 미팅 완료 이전 단계의 고객을 표시합니다 · 목업 데이터
      </p>

      <DataTable
        columns={columns}
        rows={MOCK_ROWS}
        rowKey={(r) => r.pipelineId}
        emptyMessage="숙지안을 생성할 고객이 없습니다."
      />
    </div>
  );
}
