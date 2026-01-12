'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Home, Mic, FileText, Trophy, Menu, X, Settings as SettingsIcon, LayoutDashboard, ClipboardList, BarChart2, Award, BookOpen, UserCircle, HelpCircle, Users, ShieldCheck, TrendingUp, Sparkles, Upload, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useMotionValue, PanInfo } from 'framer-motion'
import { useReducedMotion } from '@/hooks/useIsMobile'

interface NavItem {
  href: string
  icon: typeof Home
  badge?: number
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [sessionBadge, setSessionBadge] = useState<number | undefined>(undefined)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [signingOut, setSigningOut] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)

  // Check if we're in an active practice session (should hide nav)
  const isPracticeActive = useMemo(() => 
    pathname === '/trainer' || 
    (pathname?.startsWith('/trainer') && 
     pathname !== '/trainer/select-homeowner' && 
     !pathname?.startsWith('/trainer/upload')),
    [pathname]
  )

  // Check if we're on the landing page (should hide nav on mobile)
  const isLandingPage = useMemo(() => 
    pathname === '/landing',
    [pathname]
  )

  // Check if we're on the onboarding page (should hide nav)
  const isOnboardingPage = useMemo(() => 
    pathname?.startsWith('/onboarding'),
    [pathname]
  )

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

  const navItems: NavItem[] = useMemo(() => [
    { href: '/home', icon: Home },
    { href: '/dashboard', icon: LayoutDashboard },
    { href: '/trainer/select-homeowner', icon: Mic },
    ...(isSignedIn ? [{ href: '/sessions', icon: FileText, badge: sessionBadge }] : []),
    ...(isSignedIn ? [{ href: '/leaderboard', icon: Trophy }] : []),
  ], [isSignedIn, sessionBadge])

  // Menu items for the hamburger menu
  const menuItems = useMemo(() => {
    const userRole = userData?.role
    const isManager = userRole === 'manager'
    const isAdmin = userRole === 'admin'
    const isRep = userRole === 'rep'
    
    return [
      // Core Navigation
      { name: 'Home', href: '/home', icon: Home, show: isSignedIn },
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
      { name: 'Practice Hub', href: '/trainer/select-homeowner', icon: Award, show: true },
      
      // Upload Sales Call - Always visible
      { name: 'Upload Sales Call', href: '/trainer/upload', icon: Upload, show: true },
      
      // Recent Sessions - Always visible for signed-in users
      { name: 'Recent Sessions', href: '/sessions', icon: ClipboardList, show: isSignedIn },
      
      // Leaderboard - Always visible for signed-in users
      { name: 'Leaderboard', href: '/leaderboard', icon: BarChart2, show: isSignedIn },
      
      // Manager Panel removed - managers now see extra tabs in dashboard
      
      // Learning
      { name: 'Learning', href: '/learning', icon: BookOpen, show: isSignedIn },
      
      // Team & Management
      { name: 'Team', href: '/team', icon: Users, show: isSignedIn && userData?.team_id },
      { name: 'Admin Panel', href: '/admin', icon: ShieldCheck, show: isAdmin },
      
      // Settings
      { name: 'Settings', href: '/settings', icon: SettingsIcon, show: true },
      
      // Help & Support
      { name: 'Help', href: '/help', icon: HelpCircle, show: true },
      { name: 'About', href: '/about', icon: Sparkles, show: true },
      
      // Sign Out (only show when signed in)
      { name: 'Sign Out', href: '#', icon: LogOut, show: isSignedIn, isSignOut: true },
    ].filter(item => item.show)
  }, [isSignedIn, userData?.team_id, userData?.role])

  const isActive = useCallback((href: string) => {
    if (href === '/home') {
      return pathname === '/home'
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/'
    }
    return pathname?.startsWith(href)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isMenuOpen])

  // Keyboard detection and handling
  useEffect(() => {
    if (!isMenuOpen) return

    const handleResize = () => {
      // Detect keyboard by checking viewport height change
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      const windowHeight = window.innerHeight
      const heightDiff = windowHeight - viewportHeight
      
      // If viewport is significantly smaller, keyboard is likely open
      if (heightDiff > 150) {
        setKeyboardHeight(heightDiff)
      } else {
        setKeyboardHeight(0)
      }
    }

    // Use visualViewport API if available (better for mobile)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize)
      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize)
      }
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleResize)
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [isMenuOpen])

  // Handle drag end for swipe gesture
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100 // pixels to drag before closing
    if (info.offset.y > threshold || info.velocity.y > 500) {
      setIsMenuOpen(false)
      y.set(0)
    } else {
      y.set(0)
    }
  }, [y])

  // Handle sign out
  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true)
      setIsMenuOpen(false)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to sign out', error)
      setSigningOut(false)
    }
  }, [router])

  // Hide nav during active practice sessions, on landing page, or during onboarding
  if (isPracticeActive || isLandingPage || isOnboardingPage) {
    return null
  }

  return (
    <>
      <nav 
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'md:hidden',
          'h-[64px]'
        )}
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
          height: 'calc(64px + max(env(safe-area-inset-bottom), 8px))',
          background: 'rgba(17, 24, 39, 0.8)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsMenuOpen(true)
            }}
            className={cn(
              'flex flex-col items-center justify-center',
              'relative w-full h-full',
              'min-w-[44px] min-h-[44px]',
              'transition-colors duration-200',
              'text-gray-400',
              'cursor-pointer'
            )}
            aria-label="Open menu"
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

      {/* Mobile Bottom Sheet Menu */}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isMenuOpen && (
            <>
              {/* Backdrop - Frosted Glass */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={prefersReducedMotion ? { duration: 0.2 } : { duration: 0.25 }}
                onClick={() => setIsMenuOpen(false)}
                className="fixed inset-0 z-[60]"
                style={{
                  background: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
              />
              
              {/* Bottom Sheet - Frosted Glass */}
              <motion.div
                ref={sheetRef}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.25}
                dragMomentum={false}
                onDragEnd={handleDragEnd}
                initial={prefersReducedMotion ? false : { y: '100%' }}
                animate={prefersReducedMotion ? false : { y: 0 }}
                exit={prefersReducedMotion ? false : { y: '100%' }}
                transition={prefersReducedMotion ? { duration: 0.2 } : { type: 'spring', damping: 35, stiffness: 400 }}
                className={cn(
                  'fixed left-0 right-0 bottom-0 z-[70]',
                  'overflow-y-auto',
                  'max-h-[85vh]',
                  'rounded-t-3xl',
                  'shadow-2xl'
                )}
                style={{
                  y,
                  paddingBottom: `max(env(safe-area-inset-bottom), ${keyboardHeight > 0 ? keyboardHeight + 16 : 16}px)`,
                  background: 'rgba(17, 24, 39, 0.8)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-700 rounded-full" />
                </div>

                <div className="px-6 pb-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Menu</h2>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        'p-2 rounded-lg',
                        'min-w-[44px] min-h-[44px]',
                        'flex items-center justify-center',
                        'hover:bg-gray-800 active:bg-gray-700',
                        'transition-colors duration-200',
                        'touch-manipulation'
                      )}
                      aria-label="Close menu"
                    >
                      <X className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  {/* Menu Items */}
                  <nav className="space-y-1">
                    {menuItems
                      .filter(item => !(item as any).isSignOut) // Filter out sign out from regular items
                      .map((item) => {
                        const Icon = item.icon
                        const active = isActive(item.href)
                        
                        // Regular menu items
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMenuOpen(false)}
                            className={cn(
                              'flex items-center gap-4',
                              'px-4 py-4 rounded-xl',
                              'min-h-[56px]',
                              'transition-all duration-200',
                              'touch-manipulation',
                              'active:scale-[0.98]',
                              active
                                ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                            )}
                          >
                            <Icon className={cn('w-6 h-6 flex-shrink-0', active ? 'text-purple-400' : 'text-gray-400')} />
                            <span className="font-medium text-base">{item.name}</span>
                          </Link>
                        )
                      })}
                  </nav>

                  {/* Sign Out Button - Always at bottom */}
                  {isSignedIn && (
                    <div className="mt-6 pt-6 border-t border-gray-800">
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className={cn(
                          'w-full flex items-center gap-4',
                          'px-4 py-4 rounded-xl',
                          'min-h-[56px]',
                          'transition-all duration-200',
                          'touch-manipulation',
                          'active:scale-[0.98]',
                          'text-red-400 hover:bg-red-600/20 hover:text-red-300 active:bg-red-600/30',
                          'border border-red-600/30',
                          signingOut && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <LogOut className="w-6 h-6 flex-shrink-0 text-red-400" />
                        <span className="font-medium text-base">
                          {signingOut ? 'Signing out...' : 'Sign Out'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}

