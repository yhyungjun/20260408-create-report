import { readFileSync } from 'fs';
import { join } from 'path';
import { renderReport } from '@/lib/template-engine';
import type { ReportFields } from '@/lib/report-schema';

export const maxDuration = 60;

// 환경에 따라 Chrome 실행 경로 결정
async function launchBrowser() {
  if (process.env.NODE_ENV === 'development') {
    // 로컬 개발 환경: puppeteer 내장 Chrome 사용
    const puppeteer = await import('puppeteer');
    return puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }

  // 배포 환경 (Vercel, 기타 서버): @sparticuz/chromium-min 사용
  const chromium = await import('@sparticuz/chromium-min');
  const puppeteer = await import('puppeteer-core');
  const executablePath = await chromium.default.executablePath(
    'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
  );
  return puppeteer.default.launch({
    args: chromium.default.args,
    executablePath,
    headless: true,
  });
}

export async function POST(request: Request) {
  let browser;
  try {
    const { fields } = (await request.json()) as { fields: ReportFields };

    const publicDir = join(process.cwd(), 'public');
    const templatePath = join(publicDir, 'report.html');
    const htmlTemplate = readFileSync(templatePath, 'utf-8');
    let renderedHtml = renderReport(htmlTemplate, fields);

    // 이미지를 base64 data URI로 인라인 삽입 (puppeteer에서 확실하게 표시)
    renderedHtml = renderedHtml.replace(/src="\/([^"]+)"/g, (_match, filePath) => {
      const absPath = join(publicDir, filePath);
      try {
        const buf = readFileSync(absPath);
        const ext = filePath.split('.').pop()?.toLowerCase() || 'png';
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
                   : ext === 'svg' ? 'image/svg+xml'
                   : `image/${ext}`;
        return `src="data:${mime};base64,${buf.toString('base64')}"`;
      } catch {
        return `src="file://${absPath}"`;
      }
    });

    // PDF 인쇄용 CSS 주입: 각 .page를 A4에 맞춤
    const printCss = `
      <style>
        @page { size: A4; margin: 0; }
        body { background: #fff; margin: 0; padding: 0; }
        .page {
          width: 794px;
          max-width: 794px;
          margin: 0;
          padding: 0;
          border-radius: 0;
          box-shadow: none;
          page-break-after: always;
          page-break-inside: avoid;
          position: relative;
          overflow: hidden;
        }
        .page:last-child { page-break-after: auto; }
        .cover { min-height: auto; }
        .ending { min-height: auto; }
      </style>
    `;
    const pdfHtml = renderedHtml.replace('</head>', `${printCss}</head>`);

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.setContent(pdfHtml, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    await page.evaluateHandle('document.fonts.ready');

    // 넘치는 페이지 자동 축소: 콘텐츠가 A4보다 크면 scale down
    await page.evaluate(() => {
      const A4_HEIGHT = 1123;
      const A4_WIDTH = 794;
      const pages = document.querySelectorAll<HTMLElement>('.page');
      pages.forEach((pg) => {
        const inner = pg.querySelector<HTMLElement>('.page-inner, .cover, .ending');
        if (!inner) return;
        const contentHeight = pg.scrollHeight;
        if (contentHeight > A4_HEIGHT) {
          const scale = A4_HEIGHT / contentHeight;
          pg.style.height = A4_HEIGHT + 'px';
          pg.style.overflow = 'hidden';
          inner.style.transform = `scale(${scale})`;
          inner.style.transformOrigin = 'top left';
          inner.style.width = (A4_WIDTH / scale) + 'px';
        } else {
          pg.style.height = A4_HEIGHT + 'px';
        }
      });
    });

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    const safeName = encodeURIComponent(fields.companyName || 'report');
    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AX_Report.pdf"; filename*=UTF-8''AX_Report_${safeName}.pdf`,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('PDF generation error:', msg, stack);
    return new Response(
      JSON.stringify({ error: 'PDF 생성 중 오류가 발생했습니다.', detail: msg }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    if (browser) await browser.close();
  }
}
