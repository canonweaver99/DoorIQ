'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'feature_locked' | 'session_limit' | 'trial_ended'
  featureName?: string
}

export function PaywallModal({ isOpen, onClose, reason = 'feature_locked', featureName }: PaywallModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleUpgrade = () => {
    setLoading(true)
    router.push('/pricing')
  }

  const getTitle = () => {
    switch (reason) {
      case 'session_limit':
        return 'Session Limit Reached'
      case 'trial_ended':
        return 'Trial Period Ended'
      case 'feature_locked':
      default:
        return featureName ? `Unlock ${featureName}` : 'Upgrade to Premium'
    }
  }

  const getDescription = () => {
    switch (reason) {
      case 'session_limit':
        return "You've run out of practice call credits. Upgrade to get 50 credits per month, or purchase extra credits to continue!"
      case 'trial_ended':
        return 'Your 7-day free trial has ended. Upgrade now to continue accessing all premium features!'
      case 'feature_locked':
      default:
        return featureName
          ? `${featureName} is a premium feature. Upgrade to unlock this and many more powerful features!`
          : 'Upgrade to unlock all premium features and take your sales training to the next level!'
    }
  }

  const features = [
    { icon: Sparkles, text: 'Access to ALL 12 AI training agents', premium: true },
    { icon: Zap, text: '50 practice call credits per month', premium: true },
    { icon: Crown, text: 'Advanced analytics & scoring', premium: true },
    { icon: Check, text: 'Real-time feedback & coaching', premium: true },
    { icon: Check, text: 'Custom sales scenarios', premium: true },
    { icon: Check, text: 'Call recording & playback', premium: true },
    { icon: Check, text: 'Performance tracking dashboard', premium: true },
    { icon: Check, text: 'Export reports (CSV/PDF)', premium: true },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-2xl">{getTitle()}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl font-bold">$20</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Start with a 7-day free trial. Cancel anytime.
            </p>

            <ul className="space-y-3">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <li key={index} className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${feature.premium ? 'text-primary' : 'text-green-500'}`} />
                    <span className="text-sm">{feature.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="flex-1 h-12 text-base font-semibold"
            size="lg"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Loading...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-5 w-5" />
                Start Now
              </>
            )}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="sm:w-auto"
            disabled={loading}
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-4">
          7-day free trial • No credit card required for trial • Cancel anytime
        </p>
      </DialogContent>
    </Dialog>
  )
}
