import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/server/supabase';

export const runtime = 'edge';

function gradeConversation(transcript: Array<{speaker: string, text: string}>) {
  const repText = transcript
    .filter(t => t.speaker === 'rep')
    .map(t => t.text.toLowerCase())
    .join(' ');

  const homeownerText = transcript
    .filter(t => t.speaker === 'homeowner')  
    .map(t => t.text.toLowerCase())
    .join(' ');

  // Boolean rubric (0 or 1 each)
  const rubric = {
    safety_clarity: (
      repText.includes('epa') || 
      repText.includes('safe') || 
      repText.includes('kid') || 
      repText.includes('pet')
    ) ? 1 : 0,

    reentry_time_mentioned: (
      repText.includes('re-entry') ||
      repText.includes('dry') ||
      repText.includes('30 min') ||
      repText.includes('hour')
    ) ? 1 : 0,

    scope_covered: (
      repText.includes('cover') ||
      repText.includes('include') ||
      repText.includes('ant') ||
      repText.includes('spider') ||
      repText.includes('mouse')
    ) ? 1 : 0,

    time_window_offered: (
      repText.includes('wednesday') ||
      repText.includes('morning') ||
      repText.includes('afternoon') ||
      repText.includes('window') ||
      repText.includes('between')
    ) ? 1 : 0,

    price_tier_clear: (
      repText.includes('$') ||
      repText.includes('month') ||
      repText.includes('price') ||
      repText.includes('cost')
    ) ? 1 : 0,

    local_proof: (
      repText.includes('neighbor') ||
      repText.includes('review') ||
      repText.includes('referral') ||
      repText.includes('local')
    ) ? 1 : 0
  };

  const total = Object.values(rubric).reduce((sum, val) => sum + val, 0);
  const max = 6;

  // Generate notes
  const notes = [];
  if (rubric.safety_clarity) notes.push('✅ Addressed safety concerns');
  if (rubric.reentry_time_mentioned) notes.push('✅ Mentioned re-entry timing');
  if (rubric.scope_covered) notes.push('✅ Explained service scope');
  if (rubric.time_window_offered) notes.push('✅ Offered specific time window');
  if (rubric.price_tier_clear) notes.push('✅ Discussed pricing clearly');
  if (rubric.local_proof) notes.push('✅ Provided local social proof');

  // Missing items
  if (!rubric.safety_clarity) notes.push('❌ Need to address child/pet safety');
  if (!rubric.reentry_time_mentioned) notes.push('❌ Should mention re-entry timing');
  if (!rubric.scope_covered) notes.push('❌ Explain what pests are covered');
  if (!rubric.time_window_offered) notes.push('❌ Offer a specific appointment window');
  if (!rubric.price_tier_clear) notes.push('❌ Provide clear pricing information');
  if (!rubric.local_proof) notes.push('❌ Share neighbor references or reviews');

  // Auto-flags
  const repMessages = transcript.filter(t => t.speaker === 'rep');
  const longMessages = repMessages.filter(t => t.text.length > 200); // ~20s of speech
  if (longMessages.length > 0) {
    notes.push('⚠️ Some responses were too long - keep it concise');
  }

  // Check if safety questions were dodged
  const safetyQuestions = homeownerText.includes('safe') || homeownerText.includes('kid') || homeownerText.includes('pet');
  if (safetyQuestions && !rubric.safety_clarity) {
    notes.push('🚨 Safety question asked but not answered clearly');
  }

  return { total, max, notes: notes.slice(0, 8), rubric }; // Limit to 8 notes
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
    const grading = gradeConversation(turns || []);

    // Save score to database
    const { error: scoreErr } = await supabaseAdmin
      .from('scores')
      .insert([{ 
        session_id: sessionId, 
        rubric: grading.rubric, 
        total: grading.total, 
        notes: grading.notes.join('; ') 
      }]);

    if (scoreErr) {
      return NextResponse.json({ error: scoreErr.message }, { status: 500 });
    }

    // End the session
    const { error: updateError } = await supabaseAdmin
      .from('sessions')
      .update({ ended_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Return formatted grading
    const percentage = Math.round((grading.total / grading.max) * 100);
    let grade = 'D';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'B+';
    else if (percentage >= 75) grade = 'B';
    else if (percentage >= 70) grade = 'C+';
    else if (percentage >= 65) grade = 'C';

    return NextResponse.json({
      sessionId,
      grading: {
        total: grading.total,
        max: grading.max,
        percentage,
        grade,
        breakdown: grading.rubric,
        notes: grading.notes,
        strengths: grading.notes.filter(n => n.startsWith('✅')),
        improvements: grading.notes.filter(n => n.startsWith('❌') || n.startsWith('⚠️') || n.startsWith('🚨'))
      },
      turnCount: turns?.length || 0
    });

  } catch (error) {
    console.error('Session end error:', error);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}