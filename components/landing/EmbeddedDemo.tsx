'use client'

import { EmbeddedTrainerDemo } from './EmbeddedTrainerDemo'

interface EmbeddedDemoProps {
  sessionId: string | null
  onSessionEnd: (sessionId: string) => void
}

export function EmbeddedDemo({ sessionId, onSessionEnd }: EmbeddedDemoProps) {
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
        <div className="w-full h-full bg-black flex flex-col overflow-hidden" style={{ height: '100vh', maxHeight: '100%' }}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">AI</span>
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">Average Austin</h2>
                <p className="text-white/60 text-xs">Demo Preview</p>
              </div>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white text-xl font-bold mb-2">Try Instant Demo</h3>
                <p className="text-white/60 text-sm">Click the button above to start</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
