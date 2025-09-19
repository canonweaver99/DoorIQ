import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Attempt from "@/models/Attempt";
import Turn from "@/models/Turn";
import { callEvaluatorLLM } from "@/lib/llm";
import { EVALUATOR_SYSTEM } from "@/lib/prompts";
import type { EvalReport } from "@/lib/types";

export async function POST(req: Request) {
  try {
    await db();
    
    const { attemptId, forcedResult } = await req.json();
    
    if (!attemptId) {
      return NextResponse.json(
        { error: 'Missing attemptId' },
        { status: 400 }
      );
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      return NextResponse.json(
        { error: "Invalid attempt" },
        { status: 404 }
      );
    }

    // Get all turns for transcript
    const turns = await Turn.find({ attemptId }).sort({ ts: 1 });
    const transcript = turns
      .filter(t => t.role !== "system")
      .map(t => `${t.role.toUpperCase()}: ${t.text}`)
      .join("\n");

    // Get rubric for evaluation
    const rubric = attempt.rubricSnapshot || { 
      weights: { discovery: 25, value: 25, objection: 25, cta: 25 }, 
      hardRules: {} 
    };

    // Generate detailed evaluation
    let evalReport: EvalReport;
    
    try {
      evalReport = await callEvaluatorLLM({ 
        system: EVALUATOR_SYSTEM, 
        transcript, 
        rubric 
      });
      
      // Validate the evaluation structure
      if (!evalReport.score || !evalReport.result || !evalReport.rubric_breakdown) {
        throw new Error('Invalid evaluation response structure');
      }
    } catch (error) {
      console.error('Evaluation error:', error);
      // Fallback evaluation
      evalReport = {
        score: 60,
        result: forcedResult || "advanced",
        rubric_breakdown: { discovery: 15, value: 15, objection: 15, cta: 15 },
        feedback_bullets: [
          "Maintained professional tone throughout conversation",
          "Attempted to understand prospect needs",
          "Could improve on specific value quantification"
        ],
        missed_opportunities: [
          "Could have asked more specific discovery questions",
          "Missed opportunity to address budget concerns directly"
        ]
      };
    }

    // Update attempt with final results
    attempt.result = forcedResult || evalReport.result;
    attempt.score = evalReport.score;
    attempt.endedAt = new Date();
    attempt.state = "TERMINAL";
    await attempt.save();

    // Calculate additional metrics
    const repTurns = turns.filter(t => t.role === 'rep');
    const prospectTurns = turns.filter(t => t.role === 'prospect');
    const duration = attempt.endedAt.getTime() - attempt.startedAt.getTime();

    return NextResponse.json({ 
      eval: evalReport,
      metrics: {
        totalTurns: turns.length,
        repTurns: repTurns.length,
        prospectTurns: prospectTurns.length,
        duration: Math.round(duration / 1000), // seconds
        avgTurnLength: repTurns.length > 0 
          ? Math.round(repTurns.reduce((sum, t) => sum + t.text.length, 0) / repTurns.length)
          : 0
      },
      attempt: {
        id: attempt._id.toString(),
        state: attempt.state,
        result: attempt.result,
        score: attempt.score,
        turnCount: attempt.turnCount
      }
    });
  } catch (error) {
    console.error('End simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to end simulation' },
      { status: 500 }
    );
  }
}

