'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface SessionLimitBannerProps {
  sessionsRemaining: number
  sessionsLimit: number
  sessionsUsed: number
}

export default function SessionLimitBanner({ 
  sessionsRemaining, 
  sessionsLimit,
  sessionsUsed 
}: SessionLimitBannerProps) {
  const percentage = (sessionsUsed / sessionsLimit) * 100
  const isUrgent = sessionsRemaining <= 2
  const isWarning = sessionsRemaining <= 5 && sessionsRemaining > 2

  if (sessionsRemaining > 5) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-xl p-4 mb-6 ${
        isUrgent 
          ? 'bg-gradient-to-r from-red-600/20 to-orange-600/20 border-red-500/30'
          : 'bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2 bg-white/10 rounded-lg ${
          isUrgent ? 'text-red-400' : 'text-yellow-400'
        }`}>
          <AlertCircle className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${
            isUrgent ? 'text-red-300' : 'text-yellow-300'
          }`}>
            {sessionsRemaining === 0 
              ? 'Session Limit Reached'
              : `Only ${sessionsRemaining} Session${sessionsRemaining !== 1 ? 's' : ''} Remaining`
            }
          </h3>
          
          <p className="text-sm text-slate-300 mb-3">
            {sessionsRemaining === 0
              ? `You've used all ${sessionsLimit} practice sessions for this month. Upgrade to get unlimited sessions!`
              : `You've used ${sessionsUsed} of ${sessionsLimit} practice sessions this month. Upgrade for unlimited access!`
            }
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-white/10 rounded-full h-2 mb-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full rounded-full ${
                isUrgent 
                  ? 'bg-gradient-to-r from-red-500 to-orange-500'
                  : 'bg-gradient-to-r from-yellow-500 to-orange-500'
              }`}
            />
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-sm font-semibold text-white transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade to Unlimited - Start Free Trial
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

