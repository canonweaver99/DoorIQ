'use client'

import { Lock } from 'lucide-react'
import { ReactNode } from 'react'

interface FeatureLockProps {
  isLocked: boolean
  onClick?: () => void
  children: ReactNode
  blurAmount?: 'sm' | 'md' | 'lg'
}

export function FeatureLock({ 
  isLocked, 
  onClick, 
  children, 
  blurAmount = 'md' 
}: FeatureLockProps) {
  if (!isLocked) {
    return <>{children}</>
  }

  const blurClass = {
    sm: 'blur-sm',
    md: 'blur-md',
    lg: 'blur-lg'
  }[blurAmount]

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className={`${blurClass} pointer-events-none select-none`}>
        {children}
      </div>

      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center cursor-pointer group"
        onClick={onClick}
      >
        <div className="text-center space-y-4 p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Premium Feature</h3>
            <p className="text-muted-foreground mb-4">
              Upgrade to unlock this feature
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg group-hover:shadow-lg transition-all">
              <Lock className="h-4 w-4" />
              <span className="font-semibold">Unlock Now</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
