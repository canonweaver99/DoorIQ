'use client'

import Image from 'next/image'
import { Play } from 'lucide-react'
import { EmbeddedTrainerDemo } from './EmbeddedTrainerDemo'

interface EmbeddedDemoProps {
  sessionId: string | null
  onSessionEnd: (sessionId: string) => void
  onStartDemo?: () => void
}

interface EmbeddedDemoPreviewProps {
  onStartDemo: () => void
}

function EmbeddedDemoPreview({ onStartDemo }: EmbeddedDemoPreviewProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-black to-slate-900 flex flex-col overflow-hidden relative" style={{ height: '100vh', maxHeight: '100%' }}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
        <div className="text-center space-y-8 max-w-md">
          {/* Austin's Avatar */}
          <div className="relative mx-auto">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500/50 shadow-2xl shadow-indigo-500/20">
              <Image
                src="/Austin Boss.png"
                alt="Average Austin"
                width={128}
                height={128}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 blur-xl -z-10"></div>
          </div>

          {/* Text Content */}
          <div className="space-y-4">
            <div>
              <h2 className="text-white text-2xl font-bold mb-2 font-space">Average Austin</h2>
              <p className="text-white/60 text-sm font-sans">Skeptical but fair homeowner</p>
            </div>
            
            <div className="pt-4">
              <h3 className="text-white text-xl font-semibold mb-3 font-space">Ready to Practice?</h3>
              <p className="text-white/70 text-sm mb-6 font-sans leading-relaxed">
                Try a quick 3-minute practice session with Average Austin. No signup required.
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onStartDemo}
            className="group relative px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30 flex items-center gap-3 mx-auto"
          >
            <Play className="w-5 h-5" />
            <span>Try Instant Demo</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity blur-xl"></div>
          </button>

          {/* Info Badge */}
          <div className="pt-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/60 text-xs font-sans">3-minute demo • No signup</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function EmbeddedDemo({ sessionId, onSessionEnd, onStartDemo }: EmbeddedDemoProps) {
  // Always show the demo interface - if no sessionId, show preview state
  return (
    <div className="w-full h-full bg-black overflow-hidden" style={{ width: '100%', height: '100%' }}>
      {sessionId ? (
        <EmbeddedTrainerDemo
          sessionId={sessionId}
          agentId="agent_7001k5jqfjmtejvs77jvhjf254tz"
          agentName="Average Austin"
        />
      ) : (
        <EmbeddedDemoPreview onStartDemo={onStartDemo || (() => {})} />
      )}
    </div>
  )
}
