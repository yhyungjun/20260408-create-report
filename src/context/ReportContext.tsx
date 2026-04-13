'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
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
  const [fields, setFieldsRaw] = useState<ReportFields | null>(() => readStorage(STORAGE_KEY_FIELDS));
  const [metadata, setMetadataRaw] = useState<ExtractMetadata | null>(() => readStorage(STORAGE_KEY_METADATA));
  const ready = true;

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
