'use client';

import { ReportProvider } from '@/context/ReportContext';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <ReportProvider>{children}</ReportProvider>;
}
