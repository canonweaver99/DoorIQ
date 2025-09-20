import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import Attempt from "@/models/Attempt";
import Scenario from "@/models/Scenario";
import Rubric from "@/models/Rubric";
import { PersonaFactory } from "@/lib/persona-engine";
import type { Persona } from "@/lib/types";

function makePersona(scenario?: any): Persona {
  const personas = [
    {
      company: "Suburban Family Home",
      vertical: "Residential",
      size: 1,
      role: "Homeowner",
      pain: ["ants in kitchen", "spiders in basement", "mice in garage"],
      budget: "$100-300/month",
      urgency: "medium",
      objections: [
        "we don't have bugs right now",
        "too expensive", 
        "we use DIY sprays",
        "need to talk to my spouse",
        "had bad experience before"
      ],
      hiddenGoal: "will buy if rep demonstrates value for current pest issues AND offers family-safe treatment",
      successCriteria: { 
        requiresROIQuant: false, 
        requiresScheduling: true,
        requiresBudgetCheck: true
      }
    },
    {
      company: "Elderly Couple Home",
      vertical: "Residential", 
      size: 1,
      role: "Retired Homeowner",
      pain: ["termites concern", "general prevention", "fixed income budget"],
      budget: "$50-150/month",
      urgency: "low",
      objections: [
        "on fixed income",
        "don't trust door-to-door sales",
        "need to research first",
        "what chemicals do you use",
        "we're too old for this"
      ],
      hiddenGoal: "will consider service if rep is patient, explains safety, and offers senior discount",
      successCriteria: {
        requiresROIQuant: false,
        requiresScheduling: true, 
        requiresBudgetCheck: true
      }
    },
    {
      company: "Young Professional Home",
      vertical: "Residential",
      size: 1, 
      role: "Busy Professional",
      pain: ["no time for pest issues", "roaches in apartment", "wants preventive care"],
      budget: "$150-400/month",
      urgency: "high",
      objections: [
        "too busy to deal with this",
        "rent, not own",
        "landlord should handle",
        "need it done quickly",
        "what's included"
      ],
      hiddenGoal: "will buy if rep offers quick scheduling and comprehensive service",
      successCriteria: {
        requiresROIQuant: false,
        requiresScheduling: true,
        requiresBudgetCheck: false
      }
    }
  ];
  
  return personas[Math.floor(Math.random() * personas.length)];
}

export async function POST(req: Request) {
  try {
    await db();
    
    const body = await req.json().catch(() => ({}));
    const scenarioId = body.scenarioId;
    
    // Get scenario or use default
    const scenario = scenarioId 
      ? await Scenario.findById(scenarioId)
      : await Scenario.findOne();
    
    // Get rubric or use default
    const rubric = await Rubric.findOne() || {
      name: "Standard Sales Rubric",
      weights: { discovery: 25, value: 25, objection: 25, cta: 25 },
      hardRules: {}
    };

    // Use advanced persona factory for more sophisticated personas
    const personaType = body.personaType || 'random';
    const persona = personaType === 'random' 
      ? PersonaFactory.createRandomPestControlPersona()
      : PersonaFactory.createPersonaByType(personaType);
    
    // Create new attempt
    const attempt = await Attempt.create({
      userId: body.userId || "demo-user",
      scenarioId: scenario?._id,
      persona,
      state: "OPENING",
      turnCount: 0,
      rubricSnapshot: rubric
    });

    return NextResponse.json({ 
      attemptId: attempt._id.toString(), 
      persona, 
      state: "OPENING",
      scenario: scenario ? {
        title: scenario.title,
        vertical: scenario.vertical,
        difficulty: scenario.difficulty,
        goal: scenario.goal
      } : null
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to start simulation' },
      { status: 500 }
    );
  }
}
