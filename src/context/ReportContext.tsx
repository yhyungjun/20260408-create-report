'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ReportFields, ExtractMetadata } from '@/lib/report-schema';

const STORAGE_KEY_FIELDS = 'report_fields';
const STORAGE_KEY_METADATA = 'report_metadata';
const STORAGE_KEY_SURVEY = 'report_survey_answers';

function saveToStorage(key: string, value: unknown) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export interface SavedReport {
  id: string;
  title: string;
  company_name: string | null;
  created_at: string;
  fields: { industry?: string | null; diagnosisDate?: string | null } | null;
}

export interface GlobalSurveyInfo {
  headers: string[];
  rows: string[][];
  companyNames: string[];
}

interface ReportContextType {
  meetingNotes: string;
  setMeetingNotes: (notes: string) => void;
  fields: ReportFields | null;
  setFields: (fields: ReportFields) => void;
  metadata: ExtractMetadata | null;
  setMetadata: (metadata: ExtractMetadata) => void;
  surveyAnswers: Record<string, string> | null;
  setSurveyAnswers: (answers: Record<string, string> | null) => void;
  reportId: string | null;
  setReportId: (id: string | null) => void;
  reportTitle: string;
  setReportTitle: (title: string) => void;
  // 글로벌 사이드바용
  savedReports: SavedReport[];
  setSavedReports: (reports: SavedReport[]) => void;
  loadReports: () => Promise<void>;
  globalSurveyInfo: GlobalSurveyInfo | null;
  setGlobalSurveyInfo: (info: GlobalSurveyInfo | null) => void;
  globalSidebarOpen: boolean;
  setGlobalSidebarOpen: (open: boolean) => void;
  ready: boolean;
  resetAll: () => void;
}

const ReportContext = createContext<ReportContextType | null>(null);

function readStorage<T>(key: string): T | null {
  try {
    const v = sessionStorage.getItem(key);
    return v ? JSON.parse(v) : null;
  } catch {
    return null;
  }
}

export function ReportProvider({ children }: { children: ReactNode }) {
  const [meetingNotes, setMeetingNotes] = useState('');
  const [fields, setFieldsRaw] = useState<ReportFields | null>(null);
  const [metadata, setMetadataRaw] = useState<ExtractMetadata | null>(null);
  const [surveyAnswers, setSurveyAnswersRaw] = useState<Record<string, string> | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [globalSurveyInfo, setGlobalSurveyInfo] = useState<GlobalSurveyInfo | null>(null);
  const [globalSidebarOpen, setGlobalSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // 마운트 후 sessionStorage에서 복원 (SSR hydration mismatch 방지)
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setFieldsRaw(readStorage(STORAGE_KEY_FIELDS));
    setMetadataRaw(readStorage(STORAGE_KEY_METADATA));
    setSurveyAnswersRaw(readStorage(STORAGE_KEY_SURVEY));
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const setFields = useCallback((f: ReportFields) => {
    setFieldsRaw(f);
    saveToStorage(STORAGE_KEY_FIELDS, f);
  }, []);

  const setMetadata = useCallback((m: ExtractMetadata) => {
    setMetadataRaw(m);
    saveToStorage(STORAGE_KEY_METADATA, m);
  }, []);

  const setSurveyAnswers = useCallback((a: Record<string, string> | null) => {
    setSurveyAnswersRaw(a);
    saveToStorage(STORAGE_KEY_SURVEY, a);
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch('/api/report/db', { cache: 'no-store' });
      if (!res.ok) return;
      const { reports } = await res.json();
      setSavedReports(reports);
    } catch { /* 무시 */ }
  }, []);

  const resetAll = () => {
    setMeetingNotes('');
    setFieldsRaw(null);
    setMetadataRaw(null);
    setReportId(null);
    setReportTitle('');
    setSurveyAnswersRaw(null);
    saveToStorage(STORAGE_KEY_FIELDS, null);
    saveToStorage(STORAGE_KEY_METADATA, null);
    saveToStorage(STORAGE_KEY_SURVEY, null);
  };

  return (
    <ReportContext.Provider
      value={{ meetingNotes, setMeetingNotes, fields, setFields, metadata, setMetadata, surveyAnswers, setSurveyAnswers, reportId, setReportId, reportTitle, setReportTitle, savedReports, setSavedReports, loadReports, globalSurveyInfo, setGlobalSurveyInfo, globalSidebarOpen, setGlobalSidebarOpen, ready, resetAll }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useReport must be used within ReportProvider');
  return ctx;
}
