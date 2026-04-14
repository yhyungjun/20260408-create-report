'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useReport } from '@/context/ReportContext';
import {
  SURVEY_QUESTIONS, SURVEY_PARTS, ONLINE_MEETING_GUIDE,
  getMeetingFollowUps, analyzeSurveyGaps, getRelevantMeetingQuestions,
  renderQuestionText, getSurveyQuestion,
} from '@/lib/question-guide';
import { parseSurveyAnswers, remapFormIds } from '@/lib/survey-mapping';

function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let i = 0;
  while (i < text.length) {
    const row: string[] = [];
    while (i < text.length) {
      if (text[i] === '"') {
        i++;
        let val = '';
        while (i < text.length) {
          if (text[i] === '"') {
            if (i + 1 < text.length && text[i + 1] === '"') { val += '"'; i += 2; }
            else { i++; break; }
          } else { val += text[i]; i++; }
        }
        row.push(val);
      } else {
        let val = '';
        while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') { val += text[i]; i++; }
        row.push(val);
      }
      if (i < text.length && text[i] === ',') { i++; }
      else break;
    }
    if (i < text.length && text[i] === '\r') i++;
    if (i < text.length && text[i] === '\n') i++;
    if (row.length > 1 || row[0]?.trim()) rows.push(row);
  }
  return rows;
}

// ── Level 2: 기업 선택 후 미팅가이드/설문응답 선택 패널 ──
function CompanyOptionsPanel({ companyName, isCompleted, onSelect, onClose }: {
  companyName: string;
  isCompleted: boolean;
  onSelect: (view: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed left-[356px] top-0 h-full w-[240px] bg-white border-r border-gray-200 z-[60] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-purple-50">
        <div className="text-sm font-bold text-purple-900 truncate">{companyName}</div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
      </div>
      <div className="p-4 space-y-3">
        <button
          onClick={() => onSelect('guide')}
          className="w-full text-left p-4 rounded-lg border-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors group"
        >
          <div className="text-sm font-bold text-purple-700">미팅 가이드</div>
          <div className="text-xs text-gray-500 mt-1">갭 분석 기반 질문 가이드</div>
        </button>
        <button
          onClick={() => onSelect('survey')}
          className="w-full text-left p-4 rounded-lg border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors group"
        >
          <div className="text-sm font-bold text-blue-700">설문 응답</div>
          <div className="text-xs text-gray-500 mt-1">Part별 설문 응답 확인</div>
        </button>
        {isCompleted && (
          <button
            onClick={() => onSelect('report')}
            className="w-full text-left p-4 rounded-lg border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-colors group"
          >
            <div className="text-sm font-bold text-green-700">이전 리포트</div>
            <div className="text-xs text-gray-500 mt-1">리뷰에서 생성된 리포트 데이터 확인</div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Level 3: 설문 응답 상세 패널 (질문 전문 + 응답 전문 표시) ──
function SurveyDetailPanel({ answers, companyName, onClose, googleFormUrl, editUrl }: {
  answers: Record<string, string>; companyName: string; onClose: () => void; googleFormUrl?: string | null; editUrl?: string | null;
}) {
  const [expandedPart, setExpandedPart] = useState<string | null>('A');
  const gaps = analyzeSurveyGaps(answers);
  const gapMap = new Map(gaps.map(g => [g.id, g]));
  const displayParts = SURVEY_PARTS.filter(p => p.part !== 'S');

  return (
    <div className="fixed left-[596px] top-0 h-full w-[380px] bg-white border-r border-gray-200 z-[60] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-purple-50">
        <div className="text-xs font-semibold text-purple-900 truncate">{companyName} — 설문 응답</div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
      </div>
      {(editUrl || googleFormUrl) && (
        <a
          href={editUrl || googleFormUrl || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-4 py-2 border-b border-gray-200 text-xs text-purple-600 hover:text-purple-800 hover:bg-purple-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          {editUrl ? 'Google Form 개별 응답 보기' : 'Google Form 전체 응답 보기'}
        </a>
      )}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {displayParts.map(part => {
          const questions = SURVEY_QUESTIONS.filter(q => q.part === part.part);
          const answered = questions.filter(q => gapMap.get(q.id)?.status === 'answered').length;
          const isExpanded = expandedPart === part.part;
          return (
            <div key={part.part} className="rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedPart(isExpanded ? null : part.part)}
                className={`w-full px-3 py-2.5 text-xs font-semibold flex items-center justify-between rounded-lg transition-colors ${
                  isExpanded ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{part.part}: {part.label}</span>
                <span className="text-gray-400">{answered}/{questions.length}</span>
              </button>
              {isExpanded && (
                <div className="space-y-1.5 mt-1.5">
                  {questions.map(q => {
                    const answer = answers[q.id];
                    const gap = gapMap.get(q.id);
                    const followUps = getMeetingFollowUps(q.id);
                    const statusIcon = gap?.status === 'answered' ? '✅' : gap?.status === 'unclear' ? '⚠️' : '❌';
                    return (
                      <div key={q.id} className={`px-3 py-2.5 text-xs rounded-lg ${gap?.status !== 'answered' ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <div className="flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">{statusIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-gray-800">{q.id}.</span>
                              <span className="text-gray-700">{q.questionText}</span>
                              {followUps.map((f, fi) => (
                                <span key={fi} className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  f.type === '교차검증' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                }`}>{f.type}</span>
                              ))}
                            </div>
                            {answer ? (
                              <div className="mt-1.5 text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100">{answer}</div>
                            ) : (
                              <div className="mt-1 text-red-400 text-xs">미응답 — {q.reportSections.join(', ')}에 영향</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Level 3: 공통질문리스트 섹터 패널 ──
const QUESTION_SECTORS: Record<string, { label: string; parts: string[] }> = {
  'q-ab': { label: 'A~B 기본정보 & 성숙도', parts: ['A', 'B'] },
  'q-cg': { label: 'C~G Pain Point · 장벽 · 전략', parts: ['C', 'D', 'E', 'F', 'G'] },
  'q-hi': { label: 'H~I 기업현황 & 운영', parts: ['H', 'I'] },
  'q-j': { label: 'J 시장·보안·문화 심층', parts: ['J'] },
};

function QuestionPagePanel({ sectorKey, onClose }: { sectorKey: string; onClose: () => void }) {
  const sector = QUESTION_SECTORS[sectorKey];
  if (!sector) return null;

  const questions = SURVEY_QUESTIONS.filter(q => sector.parts.includes(q.part));

  return (
    <div className="fixed left-[356px] top-0 h-full w-[420px] bg-white border-r border-gray-200 z-[60] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div>
          <div className="text-sm font-bold text-gray-900">{sector.label}</div>
          <div className="text-[10px] text-gray-500">{questions.length}개 질문</div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questions.map(q => (
          <div key={q.id} className="bg-gray-50 rounded-lg p-3 border-l-3 border-l-purple-300">
            <div className="text-sm font-semibold text-gray-900 mb-1">{q.id}. {q.questionText}</div>
            <div className="text-xs text-gray-500 mb-0.5">📋 {q.purpose}</div>
            <div className="text-xs text-gray-400">📄 {q.reportSections.join(' · ')}</div>
            {q.options && (
              <div className="text-xs text-gray-400 mt-1 bg-white rounded px-2 py-1">
                선택지: {q.options.join(' / ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 리포트 페이지 → 리뷰 필드 그룹 매핑 (리뷰 페이지와 동일)
const REPORT_PAGE_TO_GROUP: Record<string, string> = {
  'P1': '표지 메타 정보', 'P2': '표지 메타 정보',
  'P3': '기업 기본정보', 'P4': 'AI 성숙도 진단', 'P4 지표1': 'AI 성숙도 진단',
  'P4 지표2': 'AI 성숙도 진단', 'P4 지표3': 'AI 성숙도 진단', 'P4 지표4': 'AI 성숙도 진단',
  'P4 지표5': 'AI 성숙도 진단',
  'P5': '업무 프로세스 분석', 'P6': '내부 역량 진단',
  'P7': 'SWOT & 환경 분석', 'P8': 'Gap 분석',
  'P9': 'AX 전환 범위', 'P10': 'AX 혁신 과제',
  'P11': '세부 추진 계획', 'P12': '세부 추진 계획',
  'P13': '세부 추진 계획', 'P14': 'SWOT 교차 전략',
  'P15': '우선 과제 & 로드맵',
};

function getReviewGroupNames(reportSections: string[]): string[] {
  const groups = new Set<string>();
  for (const sec of reportSections) {
    const g = REPORT_PAGE_TO_GROUP[sec];
    if (g) groups.add(g);
  }
  return Array.from(groups);
}

// ── Level 3: 미팅 가이드 패널 (리뷰 페이지와 동일 양식) ──
function MeetingGuidePanel({ answers, companyName, onClose }: {
  answers: Record<string, string>; companyName: string; onClose: () => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showReference, setShowReference] = useState(false);
  const gaps = analyzeSurveyGaps(answers);
  const gapIds = new Set(gaps.filter(g => g.status !== 'answered').map(g => g.id));
  const totalGaps = gaps.filter(g => g.status !== 'answered').length;
  const questions = getRelevantMeetingQuestions(gaps);
  const mustAsk = questions.filter(q => q.relatedSurveyIds.filter(id => !id.startsWith('S')).some(id => gapIds.has(id)));
  const reference = questions.filter(q => !q.relatedSurveyIds.filter(id => !id.startsWith('S')).some(id => gapIds.has(id)));

  const renderCard = (q: (typeof ONLINE_MEETING_GUIDE)[number]) => {
    const surveyIds = q.relatedSurveyIds.filter(id => !id.startsWith('S'));
    const hasGap = surveyIds.some(id => gapIds.has(id));
    const questionText = renderQuestionText(q, answers);
    const reviewGroups = getReviewGroupNames(q.reportSections);
    const isExpanded = expandedId === q.id;

    return (
      <div key={q.id} className={`border-l-2 ${hasGap ? 'border-l-yellow-400 bg-yellow-50/50' : 'border-l-gray-200'}`}>
        <button onClick={() => setExpandedId(isExpanded ? null : q.id)} className="w-full text-left p-2.5 hover:bg-gray-50/50 transition-colors">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 leading-relaxed">{questionText}</div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {surveyIds.map(id => (
                  <span key={id} className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                    gapIds.has(id) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>{id}</span>
                ))}
                {reviewGroups.map(g => (
                  <span key={g} className="text-[10px] text-purple-500">→{g}</span>
                ))}
              </div>
            </div>
            <span className="text-gray-300 text-[10px] shrink-0 mt-0.5">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </button>
        {isExpanded && (
          <div className="px-2.5 pb-2.5 space-y-1.5 overflow-hidden">
            {surveyIds.length > 0 && (
              <div className="bg-white rounded border border-gray-100 p-2 space-y-1.5">
                {surveyIds.map(id => {
                  const answer = answers[id];
                  const sq = getSurveyQuestion(id);
                  return (
                    <div key={id} className="text-[11px] overflow-hidden">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-mono font-semibold shrink-0 ${answer ? 'text-green-600' : 'text-red-500'}`}>{id}</span>
                        <span className="text-gray-400 truncate">{sq?.questionText}</span>
                        {!answer && <span className="text-red-400 shrink-0">미응답</span>}
                      </div>
                      {answer && (
                        <div className="text-gray-700 mt-0.5 pl-6 break-words line-clamp-3">{answer}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="text-[10px] text-gray-400">📋 {q.purpose}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed left-[596px] top-0 h-full w-[380px] bg-white border-r border-gray-200 z-[60] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-purple-50">
        <div className="text-xs font-semibold text-purple-900 truncate">{companyName} — 미팅 가이드</div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* 갭 요약 */}
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs">
          {totalGaps > 0 ? (
            <div>
              <span className="font-semibold text-yellow-700">⚠️ {totalGaps}개 미응답/불명확</span>
              <span className="text-gray-500 ml-1">— 필수 질문 {mustAsk.length}개</span>
            </div>
          ) : (
            <span className="text-green-600 font-semibold">✅ 전체 응답 완료 — 정성 검증 포커스</span>
          )}
        </div>

        {/* 필수 질문 */}
        {mustAsk.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-yellow-700 uppercase tracking-wider px-1 mb-1">필수 — 미응답 항목 확인 ({mustAsk.length}개)</div>
            <div className="border border-yellow-200 rounded-lg overflow-hidden divide-y divide-yellow-100">
              {mustAsk.map(renderCard)}
            </div>
          </div>
        )}

        {/* 참고 질문 */}
        <div>
          <button
            onClick={() => setShowReference(!showReference)}
            className="w-full text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1 hover:text-gray-600 transition-colors flex items-center gap-1"
          >
            <span>{showReference ? '▼' : '▶'}</span>
            참고 — 정성 검증용 ({reference.length}개)
          </button>
          {showReference && (
            <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
              {reference.map(renderCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GlobalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    savedReports,
    setSavedReports,
    loadReports,
    globalSurveyInfo,
    setGlobalSurveyInfo,
    globalSidebarOpen,
    setGlobalSidebarOpen,
    setFields,
    setMetadata,
    setReportId,
    setMeetingNotes,
    setReportTitle,
  } = useReport();

  const [expandedSection, setExpandedSection] = useState<'reports' | 'companies' | 'questions' | null>(null);
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string> | null>(null);
  const [level3View, setLevel3View] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [googleFormUrl, setGoogleFormUrl] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
    const handleFocus = () => loadReports();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [loadReports]);

  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await fetch('/api/report/fetch-sheet');
        if (!res.ok) return;
        const { csvText, googleFormUrl: formUrl } = await res.json();
        if (formUrl) setGoogleFormUrl(formUrl);
        if (!csvText) return;
        const parsed = parseCSV(csvText);
        if (parsed.length < 2) return;
        const headers = parsed[0];
        const rows = parsed.slice(1);
        const a1Idx = headers.findIndex(h => h.includes('[A1]'));
        const nameIdx = a1Idx >= 0 ? a1Idx : 0;
        const editUrlIdx = headers.findIndex(h => h.includes('[_EDIT_URL]'));
        const companyNames = rows.map(r => r[nameIdx]?.trim() || '');
        const editUrls = rows.map(r => editUrlIdx >= 0 ? (r[editUrlIdx]?.trim() || null) : null);
        setGlobalSurveyInfo({ headers, rows, companyNames, editUrls });
      } catch {}
    };
    fetchSurvey();
  }, [setGlobalSurveyInfo]);

  const handleLoadReport = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/report/db?id=${id}`);
      if (!res.ok) return;
      const { report } = await res.json();
      setReportId(report.id);
      if (report.title) setReportTitle(report.title);
      if (report.meeting_notes) setMeetingNotes(report.meeting_notes);
      if (report.fields) {
        setFields(report.fields);
        if (report.metadata) setMetadata(report.metadata);
        router.push('/report/review');
      }
      setGlobalSidebarOpen(false);
    } catch {}
  }, [setReportId, setReportTitle, setMeetingNotes, setFields, setMetadata, router, setGlobalSidebarOpen]);

  const handleDeleteReport = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/report/db?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedReports(savedReports.filter(r => r.id !== id));
      }
    } catch {}
  }, [savedReports, setSavedReports]);

  const handleRenameReport = useCallback(async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      const res = await fetch(`/api/report/db?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (res.ok) {
        setSavedReports(savedReports.map(r => r.id === id ? { ...r, title: newTitle.trim() } : r));
      }
    } catch {}
    setEditingId(null);
  }, [savedReports, setSavedReports]);

  const handleSelectCompany = (idx: number) => {
    if (!globalSurveyInfo) return;
    if (selectedCompanyIdx === idx) {
      setSelectedCompanyIdx(null);
      setSelectedAnswers(null);
      setLevel3View(null);
      return;
    }
    setSelectedCompanyIdx(idx);
    setLevel3View(null);
    const row = globalSurveyInfo.rows[idx];
    const raw = parseSurveyAnswers(globalSurveyInfo.headers, row);
    const answers = remapFormIds(raw);
    setSelectedAnswers(answers);
  };

  if (pathname.startsWith('/report/preview')) {
    return null;
  }

  const savedCompanyNames = new Set(savedReports.map(r => r.company_name).filter(Boolean));
  const pendingCompanies: { name: string; idx: number }[] = [];
  const completedCompanies: { name: string; idx: number }[] = [];

  if (globalSurveyInfo) {
    globalSurveyInfo.companyNames.forEach((name, idx) => {
      if (!name.trim()) return;
      if (savedCompanyNames.has(name)) {
        completedCompanies.push({ name, idx });
      } else {
        pendingCompanies.push({ name, idx });
      }
    });
  }

  const selectedCompanyName = selectedCompanyIdx !== null && globalSurveyInfo
    ? globalSurveyInfo.companyNames[selectedCompanyIdx] || ''
    : '';

  const iconBarItems = [
    { key: 'reports' as const, label: '이전 리포트', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
    )},
    { key: 'companies' as const, label: '사전 설문 응답', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
    )},
    { key: 'questions' as const, label: '공통질문리스트', icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>
    )},
  ];

  const handleIconClick = (key: 'reports' | 'companies' | 'questions') => {
    // 이미 열린 같은 섹션 클릭 시 닫지 않음
    if (globalSidebarOpen && expandedSection === key) return;
    setGlobalSidebarOpen(true);
    setExpandedSection(key);
    if (key !== 'companies') {
      setSelectedCompanyIdx(null);
      setSelectedAnswers(null);
      setLevel3View(null);
    }
  };

  return (
    <>
      {/* Overlay — 패널 열렸을 때만 */}
      {globalSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-[55]"
          onClick={() => { setGlobalSidebarOpen(false); setExpandedSection(null); setSelectedCompanyIdx(null); setSelectedAnswers(null); setLevel3View(null); }}
        />
      )}

      {/* 아이콘 바 — 항상 표시 */}
      <div className="fixed left-0 top-0 h-full w-[56px] bg-gray-900 z-[60] flex flex-col items-center pt-3 pb-4 gap-1">
        {/* 로고 */}
        <img src="/logo.png" alt="AX" className="w-8 h-8 rounded" />

        {/* 패널 열기/닫기 토글 */}
        <button
          onClick={() => {
            if (globalSidebarOpen) {
              setGlobalSidebarOpen(false);
              setSelectedCompanyIdx(null);
              setSelectedAnswers(null);
              setLevel3View(null);
            } else {
              setGlobalSidebarOpen(true);
              if (!expandedSection) setExpandedSection('reports');
            }
          }}
          className={`w-10 h-8 rounded-lg flex items-center justify-center transition-colors mb-1 ${
            globalSidebarOpen ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white hover:bg-gray-700'
          }`}
          title={globalSidebarOpen ? '패널 닫기' : '패널 열기'}
        >
          {globalSidebarOpen ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 19l-7-7 7-7"/><path d="M18 19l-7-7 7-7"/></svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 5l7 7-7 7"/><path d="M6 5l7 7-7 7"/></svg>
          )}
        </button>

        {/* 구분선 */}
        <div className="w-8 h-px bg-gray-700 mb-1" />

        {/* 메뉴 아이콘 — hover 시 해당 섹션 패널 열림 */}
        {iconBarItems.map(item => (
          <button
            key={item.key}
            onClick={() => handleIconClick(item.key)}
            onMouseEnter={() => {
              setGlobalSidebarOpen(true);
              setExpandedSection(item.key);
              if (item.key !== 'companies') {
                setSelectedCompanyIdx(null);
                setSelectedAnswers(null);
                setLevel3View(null);
              }
            }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative group ${
              globalSidebarOpen && expandedSection === item.key
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={item.label}
          >
            {item.icon}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[11px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[70]">
              {item.label}
            </div>
          </button>
        ))}
      </div>

      {/* 확장 패널 — 아이콘 클릭 시 열림 */}
      {globalSidebarOpen && (
        <div className="fixed left-[56px] top-0 h-full w-[300px] bg-white border-r border-gray-200 z-[60] flex flex-col shadow-lg">
          {/* 패널 헤더 */}
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="text-sm font-bold text-gray-900">
              {expandedSection === 'reports' && '이전 리포트'}
              {expandedSection === 'companies' && '사전 설문 응답'}
              {expandedSection === 'questions' && '공통질문리스트'}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {expandedSection === 'reports' && `${savedReports.length}개 리포트`}
              {expandedSection === 'companies' && (globalSurveyInfo ? `${globalSurveyInfo.companyNames.filter(n => n.trim()).length}개 기업` : '로딩 중...')}
              {expandedSection === 'questions' && 'A1~J17 질문 레퍼런스'}
            </div>
          </div>

          {/* 패널 내용 */}
          <div className="flex-1 overflow-y-auto">
            {/* 이전 리포트 */}
            {expandedSection === 'reports' && (
              savedReports.length === 0 ? (
                <div className="p-4 text-xs text-gray-400 text-center">저장된 리포트가 없습니다</div>
              ) : (
                savedReports.map((r) => (
                  <div key={r.id} className="border-b border-gray-100 hover:bg-gray-50 group">
                    {editingId === r.id ? (
                      <div className="p-2.5">
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRenameReport(r.id, editTitle); if (e.key === 'Escape') setEditingId(null); }}
                          autoFocus className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900" />
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => handleRenameReport(r.id, editTitle)} className="text-[10px] px-2 py-0.5 bg-purple-600 text-white rounded">저장</button>
                          <button onClick={() => setEditingId(null)} className="text-[10px] px-2 py-0.5 bg-gray-200 text-gray-700 rounded">취소</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <button onClick={() => handleLoadReport(r.id)} className="flex-1 text-left p-3 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{r.title}</div>
                          <div className="text-xs text-gray-500 mt-1 flex gap-2">
                            {r.fields?.industry && <span>{r.fields.industry}</span>}
                            <span>{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </button>
                        <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => { setEditingId(r.id); setEditTitle(r.title); }} className="p-1 text-gray-400 hover:text-purple-600 rounded" title="이름 변경">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button onClick={() => { if (confirm(`"${r.title}" 리포트를 삭제하시겠습니까?`)) handleDeleteReport(r.id); }} className="p-1 text-gray-400 hover:text-red-600 rounded" title="삭제">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )
            )}

            {/* 사전 설문 응답 */}
            {expandedSection === 'companies' && (
              !globalSurveyInfo ? (
                <div className="p-4 text-xs text-gray-400 text-center">설문 데이터 로딩 중...</div>
              ) : (
                <>
                  {pendingCompanies.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-yellow-700 uppercase tracking-wider bg-yellow-50">예정 ({pendingCompanies.length})</div>
                      {pendingCompanies.map(({ name, idx }) => (
                        <button key={idx} onClick={() => handleSelectCompany(idx)} className={`w-full text-left p-2.5 border-b border-gray-100 transition-colors ${selectedCompanyIdx === idx ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">{name}</span>
                            {selectedCompanyIdx === idx && <span className="text-[10px] text-purple-600">보는 중</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {completedCompanies.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-[10px] font-semibold text-green-700 uppercase tracking-wider bg-green-50">진행 ({completedCompanies.length})</div>
                      {completedCompanies.map(({ name, idx }) => (
                        <button key={idx} onClick={() => handleSelectCompany(idx)} className={`w-full text-left p-2.5 border-b border-gray-100 transition-colors ${selectedCompanyIdx === idx ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">{name}</span>
                            <div className="flex items-center gap-1.5">
                              {selectedCompanyIdx === idx && <span className="text-[10px] text-purple-600">보는 중</span>}
                              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">완료</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )
            )}

            {/* 공통질문리스트 */}
            {expandedSection === 'questions' && (
              <div className="p-3 space-y-2">
                {[
                  { key: 'q-ab', label: 'A~B 기본정보 & 성숙도', parts: ['A', 'B'] },
                  { key: 'q-cg', label: 'C~G Pain Point · 장벽 · 전략', parts: ['C', 'D', 'E', 'F', 'G'] },
                  { key: 'q-hi', label: 'H~I 기업현황 & 운영', parts: ['H', 'I'] },
                  { key: 'q-j', label: 'J 시장·보안·문화 심층', parts: ['J'] },
                ].map(sector => {
                  const count = SURVEY_QUESTIONS.filter(q => sector.parts.includes(q.part)).length;
                  const isActive = level3View === sector.key;
                  return (
                    <button
                      key={sector.key}
                      onClick={() => setLevel3View(isActive ? null : sector.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                        isActive ? 'bg-purple-100 border-2 border-purple-400 text-purple-700' : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-sm font-semibold">{sector.label}</span>
                      <span className="text-xs text-gray-400">{count}개</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Level 2: 기업 선택 후 미팅가이드/설문응답 선택 */}
      {selectedCompanyIdx !== null && selectedAnswers && (
        <CompanyOptionsPanel
          companyName={selectedCompanyName}
          isCompleted={savedCompanyNames.has(selectedCompanyName)}
          onSelect={(view) => {
            if (view === 'report') {
              const matched = savedReports.find(r => r.company_name === selectedCompanyName);
              if (matched) handleLoadReport(matched.id);
            } else {
              setLevel3View(view);
            }
          }}
          onClose={() => { setSelectedCompanyIdx(null); setSelectedAnswers(null); setLevel3View(null); }}
        />
      )}

      {/* Level 3: 상세 패널 — 기업 설문/미팅가이드 */}
      {selectedCompanyIdx !== null && selectedAnswers && level3View === 'survey' && (
        <SurveyDetailPanel
          answers={selectedAnswers}
          companyName={selectedCompanyName}
          onClose={() => setLevel3View(null)}
          googleFormUrl={googleFormUrl}
          editUrl={selectedCompanyIdx !== null && globalSurveyInfo ? globalSurveyInfo.editUrls[selectedCompanyIdx] : null}
        />
      )}
      {selectedCompanyIdx !== null && selectedAnswers && level3View === 'guide' && (
        <MeetingGuidePanel
          answers={selectedAnswers}
          companyName={selectedCompanyName}
          onClose={() => setLevel3View(null)}
        />
      )}

      {/* Level 3: 공통질문리스트 상세 패널 */}
      {expandedSection === 'questions' && level3View?.startsWith('q-') && (
        <QuestionPagePanel
          sectorKey={level3View}
          onClose={() => setLevel3View(null)}
        />
      )}
    </>
  );
}
