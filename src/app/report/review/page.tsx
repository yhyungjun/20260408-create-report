'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useReport } from '@/context/ReportContext';
import { FIELD_GROUPS, type FieldDef } from '@/lib/report-schema';
import type { ReportFields } from '@/lib/report-schema';
import {
  getReviewGuidance,
  validateField,
  getDependentFields,
  type ExtractionMethod,
  type ValidationError,
} from '@/lib/field-extraction-config';

const METHOD_BADGE: Record<ExtractionMethod, { bg: string; text: string; label: string }> = {
  '직접추출': { bg: 'bg-green-100', text: 'text-green-700', label: '직접추출' },
  '컨텍스트판단': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '컨텍스트판단' },
  '추론생성': { bg: 'bg-blue-100', text: 'text-blue-700', label: '추론생성' },
  '복합계산': { bg: 'bg-purple-100', text: 'text-purple-700', label: '복합계산' },
};

function MethodBadge({ method }: { method: ExtractionMethod }) {
  const b = METHOD_BADGE[method];
  return <span className={`text-[10px] px-1.5 py-0.5 ${b.bg} ${b.text} rounded font-medium`}>{b.label}</span>;
}

function GuidanceTooltip({ fieldKey, show, onClose }: { fieldKey: string; show: boolean; onClose: () => void }) {
  const guidance = getReviewGuidance(fieldKey);
  if (!guidance || !show) return null;
  return (
    <div className="absolute z-50 top-6 left-0 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <button onClick={onClose} className="absolute top-1 right-2 text-gray-400 hover:text-gray-600">×</button>
      <div className="space-y-2">
        <div><span className="font-semibold text-gray-700">수집 의도:</span> <span className="text-gray-600">{guidance.collectionIntent}</span></div>
        <div><span className="font-semibold text-gray-700">리뷰 가이드:</span> <span className="text-gray-600">{guidance.reviewerHint}</span></div>
        {guidance.dependencies.length > 0 && (
          <div><span className="font-semibold text-gray-700">의존 필드:</span> <span className="text-gray-500">{guidance.dependencies.join(', ')}</span></div>
        )}
        <div className="border-t pt-1 mt-1">
          <div className="text-green-600">높은 신뢰: {guidance.confidenceSignals.high}</div>
          <div className="text-orange-600">낮은 신뢰: {guidance.confidenceSignals.low}</div>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { fields, setFields, metadata } = useReport();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [dependencyWarnings, setDependencyWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!fields) router.replace('/report');
  }, [fields, router]);

  const scrollToField = useCallback((fieldId: string) => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, textarea') as HTMLElement;
      if (input) setTimeout(() => input.focus(), 400);
    }
  }, []);

  const scrollToFirstEmpty = useCallback(() => {
    const el = document.querySelector('[data-empty="true"]') as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, textarea') as HTMLElement;
      if (input) setTimeout(() => input.focus(), 400);
    }
  }, []);

  const scrollToFirstLowConfidence = useCallback(() => {
    const el = document.querySelector('[data-low-confidence="true"]') as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = el.querySelector('input, textarea') as HTMLElement;
      if (input) setTimeout(() => input.focus(), 400);
    }
  }, []);

  if (!fields) return null;

  const isLowConfidence = (key: string) =>
    metadata?.lowConfidenceFields?.includes(key) ?? false;

  const getValue = (key: string): unknown => {
    return (fields as unknown as Record<string, unknown>)[key];
  };

  const updateField = (key: string, value: unknown) => {
    setFields({ ...fields, [key]: value } as ReportFields);
    // 유효성 검증
    const err = validateField(key, value);
    setValidationErrors((prev) => {
      const next = { ...prev };
      if (err) next[key] = err.message;
      else delete next[key];
      return next;
    });
    // 의존 필드 경고
    const deps = getDependentFields(key);
    if (deps.length > 0) {
      setDependencyWarnings(deps);
      setTimeout(() => setDependencyWarnings([]), 5000);
    }
  };

  const updateNestedField = (parentKey: string, childKey: string, value: unknown) => {
    const parent = (fields as unknown as Record<string, unknown>)[parentKey];
    if (parent && typeof parent === 'object') {
      updateField(parentKey, { ...(parent as Record<string, unknown>), [childKey]: value });
    } else {
      updateField(parentKey, { [childKey]: value });
    }
  };

  // 카드에 실제 표시되는 미입력/확인필요 수 계산
  const countBadges = () => {
    let emptyCount = 0;
    let lowConfCount = 0;
    for (const group of FIELD_GROUPS) {
      for (const field of group.fields) {
        const val = getValue(field.key);
        if (field.type === 'object' && field.subFields) {
          const parentVal = val as Record<string, unknown> | null;
          const lowConf = isLowConfidence(field.key);
          for (const sub of field.subFields) {
            const subVal = parentVal?.[sub.key] ?? '';
            if (subVal === '' || subVal == null) emptyCount++;
            if (lowConf) lowConfCount++;
          }
        } else if (field.type === 'array') {
          const arr = val as Array<unknown> | null;
          if (!arr || arr.length === 0) emptyCount++;
        } else {
          const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '');
          if (val == null || displayVal === '') emptyCount++;
          if (isLowConfidence(field.key)) lowConfCount++;
        }
      }
    }
    return { emptyCount, lowConfCount };
  };
  const badges = countBadges();

  const renderField = (field: FieldDef) => {
    const fieldId = `field-${field.key}`;

    if (field.type === 'object' && field.subFields) {
      const parentVal = getValue(field.key) as Record<string, unknown> | null;
      const lowConf = isLowConfidence(field.key);
      const objGuidance = getReviewGuidance(field.key);
      return (
        <div key={field.key} id={fieldId} className="mb-4" data-low-confidence={lowConf || undefined}>
          <div className="flex items-center gap-2 mb-2 relative">
            <label className="text-sm font-medium text-black">{field.label}</label>
            {objGuidance && <MethodBadge method={objGuidance.extractionMethod} />}
            {objGuidance && (
              <button onClick={() => setActiveTooltip(activeTooltip === field.key ? null : field.key)} className="text-xs text-gray-400 hover:text-gray-600" title="추출 가이드 보기">ⓘ</button>
            )}
            <GuidanceTooltip fieldKey={field.key} show={activeTooltip === field.key} onClose={() => setActiveTooltip(null)} />
          </div>
          <div className="pl-4 border-l-2 border-gray-200 space-y-3">
            {field.subFields.map((sub) => {
              const subVal = parentVal?.[sub.key] ?? '';
              const isEmpty = subVal === '' || subVal == null;
              const subId = `field-${field.key}-${sub.key}`;
              return (
                <div key={subId} id={subId} data-empty={isEmpty || undefined} data-low-confidence={lowConf || undefined}>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs text-black">{sub.label}</label>
                    {isEmpty && (
                      <button onClick={() => scrollToField(subId)} className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors cursor-pointer">미입력</button>
                    )}
                    {lowConf && (
                      <button onClick={() => scrollToField(subId)} className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors cursor-pointer">확인 필요</button>
                    )}
                  </div>
                  {sub.type === 'textarea' ? (
                    <textarea
                      value={String(subVal ?? '')}
                      onChange={(e) => updateNestedField(field.key, sub.key, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm text-black h-20 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  ) : (
                    <input
                      type={sub.type === 'number' ? 'number' : 'text'}
                      value={String(subVal ?? '')}
                      onChange={(e) => {
                        const v = sub.type === 'number' ? (e.target.value ? Number(e.target.value) : '') : e.target.value;
                        updateNestedField(field.key, sub.key, v);
                      }}
                      className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.type === 'array' && field.subFields) {
      const arr = (getValue(field.key) as Array<Record<string, unknown>>) ?? [];
      const isEmpty = arr.length === 0;
      return (
        <div key={field.key} id={fieldId} className="mb-4" data-empty={isEmpty || undefined}>
          <div className="flex items-center gap-2 mb-2 relative">
            <label className="text-sm font-medium text-black">{field.label}</label>
            {(() => { const g = getReviewGuidance(field.key); return g ? <MethodBadge method={g.extractionMethod} /> : null; })()}
            {isEmpty && (
              <button onClick={() => scrollToField(fieldId)} className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors cursor-pointer">미입력</button>
            )}
            {(() => { const g = getReviewGuidance(field.key); return g ? (
              <button onClick={() => setActiveTooltip(activeTooltip === field.key ? null : field.key)} className="text-xs text-gray-400 hover:text-gray-600" title="추출 가이드 보기">ⓘ</button>
            ) : null; })()}
            <GuidanceTooltip fieldKey={field.key} show={activeTooltip === field.key} onClose={() => setActiveTooltip(null)} />
          </div>
          {arr.map((item, idx) => (
            <div key={idx} className="pl-4 border-l-2 border-gray-200 mb-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">#{idx + 1}</span>
                <button
                  onClick={() => {
                    const newArr = arr.filter((_, i) => i !== idx);
                    updateField(field.key, newArr.length > 0 ? newArr : null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700"
                >삭제</button>
              </div>
              {field.subFields!.map((sub) => (
                <div key={sub.key}>
                  <label className="text-xs text-black">{sub.label}</label>
                  <input
                    type="text"
                    value={String(item[sub.key] ?? '')}
                    onChange={(e) => {
                      const newArr = [...arr];
                      newArr[idx] = { ...newArr[idx], [sub.key]: e.target.value };
                      updateField(field.key, newArr);
                    }}
                    className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            onClick={() => {
              const emptyItem: Record<string, string> = {};
              field.subFields!.forEach((s) => { emptyItem[s.key] = ''; });
              updateField(field.key, [...arr, emptyItem]);
            }}
            className="text-xs text-purple-600 hover:text-purple-800 font-semibold"
          >+ 항목 추가</button>
        </div>
      );
    }

    // Simple field
    const val = getValue(field.key);
    const displayVal = Array.isArray(val) ? val.join(', ') : String(val ?? '');
    const isEmpty = val == null || displayVal === '';
    const lowConf = isLowConfidence(field.key);
    const guidance = getReviewGuidance(field.key);
    const vError = validationErrors[field.key];
    const hasDepsWarning = dependencyWarnings.includes(field.key);

    return (
      <div key={field.key} id={fieldId} className={`mb-4 ${hasDepsWarning ? 'ring-2 ring-amber-300 rounded-lg p-2' : ''}`} data-empty={isEmpty || undefined} data-low-confidence={lowConf || undefined}>
        {hasDepsWarning && (
          <div className="text-xs text-amber-600 mb-1">의존 필드가 변경되어 재검토가 필요합니다</div>
        )}
        <div className="flex items-center gap-2 mb-1 relative">
          <label className="text-sm font-medium text-black">{field.label}</label>
          {guidance && <MethodBadge method={guidance.extractionMethod} />}
          {isEmpty && (
            <button onClick={() => scrollToField(fieldId)} className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors cursor-pointer">미입력</button>
          )}
          {lowConf && (
            <button onClick={() => scrollToField(fieldId)} className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors cursor-pointer">확인 필요</button>
          )}
          {guidance && (
            <button
              onClick={() => setActiveTooltip(activeTooltip === field.key ? null : field.key)}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="추출 가이드 보기"
            >ⓘ</button>
          )}
          <GuidanceTooltip fieldKey={field.key} show={activeTooltip === field.key} onClose={() => setActiveTooltip(null)} />
        </div>
        {vError && <div className="text-xs text-red-500 mb-1">{vError}</div>}
        {field.type === 'textarea' ? (
          <textarea
            value={displayVal}
            onChange={(e) => updateField(field.key, e.target.value || null)}
            className="w-full p-2 border border-gray-300 rounded text-sm text-black h-20 resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        ) : (
          <input
            type={field.type === 'number' ? 'number' : 'text'}
            value={displayVal}
            onChange={(e) => {
              const v = field.type === 'number'
                ? (e.target.value ? Number(e.target.value) : null)
                : (e.target.value || null);
              if (field.key === 'recommendedPath' && typeof v === 'string') {
                updateField(field.key, v.split(',').map(s => s.trim()));
              } else {
                updateField(field.key, v);
              }
            }}
            className="w-full p-2 border border-gray-300 rounded text-sm text-black focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50">
        <div className="h-1 bg-gray-800" />
        <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/report')}
            className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
          >← 뒤로</button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>1. 노트 입력</span>
            <span>→</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">2. 리뷰</span>
            <span>→</span>
            <span>3. 미리보기</span>
          </div>
          <button
            onClick={() => router.push('/report/preview')}
            className="py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
          >리포트 확정 →</button>
        </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-gray-900 mb-2">리뷰 & 수정</h1>
          <p className="text-gray-500 text-sm">AI가 추출한 값을 확인하고 수정하세요</p>
          {metadata && (
            <div className="mt-4 flex items-center justify-center gap-4 text-xs">
              <span className="px-2 py-1 bg-green-50 text-green-700 rounded">추출됨: {metadata.fieldsExtracted}</span>
              {badges.emptyCount > 0 && (
                <button
                  onClick={scrollToFirstEmpty}
                  className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded hover:bg-yellow-100 transition-colors cursor-pointer"
                >미입력: {badges.emptyCount}</button>
              )}
              {badges.lowConfCount > 0 && (
                <button
                  onClick={scrollToFirstLowConfidence}
                  className="px-2 py-1 bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors cursor-pointer"
                >확인 필요: {badges.lowConfCount}</button>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-6">
          {FIELD_GROUPS.map((group) => (
            <div
              key={group.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-3 border-b" style={{ borderLeftWidth: 4, borderLeftColor: group.color }}>
                <h2 className="font-semibold text-black">{group.name}</h2>
              </div>
              <div className="p-6">
                {group.fields.map((field) => renderField(field))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
