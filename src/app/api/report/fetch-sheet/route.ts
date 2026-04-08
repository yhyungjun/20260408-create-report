import { NextResponse } from 'next/server';
import {
  extractSheetId, extractGid, buildCsvExportUrl,
  isGoogleSheetsUrl, isAppsScriptUrl,
} from '@/lib/google-sheets';

// GET: 환경변수에 설정된 기본 스프레드시트 자동 로드
export async function GET() {
  const defaultUrl = process.env.APPS_SCRIPT_URL;
  if (!defaultUrl) {
    return NextResponse.json({ csvText: null });
  }
  const token = process.env.APPS_SCRIPT_TOKEN;
  const separator = defaultUrl.includes('?') ? '&' : '?';
  const csvUrl = token ? `${defaultUrl}${separator}key=${token}` : defaultUrl;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(csvUrl, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ csvText: null });
    const csvText = await res.text();
    if (csvText.trim() === 'Unauthorized') return NextResponse.json({ csvText: null });
    return NextResponse.json({ csvText });
  } catch {
    return NextResponse.json({ csvText: null });
  }
}

// POST: 사용자가 직접 URL 입력 시
export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL을 입력해주세요.' }, { status: 400 });
    }

    let csvUrl: string;

    if (isAppsScriptUrl(url)) {
      // Apps Script 웹앱 URL → 시크릿 토큰 파라미터 추가
      const token = process.env.APPS_SCRIPT_TOKEN;
      if (!token) {
        return NextResponse.json(
          { error: 'APPS_SCRIPT_TOKEN이 설정되지 않았습니다.' },
          { status: 500 },
        );
      }
      const separator = url.includes('?') ? '&' : '?';
      csvUrl = `${url}${separator}key=${token}`;
    } else if (isGoogleSheetsUrl(url)) {
      // Google Sheets URL → gviz CSV export URL로 변환
      const sheetId = extractSheetId(url);
      if (!sheetId) {
        return NextResponse.json(
          { error: '스프레드시트 ID를 추출할 수 없습니다.' },
          { status: 400 },
        );
      }
      csvUrl = buildCsvExportUrl(sheetId, extractGid(url));
    } else {
      return NextResponse.json(
        { error: 'Google Sheets URL 또는 Apps Script 웹앱 URL을 입력해주세요.' },
        { status: 400 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(csvUrl, {
      signal: controller.signal,
      redirect: 'follow',
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const msgs: Record<number, string> = {
        401: '접근 권한이 없습니다. 워크스페이스 시트는 Apps Script 웹앱 URL을 사용해주세요.',
        403: '접근 권한이 없습니다. 워크스페이스 시트는 Apps Script 웹앱 URL을 사용해주세요.',
        404: '스프레드시트를 찾을 수 없습니다. URL을 확인해주세요.',
      };
      return NextResponse.json(
        { error: msgs[res.status] || `로드 실패 (${res.status})` },
        { status: 502 },
      );
    }

    const csvText = await res.text();

    // Apps Script 토큰 인증 실패 체크
    if (csvText.trim() === 'Unauthorized') {
      return NextResponse.json(
        { error: '인증 실패: Apps Script 시크릿 토큰이 일치하지 않습니다.' },
        { status: 403 },
      );
    }

    return NextResponse.json({ csvText });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: '요청 시간이 초과되었습니다.' }, { status: 504 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 },
    );
  }
}
