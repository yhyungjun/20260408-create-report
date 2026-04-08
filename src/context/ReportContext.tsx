'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ReportFields, ExtractMetadata } from '@/lib/report-schema';

interface ReportContextType {
  meetingNotes: string;
  setMeetingNotes: (notes: string) => void;
  fields: ReportFields | null;
  setFields: (fields: ReportFields) => void;
  metadata: ExtractMetadata | null;
  setMetadata: (metadata: ExtractMetadata) => void;
  resetAll: () => void;
}

const ReportContext = createContext<ReportContextType | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [meetingNotes, setMeetingNotes] = useState('');
  const [fields, setFields] = useState<ReportFields | null>(null);
  const [metadata, setMetadata] = useState<ExtractMetadata | null>(null);

  const resetAll = () => {
    setMeetingNotes('');
    setFields(null);
    setMetadata(null);
  };

  return (
    <ReportContext.Provider
      value={{ meetingNotes, setMeetingNotes, fields, setFields, metadata, setMetadata, resetAll }}
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
