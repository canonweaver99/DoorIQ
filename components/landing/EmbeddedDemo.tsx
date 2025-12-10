'use client'

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
    <div className="w-full h-full bg-black overflow-hidden relative" style={{ width: '100%', height: '100%' }}>
      <iframe
        src={`/trainer?demo=true&agent=agent_7001k5jqfjmtejvs77jvhjf254tz&name=Average%20Austin&embedded=true&sessionId=${sessionId}`}
        className="absolute inset-0 border-0"
        style={{ 
          width: '125%', 
          height: '125%',
          transform: 'scale(0.8)',
          transformOrigin: 'top left'
        }}
        allow="microphone; camera"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
      />
    </div>
  )
}
