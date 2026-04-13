import type { ReportFields, ExtractMetadata } from './report-schema';

const APPHUB_API_BASE = process.env.APPHUB_API_URL || 'https://hub-api.jocodingax.ai';
const APPHUB_API_KEY = process.env.APPHUB_API_KEY || process.env.APPHUB_APP_KEY || '';
const APP_ID = '10';
const TABLE_ID = '35';
const DB_SCHEMA = process.env.APPHUB_DB_SCHEMA || 'jocodingax_ai_app_2_2';

const TABLE_URL = `${APPHUB_API_BASE}/api/v1/apps/${APP_ID}/tables/${TABLE_ID}/rows?db_schema=${DB_SCHEMA}`;

function rowUrl(id: string) {
  return `${APPHUB_API_BASE}/api/v1/apps/${APP_ID}/tables/${TABLE_ID}/rows/${id}?db_schema=${DB_SCHEMA}`;
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

export interface SavedReport {
  id: string;
  title: string;
  company_name: string | null;
  meeting_notes: string | null;
  survey_csv: string | null;
  fields: ReportFields | null;
  metadata: ExtractMetadata | null;
  created_at: string;
  updated_at: string;
}

interface RawRow {
  id: string;
  title: string;
  company_name: string | null;
  meeting_notes: string | null;
  survey_csv: string | null;
  fields: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
}

function parseRow(row: RawRow): SavedReport {
  return {
    ...row,
    fields: row.fields ? JSON.parse(row.fields) : null,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  };
}

export async function listReports(): Promise<SavedReport[]> {
  const data = await apphubFetch<{ rows: RawRow[] }>(TABLE_URL);
  return data.rows.map(parseRow);
}

export async function getReport(id: string): Promise<SavedReport> {
  const data = await apphubFetch<{ rows: RawRow[] }>(`${TABLE_URL}&filter=id:${id}`);
  if (!data.rows.length) throw new Error('리포트를 찾을 수 없습니다.');
  return parseRow(data.rows[0]);
}

export async function createReport(input: {
  title: string;
  company_name?: string | null;
  meeting_notes?: string | null;
  survey_csv?: string | null;
  fields?: ReportFields | null;
  metadata?: ExtractMetadata | null;
}): Promise<SavedReport> {
  const body: Record<string, string> = { title: input.title };
  if (input.company_name) body.company_name = input.company_name;
  if (input.meeting_notes) body.meeting_notes = input.meeting_notes;
  if (input.survey_csv) body.survey_csv = input.survey_csv;
  if (input.fields) body.fields = JSON.stringify(input.fields);
  if (input.metadata) body.metadata = JSON.stringify(input.metadata);

  const row = await apphubFetch<RawRow>(TABLE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return parseRow(row);
}

export async function updateReport(
  id: string,
  updates: Partial<{
    title: string;
    company_name: string | null;
    meeting_notes: string | null;
    survey_csv: string | null;
    fields: ReportFields | null;
    metadata: ExtractMetadata | null;
  }>,
): Promise<SavedReport> {
  const body: Record<string, string | null> = {};
  if (updates.title !== undefined) body.title = updates.title;
  if (updates.company_name !== undefined) body.company_name = updates.company_name;
  if (updates.meeting_notes !== undefined) body.meeting_notes = updates.meeting_notes;
  if (updates.survey_csv !== undefined) body.survey_csv = updates.survey_csv;
  if (updates.fields !== undefined) body.fields = updates.fields ? JSON.stringify(updates.fields) : null;
  if (updates.metadata !== undefined) body.metadata = updates.metadata ? JSON.stringify(updates.metadata) : null;

  const row = await apphubFetch<RawRow>(rowUrl(id), {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return parseRow(row);
}

export async function deleteReport(id: string): Promise<void> {
  await apphubFetch<{ message: string }>(rowUrl(id), { method: 'DELETE' });
}
