import Link from 'next/link';
import {
  CreditCard,
  ClipboardCheck,
  CalendarDays,
  FileCheck2,
  Users,
  AlertTriangle,
  Activity,
} from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import StatCard from '@/admin/components/StatCard';
import StatusBadge, { type StatusVariant } from '@/admin/components/StatusBadge';

// 목업 데이터 — Phase 2에서 AppHub 실호출로 교체
const STATS = {
  total: 12,
  paymentComplete: 12,
  formComplete: 9,
  meetingScheduled: 5,
  reportDelivered: 3,
};

const PIPELINE_STAGES = [
  { key: 'payment', label: '결제', count: 12 },
  { key: 'form', label: '설문', count: 9 },
  { key: 'meeting', label: '미팅', count: 5 },
  { key: 'report', label: '리포트', count: 3 },
];

const REMINDS: Array<{ company: string; issue: string; variant: StatusVariant; label: string }> = [
  { company: '그린푸드', issue: '설문 미제출 · 발송 후 4일 경과', variant: 'warning', label: '대기' },
  { company: '메디코어', issue: '미팅 일정 미확정 · 설문 완료 후 2일', variant: 'warning', label: '대기' },
  { company: '테크플로우', issue: '리포트 지연 · 미팅 후 6일 경과', variant: 'danger', label: '긴급' },
];

const RECENT = [
  { time: '방금 전', actor: '그린푸드', event: '설문 응답 제출' },
  { time: '1시간 전', actor: '스마트홈즈', event: '결제 완료' },
  { time: '3시간 전', actor: '메디코어', event: '리포트 생성 완료' },
  { time: '어제', actor: '테크플로우', event: '미팅 완료' },
  { time: '2일 전', actor: '에코텍', event: '결제 완료' },
];

export default function AdminDashboard() {
  const maxStage = Math.max(...PIPELINE_STAGES.map((s) => s.count));

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="대시보드"
        description="고객 파이프라인 현황을 한눈에 확인합니다."
      />

      {/* KPI 카드 5개 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          label="총 고객"
          value={STATS.total}
          sublabel="활성 파이프라인"
          icon={Users}
          accent="violet"
          trend={{ value: '+2', direction: 'up' }}
        />
        <StatCard
          label="결제 완료"
          value={STATS.paymentComplete}
          sublabel="이번 주"
          icon={CreditCard}
          accent="emerald"
          trend={{ value: '+2', direction: 'up' }}
        />
        <StatCard
          label="설문 완료"
          value={STATS.formComplete}
          sublabel={`응답률 ${Math.round((STATS.formComplete / STATS.total) * 100)}%`}
          icon={ClipboardCheck}
          accent="emerald"
          trend={{ value: '+1', direction: 'up' }}
        />
        <StatCard
          label="미팅 예정"
          value={STATS.meetingScheduled}
          sublabel="다음 주 3건"
          icon={CalendarDays}
          accent="amber"
          trend={{ value: '+1', direction: 'up' }}
        />
        <StatCard
          label="리포트 전달"
          value={STATS.reportDelivered}
          sublabel="이번 달"
          icon={FileCheck2}
          accent="violet"
          trend={{ value: '-1', direction: 'down' }}
        />
      </div>

      {/* 퍼널 시각화 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">파이프라인 흐름</h2>
          <span className="text-xs text-gray-400">목업 데이터 · 실데이터 연동 예정</span>
        </div>
        <div className="space-y-3">
          {PIPELINE_STAGES.map((stage, idx) => {
            const pct = (stage.count / maxStage) * 100;
            const next = PIPELINE_STAGES[idx + 1];
            const conv = next ? Math.round((next.count / stage.count) * 100) : null;
            return (
              <div key={stage.key}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-900">{stage.label}</span>
                  <span className="text-gray-500">
                    {stage.count}건
                    {conv !== null && (
                      <span className="text-gray-400 ml-2">→ 다음 단계 전환 {conv}%</span>
                    )}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 리마인드 필요 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">리마인드 필요</h2>
            <span className="ml-auto text-xs text-gray-400">{REMINDS.length}건</span>
          </div>
          <div className="divide-y divide-gray-100">
            {REMINDS.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{r.company}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.issue}</p>
                </div>
                <StatusBadge variant={r.variant} label={r.label} />
              </div>
            ))}
          </div>
          <Link
            href="/admin/customers"
            className="block mt-4 pt-4 border-t border-gray-100 text-xs font-medium text-violet-600 hover:text-violet-700 text-center"
          >
            전체 고객 보기 →
          </Link>
        </section>

        {/* 최근 활동 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-violet-500" />
            <h2 className="text-base font-semibold text-gray-900">최근 활동</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {RECENT.map((r, i) => (
              <div
                key={i}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{r.actor}</span>
                    <span className="text-gray-500"> · {r.event}</span>
                  </p>
                </div>
                <span className="text-xs text-gray-400 shrink-0">{r.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
