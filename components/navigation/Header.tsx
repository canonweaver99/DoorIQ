'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Home,
  Mic,
  FileText,
  Trophy,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Settings as SettingsIcon,
  CreditCard,
  UserCircle,
  ShieldCheck,
  LifeBuoy,
  LogOut,
  PieChart,
  NotebookPen,
  Users,
  Plug,
  Bell,
  Award,
  ClipboardList,
  BarChart2,
  Headphones,
  HelpCircle,
  ArrowRight,
  Database as DatabaseIcon,
  Upload,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase/database.types'
import { useSubscription } from '@/hooks/useSubscription'

type User = Database['public']['Tables']['users']['Row']
type UserRole = User['role']

type AuthMeta = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: UserRole | null
  virtual_earnings?: number | null
  avatar_url?: string | null
}

const normalizeRole = (roleValue: unknown): UserRole | null => {
  if (!roleValue) return null

  if (Array.isArray(roleValue)) {
    return normalizeRole(roleValue.find((value) => typeof value === 'string'))
  }

  if (typeof roleValue === 'string') {
    const normalized = roleValue.toLowerCase()
    if (normalized === 'rep' || normalized === 'manager' || normalized === 'admin') {
      return normalized
    }
  }

  return null
}

const parseEarnings = (value: unknown): number => {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function HeaderContent() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const sidebarButtonRef = useRef<HTMLButtonElement | null>(null)
  const [portalReady, setPortalReady] = useState(false)
  const [userCredits, setUserCredits] = useState<number>(0)
  const [showCreditsTooltip, setShowCreditsTooltip] = useState(false)
  const creditsTooltipRef = useRef<HTMLDivElement | null>(null)
  const [showMenuOnHover, setShowMenuOnHover] = useState(false)
  const [isLiveSession, setIsLiveSession] = useState(false)
  const [isAuthPage, setIsAuthPage] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  const [authMeta, setAuthMeta] = useState<AuthMeta | null>(null)

  const userRole: UserRole | null = normalizeRole(user?.role) ?? normalizeRole(authMeta?.role)
  const isSignedIn = Boolean(user || authMeta)
  const profileName = (user?.full_name || authMeta?.full_name || authMeta?.email || 'Sales Pro') as string
  const profileEmail = user?.email || authMeta?.email || 'contact@dooriq.ai'
  const profileInitial = profileName.charAt(0).toUpperCase()
  const profileEarnings = parseEarnings(user?.virtual_earnings ?? authMeta?.virtual_earnings)
  const profileAvatar = (user as any)?.avatar_url || authMeta?.avatar_url || null
  const userId = user?.id || authMeta?.id || null
  const subscription = useSubscription()
  const hasActiveSubscription = subscription.hasActiveSubscription

  useEffect(() => {
    setPortalReady(true)
  }, [])

  // Check if we're on auth pages
  useEffect(() => {
    const onAuthPage = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/signup')
    setIsAuthPage(onAuthPage)
  }, [pathname])

  // Check if we're on a live session page (trainer pages except select-homeowner)
  useEffect(() => {
    const isLiveSessionPage = pathname?.startsWith('/trainer') && pathname !== '/trainer/select-homeowner'
    setIsLiveSession(isLiveSessionPage)
  }, [pathname])

  // Handle mouse position to show menu at top during live sessions
  useEffect(() => {
    if (!isLiveSession) {
      setShowMenuOnHover(false)
      return
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Show menu when cursor is within top 100px of screen
      if (e.clientY < 100) {
        setShowMenuOnHover(true)
      } else {
        setShowMenuOnHover(false)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [isLiveSession])

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setAuthMeta(null)
        return
      }

      // Save auth metadata immediately so we can show a basic profile card
      const metaRole = normalizeRole(
        authUser.user_metadata?.role ??
        authUser.user_metadata?.roles ??
        authUser.app_metadata?.role ??
        authUser.app_metadata?.roles
      )

      let { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (!userData && authUser.email) {
        const { data: userDataByEmail } = await supabase
          .from('users')
          .select('*')
          .ilike('email', authUser.email)
          .maybeSingle()

        if (userDataByEmail) {
          userData = userDataByEmail
        }
      }

      logger.debug('Header - Auth User', { id: authUser.id, email: authUser.email })
      logger.debug('Header - Fetched User Data', userData)

      if (userData) {
        logger.success('Header - Setting user with role', { 
          role: (userData as any).role, 
          earnings: (userData as any).virtual_earnings 
        })
        setUser(userData)
        setAuthMeta(null)
        
        // Fetch user credits
        const { data: limitData } = await supabase
          .from('user_session_limits')
          .select('sessions_limit, sessions_this_month')
          .eq('user_id', authUser.id)
          .single()
        
        if (limitData) {
          const creditsRemaining = Math.max(0, (limitData.sessions_limit || 0) - (limitData.sessions_this_month || 0))
          setUserCredits(creditsRemaining)
        } else {
          // Default to 5 credits if no limit record exists yet
          setUserCredits(5)
        }

        // Check if user is new (created within last 48 hours) or first time sign in and show credits tooltip
        if (userData.created_at) {
          const createdAt = new Date(userData.created_at)
          const now = new Date()
          const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
          const isNewUser = hoursSinceCreation < 48
          const tooltipDismissed = typeof window !== 'undefined' 
            ? localStorage.getItem('credits-tooltip-dismissed') === 'true'
            : false
          const hasSeenTooltip = typeof window !== 'undefined' && userData
            ? localStorage.getItem(`credits-tooltip-seen-${userData.id}`) === 'true'
            : false
          
          // Show for new users or first time sign in (if they haven't seen it before)
          if ((isNewUser || !hasSeenTooltip) && !tooltipDismissed) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
              setShowCreditsTooltip(true)
              // Mark as seen for this user
              if (typeof window !== 'undefined' && userData) {
                localStorage.setItem(`credits-tooltip-seen-${userData.id}`, 'true')
              }
            }, 1000)
          }
        }
      } else {
        logger.warn('Header - No user data found, using auth metadata')
        setAuthMeta({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name,
          role: metaRole,
          virtual_earnings: null,
        })
        // Default credits for auth-only users
        setUserCredits(5)
      }
    }

    // Initial fetch
    fetchUser()

    // Listen for avatar updates
    const handleAvatarUpdate = () => {
      logger.info('Avatar updated, refreshing user data')
      fetchUser()
    }
    window.addEventListener('avatar:updated', handleAvatarUpdate)

    // Listen for credit updates
    const handleCreditsUpdate = () => {
      logger.info('Credits updated, refreshing user credits')
      // Refresh only credits, not full user data
      const refreshCredits = async () => {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: limitData } = await supabase
            .from('user_session_limits')
            .select('sessions_limit, sessions_this_month')
            .eq('user_id', authUser.id)
            .single()
          
          if (limitData) {
            const creditsRemaining = Math.max(0, (limitData.sessions_limit || 0) - (limitData.sessions_this_month || 0))
            setUserCredits(creditsRemaining)
          }
        }
      }
      refreshCredits()
    }
    window.addEventListener('credits:updated', handleCreditsUpdate)

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthMeta(null)
      }
    })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('avatar:updated', handleAvatarUpdate)
      window.removeEventListener('credits:updated', handleCreditsUpdate)
    }
  }, [])

  const navigation = useMemo(() => {
    const navItems = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Practice', href: '/trainer/select-homeowner', icon: Mic },
      { name: 'Sessions', href: '/sessions', icon: FileText },
      { name: 'Learning', href: '/learning', icon: NotebookPen },
      { name: 'Pricing', href: '/pricing', icon: Trophy },
    ]

    // Only show Leaderboard for users on a team plan (have a team_id)
    if (user?.team_id) {
      navItems.splice(3, 0, { name: 'Leaderboard', href: '/leaderboard', icon: Trophy })
    }

    if (userRole === 'manager' || userRole === 'admin') {
      const insertIndex = Math.min(4, navItems.length)
      navItems.splice(insertIndex, 0, {
        name: 'Manager',
        href: '/manager',
        icon: FileText,
      })
    }

    return navItems
  }, [userRole, user?.team_id])

  const isManagerLike = userRole === 'manager' || userRole === 'admin'

  const sidebarSections = useMemo(() => {
    const subscriptionPlan = (user as any)?.subscription_plan
    const isIndividualPlan = subscriptionPlan === 'individual' || (!subscriptionPlan && !user?.team_id)
    
    const sections: Array<{
      title: string
      items: Array<{ name: string; href: string; icon: LucideIcon; badge?: string; managerOnly?: boolean }>
    }> = [
      {
        title: 'Workspace',
        items: [
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          ...(isIndividualPlan ? [] : [{ name: 'Analytics', href: '/dashboard?tab=performance', icon: BarChart3 }]),
          { name: 'Learning', href: '/learning', icon: NotebookPen },
          { name: 'Manager Panel', href: '/manager', icon: Users, managerOnly: true },
          { name: 'Add Knowledge Base', href: '/manager?tab=knowledge', icon: DatabaseIcon, managerOnly: true },
        ],
      },
      {
        title: 'Training',
        items: [
          { name: 'Practice Hub', href: '/trainer/select-homeowner', icon: Award },
          { name: 'Upload Sales Call', href: '/dashboard?tab=upload', icon: Upload },
          { name: 'Session History', href: '/sessions', icon: ClipboardList },
          ...(user?.team_id ? [{ name: 'Leaderboard', href: '/leaderboard', icon: BarChart2 }] : []),
        ],
      },
      {
        title: 'Support & Account',
        items: [
          // Archived: { name: 'Documentation', href: '/documentation', icon: BookOpen },
          // Archived: { name: 'Help Center', href: '/support', icon: HelpCircle },
          // Archived: { name: 'Notifications', href: '/notifications', icon: Bell },
          { name: 'Settings', href: '/billing?tab=settings', icon: SettingsIcon },
          { name: 'Billing', href: '/billing', icon: CreditCard },
        ],
      },
    ]

    // AI Insights removed per user request

    return sections
  }, [isManagerLike, hasActiveSubscription, user?.team_id, (user as any)?.subscription_plan])

  const quickActions = [
    { label: 'Start Training', href: '/trainer/select-homeowner', icon: Mic },
    { label: 'Review Sessions', href: '/sessions', icon: ClipboardList },
    { label: 'Invite a Sales Rep', href: '/affiliate/dashboard', icon: Users },
  ]

  const profileNavigation = useMemo(() => {
    const subscriptionPlan = (user as any)?.subscription_plan
    const isIndividualPlan = subscriptionPlan === 'individual' || (!subscriptionPlan && !user?.team_id)
    
    const items: Array<{ name: string; href: string; icon: LucideIcon; managerOnly?: boolean; badge?: number }> = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ...(isIndividualPlan ? [] : [{ name: 'Analytics', href: '/dashboard?tab=performance', icon: BarChart3 }]),
      { name: 'Learning', href: '/learning', icon: NotebookPen },
      { name: 'Add Knowledge Base', href: '/manager?tab=knowledge', icon: DatabaseIcon, managerOnly: true },
      { name: 'Team', href: '/team', icon: Users },
      // Archived: { name: 'Documentation', href: '/documentation', icon: BookOpen },
      // Archived: { name: 'Support', href: '/support', icon: LifeBuoy },
      // Archived: { name: 'Integrations', href: '/integrations', icon: Plug },
      // Archived: { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/billing?tab=settings', icon: SettingsIcon },
      { name: 'Billing', href: '/billing', icon: CreditCard },
      { name: 'User Profile', href: '/profile', icon: UserCircle },
    ]

    // AI Insights removed per user request

    return items satisfies Array<{ name: string; href: string; icon: LucideIcon; managerOnly?: boolean; badge?: number }>
  }, [isManagerLike, (user as any)?.subscription_plan, user?.team_id])

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      const supabase = createClient()
      await supabase.auth.signOut()
      setIsSidebarOpen(false)
      router.push('/auth/login')
    } catch (error) {
      console.error('Failed to sign out', error)
    } finally {
      setSigningOut(false)
    }
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'

    if (href.startsWith('/manager?tab=')) {
      const targetTab = href.split('tab=')[1]
      return pathname === '/manager' && searchParams?.get('tab') === targetTab
    }

    const [basePath] = href.split('?')
    return pathname.startsWith(basePath)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isSidebarOpen) return
      const target = event.target as Node
      if (sidebarRef.current?.contains(target)) return
      if (sidebarButtonRef.current?.contains(target)) return
      setIsSidebarOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    if (isSidebarOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    const bodyEl = document.body
    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = bodyEl.style.overflow
    const previousPaddingRight = bodyEl.style.paddingRight

    if (isSidebarOpen) {
      const scrollbarWidth = window.innerWidth - root.clientWidth
      root.style.overflow = 'hidden'
      bodyEl.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        bodyEl.style.paddingRight = `${scrollbarWidth}px`
      }
    } else {
      root.style.overflow = previousRootOverflow
      bodyEl.style.overflow = previousBodyOverflow
      bodyEl.style.paddingRight = previousPaddingRight
    }

    return () => {
      root.style.overflow = previousRootOverflow
      bodyEl.style.overflow = previousBodyOverflow
      bodyEl.style.paddingRight = previousPaddingRight
    }
  }, [isSidebarOpen])

  // Scroll detection for fading menu
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Only fade if scrolled down more than 50px
      if (currentScrollY > 50) {
        setIsScrolledDown(currentScrollY > lastScrollY && currentScrollY > 50)
      } else {
        setIsScrolledDown(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      {/* Centered oval navigation bar - Desktop */}
      <div className={`hidden md:flex fixed top-4 left-1/2 -translate-x-[50%] z-50 items-center space-x-4 rounded-full border border-white/10 bg-black/80 backdrop-blur-xl pl-6 pr-6 lg:pr-8 xl:pr-10 py-2 shadow-lg shadow-purple-500/10 transition-opacity duration-300 ${
        isAuthPage || (isLiveSession && !showMenuOnHover) ? 'opacity-0 pointer-events-none' : isScrolledDown ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}>
            <Link href="/" className="flex items-center pr-2 mr-2 border-r border-white/10 flex-shrink-0">
              <Image 
                src="/dooriqlogo.png" 
                alt="DoorIQ Logo" 
                width={120} 
                height={20} 
                className="h-[20px] w-auto object-contain"
                priority
              />
            </Link>

            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all
                    ${active ? 'text-white bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10' : 'text-slate-300 hover:text-white hover:bg-white/5'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              )
            })}

            <div className="flex items-center gap-2 flex-shrink-0">
              {isSignedIn && (
                <>
                  <div className="pl-2 border-l border-white/10 relative">
                    <p className="text-xs text-slate-300 leading-4">{user?.full_name ?? profileName}</p>
                    <p 
                      ref={creditsTooltipRef}
                      className="text-[11px] text-purple-400 font-semibold relative"
                    >
                      {userCredits} credits
                    </p>
                    
                    {/* Credits Tooltip for First-Time Users */}
                    <AnimatePresence>
                      {showCreditsTooltip && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
                          className="absolute left-0 top-full mt-2 z-50 w-64 p-4 bg-gradient-to-br from-purple-600/95 to-pink-600/95 backdrop-blur-sm rounded-lg border border-purple-400/30 shadow-[0px_0px_20px_rgba(168,85,247,0.4)]"
                          style={{
                            transformOrigin: 'top left',
                          }}
                        >
                          {/* Arrow pointer */}
                          <div className="absolute -top-2 left-4 w-4 h-4 bg-gradient-to-br from-purple-600 to-pink-600 border-l border-t border-purple-400/30 rotate-45"></div>
                          
                          <div className="relative">
                            <button
                              onClick={() => {
                                setShowCreditsTooltip(false)
                                if (typeof window !== 'undefined') {
                                  localStorage.setItem('credits-tooltip-dismissed', 'true')
                                }
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 text-xs transition-colors"
                              aria-label="Dismiss tooltip"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            <h3 className="text-sm font-semibold text-white mb-2">
                              Welcome! Here's how credits work:
                            </h3>
                            <p className="text-xs text-slate-200 leading-relaxed mb-2">
                              You start with <span className="font-semibold text-purple-200">5 free credits</span> to practice your sales skills with AI homeowners.
                            </p>
                            <p className="text-xs text-slate-200 leading-relaxed">
                              Each training session uses 1 credit. Credits reset monthly, or you can purchase more anytime!
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  {profileAvatar && (
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-500/30">
                      <img 
                        src={profileAvatar} 
                        alt={profileName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </>
              )}
              <button
                ref={sidebarButtonRef}
                onClick={() => setIsSidebarOpen((prev) => !prev)}
                className={`relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-all ${
                  isSidebarOpen
                    ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 shadow-[0px_0px_18px_rgba(168,85,247,0.35)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                aria-haspopup="menu"
                aria-expanded={isSidebarOpen}
                aria-label="Open account navigation"
              >
                <HamburgerIcon open={isSidebarOpen} />
              </button>
            </div>
      </div>

      {/* Mobile header */}
      <div className={`fixed top-4 right-4 z-50 md:hidden transition-opacity duration-300 ${
        isAuthPage || (isLiveSession && !showMenuOnHover) ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/80 backdrop-blur-xl shadow-lg shadow-purple-500/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all touch-target"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Mobile Navigation Panel */}
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-sm bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28] backdrop-blur-2xl shadow-[0_30px_120px_rgba(109,40,217,0.35)] border-l border-white/10 overflow-y-auto">
            <div className="p-6 pt-20 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all
                    ${active ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              )
            })}
            {isSignedIn ? (
              <div className="border-t border-white/10 pt-4 mt-4">
                <p className="px-4 text-xs uppercase tracking-[0.3em] text-slate-400">Account</p>
                <div className="mt-2 space-y-2">
                  {profileNavigation.filter(item => {
                    if (item.managerOnly) {
                      return userRole === 'manager' || userRole === 'admin'
                    }
                    return true
                  }).map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-lg text-base font-medium transition-all ${
                          active
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center space-x-3">
                          <Icon className="w-5 h-5" />
                          <span className="tracking-tight">{item.name}</span>
                        </span>
                        {item.badge && item.badge > 0 && (
                          <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
                <button
                  onClick={async () => {
                    setIsMenuOpen(false)
                    await handleSignOut()
                  }}
                  className="mt-4 mx-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-500/40 hover:to-pink-500/40"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
                </button>
                {user && (
                  <div className="px-4 py-3 border-t border-white/10 mt-4">
                    <p className="text-sm font-medium text-white">{profileName}</p>
                    <p className="text-xs text-purple-400 font-semibold mt-1">{userCredits} credits</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-white/10 pt-4 mt-4 px-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400 mb-3">Get Started</p>
                <div className="space-y-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      )}
      {portalReady &&
        createPortal(
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div
                  key="sidebar-backdrop"
                  className="hidden md:block fixed inset-0 z-[998] bg-black/70"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setIsSidebarOpen(false)}
                  aria-hidden="true"
                />
                <motion.div
                  key="sidebar-panel"
                  ref={sidebarRef}
                  className="hidden md:flex fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[428px] flex-col overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28] backdrop-blur-2xl shadow-[0_30px_120px_rgba(109,40,217,0.35)]"
                  role="menu"
                  initial={{ opacity: 0, x: 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 64 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                >
                  <div className="px-[19px] pt-[14px] pb-[9px] flex items-center justify-between">
                    <div>
                      <p className="text-[11.5px] uppercase tracking-[0.3em] text-slate-400">Account</p>
                      <h2 className="mt-[5px] text-[19px] font-semibold text-white">DoorIQ Control Center</h2>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="rounded-full bg-white/10 text-slate-300 p-[7px] hover:bg-white/20 transition"
                      aria-label="Close account navigation"
                    >
                      <X className="w-[16.5px] h-[16.5px]" />
                    </button>
                  </div>

                  <div className="px-[19px]">
                    {isSignedIn ? (
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-[14px] shadow-inner shadow-purple-500/10">
                        <div className="flex items-center gap-[12px]">
                          {profileAvatar ? (
                            <div className="h-[37px] w-[37px] rounded-xl overflow-hidden border border-purple-500/30">
                              <img 
                                src={profileAvatar} 
                                alt={profileName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-[37px] w-[37px] rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-[14px] font-semibold">
                              {profileInitial}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-white leading-tight truncate">{profileName}</p>
                            <p className="text-[11.5px] text-slate-300 leading-tight truncate">{profileEmail}</p>
                          </div>
                        </div>
                        <div className="mt-[12px] flex items-center justify-between text-[14px] text-slate-300">
                          <div>
                            <p className="text-[10.5px] uppercase tracking-[0.2em] text-slate-400">Earnings</p>
                            <p className="mt-[2px] text-[16.5px] font-semibold text-white">${profileEarnings?.toFixed(2) ?? '0.00'}</p>
                          </div>
                          <button
                            onClick={() => router.push('/billing?tab=settings')}
                            className="inline-flex items-center gap-[5px] rounded-full border border-white/10 bg-white/5 px-[12px] py-[5px] text-[10.5px] uppercase tracking-[0.15em] text-slate-200 hover:bg-white/10 transition"
                          >
                            Manage Account
                            <ArrowRight className="h-[12px] w-[12px]" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-white/10 bg-white/[0.06] p-[14px] shadow-inner shadow-purple-500/10">
                        <p className="text-[14px] font-semibold text-white mb-[9px]">Get Started with DoorIQ</p>
                        <p className="text-[11.5px] text-slate-300 leading-snug mb-[14px]">Sign in to track your progress, compete on the leaderboard, and unlock all features.</p>
                        <div className="space-y-[7px]">
                          <button
                            onClick={() => {
                              router.push('/auth/login')
                              setIsSidebarOpen(false)
                            }}
                            className="w-full flex items-center justify-center gap-[9px] rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-[14px] py-[9px] text-[14px] font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500"
                          >
                            Sign In
                          </button>
                          <button
                            onClick={() => {
                              router.push('/auth/signup')
                              setIsSidebarOpen(false)
                            }}
                            className="w-full flex items-center justify-center gap-[9px] rounded-lg border border-white/20 bg-white/5 px-[14px] py-[9px] text-[14px] font-semibold text-white transition hover:bg-white/10"
                          >
                            Sign Up
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-[19px] pt-[14px]">
                    <div className="grid grid-cols-3 gap-[9px]">
                      {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.label}
                            onClick={() => {
                              router.push(action.href)
                              setIsSidebarOpen(false)
                            }}
                            className="group flex flex-col items-center justify-center gap-[7px] rounded-xl border border-white/5 bg-white/5 px-[9px] py-[12px] text-[11.5px] text-slate-200 transition hover:bg-white/10 hover:border-white/15"
                          >
                            <span className="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/40 to-indigo-500/40 text-white">
                              <Icon className="h-[16.5px] w-[16.5px]" />
                            </span>
                            <span className="text-center leading-tight font-medium">{action.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-[19px] pt-[14px] pb-[9px]">
                    <div className="space-y-[14px]">
                      {sidebarSections.map((section) => {
                        // Filter items based on user role
                        const visibleItems = section.items.filter(item => {
                          if (item.managerOnly) {
                            return userRole === 'manager' || userRole === 'admin'
                          }
                          return true
                        })

                        // Don't render section if it has no visible items
                        if (visibleItems.length === 0) return null

                        return (
                          <div key={section.title}>
                            <p className="text-[10.5px] uppercase tracking-[0.25em] text-slate-500 mb-[7px]">{section.title}</p>
                            <div className="space-y-[5px]">
                              {visibleItems.map((item) => {
                                const Icon = item.icon
                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => {
                                      router.push(item.href)
                                      setIsSidebarOpen(false)
                                    }}
                                    className="flex w-full items-center justify-between gap-[9px] rounded-xl border border-white/5 px-[14px] py-[9px] text-[16.5px] text-slate-200 transition-all hover:border-white/15 hover:bg-white/5"
                                  >
                                    <span className="flex items-center gap-[12px]">
                                      <span className="flex h-[28.5px] w-[28.5px] items-center justify-center rounded-lg bg-gradient-to-br from-purple-600/30 to-indigo-600/30 text-white shrink-0">
                                        <Icon className="h-[16.5px] w-[16.5px]" />
                                      </span>
                                      <span className="text-[14px] font-medium tracking-tight">{item.name}</span>
                                    </span>
                                    {item.badge && (
                                      <span className={`rounded-full px-[7px] py-[2px] text-[10.5px] font-semibold ${
                                        item.name === 'Messages' && Number(item.badge) > 0
                                          ? 'bg-purple-500 text-white'
                                          : 'bg-purple-500/20 text-purple-200 uppercase tracking-[0.15em]'
                                      }`}>
                                        {item.badge}
                                      </span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </nav>

                  <div className="px-[19px] pb-[14px]">
                    {isSignedIn && (
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center justify-center gap-[9px] rounded-xl border border-white/10 bg-gradient-to-r from-purple-600/35 to-pink-600/35 px-[14px] py-[9px] text-[14px] font-semibold text-white transition hover:from-purple-500/40 hover:to-pink-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={signingOut}
                      >
                        <LogOut className="h-[16.5px] w-[16.5px]" />
                        <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
                      </button>
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

export default function Header() {
  return <HeaderContent />
}

const HamburgerIcon = ({ open }: { open: boolean }) => {
  return (
    <span className="flex h-4 w-5 flex-col items-center justify-between py-[2px]">
      <span
        className={`block h-[2px] w-full rounded-full bg-slate-300 transition-all duration-200 ease-linear ${
          open ? 'translate-y-[6px] rotate-45 bg-white' : ''
        }`}
      />
      <span
        className={`block h-[2px] w-full rounded-full bg-slate-300 transition-all duration-200 ease-linear ${
          open ? 'opacity-0' : ''
        }`}
      />
      <span
        className={`block h-[2px] w-full rounded-full bg-slate-300 transition-all duration-200 ease-linear ${
          open ? '-translate-y-[6px] -rotate-45 bg-white' : ''
        }`}
      />
    </span>
  )
}
