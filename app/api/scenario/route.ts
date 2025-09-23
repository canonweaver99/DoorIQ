import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const random = searchParams.get('random');
    const agent = searchParams.get('agent');

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
      let baseQuery = supabaseAdmin.from('scenarios').select('id', { count: 'exact', head: true });
      if (agent) {
        baseQuery = baseQuery.ilike('name', `%${agent}%`);
      }
      const { count, error: cntErr } = await baseQuery;
      if (cntErr) return NextResponse.json({ error: cntErr.message }, { status: 500 });
      const total = count || 0;
      if (total === 0) return NextResponse.json({ scenario: null });
      const offset = Math.floor(Math.random() * total);
      let rowsQuery = supabaseAdmin
        .from('scenarios')
        .select('id, name, persona, script')
        .order('created_at', { ascending: true })
        .range(offset, offset);
      if (agent) {
        rowsQuery = rowsQuery.ilike('name', `%${agent}%`);
      }
      const { data: rows, error: rowErr } = await rowsQuery;
      if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 });
      return NextResponse.json({ scenario: rows?.[0] || null });
    }

    let base = supabaseAdmin
      .from('scenarios')
      .select('id, name, persona, script')
      .order('created_at', { ascending: true })
      .limit(1);
    if (agent) base = base.ilike('name', `%${agent}%`);
    const { data, error } = await base.maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ scenario: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'scenario_failed' }, { status: 500 });
  }
}


