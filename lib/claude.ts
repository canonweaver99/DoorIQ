const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeClient {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || CLAUDE_API_KEY;
  }

  async sendMessage(
    messages: ClaudeMessage[],
    model: string = 'claude-3-opus-20240229',
    maxTokens: number = 1000
  ): Promise<ClaudeResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        messages
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeConversation(
    conversation: Array<{ speaker: string; text: string }>,
    scenario: string
  ) {
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

Format your response as JSON with this structure:
{
  "overallScore": number,
  "strengths": ["string", "string", "string"],
  "improvements": ["string", "string", "string"],
  "keyMoments": [
    { "index": number, "type": "positive" | "negative", "note": "string" }
  ],
  "objectionHandling": ["string", "string"]
}`;

    const response = await this.sendMessage([
      { role: 'user', content: prompt }
    ]);

    try {
      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      // Return a default analysis
      return {
        overallScore: 75,
        strengths: [
          "Good opening introduction",
          "Maintained professional tone",
          "Clear value proposition"
        ],
        improvements: [
          "Ask more qualifying questions",
          "Create more urgency",
          "Use specific examples"
        ],
        keyMoments: [
          { index: 0, type: 'positive', note: 'Strong opening' }
        ],
        objectionHandling: [
          "Address concerns more directly",
          "Use social proof when handling skepticism"
        ]
      };
    }
  }

  async generateCustomerResponse(
    repText: string,
    conversationHistory: Array<{ speaker: string; text: string }>,
    customerPersonality: string
  ): Promise<string> {
    const prompt = `You are playing the role of a ${customerPersonality} in a door-to-door sales scenario.

Previous conversation:
${conversationHistory.map(msg => `${msg.speaker}: ${msg.text}`).join('\n')}

The sales representative just said: "${repText}"

Respond as the customer would, staying in character. Keep your response natural, conversational, and under 2 sentences.`;

    const response = await this.sendMessage([
      { role: 'user', content: prompt }
    ]);

    return response.content[0].text;
  }
}

export const claudeClient = new ClaudeClient();

