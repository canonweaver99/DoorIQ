'use client'

import { X, Clock, Sparkles } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TrialBannerProps {
  daysRemaining: number
  trialEndsAt: string
}

export function TrialBanner({ daysRemaining, trialEndsAt }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const isEndingSoon = daysRemaining <= 3

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <div className={`relative ${
      isEndingSoon 
        ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30' 
        : 'bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30'
    } border rounded-lg p-4 mb-6 shadow-sm`}>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className={`mt-0.5 ${
          isEndingSoon ? 'text-orange-500' : 'text-blue-500'
        }`}>
          {isEndingSoon ? (
            <Clock className="h-6 w-6" />
          ) : (
            <Sparkles className="h-6 w-6" />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">
            {isEndingSoon ? '⏰ Trial Ending Soon!' : '🎉 You\'re on a Free Trial'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {daysRemaining === 0 ? (
              <>Your trial ends <strong>today</strong> ({formatDate(trialEndsAt)}). Upgrade now to continue accessing all premium features!</>
            ) : daysRemaining === 1 ? (
              <>You have <strong>1 day</strong> left in your free trial (ends {formatDate(trialEndsAt)}). Upgrade to keep unlimited access!</>
            ) : isEndingSoon ? (
              <>You have <strong>{daysRemaining} days</strong> left in your free trial (ends {formatDate(trialEndsAt)}). Upgrade to keep unlimited access!</>
            ) : (
              <>You have <strong>{daysRemaining} days</strong> left to explore all premium features. Your trial ends on {formatDate(trialEndsAt)}.</>
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/billing">
              <Button 
                size="sm" 
                variant={isEndingSoon ? "default" : "outline"}
                className={isEndingSoon ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : ''}
              >
                {isEndingSoon ? 'Upgrade Now' : 'Manage Subscription'}
              </Button>
            </Link>
            <Link href="/pricing" className="text-sm text-primary hover:underline">
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
