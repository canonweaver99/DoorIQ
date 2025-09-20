import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function callProspectLLM(params: {
  system: string;
  persona: any;
  state: string;
  history: {role: "user" | "assistant", content: string}[];
  repUtterance: string;
  ragText?: string;
}) {
  const { system, persona, state, history, repUtterance, ragText } = params;
  
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: `${system}\n\nIMPORTANT: Respond ONLY in English. Be a realistic American homeowner.` },
    { role: "system", content: `STATE=${state}` },
    { role: "system", content: `PERSONA=${JSON.stringify(persona)}` },
    ...(ragText ? [{ role: "system", content: `RAG:\n${ragText}` }] : []),
    ...history,
    { role: "user", content: repUtterance }
  ];

  try {
    const res = await client.chat.completions.create({
      model: process.env.MODEL_NAME || 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 200,
      messages
    });
    
    return res.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error('Prospect LLM error:', error);
    throw error;
  }
}

export async function callEvaluatorLLM(params: {
  system: string;
  transcript: string;
  rubric: any;
}) {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: params.system },
    { role: "user", content: `RUBRIC=${JSON.stringify(params.rubric)}` },
    { role: "user", content: `TRANSCRIPT:\n${params.transcript}` }
  ];

  try {
    const res = await client.chat.completions.create({
      model: process.env.MODEL_NAME || 'gpt-4o-mini',
      temperature: 0.2,
      max_tokens: 1000,
      response_format: { type: "json_object" },
      messages
    });
    
    const content = res.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from evaluator LLM');
    }
    
    return JSON.parse(content);
  } catch (error) {
    console.error('Evaluator LLM error:', error);
    // Return fallback evaluation
    return {
      score: 50,
      result: "advanced",
      rubric_breakdown: { discovery: 12, value: 12, objection: 13, cta: 13 },
      feedback_bullets: ["Unable to generate detailed feedback due to API error"],
      missed_opportunities: ["System error prevented detailed analysis"]
    };
  }
}

// Whisper transcription for better accuracy
export async function transcribeWithWhisper(audioBuffer: Buffer): Promise<string> {
  try {
    const file = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
    
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    });
    
    return transcription;
  } catch (error) {
    console.error('Whisper transcription error:', error);
    throw error;
  }
}
