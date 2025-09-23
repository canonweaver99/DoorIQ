'use client';
import { useEffect, useRef } from 'react';
import type { Turn } from './types';

export default function TranscriptList({ turns, speaking }: { turns: Turn[]; speaking: boolean }) {
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, speaking]);

  return (
    <div className="h-[55vh] md:h-[60vh] overflow-y-auto space-y-3 pr-1">
      {turns.slice(-20).map((t) => (
        <div key={t.id} className={`rounded-2xl p-3 border text-sm shadow ${t.speaker === 'rep' ? 'bg-blue-600/15 border-blue-500/30 text-blue-100' : 'bg-purple-600/15 border-purple-500/30 text-purple-100'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">{t.speaker === 'rep' ? 'You' : 'Amanda'}</span>
            <span className="text-[10px] opacity-60">{new Date(t.ts).toLocaleTimeString()}</span>
          </div>
          <div className="leading-relaxed">
            {t.text}
            {/* Interruption tags styling placeholder */}
            {/* <span className="ml-2 text-xs px-2 py-0.5 rounded bg-white/10 border border-white/20">[kid noise]</span> */}
          </div>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}


