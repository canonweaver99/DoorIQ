import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

async function gradeConversation(transcript: Array<{speaker: string, text: string}>) {
  const conversationText = transcript
    .map(t => `${t.speaker.toUpperCase()}: ${t.text}`)
    .join('\n');

  const gradingPrompt = `You are grading a door-to-door pest control sales conversation. 
The sales rep is talking to Amanda Rodriguez, a suburban mom who values child/pet safety and clear pricing.

Rate the conversation on these 4 criteria (0-5 points each):
1. SAFETY: Did they address child/pet safety concerns clearly?
2. VALUE: Did they explain the service value and what's included?
3. TIMING: Did they offer specific scheduling and respect her time?
4. PRICING: Did they provide clear, transparent pricing?

Conversation:
${conversationText}

Respond with JSON only:
{
  "total": number (0-20),
  "breakdown": {
    "safety": number (0-5),
    "value": number (0-5), 
    "timing": number (0-5),
    "pricing": number (0-5)
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "grade": "A+/A/B+/B/C+/C/D"
}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: gradingPrompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    const grading = JSON.parse(data.choices[0].message.content);
    return grading;
  } catch (error) {
    console.error('Grading error:', error);
    return {
      total: 12,
      breakdown: { safety: 3, value: 3, timing: 3, pricing: 3 },
      strengths: ["Professional approach"],
      improvements: ["Continue practicing"],
      grade: "B"
    };
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    // Fetch all turns for this session
    const { data: turns, error: turnsError } = await supabaseAdmin
      .from('turns')
      .select('speaker, text')
      .eq('session_id', sessionId)
      .order('id', { ascending: true });

    if (turnsError) {
      return NextResponse.json({ error: turnsError.message }, { status: 500 });
    }

    // Grade the conversation
    const grading = await gradeConversation(turns || []);

    // Update session with end time and grading
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({
        ended_at: new Date().toISOString(),
        grading: grading
      })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      sessionId,
      grading,
      turnCount: turns?.length || 0
    });

  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
