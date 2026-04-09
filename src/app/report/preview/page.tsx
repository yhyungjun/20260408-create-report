'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useReport } from '@/context/ReportContext';
import { renderReport } from '@/lib/template-engine';

export default function PreviewPage() {
  const router = useRouter();
  const { fields, ready } = useReport();
  const [pages, setPages] = useState<string[]>([]);
  const [styleTag, setStyleTag] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    if (!fields) {
      router.replace('/report');
      return;
    }

    async function loadTemplate() {
      const res = await fetch('/report.html');
      const html = await res.text();
      const rendered = renderReport(html, fields!);

      // Extract style
      const styleMatch = rendered.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      const style = styleMatch ? styleMatch[1] : '';
      setStyleTag(style);

      // Extract pages
      const parser = new DOMParser();
      const doc = parser.parseFromString(rendered, 'text/html');
      const pageElements = doc.querySelectorAll('.page');
      const pageHtmls = Array.from(pageElements).map((el) => el.outerHTML);
      setPages(pageHtmls);
    }

    loadTemplate();
  }, [fields, router]);

  // 페이지 변경 시 스케일 재계산
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newScale = Math.min(containerWidth / 800, 1);
        setScale(newScale);
      }
    };
    updateScale();
    // 콘텐츠 높이 측정
    requestAnimationFrame(() => {
      if (contentRef.current) {
        const contentHeight = contentRef.current.scrollHeight;
        setScaledHeight(contentHeight * (containerRef.current ? Math.min(containerRef.current.clientWidth / 800, 1) : 1));
      }
    });
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [currentPage, pages]);

  const goTo = useCallback((page: number) => {
    setCurrentPage(Math.max(0, Math.min(page, pages.length - 1)));
  }, [pages.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goTo(currentPage - 1);
      if (e.key === 'ArrowRight') goTo(currentPage + 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [currentPage, goTo]);

  // 브라우저 인쇄 기능으로 PDF 생성 (서버 Chrome 불필요)
  const downloadPdf = () => {
    if (!fields || pages.length === 0) return;
    setPdfLoading(true);

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AX Report - ${fields.companyName || 'report'}</title>
  <style>
    ${styleTag}
    @page { size: A4; margin: 0; }
    body { margin: 0; padding: 0; background: #fff; }
    .page {
      width: 794px;
      max-width: 794px;
      margin: 0;
      padding: 0;
      border-radius: 0 !important;
      box-shadow: none !important;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    .cover { min-height: auto; }
    .ending { min-height: auto; }
  </style>
</head>
<body>
  ${pages.join('\n')}
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단됐습니다. 주소창 오른쪽의 팝업 허용 버튼을 클릭한 후 다시 시도해주세요.');
      setPdfLoading(false);
      return;
    }

    printWindow.document.write(printHtml);
    printWindow.document.close();

    // 폰트/이미지 로드 후 인쇄
    const doPrint = () => {
      printWindow.focus();
      printWindow.print();
      setPdfLoading(false);
    };

    if (printWindow.document.readyState === 'complete') {
      setTimeout(doPrint, 300);
    } else {
      printWindow.onload = () => setTimeout(doPrint, 300);
    }
  };

  if (!fields || pages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-50">
        <div className="h-1 bg-gray-800" />
        <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.push('/report/review')}
            className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
          >← 뒤로</button>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>1. 노트 입력</span>
            <span>→</span>
            <span>2. 리뷰</span>
            <span>→</span>
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-semibold">3. 미리보기</span>
          </div>
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="py-2 px-4 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
          >
            {pdfLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                생성 중...
              </>
            ) : (
              'PDF 다운로드 →'
            )}
          </button>
        </div>
        </div>
      </div>

      {/* Slide viewer */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* 좌측 빈 공간 클릭: 이전 페이지 */}
        <div
          className="absolute left-0 top-0 h-full cursor-pointer z-10"
          style={{ width: `calc(50% - ${(800 * scale) / 2}px)` }}
          onClick={() => goTo(currentPage - 1)}
        />
        {/* 우측 빈 공간 클릭: 다음 페이지 */}
        <div
          className="absolute right-0 top-0 h-full cursor-pointer z-10"
          style={{ width: `calc(50% - ${(800 * scale) / 2}px)` }}
          onClick={() => goTo(currentPage + 1)}
        />

        <div ref={containerRef} className="w-full max-w-4xl">
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden mx-auto"
            style={{ width: `${800 * scale}px`, height: scaledHeight ? `${scaledHeight}px` : 'auto' }}
          >
            <div
              ref={contentRef}
              className="origin-top-left"
              style={{
                width: '800px',
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: styleTag }} />
              <div dangerouslySetInnerHTML={{ __html: pages[currentPage] }} />
            </div>
          </div>
        </div>
      </div>

      {/* Page indicator */}
      <div className="flex items-center justify-center gap-2 pb-6">
        <div className="flex items-center gap-1.5">
          {pages.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === currentPage ? 'w-6 h-3 bg-purple-500' : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'}`}
            />
          ))}
        </div>
        <span className="text-sm text-gray-400 ml-2">{currentPage + 1} / {pages.length}</span>
      </div>
    </div>
  );
}
