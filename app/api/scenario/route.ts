import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const random = searchParams.get('random');

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('scenarios')
        .select('id, name, persona, script')
        .eq('id', id)
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ scenario: data });
    }

    if (random === '1') {
      // Get count
      const { count, error: cntErr } = await supabaseAdmin
        .from('scenarios')
        .select('id', { count: 'exact', head: true });
      if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 500 });
      const total = count || 0;
      if (total === 0) return NextResponse.json({ scenario: null });
      const offset = Math.floor(Math.random() * total);
      const { data: rows, error: rowErr } = await supabaseAdmin
        .from('scenarios')
        .select('id, name, persona, script')
        .order('created_at', { ascending: true })
        .range(offset, offset);
      if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
      return NextResponse.json({ scenario: rows?.[0] || null });
    }

    const { data, error } = await supabaseAdmin
      .from('scenarios')
      .select('id, name, persona, script')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ scenario: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'scenario_failed' }, { status: 500 });
  }
}


