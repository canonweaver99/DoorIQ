'use client';
import { useEffect, useRef } from 'react';
import { Mic, PhoneOff, Activity } from 'lucide-react';

export default function ControlsBar({
  connected,
  onMic,
  onEnd,
  elapsed,
  audioRef
}: {
  connected: boolean;
  onMic: () => void;
  onEnd: () => void;
  elapsed: number;
  audioRef: React.RefObject<HTMLAudioElement>;
}) {
  // simple level meter using analyser
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let raf = 0;
    if (audioRef.current) {
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = ctx.createMediaElementSource(audioRef.current);
        analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        analyser.connect(ctx.destination);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const draw = () => {
          if (!canvasRef.current) return;
          const c = canvasRef.current.getContext('2d'); if (!c) return;
          analyser!.getByteFrequencyData(data);
          const level = Math.min(1, data.reduce((a, b) => a + b, 0) / (data.length * 255));
          const w = canvasRef.current.width; const h = canvasRef.current.height;
          c.clearRect(0, 0, w, h);
          c.fillStyle = 'rgba(99,102,241,0.7)';
          c.fillRect(0, h - h * level, w, h * level);
          raf = requestAnimationFrame(draw);
        };
        raf = requestAnimationFrame(draw);
      } catch {}
    }
    return () => { if (raf) cancelAnimationFrame(raf); ctx?.close().catch(() => {}); };
  }, [audioRef]);

  const m = (n: number) => String(Math.floor(n / 60)).padStart(2, '0');
  const s = (n: number) => String(n % 60).padStart(2, '0');

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-white/60 text-sm">
        <Activity className="w-4 h-4" /> <span>{m(elapsed)}:{s(elapsed)}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          aria-label="Mic"
          disabled={!connected}
          onClick={onMic}
          className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow disabled:opacity-40 focus-visible:ring-2 ring-offset-2 ring-purple-400"
        >
          <Mic className="w-6 h-6" />
        </button>
        <button
          aria-label="End"
          onClick={onEnd}
          className="px-4 py-3 rounded-full bg-red-600 text-white flex items-center gap-2 shadow hover:bg-red-700 focus-visible:ring-2 ring-offset-2 ring-red-400"
        >
          <PhoneOff className="w-5 h-5" /> End
        </button>
        <canvas ref={canvasRef} width={40} height={18} className="rounded bg-white/10 border border-white/10" />
      </div>
    </div>
  );
}


