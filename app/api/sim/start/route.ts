import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { PersonaFactory } from "@/lib/persona-engine";
import type { Persona } from "@/lib/types";
import type { HomeownerPersona } from "@/lib/personas";

function makePersona(scenario?: any): Persona {
  const personas: Persona[] = [
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

// New conversion function
function convertHomeownerPersonaToPersona(homeowner: HomeownerPersona): Persona {
  return {
    company: `${homeowner.name}'s Home`,
    vertical: "Residential",
    size: homeowner.backgroundInfo.familySize,
    role: homeowner.occupation,
    pain: homeowner.backgroundInfo.previousPestIssues || ["general pest concerns"],
    budget: "$100-300/month", // Default range
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
    console.log('Starting simulation with Supabase...');
    
    const body = await req.json().catch(() => ({}));
    console.log('Request body:', body);
    
    // Use persona data from request or generate random one
    const persona = body.personaData 
      ? convertHomeownerPersonaToPersona(body.personaData)
      : makePersona();
    
    console.log('Persona created:', persona);
    
    // Create new attempt in Supabase
    const { data: attempt, error } = await supabaseAdmin
      .from('attempts')
      .insert({
        user_id: body.userId || "demo-user",
        persona: persona,
        state: "OPENING",
        turn_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Attempt created:', attempt.id);

    // Generate initial greeting based on persona data
    const greeting = body.personaData?.conversationStyle?.greeting || 
                    "Hello, what can I help you with today?";

    console.log('Sending response with greeting:', greeting);

    return NextResponse.json({ 
      attemptId: attempt.id, 
      persona, 
      state: "OPENING",
      reply: greeting
    });
  } catch (error) {
    console.error('Start simulation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      { 
        error: 'Failed to start simulation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}