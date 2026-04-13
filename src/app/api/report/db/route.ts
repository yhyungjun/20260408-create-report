import { NextResponse } from 'next/server';
import { listReports, getReport, createReport, updateReport, deleteReport } from '@/lib/apphub-db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const report = await getReport(id);
      return NextResponse.json({ report });
    }
    const reports = await listReports();
    return NextResponse.json({ reports });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const report = await createReport(body);
    return NextResponse.json({ report });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const report = await updateReport(id, body);
    return NextResponse.json({ report });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
  }

  try {
    await deleteReport(id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 },
    );
  }
}
