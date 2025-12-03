'use client'

import { HelpCircle, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function QuickActionsToolbar() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/billing/current-plan')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionStatus(data.plan?.status || 'free')
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    }
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white/[0.02] border-2 border-white/5 hover:border-white/20 hover:bg-white/[0.03] rounded-lg transition-all">
      <div className="flex items-center gap-3">
        <Link
          href="/help"
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 rounded-md text-white/80 hover:text-white transition-all"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Support</span>
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 rounded-md text-white/80 hover:text-white transition-all"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </Link>

        <Link
          href="/profile"
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 rounded-md text-white/80 hover:text-white transition-all"
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Profile</span>
        </Link>
      </div>

      {subscriptionStatus && subscriptionStatus !== 'free' && (
        <div className="px-3 py-1.5 bg-white/[0.05] border border-white/10 rounded-md">
          <span className="text-purple-400 text-xs font-medium uppercase">
            {subscriptionStatus === 'active' ? 'Pro' : subscriptionStatus}
          </span>
        </div>
      )}
    </div>
  )
}

