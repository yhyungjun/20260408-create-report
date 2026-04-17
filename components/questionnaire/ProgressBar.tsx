'use client';

import { QUESTION_PAGES } from '@/lib/questionnaire/question-guide';

interface Props {
  currentPage: number;
}

export default function ProgressBar({ currentPage }: Props) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {QUESTION_PAGES.map((qp) => (
        <div key={qp.page} className="flex-1">
          <div
            className={`h-2 rounded-full transition-colors ${
              qp.page <= currentPage ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
          <p
            className={`text-xs mt-1 ${
              qp.page === currentPage ? 'text-blue-600 font-semibold' : 'text-gray-400'
            }`}
          >
            {qp.label}
          </p>
        </div>
      ))}
    </div>
  );
}
