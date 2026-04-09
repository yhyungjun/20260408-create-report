'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ReportFields, ExtractMetadata } from '@/lib/report-schema';

const STORAGE_KEY_FIELDS = 'report_fields';
const STORAGE_KEY_METADATA = 'report_metadata';

function saveToStorage(key: string, value: unknown) {
  try {
    if (value == null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

interface ReportContextType {
  meetingNotes: string;
  setMeetingNotes: (notes: string) => void;
  fields: ReportFields | null;
  setFields: (fields: ReportFields) => void;
  metadata: ExtractMetadata | null;
  setMetadata: (metadata: ExtractMetadata) => void;
  ready: boolean;
  resetAll: () => void;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [meetingNotes, setMeetingNotes] = useState('');
  const [fields, setFieldsRaw] = useState<ReportFields | null>(null);
  const [metadata, setMetadataRaw] = useState<ExtractMetadata | null>(null);
  const [ready, setReady] = useState(false);

  // 마운트 후 sessionStorage에서 복원 (hydration 안전)
  useEffect(() => {
    try {
      const storedFields = sessionStorage.getItem(STORAGE_KEY_FIELDS);
      const storedMeta = sessionStorage.getItem(STORAGE_KEY_METADATA);
      if (storedFields) setFieldsRaw(JSON.parse(storedFields));
      if (storedMeta) setMetadataRaw(JSON.parse(storedMeta));
    } catch {}
    setReady(true);
  }, []);

  const setFields = useCallback((f: ReportFields) => {
    setFieldsRaw(f);
    saveToStorage(STORAGE_KEY_FIELDS, f);
  }, []);

  const setMetadata = useCallback((m: ExtractMetadata) => {
    setMetadataRaw(m);
    saveToStorage(STORAGE_KEY_METADATA, m);
  }, []);

  const resetAll = () => {
    setMeetingNotes('');
    setFieldsRaw(null);
    setMetadataRaw(null);
    saveToStorage(STORAGE_KEY_FIELDS, null);
    saveToStorage(STORAGE_KEY_METADATA, null);
  };

  return (
    <ReportContext.Provider
      value={{ meetingNotes, setMeetingNotes, fields, setFields, metadata, setMetadata, ready, resetAll }}
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
