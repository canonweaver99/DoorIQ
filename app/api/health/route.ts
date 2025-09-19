import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {
    env: {
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      ELEVENLABS_API_KEY: Boolean(process.env.ELEVENLABS_API_KEY),
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
    },
    checks: {
      openai: { ok: false, detail: '' },
      elevenlabs: { ok: false, detail: '' },
      database: { ok: false, detail: '' },
    },
  };

  // OpenAI key check (models list)
  if (process.env.OPENAI_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      });
      results.checks.openai.ok = res.ok;
      results.checks.openai.detail = res.ok ? 'OK' : `HTTP ${res.status}`;
    } catch (e: any) {
      results.checks.openai.detail = e?.message || 'Error';
    }
  } else {
    results.checks.openai.detail = 'Missing OPENAI_API_KEY';
  }

  // ElevenLabs key check (user endpoint)
  if (process.env.ELEVENLABS_API_KEY) {
    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
        },
      });
      results.checks.elevenlabs.ok = res.ok;
      results.checks.elevenlabs.detail = res.ok ? 'OK' : `HTTP ${res.status}`;
    } catch (e: any) {
      results.checks.elevenlabs.detail = e?.message || 'Error';
    }
  } else {
    results.checks.elevenlabs.detail = 'Missing ELEVENLABS_API_KEY';
  }

  // Database connection check (direct MongoDB driver to avoid Prisma init issues)
  if (process.env.DATABASE_URL) {
    try {
      const client = new MongoClient(process.env.DATABASE_URL as string, { serverSelectionTimeoutMS: 3000 });
      await client.connect();
      // Force a round-trip
      await client.db().command({ ping: 1 });
      await client.close();
      results.checks.database.ok = true;
      results.checks.database.detail = 'Connected';
    } catch (e: any) {
      results.checks.database.detail = e?.message || 'Error connecting';
    }
  } else {
    results.checks.database.detail = 'Missing DATABASE_URL';
  }

  return NextResponse.json(results);
}


