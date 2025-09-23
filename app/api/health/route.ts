import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, any> = {
    env: {
      OPENAI_API_KEY: Boolean(process.env.OPENAI_API_KEY),
      ELEVENLABS_API_KEY: Boolean(process.env.ELEVENLABS_API_KEY),
      SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      SUPABASE_SERVICE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    },
    checks: {
      openai: { ok: false, detail: '' },
      elevenlabs: { ok: false, detail: '' },
      supabase: { ok: false, detail: '' },
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

  // Supabase connection check
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      // Try to list tables or do a simple query
      const { error } = await supabaseAdmin
        .from('sessions')
        .select('count')
        .limit(1)
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Table doesn't exist yet, but connection works
        results.checks.supabase.ok = true;
        results.checks.supabase.detail = 'Connected (tables not created yet)';
      } else if (error) {
        results.checks.supabase.ok = false;
        results.checks.supabase.detail = error.message;
      } else {
        results.checks.supabase.ok = true;
        results.checks.supabase.detail = 'Connected';
      }
    } catch (e: any) {
      results.checks.supabase.detail = e?.message || 'Error connecting';
    }
  } else {
    results.checks.supabase.detail = 'Missing SUPABASE credentials';
  }

  return NextResponse.json(results);
}