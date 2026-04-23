import { FileText, AlertCircle } from 'lucide-react';
import PageHeader from '@/admin/components/PageHeader';

export default function ReportGeneratorPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <PageHeader
        title="리포트 생성기"
        description="설문 답변 + 미팅 요약으로 8페이지 사전 기업 진단 리포트를 생성합니다."
      />

      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-5">
          <FileText className="w-8 h-8 text-violet-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">곧 통합됩니다</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed mb-5">
          리포트 생성기는 별도 서비스로 운영 중입니다.
          <br />
          본 어드민에 통합되면 여기에서 바로 생성·편집·다운로드가 가능해집니다.
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-xs text-amber-700 font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          통합 소스코드 준비 중
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-left">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
            예정 기능
          </p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
              미팅노트 직접 입력 / Caret 앱 연동 / PDF·txt 업로드
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
              설문 CSV / 구글시트 / Apps Script URL 연동
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
              AI 기반 25+ 필드 자동 추출 + 수동 리뷰·편집
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
              8페이지 PDF 다운로드 (레이더·간트차트 포함)
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 shrink-0" />
              이전 리포트 목록 + 재편집
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
