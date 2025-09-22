import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { callEvaluatorLLM } from "@/lib/llm";
import { EVALUATOR_SYSTEM } from "@/lib/prompts";
import type { EvalReport } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json();
    
    // Get attempt from Supabase
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('attempts')
      .select('*')
      .eq('id', attemptId)
      .single();
      
    if (attemptError || !attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }
    
    // Get all turns for transcript
    const { data: turns, error: turnsError } = await supabaseAdmin
      .from('turns')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('turn_number', { ascending: true });
      
    if (turnsError) {
      console.error('Error fetching turns:', turnsError);
    }
    
    // Build transcript
    const transcript = (turns || []).map(turn => 
      `Rep: ${turn.user_message}\nProspect: ${turn.ai_response}`
    ).join('\n\n');
    
    // Get evaluation rubric (using default for now)
    const rubric = {
      discovery: { weight: 0.25, criteria: "Asking good questions to understand needs" },
      value: { weight: 0.25, criteria: "Connecting solution to specific problems" },
      objection: { weight: 0.25, criteria: "Addressing concerns effectively" },
      cta: { weight: 0.25, criteria: "Clear next steps and scheduling" }
    };
    
    // Generate evaluation
    const evaluation: EvalReport = await callEvaluatorLLM({
      system: EVALUATOR_SYSTEM,
      transcript,
      rubric
    });
    
    // Update attempt with evaluation and completion time
    const { error: updateError } = await supabaseAdmin
      .from('attempts')
      .update({
        evaluation: evaluation,
        completed_at: new Date().toISOString()
      })
      .eq('id', attemptId);
      
    if (updateError) {
      console.error('Error updating attempt with evaluation:', updateError);
    }
    
    return NextResponse.json({
      attemptId,
      eval: evaluation,
      transcript,
      turns: turns?.length || 0
    });
    
  } catch (error) {
    console.error('End simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to end simulation' },
      { status: 500 }
    );
  }
}