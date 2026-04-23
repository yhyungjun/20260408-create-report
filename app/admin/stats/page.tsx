import {
  ArrowRight,
  Users,
  ClipboardCheck,
  CalendarDays,
  FileCheck2,
} from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';
import StatCard from '@/admin/components/StatCard';

// 목업 — Phase 2에서 AppHub 실데이터 집계로 교체
const FUNNEL_STAGES = [
  { label: '결제 완료', value: 100, count: 12, color: 'bg-violet-500' },
  { label: '설문 완료', value: 75, count: 9, color: 'bg-violet-400' },
  { label: '미팅 완료', value: 42, count: 5, color: 'bg-violet-300' },
  { label: '리포트 전달', value: 25, count: 3, color: 'bg-violet-200' },
];

const AVERAGE_DURATION = [
  { from: '결제', to: '설문 제출', days: '2.3일' },
  { from: '설문 제출', to: '미팅 완료', days: '5.1일' },
  { from: '미팅 완료', to: '리포트 전달', days: '3.8일' },
];

const DROPOFF = [
  { stage: '설문 미제출', count: 3, pct: 25, variant: 'warning' as const },
  { stage: '미팅 일정 미확정', count: 4, pct: 33, variant: 'warning' as const },
  { stage: '리포트 검토 대기', count: 2, pct: 17, variant: 'amber' as const },
  { stage: '리포트 전달 완료', count: 3, pct: 25, variant: 'success' as const },
];

const DROPOFF_COLOR: Record<string, string> = {
  warning: 'text-orange-600',
  amber: 'text-amber-600',
  success: 'text-emerald-600',
};

const AI_METRICS = [
  { label: '추출 필드 완전성', value: '88%', detail: '25개 중 평균 22개 추출 성공' },
  { label: '저확신도 필드', value: '2.4개', detail: '평균 — 리뷰 단계에서 수동 보정' },
  { label: '캐시 적중률', value: '34%', detail: '재생성 시 Claude 호출 스킵' },
  { label: '평균 처리 시간', value: '47초', detail: '노트 입력 ~ 필드 추출 완료' },
];

export default function StatsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="유저 통계"
        description="전환율·이탈·AI 에이전트 처리 지표를 모니터링합니다."
      />

      {/* 상단 KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="총 고객" value={12} icon={Users} accent="violet" />
        <StatCard
          label="설문 응답률"
          value="75%"
          icon={ClipboardCheck}
          accent="emerald"
          sublabel="9 / 12"
        />
        <StatCard
          label="미팅 전환율"
          value="42%"
          icon={CalendarDays}
          accent="amber"
          sublabel="5 / 12"
        />
        <StatCard
          label="리포트 완료율"
          value="25%"
          icon={FileCheck2}
          accent="violet"
          sublabel="3 / 12"
        />
      </div>

      {/* 퍼널 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">단계별 전환 퍼널</h2>
          <span className="text-xs text-gray-400">목업 데이터</span>
        </div>
        <div className="space-y-3">
          {FUNNEL_STAGES.map((stage, idx) => {
            const prev = FUNNEL_STAGES[idx - 1];
            const convFromPrev = prev ? Math.round((stage.count / prev.count) * 100) : null;
            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-900">{stage.label}</span>
                  <span className="text-gray-500">
                    {stage.count}명 ({stage.value}%)
                    {convFromPrev !== null && (
                      <span className="text-gray-400 ml-2">
                        이전 대비 {convFromPrev}%
                      </span>
                    )}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stage.color} rounded-full transition-all`}
                    style={{ width: `${stage.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 단계 간 소요 시간 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            단계 간 평균 소요 시간
          </h2>
          <div className="space-y-3">
            {AVERAGE_DURATION.map((d, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md shrink-0">
                  {d.from}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md shrink-0">
                  {d.to}
                </span>
                <span className="ml-auto text-sm font-semibold text-violet-600">
                  {d.days}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 이탈 지점 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">이탈 지점 분석</h2>
          <div className="space-y-1">
            {DROPOFF.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
              >
                <span className="text-gray-700">{d.stage}</span>
                <span className={`font-semibold ${DROPOFF_COLOR[d.variant]}`}>
                  {d.count}명 ({d.pct}%)
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* AI 에이전트 부통계 */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">AI 에이전트 처리 지표</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            리포트 생성기에 제공된 데이터의 품질과 처리 효율을 모니터링합니다
          </p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_METRICS.map((m) => (
            <div key={m.label} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                {m.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">{m.value}</p>
              <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                {m.detail}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
