'use client';

import type { SurveyQuestion } from '@/lib/questionnaire/question-guide';

interface Props {
  question: SurveyQuestion;
  value: string;
  onChange: (questionId: string, value: string) => void;
}

export default function QuestionRenderer({ question, value, onChange }: Props) {
  const { id, questionText, answerType, options } = question;

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <label className="block text-sm font-medium text-gray-800 mb-2">
        <span className="text-gray-400 mr-1.5">{id}.</span>
        {questionText}
      </label>

      {answerType === 'text' && (
        questionText.length > 50 || id.startsWith('C') || id.startsWith('G') || id.startsWith('J1') ? (
          <textarea
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="답변을 입력해주세요"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="답변을 입력해주세요"
          />
        )
      )}

      {answerType === 'number' && (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(id, e.target.value)}
          className="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          placeholder="숫자 입력"
        />
      )}

      {answerType === 'single' && options && (
        <div className="space-y-1.5">
          {options.map((opt) => (
            <label
              key={opt}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                value === opt ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <input
                type="radio"
                name={id}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(id, opt)}
                className="mt-0.5 accent-blue-600"
              />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {answerType === 'multi' && options && (
        <div className="space-y-1.5">
          {options.map((opt) => {
            const selected = value ? value.split(';;') : [];
            const isChecked = selected.includes(opt);
            return (
              <label
                key={opt}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg cursor-pointer transition-colors ${
                  isChecked ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    const next = isChecked
                      ? selected.filter((s) => s !== opt)
                      : [...selected, opt];
                    onChange(id, next.join(';;'));
                  }}
                  className="mt-0.5 accent-blue-600"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {answerType === 'rank' && options && (
        <div className="space-y-1.5">
          <p className="text-xs text-gray-400 mb-2">우선순위를 숫자로 입력해주세요 (1이 가장 높음)</p>
          {options.map((opt) => {
            const rankings = value ? JSON.parse(value || '{}') as Record<string, number> : {};
            return (
              <div key={opt} className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={options.length}
                  value={rankings[opt] || ''}
                  onChange={(e) => {
                    const next = { ...rankings, [opt]: Number(e.target.value) || 0 };
                    if (!e.target.value) delete next[opt];
                    onChange(id, JSON.stringify(next));
                  }}
                  className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="#"
                />
                <span className="text-sm text-gray-700">{opt}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
