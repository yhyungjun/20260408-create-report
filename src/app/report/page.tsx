'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useReport } from '@/context/ReportContext';
import { parseSurveyAnswers, remapFormIds, prefillFieldsFromSurvey, computeDerivedMetrics, formatSurveyForLLM } from '@/lib/survey-mapping';
import { isSupportedUrl } from '@/lib/google-sheets';

// ── CSV 파싱 (Google Sheets 호환: BOM, 따옴표 중첩, \r\n/\r/\n 모두 처리) ──
function parseCSV(text: string): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows: string[][] = [];
  let i = 0;
  while (i < text.length) {
    const row: string[] = [];
    while (i < text.length) {
      let field = '';
      if (text[i] === '"') {
        i++;
        while (i < text.length) {
          if (text[i] === '"') {
            if (text[i + 1] === '"') { field += '"'; i += 2; }
            else { i++; break; }
          } else { field += text[i]; i++; }
        }
        while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') i++;
      } else {
        while (i < text.length && text[i] !== ',' && text[i] !== '\n' && text[i] !== '\r') { field += text[i]; i++; }
      }
      row.push(field.trim());
      if (i < text.length && text[i] === ',') { i++; continue; }
      break;
    }
    if (i < text.length && text[i] === '\r') i++;
    if (i < text.length && text[i] === '\n') i++;
    if (row.length > 1 || row.some((c) => c !== '')) rows.push(row);
  }
  return rows;
}

// ── 파일 확장자 체크 ──
const PDF_EXT = '.pdf';
const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.html', '.json', '.tsv'];
const ALL_NOTE_ACCEPT = [...TEXT_EXTENSIONS, PDF_EXT].join(',');

function getExt(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

interface NoteFile {
  name: string;
  text: string;
}

interface SurveyInfo {
  headers: string[];
  rows: string[][];
  companyNames: string[];
}

export default function ReportInputPage() {
  const router = useRouter();
  const { meetingNotes, setMeetingNotes, setFields, setMetadata } = useReport();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 노트 파일 상태
  const [noteFiles, setNoteFiles] = useState<NoteFile[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const noteInputRef = useRef<HTMLInputElement>(null);

  // noteFiles가 변경되면 meetingNotes(Context)에 반영
  useEffect(() => {
    if (noteFiles.length === 0) return;
    const combined = noteFiles.map((f) => `[${f.name}]\n${f.text}`).join('\n\n---\n\n');
    setMeetingNotes(combined);
  }, [noteFiles, setMeetingNotes]);

  // 설문 상태
  const [surveyFileName, setSurveyFileName] = useState('');
  const [surveyInfo, setSurveyInfo] = useState<SurveyInfo | null>(null);
  const [selectedCompanyIdx, setSelectedCompanyIdx] = useState(0);

  // Google Sheets 상태
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsFetching, setSheetsFetching] = useState(false);

  // ── 페이지 로드 시 기본 스프레드시트 자동 로드 ──
  useEffect(() => {
    if (surveyInfo) return; // 이미 로드됨
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/report/fetch-sheet');
        if (!res.ok) return;
        const { csvText } = await res.json();
        if (!csvText || cancelled) return;
        processCsvText(csvText, '사전 설문 응답');
      } catch { /* 기본 시트 없으면 무시 */ }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 노트 파일 업로드 (다중 + PDF 지원) ──
  const handleNoteFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setFileLoading(true);
    setError('');

    try {
      const fileList = Array.from(files);
      const hasPdf = fileList.some((f) => getExt(f.name) === PDF_EXT);

      let parsed: NoteFile[];

      if (hasPdf) {
        // PDF가 포함되면 서버로 전송해서 파싱
        const formData = new FormData();
        fileList.forEach((f) => formData.append('files', f));

        const res = await fetch('/api/report/parse-files', { method: 'POST', body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || '파일 파싱 실패');
        }
        const { files: results } = await res.json();
        parsed = results as NoteFile[];
      } else {
        // 텍스트 파일만: 클라이언트에서 직접 읽기
        parsed = await Promise.all(
          fileList.map(async (f) => ({ name: f.name, text: await f.text() }))
        );
      }

      // 기존 파일 + 새 파일 합치기 (중복 파일명 제거)
      const existingNames = new Set(noteFiles.map((f) => f.name));
      const newFiles = parsed.filter((f) => !existingNames.has(f.name));
      setNoteFiles([...noteFiles, ...newFiles]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일 읽기 오류');
    } finally {
      setFileLoading(false);
      // input 초기화 (같은 파일 재선택 가능하도록)
      if (noteInputRef.current) noteInputRef.current.value = '';
    }
  }, [noteFiles]);

  const handleRemoveNoteFile = (idx: number) => {
    const next = noteFiles.filter((_, i) => i !== idx);
    setNoteFiles(next);
    if (next.length === 0) setMeetingNotes('');
  };

  // ── CSV 텍스트 → surveyInfo 공통 처리 ──
  const processCsvText = useCallback((text: string, sourceName: string): boolean => {
    const parsed = parseCSV(text);
    if (parsed.length < 2) {
      setError('설문 데이터가 없습니다.');
      return false;
    }
    const headers = parsed[0];
    const dataRows = parsed.slice(1).filter((row) =>
      row.some((cell, idx) => idx > 0 && cell && cell.trim() !== '')
    );
    if (dataRows.length === 0) {
      setError('유효한 응답 데이터가 없습니다.');
      return false;
    }
    const a1Idx = headers.findIndex((h) => h.includes('[A1]'));
    const companyNames = dataRows.map((row, i) =>
      a1Idx >= 0 && row[a1Idx] && row[a1Idx].trim() ? row[a1Idx] : `응답 ${i + 1}`
    );
    setSurveyInfo({ headers, rows: dataRows, companyNames });
    setSurveyFileName(sourceName);
    setSelectedCompanyIdx(0);
    setError('');
    return true;
  }, []);

  // ── 설문 파일 업로드 ──
  const handleSurveyFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    if (!processCsvText(text, file.name)) {
      setSurveyFileName('');
    }
  }, [processCsvText]);

  // ── Google Sheets URL로 불러오기 ──
  const handleSheetsFetch = useCallback(async () => {
    if (!sheetsUrl.trim() || !isSupportedUrl(sheetsUrl)) {
      setError('Google Sheets URL 또는 Apps Script 웹앱 URL을 입력해주세요.');
      return;
    }
    setSheetsFetching(true);
    setError('');
    try {
      const res = await fetch('/api/report/fetch-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: sheetsUrl }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '스프레드시트 로드 실패');
      }
      const { csvText } = await res.json();
      processCsvText(csvText, 'Google Sheets');
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSheetsFetching(false);
    }
  }, [sheetsUrl, processCsvText]);

  const handleRemoveSurvey = () => {
    setSurveyInfo(null);
    setSurveyFileName('');
    setSelectedCompanyIdx(0);
  };

  // ── 제출 ──
  const handleSubmit = async () => {
    if (!meetingNotes.trim() && !surveyInfo) return;
    setLoading(true);
    setError('');
    try {
      let combined = meetingNotes.trim();
      let surveyFields = null;

      if (surveyInfo) {
        const row = surveyInfo.rows[selectedCompanyIdx];
        if (row) {
          // 설문 응답 파싱 → 구글폼 ID 리매핑 → 구조화
          const rawAnswers = parseSurveyAnswers(surveyInfo.headers, row);
          const answers = remapFormIds(rawAnswers);
          // Track 1: 직접 매핑 가능한 필드 pre-fill
          surveyFields = prefillFieldsFromSurvey(answers);
          // Track 1.5: 파생 계산 (복수 질문 조합 → 중간 지표)
          const derivedMetrics = computeDerivedMetrics(answers);
          // Track 2: LLM 컨텍스트용 구조화 텍스트 (파생 메트릭 포함)
          const llmContext = formatSurveyForLLM(answers, derivedMetrics);
          if (llmContext) {
            combined += `\n\n---\n[사전 설문 구조화 데이터]\n${llmContext}`;
          }
        }
      }

      const res = await fetch('/api/report/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetingNotes: combined, surveyFields }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '분석 실패');
      }
      const { fields, metadata } = await res.json();
      setFields(fields);
      setMetadata(metadata);
      router.push('/report/review');
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const hasInput = meetingNotes.trim() || surveyInfo;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.png" alt="조코딩 AX 파트너스" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-bold text-gray-900">조코딩 AX 파트너스</h1>
          </div>
          <p className="text-gray-500">사전 기업 진단 리포트 생성기</p>
          <div className="flex items-center justify-center gap-2 mt-6 text-sm">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">1. 노트 입력</span>
            <span className="text-gray-300">→</span>
            <span className="text-gray-400">2. 리뷰</span>
            <span className="text-gray-300">→</span>
            <span className="text-gray-400">3. 미리보기</span>
          </div>
        </div>

        {/* 미팅 노트 입력 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-semibold text-gray-700">미팅 노트</label>
            <label className={`cursor-pointer text-sm font-medium flex items-center gap-1.5 ${fileLoading ? 'text-gray-400' : 'text-purple-600 hover:text-purple-800'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {fileLoading ? '파일 읽는 중...' : '파일 첨부'}
              <input
                ref={noteInputRef}
                type="file"
                accept={ALL_NOTE_ACCEPT}
                multiple
                onChange={handleNoteFileUpload}
                className="hidden"
                disabled={loading || fileLoading}
              />
            </label>
          </div>

          {/* 업로드된 파일 목록 */}
          {noteFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {noteFiles.map((f, i) => (
                <span key={f.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs text-gray-700">
                  {getExt(f.name) === PDF_EXT ? (
                    <svg className="w-3.5 h-3.5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-2.5 9.5c0 .83-.67 1.5-1.5 1.5H8v2H6.5v-5H9c.83 0 1.5.67 1.5 1.5zm5 0v3c0 .83-.67 1.5-1.5 1.5h-2v-5h2c.83 0 1.5.67 1.5 1.5zm4-1.5h-3v5h1.5v-2h1.5v-1.5h-1.5v-1h1.5V12z"/></svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  )}
                  <span className="max-w-32 truncate">{f.name}</span>
                  <button
                    onClick={() => handleRemoveNoteFile(i)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    disabled={loading}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
          )}

          <textarea
            value={meetingNotes}
            onChange={(e) => setMeetingNotes(e.target.value)}
            placeholder={`미팅 노트를 여기에 붙여넣거나, 파일을 첨부하세요.\n\nPDF, TXT, MD, HTML, JSON, CSV 파일을 여러 개 첨부할 수 있습니다.\n\n예시:\n- 기업명: 주식회사 테스트\n- 업종: IT서비스\n- 직원 수: 45명\n...`}
            className="w-full h-72 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm leading-relaxed text-black"
            disabled={loading}
          />
        </div>

        {/* 설문 응답 첨부 */}
        <div className="mt-4 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <label className="text-sm font-semibold text-gray-700">사전 설문 응답</label>
              <p className="text-xs text-gray-400 mt-0.5">공통 질문 리스트 응답 파일 (선택)</p>
            </div>
            {surveyInfo ? (
              <button
                onClick={handleRemoveSurvey}
                className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                disabled={loading}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                제거
              </button>
            ) : null}
          </div>

          {surveyInfo ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-purple-800 truncate">{surveyFileName}</p>
                  <p className="text-xs text-purple-500">{surveyInfo.rows.length}개 기업 응답</p>
                </div>
                <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* 카드형 기업 선택 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">리포트 대상 기업 선택</label>
                <div className="space-y-2">
                  {surveyInfo.rows.map((row, i) => {
                    const answers = parseSurveyAnswers(surveyInfo.headers, row);
                    const isSelected = selectedCompanyIdx === i;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedCompanyIdx(i)}
                        disabled={loading}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 text-sm">
                            {answers.A1 || surveyInfo.companyNames[i]}
                          </span>
                          {isSelected && (
                            <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              선택됨
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                          {answers.A2 && (
                            <span>담당자: <span className="text-gray-700">{answers.A2}</span></span>
                          )}
                          {answers.A3 && (
                            <span>직급: <span className="text-gray-700">{answers.A3.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')}</span></span>
                          )}
                          {answers.A4 && (
                            <span>규모: <span className="text-gray-700">{answers.A4.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')}</span></span>
                          )}
                          {answers.A5 && (
                            <span>업무: <span className="text-gray-700">{answers.A5.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '')}</span></span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Google Sheets URL 입력 */}
              <div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="Google Sheets 또는 Apps Script 웹앱 URL"
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black placeholder:text-gray-400"
                    disabled={loading || sheetsFetching}
                  />
                  <button
                    onClick={handleSheetsFetch}
                    disabled={loading || sheetsFetching || !sheetsUrl.trim()}
                    className="px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap flex items-center gap-1.5"
                  >
                    {sheetsFetching ? (
                      <>
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        로딩 중
                      </>
                    ) : '불러오기'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">공개 시트: Sheets URL 직접 입력 | 워크스페이스: Apps Script 웹앱 URL 입력</p>
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400">또는</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* CSV 파일 업로드 (기존) */}
              <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors">
                <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm text-gray-500">CSV 파일을 직접 업로드</span>
                <input
                  type="file"
                  accept=".csv,.txt,.json,.tsv"
                  onChange={handleSurveyFileUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>
          )}
        </div>

        {/* 에러 & 제출 */}
        <div className="mt-4">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={!hasInput || loading}
            className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                AI 분석 중...
              </>
            ) : (
              '리포트 생성'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
