'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from "next/navigation";
import { Mic, PhoneOff } from 'lucide-react';
import StatusChip from './StatusChip';
import { useRealtimeSession } from './useRealtimeSession';
import type { Status, Turn } from './types';

export default function Trainer() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading…</div>}>
      <TrainerInner />
    </Suspense>
  );
}

function TrainerInner() {
  const search = useSearchParams();
  const { audioRef, status, error, connected, transcript, isSpeaking, elapsedSeconds, connect, disconnect } = useRealtimeSession();
  const [agent, setAgent] = useState<any>(null);

  async function start() { 
    await connect(); 
    // Fetch agent data
    try {
      const res = await fetch('/api/agent');
      const data = await res.json();
      setAgent(data);
    } catch {}
  }

  async function stop() {
    await disconnect();
  }

  // Auto-start if ?autostart=1
  useEffect(() => {
    const a = search?.get('autostart');
    if (a === '1' && !connected) {
      start().catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { 
        e.preventDefault(); 
        if (!connected) start().catch(() => {}); 
      }
      if (e.code === 'Escape') { 
        e.preventDefault(); 
        if (connected) stop().catch(() => {}); 
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connected]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white flex flex-col">
      {/* Status bar */}
      <div className="flex justify-between items-center p-4 border-b border-white/10">
        <div className="text-sm text-gray-400 font-mono">
          {formatTime(elapsedSeconds)}
        </div>
        <StatusChip status={(status as Status)} />
        {error && (
          <button onClick={start} className="text-sm px-3 py-1 rounded-lg text-red-200 border border-red-500/40 hover:bg-red-500/20 transition">
            Retry
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Floating Avatar */}
        <div className="relative mb-8">
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-2xl relative">
            {agent?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={agent.avatar_url} alt={agent.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-6xl font-bold text-white">AR</span>
              </div>
            )}
            
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-2">{agent?.name || 'Amanda Rodriguez'}</h2>
        <p className="text-gray-400 mb-8">{agent?.persona_description || 'Suburban Mom'}</p>

        {/* Live Transcript */}
        <div className="w-full max-w-3xl bg-white/5 border border-white/10 rounded-xl p-6 max-h-80 overflow-y-auto custom-scrollbar mb-8">
          <h3 className="text-lg font-semibold mb-4 text-center">Live Transcript</h3>
          <div className="space-y-3">
            {transcript.length === 0 && (
              <div className="text-center text-gray-500 italic">
                Start the conversation to see the transcript here.
              </div>
            )}
            {transcript.map((turn: Turn, index: number) => (
              <div
                key={turn.id || index}
                className={`flex ${turn.speaker === 'rep' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                    turn.speaker === 'rep'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {turn.speaker === 'rep' ? 'You' : 'Amanda'}
                  </div>
                  <div>{turn.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            className={`relative w-20 h-20 rounded-full transition-all duration-200 ${
              connected && status === 'listening'
                ? 'bg-green-600 hover:bg-green-700 shadow-lg animate-pulse-mic'
                : 'bg-gray-700 hover:bg-gray-600 shadow-md'
            }`}
            onClick={connected ? () => {} : start}
            disabled={status === 'connecting'}
          >
            {status === 'connecting' ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            ) : connected ? (
              <Mic className="h-8 w-8 text-white" />
            ) : (
              <PhoneOff className="h-8 w-8 text-gray-300" />
            )}
          </button>
          
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold text-lg disabled:opacity-50"
            onClick={stop}
            disabled={!connected}
          >
            End & Grade
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Press Space to start • Press Escape to end
        </p>
      </div>
      
      <audio ref={audioRef as any} autoPlay />
    </div>
  );
}