'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Target, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export function MiniNavMenu() {
  const pathname = usePathname()
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

  useEffect(() => {
    const checkSubscription = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setHasActiveSubscription(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (userData?.organization_id) {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('plan_tier, stripe_subscription_id')
          .eq('id', userData.organization_id)
          .single()
        
        if (orgData && (orgData.plan_tier || orgData.stripe_subscription_id)) {
          setHasActiveSubscription(true)
        } else {
          setHasActiveSubscription(false)
        }
      } else {
        setHasActiveSubscription(false)
      }
    }

    checkSubscription()
  }, [])

  const menuItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Practice', href: '/trainer/select-homeowner', icon: Target },
    // Pricing page temporarily archived
    // ...(!hasActiveSubscription ? [{ label: 'Pricing', href: '/pricing', icon: DollarSign }] : []),
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="flex items-center gap-1 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm border border-slate-800/50 dark:border-white/10 rounded-lg p-1">
      {menuItems.map((item) => {
        const Icon = item.icon
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-space font-medium transition-all duration-200',
              active
                ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

