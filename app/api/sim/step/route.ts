import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { inferNextState } from "@/lib/fsm";
import { callProspectLLM } from "@/lib/llm";
import { PROSPECT_SYSTEM } from "@/lib/prompts";
import { retrieveContext } from "@/lib/rag";
import { PersonaEngine } from "@/lib/persona-engine";
import type { SimState } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { attemptId, repUtterance } = body;
    
    // Get attempt from Supabase
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
      
    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    
    // Get conversation history from Supabase
    const { data: turns, error: turnsError } = await supabaseAdmin
      .from('turns')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('turn_number', { ascending: true });
      
    if (turnsError) {
      console.error('Error fetching turns:', turnsError);
    }
    
    const history = (turns || []).map(turn => [
      { role: "user" as const, content: turn.user_message },
      { role: "assistant" as const, content: turn.ai_response }
    ]).flat();
    
    // Use PersonaEngine for advanced behavioral modeling
    const engine = new PersonaEngine(attempt.persona);
    const behaviorModifiers = engine.getBehaviorModifiers({
      turnCount: attempt.turn_count,
      lastUserMessage: repUtterance,
      currentState: attempt.state as SimState
    });
    
    // Retrieve RAG context
    const ragText = await retrieveContext(repUtterance);
    
    // Generate AI response
    const prospectReply = await callProspectLLM({
      system: PROSPECT_SYSTEM + '\n' + behaviorModifiers.systemPromptAddition,
      persona: {
        ...attempt.persona,
        ...behaviorModifiers.personaOverrides
      },
      state: attempt.state,
      history,
      repUtterance,
      ragText
    });
    
    // Infer next state
    const { next, terminal } = inferNextState(
      attempt.state as SimState,
      repUtterance,
      prospectReply
    );
    
    // Save turn to Supabase
    const turnNumber = (turns?.length || 0) + 1;
    const { error: turnError } = await supabaseAdmin
      .from('turns')
      .insert({
        attempt_id: attemptId,
        turn_number: turnNumber,
        user_message: repUtterance,
        ai_response: prospectReply
      });
      
    if (turnError) {
      console.error('Error saving turn:', turnError);
    }
    
    // Update attempt state
    const { error: updateError } = await supabaseAdmin
      .from('attempts')
      .update({
        state: next,
        turn_count: turnNumber
      })
      .eq('id', attemptId);
      
    if (updateError) {
      console.error('Error updating attempt:', updateError);
    }
    
    // Track objectives completed
    const objectivesCompleted = [];
    if (repUtterance.toLowerCase().includes('understand') || 
        repUtterance.toLowerCase().includes('need')) {
      objectivesCompleted.push('1'); // Qualify
    }
    if (repUtterance.toLowerCase().includes('protect') || 
        repUtterance.toLowerCase().includes('benefit')) {
      objectivesCompleted.push('2'); // Present
    }
    if (prospectReply.toLowerCase().includes('makes sense') || 
        prospectReply.toLowerCase().includes('i see')) {
      objectivesCompleted.push('3'); // Handle objections
    }
    if (terminal) {
      objectivesCompleted.push('4'); // Get commitment
    }
    
    return NextResponse.json({
      prospectReply,
      state: next,
      terminal: terminal || false,
      objectivesCompleted,
      responseMetadata: behaviorModifiers.responseMetadata
    });
    
  } catch (error) {
    console.error('Step error:', error);
    return NextResponse.json(
      { error: 'Failed to process step' },
      { status: 500 }
    );
  }
}