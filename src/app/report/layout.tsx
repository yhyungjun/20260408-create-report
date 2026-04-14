'use client';

import { ReportProvider } from '@/context/ReportContext';
import GlobalSidebar from '@/components/GlobalSidebar';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReportProvider>
      <GlobalSidebar />
      {children}
    </ReportProvider>
  );
}
