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
    <div 
      className="w-full h-full bg-black flex flex-col overflow-hidden relative" 
      style={{ 
        height: '100%', 
        minHeight: '400px',
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_transparent_70%)] pointer-events-none"></div>
      
      {/* Content */}
      <div 
        className="flex-1 flex flex-col items-center justify-center p-6 relative" 
        style={{ zIndex: 10, pointerEvents: 'auto' }}
      >
        <div className="text-center space-y-6 w-full max-w-sm">
          {/* Austin's Avatar - Larger and more prominent */}
          <div className="relative mx-auto mb-2">
            <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-indigo-500/70 shadow-2xl shadow-indigo-500/40 ring-4 ring-indigo-500/30">
              <Image
                src="/Austin Boss.png"
                alt="Average Austin"
                width={144}
                height={144}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            {/* Animated glow effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/50 to-purple-500/50 blur-2xl animate-pulse"></div>
          </div>

          {/* Name and Description */}
          <div className="space-y-1">
            <h2 className="text-white text-3xl font-bold font-space tracking-tight">Average Austin</h2>
            <p className="text-white/60 text-sm font-sans">Skeptical but fair homeowner</p>
          </div>
          
          {/* Divider */}
          <div className="h-px w-20 mx-auto bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent"></div>

          {/* CTA Section */}
          <div className="space-y-5 pt-1">
            <h3 className="text-white text-xl font-semibold font-space">Ready to Practice?</h3>
            
            {/* Interactive Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('Demo button clicked!')
                if (onStartDemo) {
                  onStartDemo()
                }
              }}
              className="group relative w-full px-8 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 text-white font-bold rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-600 transition-all transform hover:scale-[1.03] active:scale-[0.97] shadow-xl shadow-indigo-500/50 flex items-center justify-center gap-3 cursor-pointer border-2 border-indigo-400/30 hover:border-indigo-400/50"
              style={{ 
                pointerEvents: 'auto',
                zIndex: 10000,
                position: 'relative'
              }}
              type="button"
            >
              <Play className="w-6 h-6" />
              <span className="text-lg">Try Instant Demo</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </button>

            {/* Info Badge */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/50 text-xs font-sans">3-minute demo • No signup required</span>
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
