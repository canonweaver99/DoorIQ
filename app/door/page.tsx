'use client';
import { useRouter } from 'next/navigation';

export default function DoorPage() {
  const router = useRouter();

  const knock = async () => {
    // simple knock SFX
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      osc.start(t); osc.stop(t + 0.1);
    } catch {}

    setTimeout(() => router.push('/trainer?autostart=1'), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <button onClick={knock} className="relative group cursor-pointer">
        <div className="w-64 h-96 bg-gradient-to-b from-gray-800 to-gray-900 rounded-xl p-3 shadow-2xl">
          <div className="h-full bg-gradient-to-br from-amber-800 to-amber-900 rounded relative">
            <div className="grid grid-rows-2 gap-2 p-4 h-full">
              <div className="bg-amber-700/50 rounded shadow-inner"></div>
              <div className="bg-amber-700/50 rounded shadow-inner"></div>
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg"></div>
            </div>
            <div className="absolute inset-x-0 bottom-4 text-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-sm bg-black/30 px-3 py-1 rounded">Click to knock</span>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}


