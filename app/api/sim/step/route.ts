import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Attempt from "@/models/Attempt";
import Turn from "@/models/Turn";
import { retrieveRAG } from "@/lib/rag";
import { callProspectLLM } from "@/lib/llm";
import { PROSPECT_SYSTEM } from "@/lib/prompts";
import { inferNextState, shouldTerminate, analyzeConversationQuality } from "@/lib/fsm";
import { PersonaEngine } from "@/lib/persona-engine";

export async function POST(req: Request) {
  try {
    await db();
    
    const { attemptId, repUtterance } = await req.json();
    
    if (!attemptId || !repUtterance) {
      return NextResponse.json(
        { error: 'Missing attemptId or repUtterance' },
        { status: 400 }
      );
    }

    const attempt = await Attempt.findById(attemptId);
    if (!attempt || attempt.state === "TERMINAL") {
      return NextResponse.json(
        { error: "Invalid attempt or already terminated" },
        { status: 400 }
      );
    }

    // Get conversation history
    const historyTurns = await Turn.find({ attemptId }).sort({ ts: 1 });
    const history = historyTurns
      .filter(t => t.role !== "system")
      .map(t => ({ 
        role: t.role === "rep" ? "user" as const : "assistant" as const, 
        content: t.text 
      }));

    // Save rep's turn
    await Turn.create({ 
      attemptId, 
      role: "rep", 
      text: repUtterance,
      meta: { state: attempt.state }
    });

    // Get relevant knowledge for this context
    const rag = await retrieveRAG(repUtterance, 3);
    
    // Create persona engine for advanced behavioral modeling
    const personaEngine = new PersonaEngine(attempt.persona);
    
    // Update persona state based on rep's message
    personaEngine.updateFromRepMessage(repUtterance);
    
    // Get behavioral context for more realistic responses
    const behavioralContext = personaEngine.getBehavioralContext();
    
    // Generate prospect response with enhanced context
    const enhancedSystem = `${PROSPECT_SYSTEM}\n\nCURRENT BEHAVIORAL STATE: ${behavioralContext}`;
    
    const prospectReply = await callProspectLLM({
      system: enhancedSystem,
      persona: attempt.persona,
      state: attempt.state,
      history,
      repUtterance,
      ragText: rag
    });

    // Determine next state using FSM
    const { next, terminal } = inferNextState(attempt.state, repUtterance, prospectReply);
    
    // Save prospect's turn
    await Turn.create({ 
      attemptId, 
      role: "prospect", 
      text: prospectReply, 
      meta: { state: next, terminal }
    });

    // Check if conversation should terminate
    const terminationCheck = shouldTerminate(
      attempt.turnCount + 1,
      next,
      prospectReply,
      repUtterance
    );

    // Update attempt
    attempt.state = terminationCheck.terminal ? "TERMINAL" : next;
    attempt.turnCount += 1;
    
    if (terminationCheck.terminal) {
      attempt.result = terminationCheck.result;
      attempt.endedAt = new Date();
    }
    
    await attempt.save();

    // Get real-time quality analysis
    const allTurns = await Turn.find({ attemptId }).sort({ ts: 1 });
    const qualityAnalysis = analyzeConversationQuality(allTurns);

    return NextResponse.json({ 
      prospectReply, 
      state: attempt.state,
      terminal: terminal || terminationCheck.terminal,
      result: terminal || terminationCheck.result,
      turnCount: attempt.turnCount,
      liveMetrics: {
        discovery: qualityAnalysis.discoveryScore,
        value: qualityAnalysis.valueScore,
        objection: qualityAnalysis.objectionScore,
        cta: qualityAnalysis.ctaScore,
        suggestions: qualityAnalysis.suggestions
      }
    });
  } catch (error) {
    console.error('Simulation step error:', error);
    return NextResponse.json(
      { error: 'Failed to process simulation step' },
      { status: 500 }
    );
  }
}
