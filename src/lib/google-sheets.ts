// ── Google Sheets 공개 발행 URL → CSV export URL 변환 유틸 ──

const SHEET_ID_REGEX = /spreadsheets\/d\/([a-zA-Z0-9_-]+)/;
const GID_REGEX = /[?&#]gid=(\d+)/;

export function extractSheetId(url: string): string | null {
  const match = url.match(SHEET_ID_REGEX);
  return match ? match[1] : null;
}

export function extractGid(url: string): string {
  const match = url.match(GID_REGEX);
  return match ? match[1] : '0';
}

// "링크가 있는 모든 사용자에게 공개" 상태에서도 작동하는 gviz 엔드포인트 사용
// (export?format=csv는 "웹에 게시" 설정이 필요하여 401 발생)
export function buildCsvExportUrl(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

// Apps Script 웹앱 URL: script.google.com 하위에 /s/{id}/exec 포함
const APPS_SCRIPT_REGEX = /script\.google\.com\/.*\/s\/[a-zA-Z0-9_-]+\/exec/;

export function isGoogleSheetsUrl(url: string): boolean {
  return SHEET_ID_REGEX.test(url);
}

export function isAppsScriptUrl(url: string): boolean {
  return APPS_SCRIPT_REGEX.test(url) || url.includes('script.googleusercontent.com');
}

export function isSupportedUrl(url: string): boolean {
  return isGoogleSheetsUrl(url) || isAppsScriptUrl(url);
}
