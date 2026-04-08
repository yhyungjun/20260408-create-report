import { NextResponse } from 'next/server';
import pdf from 'pdf-parse';

const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.html', '.json', '.tsv'];

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    const results: { name: string; text: string }[] = [];

    for (const file of files) {
      const ext = getExtension(file.name);

      if (ext === '.pdf') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const data = await pdf(buffer);
        results.push({ name: file.name, text: data.text });
      } else if (TEXT_EXTENSIONS.includes(ext)) {
        const text = await file.text();
        results.push({ name: file.name, text });
      } else {
        results.push({ name: file.name, text: `[지원하지 않는 형식: ${ext}]` });
      }
    }

    return NextResponse.json({ files: results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Parse files error:', msg);
    return NextResponse.json({ error: `파일 파싱 오류: ${msg}` }, { status: 500 });
  }
}
