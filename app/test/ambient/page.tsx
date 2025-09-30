'use client'

import dynamic from 'next/dynamic'

// Minimal monologue player
const MonologuePlayer = dynamic(
  () => import('@/components/trainer/MonologuePlayer'),
  { ssr: false }
)

export default function AmbientTestPage() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Ambient Audio Test</h1>
      <p className="text-gray-600">Start a conversation with Austin and try the ambient SFX controls.</p>

      <div className="border rounded-lg p-4">
        <MonologuePlayer />
      </div>

      <div className="text-sm text-gray-500">
        <p>
          Tip: Add more ambient files under <code>/public/sounds/</code> (see README in that folder) to enable the
          ambient loop and random SFX scheduler.
        </p>
      </div>
    </div>
  )
}


