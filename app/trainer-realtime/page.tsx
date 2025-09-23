'use client';
import { useEffect, useRef, useState } from 'react';
import type { RealtimeSession } from '@openai/agents/realtime';

export default function TrainerRealtime() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const sessionRef = useRef<RealtimeSession | null>(null);

  async function start() {
    setError(null);
    try {
      const t = await fetch('/api/realtime/token').then(r => r.json());
      if (!t?.token) { setError('No realtime token'); return; }

      const { RealtimeAgent, RealtimeSession } = await import('@openai/agents/realtime');
      const agent = new RealtimeAgent({
        name: 'Amanda',
        instructions: 'You are Amanda Rodriguez, a realistic suburban homeowner used to train sales reps. Keep responses short, natural, and time-aware.',
      });
      const session = new RealtimeSession(agent);
      sessionRef.current = session as any;

      // optional message listener
      session.on('message', (m: any) => {
        if (m?.content) {
          setMessages(prev => [...prev, { role: m.role === 'assistant' ? 'assistant' : 'user', text: String(m.content) }]);
        }
      });

      await session.connect({ apiKey: t.token });
      setConnected(true);
    } catch (e: any) {
      setError(e?.message || 'start-failed');
    }
  }

  async function stop() {
    try { await sessionRef.current?.disconnect(); } catch {}
    setConnected(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">DoorIQ Realtime (OpenAI)</h1>
        <p className="text-gray-400">This page uses OpenAI Realtime for fully streamed STT + TTS. Click Start to connect mic and audio.</p>

        <div className="flex gap-3">
          {!connected ? (
            <button onClick={start} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded">Start</button>
          ) : (
            <button onClick={stop} className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded">Stop</button>
          )}
        </div>

        {error && <p className="text-red-400">{error}</p>}

        <div className="bg-white/10 border border-white/20 rounded p-4 h-64 overflow-auto">
          {messages.map((m, i) => (
            <div key={i} className="mb-2">
              <b className="text-sm text-gray-300">{m.role === 'assistant' ? 'Amanda' : 'You'}:</b> {m.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


