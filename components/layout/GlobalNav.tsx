'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

export default function GlobalNav() {
  const router = useRouter()
  const pathname = usePathname()

  const handleHomeClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Check for active conversation via global hints
    const anyWindow = window as any
    const hasActiveSession = Boolean(anyWindow.__doorIQ_conversationActive) || typeof anyWindow.stopAustin === 'function'

    if (hasActiveSession) {
      e.preventDefault()
      const ok = window.confirm('Are you sure? Your current session will not be saved.')
      if (!ok) return

      // Attempt to gracefully stop Austin if available
      try { anyWindow.stopAustin?.() } catch {}
      router.push('/')
    }
    // else allow normal navigation
  }, [router])

  // Simple top bar with Home link
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" onClick={handleHomeClick} className="text-slate-100 hover:text-white font-medium">
            Home
          </Link>
        </div>
        <div className="text-xs text-slate-400 hidden sm:block">
          {pathname}
        </div>
      </div>
    </div>
  )
}


