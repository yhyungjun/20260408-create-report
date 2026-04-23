import {
  Plus,
  Edit3,
  BarChart3,
  Share2,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { SURVEY_QUESTIONS, QUESTION_PAGES } from '@/lib/questionnaire/question-guide';
import PageHeader from '@/admin/components/PageHeader';
import StatusBadge from '@/admin/components/StatusBadge';

// 목업 — 현재는 기본 설문 1종. Phase 3(F4 CRUD)에서 AppHub로 외부화 예정.
const QUESTIONNAIRES = [
  {
    id: 'main-diagnosis',
    name: '사전 기업 진단 설문',
    description: 'AI 도입 준비도 진단용 표준 설문',
    questions: SURVEY_QUESTIONS.length,
    pages: QUESTION_PAGES.length,
    responses: 9,
    visible: true,
    updatedAt: '2026-04-19',
  },
];

export default function QuestionnairesPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <PageHeader
        title="설문지 설정"
        description="설문 질문·노출·공유·권한을 관리합니다."
        actions={
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="다음 단계에서 활성화"
          >
            <Plus className="w-4 h-4" />새 설문지
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {QUESTIONNAIRES.map((q) => (
          <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-gray-900">{q.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{q.description}</p>
              </div>
              <StatusBadge
                variant={q.visible ? 'success' : 'neutral'}
                label={q.visible ? '노출' : '비노출'}
              />
            </div>

            <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100 mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                  질문
                </p>
                <p className="text-lg font-bold text-gray-900">{q.questions}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                  페이지
                </p>
                <p className="text-lg font-bold text-gray-900">{q.pages}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-0.5">
                  응답
                </p>
                <p className="text-lg font-bold text-gray-900">{q.responses}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 text-xs">
              <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Edit3 className="w-3.5 h-3.5" />
                편집
              </button>
              <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <BarChart3 className="w-3.5 h-3.5" />
                통계
              </button>
              <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Share2 className="w-3.5 h-3.5" />
                공유
              </button>
              <button className="inline-flex items-center gap-1 px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                <Copy className="w-3.5 h-3.5" />
                복제
              </button>
              <button className="inline-flex items-center gap-1 ml-auto px-2.5 py-1.5 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                {q.visible ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    숨김
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    공개
                  </>
                )}
              </button>
            </div>

            <p className="text-[10px] text-gray-400 mt-3">
              최종 수정: {q.updatedAt}
            </p>
          </div>
        ))}
      </div>

      {/* 질문 미리보기 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">질문 미리보기</h2>
          <span className="text-xs text-gray-400">
            전체 {QUESTION_PAGES.length}페이지 · {SURVEY_QUESTIONS.length}개 질문
          </span>
        </div>

        <div className="space-y-4">
          {QUESTION_PAGES.map((page) => {
            const partsSet = new Set(page.parts);
            const pageQuestions = SURVEY_QUESTIONS.filter((q) => partsSet.has(q.part));
            return (
              <div
                key={page.page}
                className="bg-white border border-gray-200 rounded-xl p-6"
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-mono text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                    P{page.page}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900">{page.label}</h3>
                </div>
                <p className="text-xs text-gray-500 mb-4">{page.desc}</p>
                <ul className="space-y-2 text-sm">
                  {pageQuestions.slice(0, 3).map((q) => (
                    <li
                      key={q.id}
                      className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0"
                    >
                      <span className="font-mono text-xs text-gray-400 shrink-0 w-10">
                        {q.id}
                      </span>
                      <span className="text-gray-700">{q.questionText}</span>
                    </li>
                  ))}
                  {pageQuestions.length > 3 && (
                    <li className="text-xs text-gray-400 pl-14">
                      외 {pageQuestions.length - 3}개 질문…
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          편집·CRUD 기능은 다음 단계에서 추가됩니다
        </p>
      </section>
    </div>
  );
}
