'use client'

import dynamic from 'next/dynamic'

// Dynamic import for heavy component - reduces initial bundle size
const AgentBubbleSelector = dynamic(() => import('@/components/trainer/AgentBubbleSelector'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
    </div>
  )
})

export default function SelectHomeownerPage() {
  return <AgentBubbleSelector standalone={true} />
}
