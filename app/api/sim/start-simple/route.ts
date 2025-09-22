import { NextResponse } from "next/server";
import type { Persona } from "@/lib/types";
import type { HomeownerPersona } from "@/lib/personas";

// Simplified makePersona for testing
function makePersona(): Persona {
  return {
    company: "Test Home",
    vertical: "Residential",
    size: 2,
    role: "Test Homeowner",
    pain: ["test bugs"],
    urgency: "medium",
    objections: ["test objection"],
    hiddenGoal: "test goal",
    successCriteria: {}
  };
}

function convertHomeownerPersonaToPersona(homeowner: HomeownerPersona): Persona {
  return {
    company: `${homeowner.name}'s Home`,
    vertical: "Residential",
    size: homeowner.backgroundInfo.familySize,
    role: homeowner.occupation,
    pain: homeowner.backgroundInfo.previousPestIssues || ["general pest concerns"],
    budget: "$100-300/month",
    urgency: homeowner.temperature === 'warm' || homeowner.temperature === 'interested' ? "high" : 
             homeowner.temperature === 'neutral' ? "medium" : "low",
    objections: homeowner.conversationStyle.objections,
    hiddenGoal: `${homeowner.personality} - responds to ${homeowner.conversationStyle.interests.join(', ')}`,
    successCriteria: {
      requiresROIQuant: homeowner.temperature === 'skeptical',
      requiresScheduling: true,
      requiresBudgetCheck: homeowner.temperature !== 'warm'
    }
  };
}

export async function POST(req: Request) {
  try {
    console.log('Starting simple simulation...');
    const body = await req.json().catch(() => ({}));
    console.log('Request body (simple):', body);

    const persona = body.personaData 
      ? convertHomeownerPersonaToPersona(body.personaData)
      : makePersona();

    console.log('Persona created (simple):', persona);

    const greeting = body.personaData?.conversationStyle?.greeting || 
                    "Hello, what can I help you with today?";

    console.log('Sending simple response with greeting:', greeting);

    return NextResponse.json({ 
      attemptId: "mock-attempt-id-" + Date.now(), 
      persona, 
      state: "OPENING",
      reply: greeting
    });
  } catch (error) {
    console.error('Start simple simulation error:', error);
    return NextResponse.json(
      { error: 'Failed to start simple simulation', details: (error as Error).message },
      { status: 500 }
    );
  }
}
