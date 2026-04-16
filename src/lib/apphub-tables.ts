/**
 * AppHub 제네릭 CRUD 팩토리
 * 기존 apphub-db.ts 패턴을 재사용하여 다중 테이블 지원
 */

const APPHUB_API_BASE = process.env.APPHUB_API_URL || 'https://hub-api.jocodingax.ai';
const APPHUB_API_KEY = process.env.APPHUB_API_KEY || process.env.APPHUB_APP_KEY || '';
const APP_ID = '10';
const DB_SCHEMA = process.env.APPHUB_DB_SCHEMA || 'jocodingax_ai_app_2_2';

export const TABLE_IDS = {
  reports: '36',
  payments: '40',
  pipelines: '41',
  questionnaires: '42',
} as const;

export type TableName = keyof typeof TABLE_IDS;

function tableUrl(tableId: string): string {
  return `${APPHUB_API_BASE}/api/v1/apps/${APP_ID}/tables/${tableId}/rows?db_schema=${DB_SCHEMA}`;
}

function rowUrl(tableId: string, id: string): string {
  return `${APPHUB_API_BASE}/api/v1/apps/${APP_ID}/tables/${tableId}/rows/${id}?db_schema=${DB_SCHEMA}`;
}

async function apphubFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'X-Api-Key': APPHUB_API_KEY,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`AppHub API 오류: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'AppHub 오류');
  return json.data;
}

/** 전체 행 조회 */
export async function listRows<T>(tableName: TableName): Promise<T[]> {
  const data = await apphubFetch<{ rows: T[] }>(tableUrl(TABLE_IDS[tableName]));
  return data.rows;
}

/** ID로 단일 행 조회 (전체 조회 후 필터 — AppHub 필터 API 버그 우회) */
export async function getRow<T extends { id: string }>(
  tableName: TableName,
  id: string,
): Promise<T> {
  const rows = await listRows<T>(tableName);
  const row = rows.find(r => r.id === id);
  if (!row) throw new Error(`${tableName}: ID ${id}를 찾을 수 없습니다.`);
  return row;
}

/** 조건으로 행 검색 (전체 조회 후 필터) */
export async function findRows<T>(
  tableName: TableName,
  predicate: (row: T) => boolean,
): Promise<T[]> {
  const rows = await listRows<T>(tableName);
  return rows.filter(predicate);
}

/** 행 생성 */
export async function createRow<T>(
  tableName: TableName,
  data: Record<string, unknown>,
): Promise<T> {
  return apphubFetch<T>(tableUrl(TABLE_IDS[tableName]), {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** 행 수정 (부분 업데이트) */
export async function updateRow<T>(
  tableName: TableName,
  id: string,
  updates: Record<string, unknown>,
): Promise<T> {
  return apphubFetch<T>(rowUrl(TABLE_IDS[tableName], id), {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/** 행 삭제 */
export async function deleteRow(tableName: TableName, id: string): Promise<void> {
  await apphubFetch<{ message: string }>(rowUrl(TABLE_IDS[tableName], id), {
    method: 'DELETE',
  });
}
