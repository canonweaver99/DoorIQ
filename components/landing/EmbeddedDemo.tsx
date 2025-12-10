'use client'

import { EmbeddedTrainerDemo } from './EmbeddedTrainerDemo'

interface EmbeddedDemoProps {
  sessionId: string | null
  onSessionEnd: (sessionId: string) => void
}

export function EmbeddedDemo({ sessionId, onSessionEnd }: EmbeddedDemoProps) {
  if (!sessionId) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <div className="text-white text-center p-4">
          <p className="text-sm mb-2">Ready to start demo</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black overflow-hidden" style={{ width: '100%', height: '100%' }}>
      <EmbeddedTrainerDemo
        sessionId={sessionId}
        agentId="agent_7001k5jqfjmtejvs77jvhjf254tz"
        agentName="Average Austin"
      />
    </div>
  )
}
