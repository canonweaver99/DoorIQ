'use client'

import { motion } from 'framer-motion'
import { Crown, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'

export default function SubscriptionStatusCard() {
  const subscription = useSubscription()

  if (subscription.loading) {
    return (
      <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 animate-pulse">
        <div className="h-24 bg-white/5 rounded" />
      </div>
    )
  }

  // Active subscription
  if (subscription.status === 'active') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Crown className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Premium Active</h3>
              <p className="text-sm text-purple-300">Full access to all features</p>
            </div>
          </div>
          <CheckCircle className="w-5 h-5 text-green-400" />
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Next billing date</span>
            <span className="text-white font-medium">
              {subscription.currentPeriodEnd 
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : 'N/A'
              }
            </span>
          </div>
        </div>

        <Link
          href="/billing"
          className="block w-full py-2 text-center bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
        >
          Manage Subscription
        </Link>
      </motion.div>
    )
  }

  // Trialing
  if (subscription.isTrialing) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Free Trial Active</h3>
              <p className="text-sm text-blue-300">
                {subscription.daysRemainingInTrial} day{subscription.daysRemainingInTrial !== 1 ? 's' : ''} remaining
              </p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-blue-400" />
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Trial ends on</span>
            <span className="text-white font-medium">
              {subscription.trialEndsAt 
                ? new Date(subscription.trialEndsAt).toLocaleDateString()
                : 'N/A'
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/billing"
            className="block py-2 text-center bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Manage
          </Link>
          <Link
            href="/pricing"
            className="block py-2 text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-sm font-semibold text-white transition-all"
          >
            View Plans
          </Link>
        </div>
      </motion.div>
    )
  }

  // Past due
  if (subscription.isPastDue) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-yellow-600/20 to-red-600/20 border border-yellow-500/30 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Payment Issue</h3>
              <p className="text-sm text-yellow-300">Please update your payment method</p>
            </div>
          </div>
        </div>

        <Link
          href="/billing"
          className="block w-full py-2 text-center bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 rounded-lg text-sm font-semibold text-white transition-all"
        >
          Update Payment Method
        </Link>
      </motion.div>
    )
  }

  // No subscription (free tier)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-700/20 to-slate-600/20 border border-slate-500/30 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-500/20 rounded-lg">
            <Crown className="w-6 h-6 text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Free Plan</h3>
            <p className="text-sm text-slate-400">Limited access</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="text-sm text-slate-300">
          <p>• 3 basic AI agents</p>
          <p>• 10 sessions per month</p>
          <p>• Basic analytics</p>
        </div>
      </div>

      <Link
        href="/pricing"
        className="block w-full py-2 text-center bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-sm font-semibold text-white transition-all"
      >
        <span className="flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4" />
          Start Now
        </span>
      </Link>
    </motion.div>
  )
}

