'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Mic, FileText, Trophy, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface NavItem {
  href: string
  icon: typeof Home
  badge?: number
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [sessionBadge, setSessionBadge] = useState<number | undefined>(undefined)

  // Check if we're in an active practice session (should hide nav)
  const isPracticeActive = pathname === '/trainer' || 
    (pathname?.startsWith('/trainer') && 
     pathname !== '/trainer/select-homeowner' && 
     !pathname?.startsWith('/trainer/upload'))

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsSignedIn(!!user)

      // Fetch unread/new sessions count for badge
      if (user) {
        try {
          // Get recent sessions count (last 24 hours) for badge
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          
          const { count } = await supabase
            .from('live_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', yesterday.toISOString())
          
          // Only show badge if there are new sessions
          if (count && count > 0) {
            setSessionBadge(count > 99 ? 99 : count)
          } else {
            setSessionBadge(undefined)
          }
        } catch (error) {
          console.error('Error fetching session badge:', error)
        }
      }
    }

    checkAuth()
  }, [])

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: Home },
    { href: '/trainer/select-homeowner', icon: Mic },
    ...(isSignedIn ? [{ href: '/sessions', icon: FileText, badge: sessionBadge }] : []),
    ...(isSignedIn ? [{ href: '/leaderboard', icon: Trophy }] : []),
    { href: '/settings', icon: Settings },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(href)
  }

  // Hide nav during active practice sessions
  if (isPracticeActive) {
    return null
  }

  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-gray-900 border-t border-gray-800',
        'md:hidden',
        'h-[64px]'
      )}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        height: 'calc(64px + max(env(safe-area-inset-bottom), 8px))'
      }}
    >
      <div className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center',
                'relative w-full h-full',
                'min-w-[44px] min-h-[44px]',
                'transition-colors duration-200',
                active
                  ? 'text-purple-400'
                  : 'text-gray-400'
              )}
            >
              <div className={cn(
                'relative flex items-center justify-center',
                'w-10 h-10 rounded-lg',
                'transition-colors duration-200',
                active && 'bg-purple-600/20'
              )}>
                <Icon className="w-6 h-6" />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    'absolute -top-1 -right-1',
                    'flex items-center justify-center',
                    'min-w-[18px] h-[18px]',
                    'px-1.5 py-0.5',
                    'text-xs font-semibold text-white',
                    'bg-purple-600 rounded-full',
                    'border-2 border-gray-900'
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

