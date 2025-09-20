import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResponse(
  state: string,
  persona: any,
  ragText: string | null,
  history: ChatCompletionMessageParam[],
  repUtterance: string
) {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system" as const, content: `STATE=${state}` },
    { role: "system" as const, content: `PERSONA=${JSON.stringify(persona)}` },
    ...(ragText ? [{ role: "system" as const, content: `RAG:\n${ragText}` } as ChatCompletionMessageParam] : []),
    ...history,
    { role: "user" as const, content: repUtterance }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: messages,
  });

  return completion.choices[0].message.content;
}

// Legacy functions for backward compatibility
export async function callProspectLLM(params: {
  system: string;
  persona: any;
  state: string;
  history: ChatCompletionMessageParam[];
  repUtterance: string;
  ragText?: string;
}) {
  const { system, persona, state, history, repUtterance, ragText } = params;
  
  const messages: ChatCompletionMessageParam[] = [
    { role: "system" as const, content: `${system}\n\nIMPORTANT: Respond ONLY in English. Be a realistic American homeowner.` },
    { role: "system" as const, content: `STATE=${state}` },
    { role: "system" as const, content: `PERSONA=${JSON.stringify(persona)}` },
    ...(ragText ? [{ role: "system" as const, content: `RAG:\n${ragText}` } as ChatCompletionMessageParam] : []),
    ...history,
    { role: "user" as const, content: repUtterance }
  ];

  try {
    const res = await openai.chat.completions.create({
      model: process.env.MODEL_NAME || 'gpt-4o-mini',
      temperature: 0.6,
      messages
    });
    return res.choices[0]?.message?.content?.trim() || "";
  } catch (error) {
    console.error("Error calling Prospect LLM:", error);
    return "I'm sorry, I'm having trouble responding right now. Can you please repeat that?";
  }
}

export async function callEvaluatorLLM(params: {
  system: string;
  transcript: string;
  rubric: any;
}) {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system" as const, content: params.system },
    { role: "user" as const, content: `RUBRIC=${JSON.stringify(params.rubric)}` },
    { role: "user" as const, content: `TRANSCRIPT:\n${params.transcript}` }
  ];

  try {
    const res = await openai.chat.completions.create({
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
    console.error("Error calling Evaluator LLM:", error);
    return {
      score: 0,
      result: "rejected",
      rubric_breakdown: { discovery:0, value:0, objection:0, cta:0 },
      feedback_bullets: ["Error during evaluation."],
      missed_opportunities: ["Could not generate detailed feedback."]
    };
  }
}