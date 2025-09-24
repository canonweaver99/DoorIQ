"use client";
import { Suspense } from 'react';

export default function Trainer() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading…</div>}>
      <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white flex items-center justify-center">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold">Trainer is reset</h2>
          <p className="text-sm text-gray-400">Voice AI has been removed. Ready to rebuild Amanda from scratch.</p>
        </div>
      </div>
    </Suspense>
  );
}