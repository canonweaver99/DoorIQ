import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ConversationContext {
  scenario: string;
  customerPersonality: string;
  conversationHistory: Array<{ role: string; content: string }>;
  performanceMetrics: {
    rapportScore: number;
    objectionHandling: number;
    closingStrength: number;
    activeListening: number;
  };
}

export class AIConversationManager {
  private context: ConversationContext;

  constructor(scenario: string) {
    this.context = {
      scenario,
      customerPersonality: this.generatePersonality(scenario),
      conversationHistory: [],
      performanceMetrics: {
        rapportScore: 0,
        objectionHandling: 0,
        closingStrength: 0,
        activeListening: 0,
      },
    };
  }

  private generatePersonality(scenario: string): string {
    const personalities: Record<string, string> = {
      skeptical_homeowner: `You are a skeptical homeowner who:
        - Is naturally suspicious of door-to-door salespeople
        - Values their time and hates feeling pressured
        - Has had bad experiences with salespeople before
        - Needs to see clear value before considering any offer
        - Responds well to genuine rapport and honesty
        - Will test the salesperson with tough questions`,
      
      busy_professional: `You are a busy professional who:
        - Has very limited time and is always in a rush
        - Makes decisions quickly based on ROI
        - Appreciates efficiency and directness
        - Is interested if the value proposition is clear
        - Responds poorly to long-winded pitches
        - Values data and concrete benefits`,
      
      friendly_curious: `You are a friendly, curious homeowner who:
        - Is generally open to hearing about new products
        - Asks lots of questions out of genuine interest
        - Takes time to make decisions
        - Values relationships and trust
        - Can be indecisive without gentle guidance
        - Responds well to enthusiasm and expertise`,
      
      price_conscious: `You are a price-conscious customer who:
        - Is primarily concerned about cost
        - Compares everything to cheaper alternatives
        - Needs to understand the long-term value
        - Is skeptical of "too good to be true" offers
        - Responds well to payment plans and guarantees
        - Will negotiate on price if interested`,
    };

    return personalities[scenario] ?? personalities["skeptical_homeowner"];
  }

  async generateResponse(salesRepMessage: string): Promise<{
    response: string;
    emotion: string;
    internalThought: string;
  }> {
    // Add the sales rep's message to history
    this.context.conversationHistory.push({
      role: 'sales_rep',
      content: salesRepMessage,
    });

    // Analyze the sales rep's approach
    const analysis = await this.analyzeSalesApproach(salesRepMessage);
    
    // Generate customer response using GPT-4
    const systemPrompt = `${this.context.customerPersonality}
    
    Current emotional state: Consider the conversation so far and respond authentically.
    Internal monologue: Think about what this customer would really be thinking.
    
    Respond naturally as this customer would, including:
    - Interruptions if the pitch is too long
    - Emotional reactions (sighs, laughs, frustration)
    - Body language cues [describe in brackets]
    - Natural speech patterns and filler words
    
    Keep responses concise and realistic.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...this.context.conversationHistory.map(msg => ({
          role: msg.role === 'sales_rep' ? 'user' : 'assistant',
          content: msg.content,
        })),
      ],
      temperature: 0.8,
      max_tokens: 150,
    });

    const customerResponse = response.choices[0].message.content || '';
    
    // Extract emotion and internal thought
    const emotionMatch = customerResponse.match(/\[(.*?)\]/);
    const emotion = emotionMatch ? emotionMatch[1] : 'neutral';
    
    // Generate internal thought
    const thoughtResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'What is this customer thinking but not saying? Be brief and insightful.',
        },
        {
          role: 'user',
          content: `Customer said: "${customerResponse}"\nWhat are they really thinking?`,
        },
      ],
      max_tokens: 50,
    });

    const internalThought = thoughtResponse.choices[0].message.content || '';

    // Update conversation history
    this.context.conversationHistory.push({
      role: 'customer',
      content: customerResponse,
    });

    // Update performance metrics
    this.updateMetrics(analysis);

    return {
      response: customerResponse.replace(/\[.*?\]/g, '').trim(),
      emotion,
      internalThought,
    };
  }

  private async analyzeSalesApproach(message: string): Promise<any> {
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Analyze this sales pitch for:
            1. Rapport building (0-10)
            2. Objection handling (0-10)
            3. Closing strength (0-10)
            4. Active listening (0-10)
            5. Key strengths and weaknesses
            Return as JSON.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 200,
    });

    return JSON.parse(analysis.choices[0].message.content || '{}');
  }

  private updateMetrics(analysis: any) {
    // Rolling average of metrics
    const weight = 0.3; // Weight for new values
    this.context.performanceMetrics.rapportScore = 
      this.context.performanceMetrics.rapportScore * (1 - weight) + analysis.rapport * weight;
    this.context.performanceMetrics.objectionHandling = 
      this.context.performanceMetrics.objectionHandling * (1 - weight) + analysis.objection_handling * weight;
    this.context.performanceMetrics.closingStrength = 
      this.context.performanceMetrics.closingStrength * (1 - weight) + analysis.closing_strength * weight;
    this.context.performanceMetrics.activeListening = 
      this.context.performanceMetrics.activeListening * (1 - weight) + analysis.active_listening * weight;
  }

  async generateDetailedFeedback(): Promise<{
    overallScore: number;
    strengths: string[];
    improvements: string[];
    specificExamples: Array<{
      moment: string;
      feedback: string;
      suggestion: string;
    }>;
    nextSteps: string[];
  }> {
    const conversationText = this.context.conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    const feedbackResponse = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert sales coach. Analyze this door-to-door sales conversation and provide detailed, actionable feedback. Focus on:
            1. Specific moments that went well or poorly
            2. Concrete suggestions for improvement
            3. Recognition of good techniques used
            4. Areas where the approach could be refined
            Be encouraging but honest. Provide specific examples from the conversation.`,
        },
        {
          role: 'user',
          content: `Analyze this conversation:\n\n${conversationText}\n\nProvide detailed feedback in JSON format with: overallScore (0-100), strengths (array), improvements (array), specificExamples (array of {moment, feedback, suggestion}), nextSteps (array).`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    return JSON.parse(feedbackResponse.choices[0].message.content || '{}');
  }

  getMetrics() {
    return this.context.performanceMetrics;
  }

  getConversationHistory() {
    return this.context.conversationHistory;
  }
}

// Whisper integration for better speech recognition
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      language: 'en',
    });

    return transcription.text;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw error;
  }
}

// Generate more natural speech with voice variations
export async function generateSpeech(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
  emotion?: string
): Promise<Buffer> {
  try {
    // Add emotional cues to the text if provided
    const enhancedText = emotion ? `[Speaking ${emotion}] ${text}` : text;

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1-hd',
      voice: voice,
      input: enhancedText,
      speed: 1.0,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error('Speech generation error:', error);
    throw error;
  }
}

