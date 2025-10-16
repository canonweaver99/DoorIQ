'use client'

import { motion } from 'framer-motion'
import { Clock, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface TrialBannerProps {
  daysRemaining: number
  trialEndsAt: string
  onDismiss?: () => void
}

export default function TrialBanner({ daysRemaining, trialEndsAt, onDismiss }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed) return null

  const urgency = daysRemaining <= 2 ? 'high' : daysRemaining <= 4 ? 'medium' : 'low'

  const colors = {
    high: {
      bg: 'bg-gradient-to-r from-red-600/20 to-orange-600/20',
      border: 'border-red-500/30',
      text: 'text-red-300',
      icon: 'text-red-400'
    },
    medium: {
      bg: 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-300',
      icon: 'text-yellow-400'
    },
    low: {
      bg: 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20',
      border: 'border-blue-500/30',
      text: 'text-blue-300',
      icon: 'text-blue-400'
    }
  }

  const style = colors[urgency]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`${style.bg} border ${style.border} rounded-xl p-4 mb-6 relative`}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>

      <div className="flex items-start gap-4 pr-8">
        <div className={`p-2 bg-white/10 rounded-lg ${style.icon}`}>
          {urgency === 'high' ? (
            <Clock className="w-5 h-5" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${style.text}`}>
              {urgency === 'high' 
                ? `Trial Ending Soon - ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''} Left!`
                : urgency === 'medium'
                ? `${daysRemaining} Days Left in Your Free Trial`
                : 'Free Trial Active'
              }
            </h3>
          </div>
          
          <p className="text-sm text-slate-300 mb-3">
            {urgency === 'high' 
              ? `Your trial ends on ${new Date(trialEndsAt).toLocaleDateString()}. Continue enjoying all premium features!`
              : urgency === 'medium'
              ? `Your free trial will end on ${new Date(trialEndsAt).toLocaleDateString()}. You'll be automatically subscribed to continue.`
              : `You have ${daysRemaining} days to explore all premium features. Your trial ends on ${new Date(trialEndsAt).toLocaleDateString()}.`
            }
          </p>

          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="text-sm font-medium text-white hover:text-slate-200 transition-colors"
            >
              Manage Subscription →
            </Link>
            {urgency !== 'low' && (
              <span className="text-sm text-slate-400">
                Cancel anytime before {new Date(trialEndsAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

