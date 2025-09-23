'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from "next/navigation";
import PersonaCard from './PersonaCard';
import StatusChip from './StatusChip';
import TranscriptList from './TranscriptList';
import ControlsBar from './ControlsBar';
import { useRealtimeSession } from './useRealtimeSession';
import type { Status } from './types';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  async function start() { await connect(); }

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

  // Keyboard shortcuts: space toggles mic; esc ends session
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); if (!connected) start().catch(() => {}); }
      if (e.code === 'Escape') { e.preventDefault(); if (connected) stop().catch(() => {}); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connected]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white">
      <div className="max-w-6xl mx-auto p-4 md:p-8 grid md:grid-cols-2 gap-6">
        <div className="space-y-4 order-2 md:order-1">
          <PersonaCard name="Amanda" avatarUrl={avatarUrl || undefined} />
        </div>
        <div className="order-1 md:order-2">
          <div className="rounded-2xl bg-white/5 border border-white/10 shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm opacity-70">Live Conversation</div>
              <StatusChip status={(status as Status)} />
            </div>
            <div className="bg-gradient-to-r from-white/5 to-white/0 rounded-xl p-3 mb-3" />
            {error && (
              <div className="mb-3 rounded-lg border border-red-500/30 bg-red-600/10 text-red-300 px-3 py-2 text-sm flex items-center justify-between">
                <span>{error}</span>
                <button onClick={start} className="underline">Retry</button>
              </div>
            )}
            <TranscriptList turns={transcript as any} speaking={isSpeaking} />
            <div className="mt-4">
              <ControlsBar connected={connected} onMic={start} onEnd={stop} elapsed={elapsedSeconds} audioRef={audioRef as any} />
            </div>
          </div>
        </div>
      </div>
      <audio ref={audioRef as any} autoPlay />
    </div>
  );
}


