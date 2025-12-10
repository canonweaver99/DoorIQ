'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import trainer components to avoid loading them until needed
const TrainerInterface = dynamic(() => import('./EmbeddedTrainerInterface'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="text-white text-sm">Loading demo...</div>
    </div>
  )
})

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
    <div className="w-full h-full bg-black overflow-hidden">
      <iframe
        src={`/trainer?demo=true&agent=agent_7001k5jqfjmtejvs77jvhjf254tz&name=Average%20Austin&embedded=true&sessionId=${sessionId}`}
        className="w-full h-full border-0"
        style={{ 
          width: '100%', 
          height: '100%',
          transform: 'scale(0.8)',
          transformOrigin: 'top left'
        }}
        allow="microphone; camera"
      />
    </div>
  )
}
