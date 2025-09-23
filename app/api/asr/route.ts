import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const fd = new FormData();
    fd.append('file', audioFile);
    fd.append('model', 'whisper-1');
    fd.append('language', 'en');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY!}` },
      body: fd
    });

    if (!r.ok) {
      const err = await r.text();
      return NextResponse.json({ error: 'asr_failed', detail: err }, { status: r.status });
    }

    const data = await r.json();
    return NextResponse.json({ text: data.text || '' });
  } catch (e: any) {
    return NextResponse.json({ error: 'asr_exception', detail: e?.message || 'unknown' }, { status: 500 });
  }
}


