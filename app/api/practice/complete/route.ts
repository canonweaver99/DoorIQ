import { NextRequest, NextResponse } from 'next/server';

// Analyze conversation and provide feedback
const analyzePerformance = (conversation: any[], scenario: string, duration: number) => {
  const repMessages = conversation.filter(m => m.speaker === 'rep');
  const customerMessages = conversation.filter(m => m.speaker === 'customer');
  
  // Basic scoring metrics
  let score = 50; // Base score
  const feedback = {
    strengths: [] as string[],
    improvements: [] as string[],
    tips: [] as string[]
  };

  // Analyze rep's performance
  const allRepText = repMessages.map(m => m.text).join(' ').toLowerCase();
  
  // Positive indicators
  if (allRepText.includes('free assessment') || allRepText.includes('no cost')) {
    score += 10;
    feedback.strengths.push('Good job mentioning the free assessment early');
  }
  
  if (allRepText.includes('neighbor') || allRepText.includes('your area')) {
    score += 10;
    feedback.strengths.push('Nice local connection - mentioning neighbors builds trust');
  }
  
  if (allRepText.includes('save') || allRepText.includes('lower your bill')) {
    score += 10;
    feedback.strengths.push('Excellent focus on customer benefits (savings)');
  }
  
  // Check conversation flow
  if (repMessages.length >= 3 && repMessages.length <= 6) {
    score += 10;
    feedback.strengths.push('Good conversation pacing - not too pushy, not too passive');
  }
  
  // Areas for improvement
  if (!allRepText.includes('my name') && !allRepText.includes("i'm")) {
    score -= 5;
    feedback.improvements.push('Remember to introduce yourself by name');
  }
  
  if (duration > 180) { // More than 3 minutes
    score -= 5;
    feedback.improvements.push('Try to keep initial conversations under 3 minutes');
  }
  
  if (repMessages.length < 2) {
    score -= 10;
    feedback.improvements.push('Engage more with the customer - ask questions and build rapport');
  }
  
  // Scenario-specific feedback
  if (scenario === 'skeptical_homeowner') {
    feedback.tips.push('With skeptical customers, focus on credibility and social proof');
  } else if (scenario === 'busy_professional') {
    feedback.tips.push('For busy professionals, lead with time-saving benefits and be concise');
  } else if (scenario === 'friendly_curious') {
    feedback.tips.push('Friendly customers appreciate detailed explanations - take your time');
  }
  
  // Final score adjustment
  score = Math.max(0, Math.min(100, score));
  
  return {
    score,
    rating: Math.round(score / 20), // 1-5 star rating
    feedback,
    metrics: {
      totalMessages: conversation.length,
      repMessages: repMessages.length,
      avgResponseLength: Math.round(allRepText.length / repMessages.length),
      duration: duration
    }
  };
};

export async function POST(request: NextRequest) {
  try {
    const { sessionId, conversation, scenario, duration } = await request.json();
    
    // Analyze the conversation
    const analysis = analyzePerformance(conversation, scenario, duration);
    
    // In production, save to database
    // await prisma.session.update({
    //   where: { id: sessionId },
    //   data: {
    //     conversation,
    //     rating: analysis.rating,
    //     feedback: analysis.feedback,
    //     duration
    //   }
    // });
    
    return NextResponse.json({
      sessionId,
      ...analysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to complete session analysis' },
      { status: 500 }
    );
  }
}


