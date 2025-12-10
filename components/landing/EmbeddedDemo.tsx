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
    <div className="w-full h-full bg-black flex flex-col overflow-hidden relative" style={{ height: '100%', minHeight: '400px' }}>
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.1)_0%,_transparent_70%)]"></div>
      
      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="text-center space-y-6 w-full max-w-sm">
          {/* Austin's Avatar - Larger and more prominent */}
          <div className="relative mx-auto mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-indigo-500/60 shadow-2xl shadow-indigo-500/30 ring-4 ring-indigo-500/20">
              <Image
                src="/Austin Boss.png"
                alt="Average Austin"
                width={112}
                height={112}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Animated glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 blur-2xl animate-pulse"></div>
          </div>

          {/* Name and Description */}
          <div className="space-y-2">
            <h2 className="text-white text-3xl font-bold font-space tracking-tight">Average Austin</h2>
            <p className="text-white/50 text-sm font-sans">Skeptical but fair homeowner</p>
          </div>
          
          {/* Divider */}
          <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          {/* CTA Section */}
          <div className="space-y-4 pt-2">
            <h3 className="text-white text-lg font-semibold font-space">Ready to Practice?</h3>
            
            {/* Interactive Button - Make sure it's clickable */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onStartDemo()
              }}
              className="group relative w-full px-6 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white font-bold rounded-lg hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-500/40 flex items-center justify-center gap-2 cursor-pointer z-50"
              style={{ pointerEvents: 'auto' }}
            >
              <Play className="w-5 h-5" />
              <span className="text-base">Try Instant Demo</span>
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>

            {/* Info Badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/40 text-xs font-sans">3-minute demo • No signup required</span>
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
