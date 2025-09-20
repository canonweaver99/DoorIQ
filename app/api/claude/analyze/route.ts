import { NextRequest, NextResponse } from 'next/server';

interface ConversationMessage {
  speaker: 'rep' | 'customer';
  text: string;
}

// Analyze conversation using Claude API
async function analyzeWithClaude(conversation: ConversationMessage[], scenario: string) {
  if (!process.env.CLAUDE_API_KEY) {
    // Return mock analysis for demo
    return {
      overallScore: 75,
      strengths: [
        "Good opening with clear value proposition",
        "Maintained professional tone throughout",
        "Addressed customer concerns effectively"
      ],
      improvements: [
        "Could have asked more qualifying questions",
        "Missed opportunity to create urgency",
        "Consider mentioning specific neighbor success stories"
      ],
      keyMoments: [
        { index: 1, type: 'positive', note: 'Strong introduction with company name' },
        { index: 3, type: 'negative', note: 'Could have handled objection better' }
      ]
    };
  }

  const prompt = `Analyze this door-to-door sales conversation and provide detailed feedback.

Scenario: ${scenario}

Conversation:
${conversation.map((msg, i) => `${i + 1}. ${msg.speaker.toUpperCase()}: ${msg.text}`).join('\n')}

Please analyze and provide:
1. Overall performance score (0-100)
2. Top 3 strengths
3. Top 3 areas for improvement
4. Key conversation moments (positive and negative)
5. Specific suggestions for handling objections better

Format your response as JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude API error');
    }

    const data = await response.json();
    return JSON.parse(data.content[0].text);
  } catch (error) {
    console.error('Claude analysis error:', error);
    // Return mock analysis
    return {
      overallScore: 75,
      strengths: [
        "Good opening with clear value proposition",
        "Maintained professional tone throughout",
        "Addressed customer concerns effectively"
      ],
      improvements: [
        "Could have asked more qualifying questions",
        "Missed opportunity to create urgency",
        "Consider mentioning specific neighbor success stories"
      ],
      keyMoments: [
        { index: 1, type: 'positive', note: 'Strong introduction with company name' },
        { index: 3, type: 'negative', note: 'Could have handled objection better' }
      ]
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { conversation, scenario, duration } = await request.json();
    
    // Get Claude's analysis
    const analysis = await analyzeWithClaude(conversation, scenario);
    
    // Calculate additional metrics
    const repMessages = conversation.filter((m: ConversationMessage) => m.speaker === 'rep');
    const customerMessages = conversation.filter((m: ConversationMessage) => m.speaker === 'customer');
    
    return NextResponse.json({
      ...analysis,
      metrics: {
        totalMessages: conversation.length,
        repMessages: repMessages.length,
        customerMessages: customerMessages.length,
        avgResponseTime: duration / repMessages.length,
        conversationDuration: duration
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to analyze conversation' },
      { status: 500 }
    );
  }
}

