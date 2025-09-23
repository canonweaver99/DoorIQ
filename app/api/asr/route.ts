// WebSocket ASR will be added later if needed
// For now, OpenAI Realtime handles STT directly
export async function GET() {
  return new Response('ASR WebSocket endpoint - not implemented yet', { status: 501 });
}