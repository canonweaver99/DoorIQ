'use client'

import { Suspense } from 'react'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl" />
      </div>

      {/* Top logo bar */}
      <div className="relative z-10 px-6 py-4 flex items-center justify-center border-b border-white/5">
        <Image
          src="/dooriqlogo.png"
          alt="DoorIQ"
          width={120}
          height={40}
          className="h-8 w-auto"
          priority
        />
      </div>

      {/* Main content area */}
      <main className="relative z-10">
        <Suspense
          fallback={
            <div className="min-h-[80vh] flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto mb-4" />
                <p className="text-white/60 font-sans">Loading...</p>
              </div>
            </div>
          }
        >
          {children}
        </Suspense>
      </main>
    </div>
  )
}

