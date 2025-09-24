'use client';
import { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from "next/navigation";
import { Mic, PhoneOff } from 'lucide-react';
import { useRealtimeSession } from './useRealtimeSession';
import { useElevenAgentSession } from './useElevenAgentSession';
import type { Status, Turn } from './types';

// Inline StatusChip component
function StatusChip({ status }: { status: Status }) {
  const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');
  
  const map: Record<Status, { label: string; cls: string }> = {
    idle: { label: 'Idle', cls: 'bg-gray-500/20 text-gray-300 border-gray-500/30' },
    connecting: { label: 'Connecting', cls: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
    listening: { label: 'Listening', cls: 'bg-green-500/20 text-green-300 border-green-500/30' },
    speaking: { label: 'Speaking', cls: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    error: { label: 'Error', cls: 'bg-red-500/20 text-red-300 border-red-500/30' },
  };
  
  const m = map[status];
  return (
    <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm', m.cls)}>
      <div className={cn('w-2 h-2 rounded-full', status === 'error' ? 'bg-red-400' : 'bg-current')} />
      {m.label}
    </div>
  );
}

export default function Trainer() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading…</div>}>
      <TrainerInner />
    </Suspense>
  );
}

function TrainerInner() {
  const search = useSearchParams();
  const router = useRouter();
  const [engine, setEngine] = useState<'openai' | 'eleven'>((search?.get('engine') as any) === 'eleven' ? 'eleven' : 'openai');

  const openai = useRealtimeSession();
  const eleven = useElevenAgentSession(search?.get('agent_id') || undefined);

  const api = useMemo(() => engine === 'eleven' ? eleven : openai, [engine, eleven, openai]);
  const { status, error, connected, transcript, isSpeaking, elapsedSeconds, currentScenario, micEnabled } = api as any;

  const connect = (api as any).connect as () => Promise<void>;
  const disconnect = (api as any).disconnect as () => Promise<void>;
  const toggleMic = (api as any).toggleMic as () => void;

  const start = useCallback(async () => { await connect(); }, [connect]);
  const stop = useCallback(async () => {
    await disconnect();
    const duration = formatTime(elapsedSeconds);
    const transcriptData = encodeURIComponent(JSON.stringify(transcript));
    router.push(`/feedback?duration=${duration}&transcript=${transcriptData}`);
  }, [disconnect, elapsedSeconds, transcript, router]);

  useEffect(() => {
    const a = search?.get('autostart');
    if (a === '1' && !connected) { start().catch(() => {}); }
  }, [search, connected, start]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { 
        e.preventDefault(); 
        if (connected) {
          toggleMic();
        } else {
          start().catch(() => {});
        }
      }
      if (e.code === 'Escape') { 
        e.preventDefault(); 
        if (connected) stop().catch(() => {}); 
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connected, toggleMic, start, stop]);

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
              alt="Amanda Rodriguez" 
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to initials if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 items-center justify-center" style={{display: 'none'}}>
              <span className="text-6xl font-bold text-white">AR</span>
            </div>
            
            {/* Speaking indicator */}
            {isSpeaking && (
              <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse" />
            )}
          </div>
        </div>

        <h2 className="text-2xl font-semibold mb-2">Amanda Rodriguez</h2>
        {currentScenario && (
          <div className="text-center mb-6">
            <p className="text-lg text-purple-300 font-medium">{currentScenario.name}</p>
            <p className="text-sm text-gray-400 capitalize">Mood: {currentScenario.mood}</p>
          </div>
        )}

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
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-6">
            <button
              className={`relative w-20 h-20 rounded-full transition-all duration-200 ${
                connected && micEnabled
                  ? 'bg-green-600 hover:bg-green-700 shadow-lg animate-pulse-mic'
                  : connected && !micEnabled
                  ? 'bg-yellow-600 hover:bg-yellow-700 shadow-md'
                  : 'bg-gray-700 hover:bg-gray-600 shadow-md'
              }`}
              onClick={connected ? toggleMic : start}
              disabled={status === 'connecting'}
              title={connected ? (micEnabled ? 'Mute microphone' : 'Unmute microphone') : 'Start conversation'}
            >
              {status === 'connecting' ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              ) : connected ? (
                micEnabled ? <Mic className="h-8 w-8 text-white" /> : <Mic className="h-8 w-8 text-white opacity-50" />
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

          <p className="text-xs text-gray-500 text-center">
            {connected ? 'Press Space to toggle mic • Press Escape to end' : 'Press Space to start • Press Escape to end'}
          </p>
          
          {connected && (
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-3 h-3 rounded-full ${micEnabled ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-gray-400">
                Microphone: {micEnabled ? 'LIVE' : 'MUTED'}
              </span>
            </div>
          )}
        </div>
      </div>
      
      <audio ref={api.audioRef as any} autoPlay />
    </div>
  );
}