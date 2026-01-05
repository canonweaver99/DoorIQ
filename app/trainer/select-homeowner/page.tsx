'use client'

import dynamic from 'next/dynamic'

// Lazy load AgentBubbleSelector for better performance
const AgentBubbleSelector = dynamic(() => import('@/components/trainer/AgentBubbleSelector'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )
})

export default function SelectHomeownerPage() {
  return <AgentBubbleSelector standalone={true} />
}
