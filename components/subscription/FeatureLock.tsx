'use client'

import { Lock } from 'lucide-react'
import { ReactNode } from 'react'

interface FeatureLockProps {
  isLocked: boolean
  children: ReactNode
  blurContent?: boolean
  showBadge?: boolean
  onClick?: () => void
}

/**
 * Component that wraps features and shows a lock overlay when the feature is not accessible
 */
export default function FeatureLock({ 
  isLocked, 
  children, 
  blurContent = true,
  showBadge = true,
  onClick 
}: FeatureLockProps) {
  if (!isLocked) {
    return <>{children}</>
  }

  return (
    <div className="relative">
      {/* Content with optional blur */}
      <div className={blurContent ? 'blur-sm pointer-events-none select-none' : 'opacity-50 pointer-events-none select-none'}>
        {children}
      </div>

      {/* Lock Overlay */}
      <div 
        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-xl cursor-pointer group"
        onClick={onClick}
      >
        {showBadge && (
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg group-hover:scale-105 transition-transform flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Premium Feature - Click to Upgrade
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Inline badge for locked features
 */
export function PremiumBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-full ${className}`}>
      <Lock className="w-3 h-3" />
      Premium
    </span>
  )
}

