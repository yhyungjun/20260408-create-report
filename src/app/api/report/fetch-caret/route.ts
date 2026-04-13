import { NextResponse } from 'next/server';
import { listNotes, getNoteDetail } from '@/lib/caret';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') ?? 'list';

  try {
    if (action === 'list') {
      const data = await listNotes();
      const notes = data.items.map((n) => ({
        id: n.id,
        title: n.title,
        createdAt: n.createdAt,
        tags: n.tags.map((t) => t.name),
        durationMin: Math.round(n.totalDurationSec / 60),
      }));
      return NextResponse.json({ notes });
    }

    if (action === 'detail') {
      const noteId = searchParams.get('noteId');
      if (!noteId) {
        return NextResponse.json({ error: 'noteId가 필요합니다.' }, { status: 400 });
      }
      const note = await getNoteDetail(noteId);
      const content = note.enhancedNote || note.userWrittenNote || note.summary || '';
      return NextResponse.json({
        id: note.id,
        title: note.title,
        createdAt: note.createdAt,
        content,
      });
    }

    return NextResponse.json({ error: '알 수 없는 action입니다.' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
