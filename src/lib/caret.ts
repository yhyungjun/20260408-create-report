const CARET_API_BASE = 'https://api.caret.so/v1';

export interface CaretNote {
  id: string;
  title: string;
  kind: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  totalDurationSec: number;
  userWrittenNote: string;
  enhancedNote: string;
  summary: string;
  tags: { id: string; name: string; color: string }[];
  inputLanguage: string | null;
  meetingApp: string | null;
}

interface ListNotesResponse {
  items: CaretNote[];
  pagination: { limit: number; nextOffset: number; isLast: boolean };
}

interface GetNoteResponse {
  note: CaretNote;
}

function getApiKey(): string {
  const key = process.env.CARET_API_KEY;
  if (!key) throw new Error('CARET_API_KEY 환경변수가 설정되지 않았습니다.');
  return key;
}

async function caretFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${CARET_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`Caret API 오류: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export async function listNotes(limit = 20, offset = 0): Promise<ListNotesResponse> {
  return caretFetch(`/notes?limit=${limit}&offset=${offset}`);
}

export async function getNoteDetail(noteId: string): Promise<CaretNote> {
  const data = await caretFetch<GetNoteResponse>(`/notes/${noteId}`);
  return data.note;
}
