'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Home, Mic, FileText, Trophy, Menu, X, Settings as SettingsIcon, LayoutDashboard, ClipboardList, BarChart2, Award } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface NavItem {
  href: string
  icon: typeof Home
  badge?: number
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [sessionBadge, setSessionBadge] = useState<number | undefined>(undefined)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)

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
      setUser(user)

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

  // Get user data for menu items
  const [userData, setUserData] = useState<any>(null)
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const supabase = createClient()
        const { data } = await supabase
          .from('users')
          .select('role, team_id, subscription_plan')
          .eq('id', user.id)
          .single()
        setUserData(data)
      }
    }
    if (user) {
      fetchUserData()
    }
  }, [user])

  const navItems: NavItem[] = [
    { href: '/dashboard', icon: Home },
    { href: '/trainer/select-homeowner', icon: Mic },
    ...(isSignedIn ? [{ href: '/sessions', icon: FileText, badge: sessionBadge }] : []),
    ...(isSignedIn ? [{ href: '/leaderboard', icon: Trophy }] : []),
  ]

  // Menu items for the hamburger menu
  const menuItems = [
    { name: 'Home', href: '/home', icon: Home, show: isSignedIn },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Practice Hub', href: '/trainer/select-homeowner', icon: Award, show: true },
    { name: 'Session History', href: '/sessions', icon: ClipboardList, show: isSignedIn },
    { name: 'Leaderboard', href: '/leaderboard', icon: BarChart2, show: isSignedIn && userData?.team_id },
    { name: 'Settings', href: '/settings', icon: SettingsIcon, show: true },
  ].filter(item => item.show)

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    if (href === '/home') {
      return pathname === '/home'
    }
    return pathname?.startsWith(href)
  }

  // Hide nav during active practice sessions
  if (isPracticeActive) {
    return null
  }

  return (
    <>
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
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center',
              'relative w-full h-full',
              'min-w-[44px] min-h-[44px]',
              'transition-colors duration-200',
              'text-gray-400'
            )}
          >
            <div className={cn(
              'relative flex items-center justify-center',
              'w-10 h-10 rounded-lg',
              'transition-colors duration-200'
            )}>
              <Menu className="w-6 h-6" />
            </div>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && typeof window !== 'undefined' && createPortal(
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[60] md:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                'fixed top-0 right-0 bottom-0 z-[70]',
                'w-[85%] max-w-sm',
                'bg-gray-900 border-l border-gray-800',
                'md:hidden',
                'overflow-y-auto'
              )}
              style={{
                paddingTop: 'max(env(safe-area-inset-top), 16px)',
                paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
              }}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Menu</h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-400" />
                  </button>
                </div>

                {/* Menu Items */}
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-4 px-4 py-3 rounded-lg',
                          'transition-colors duration-200',
                          active
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        )}
                      >
                        <Icon className={cn('w-5 h-5', active ? 'text-purple-400' : 'text-gray-400')} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            </motion.div>
          </>,
          document.body
        )}
      </AnimatePresence>
    </>
  )
}

