import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

async function callLLM(userText: string, history: Array<{speaker:string,text:string}>) {
  // Minimal OpenAI example; swap with your LLM if you'd like.
  const system = `You are Amanda Rodriguez, a realistic, friendly but skeptical suburban homeowner. 
34 years old, marketing director, married with 2 young kids and a dog. 
You're polite but time-constrained. You value child & pet safety, clear pricing, and professional service.
Keep replies short and natural (1-3 sentences). You're considering pest control but need convincing.`;

  const messages = [
    { role: 'system', content: system },
    ...history.map(t => ({ role: t.speaker === 'rep' ? 'user' : 'assistant', content: t.text })),
    { role: 'user', content: userText }
  ];

  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages
    })
  });
  const data = await r.json();
  const reply = data.choices?.[0]?.message?.content?.trim() || "Hmm.";
  return reply;
}

async function postToWebhook(payload: any) {
  const url = process.env.WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
  } catch {}
}

export async function POST(req: Request) {
  const { sessionId, userText } = await req.json();

  // Fetch light history for the LLM (optional: limit last N).
  const { data: historyRows } = await supabaseAdmin
    .from('turns')
    .select('speaker,text')
    .eq('session_id', sessionId)
    .order('id', { ascending: true })
    .limit(20);

  // Log the rep turn
  const { data: repTurn, error: repErr } = await supabaseAdmin
    .from('turns')
    .insert([{ session_id: sessionId, speaker: 'rep', text: userText }])
    .select()
    .single();

  if (repErr) {
    return NextResponse.json({ error: repErr.message }, { status: 500 });
  }

  // Generate homeowner reply
  const replyText = await callLLM(userText, historyRows ?? []);

  // Log homeowner turn
  const { data: aiTurn, error: aiErr } = await supabaseAdmin
    .from('turns')
    .insert([{ session_id: sessionId, speaker: 'homeowner', text: replyText }])
    .select()
    .single();

  if (aiErr) {
    return NextResponse.json({ error: aiErr.message }, { status: 500 });
  }

  // Fire-and-forget webhook chunk
  postToWebhook({
    session_id: sessionId,
    turn_id: repTurn.id,
    speaker: 'rep',
    text: userText,
    timestamp_utc: new Date().toISOString()
  });
  postToWebhook({
    session_id: sessionId,
    turn_id: aiTurn.id,
    speaker: 'homeowner',
    text: replyText,
    timestamp_utc: new Date().toISOString()
  });

  return NextResponse.json({ replyText });
}
