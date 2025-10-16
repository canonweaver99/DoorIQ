'use client'

import { AlertCircle, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface SessionLimitBannerProps {
  sessionsRemaining: number
  sessionsLimit: number
  sessionsUsed: number
}

export function SessionLimitBanner({ 
  sessionsRemaining, 
  sessionsLimit, 
  sessionsUsed 
}: SessionLimitBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || sessionsRemaining > 3) return null

  const percentage = (sessionsUsed / sessionsLimit) * 100
  const isNearLimit = sessionsRemaining <= 2
  const isAtLimit = sessionsRemaining === 0

  return (
    <div className={`relative ${
      isNearLimit 
        ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30' 
        : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
    } border rounded-lg p-4 mb-6 shadow-sm`}>
      {!isAtLimit && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss banner"
        >
          ✕
        </button>
      )}

      <div className="flex items-start gap-4 pr-8">
        <div className={`mt-0.5 ${
          isNearLimit ? 'text-red-500' : 'text-yellow-500'
        }`}>
          <AlertCircle className="h-6 w-6" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {isAtLimit 
              ? '🚫 Session Limit Reached' 
              : `⚠️ ${sessionsRemaining} Session${sessionsRemaining !== 1 ? 's' : ''} Remaining`}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isAtLimit ? (
              <>You've used all <strong>{sessionsLimit} practice sessions</strong> for this month. Upgrade to Premium for unlimited sessions!</>
            ) : (
              <>You've used <strong>{sessionsUsed} of {sessionsLimit}</strong> practice sessions this month. Upgrade for unlimited sessions!</>
            )}
          </p>

          {/* Progress bar */}
          <div className="mb-3 bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                percentage >= 90 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                percentage >= 70 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                'bg-gradient-to-r from-yellow-500 to-yellow-600'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/pricing">
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            </Link>
            <div className="text-xs text-muted-foreground">
              Resets on the 1st of next month
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
