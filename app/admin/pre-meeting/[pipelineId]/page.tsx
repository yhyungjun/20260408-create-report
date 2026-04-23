import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Building2,
  ClipboardCheck,
  BookOpen,
  Target,
} from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';

export default async function PreMeetingDetailPage({
  params,
}: {
  params: Promise<{ pipelineId: string }>;
}) {
  const { pipelineId } = await params;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <Link
        href="/admin/pre-meeting"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        숙지안 목록
      </Link>

      <PageHeader
        title="미팅 전 숙지안"
        description={`파이프라인 ID: ${pipelineId}`}
        actions={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="다음 단계에서 활성화"
          >
            <Sparkles className="w-4 h-4" />
            AI 숙지안 생성
          </button>
        }
      />

      <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-violet-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            이 페이지는 UI 스켈레톤입니다. AI 숙지안 생성 로직은 다음 단계에서 추가됩니다.
          </span>
        </p>
      </div>

      <div className="space-y-6">
        {/* 기업 페르소나 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-violet-500" />
            <h2 className="text-base font-semibold text-gray-900">기업 페르소나</h2>
          </div>
          <p className="text-sm text-gray-400 italic mb-4">
            설문 답변 + 기업 정보로 자동 생성될 예정
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                업종
              </p>
              <p className="text-sm text-gray-400">—</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                규모
              </p>
              <p className="text-sm text-gray-400">—</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                AI 도입 단계
              </p>
              <p className="text-sm text-gray-400">—</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
                의사결정 권한
              </p>
              <p className="text-sm text-gray-400">—</p>
            </div>
          </div>
        </section>

        {/* 설문 주요 답변 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
            <h2 className="text-base font-semibold text-gray-900">설문 주요 답변 요약</h2>
          </div>
          <p className="text-sm text-gray-400 italic">
            핵심 질문 답변을 AI가 요약하여 표시할 예정
          </p>
        </section>

        {/* 레퍼런스 분석 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">업종 레퍼런스 분석</h2>
          </div>
          <p className="text-sm text-gray-400 italic">
            유사 업종/규모 기업의 AX 전환 사례와 비교 분석이 표시될 예정
          </p>
        </section>

        {/* 미팅 포인트 */}
        <section className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-red-500" />
            <h2 className="text-base font-semibold text-gray-900">미팅 시 질문 포인트</h2>
          </div>
          <p className="text-sm text-gray-400 italic">
            컨설턴트가 미팅에서 중점적으로 확인해야 할 항목이 AI로 생성될 예정
          </p>
        </section>
      </div>
    </div>
  );
}
