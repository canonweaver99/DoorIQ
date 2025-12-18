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
  LogIn,
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
  DollarSign,
  Sparkles,
  Info,
  MessageSquare,
  Calendar,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useFeatureAccess } from '@/hooks/useSubscription'
import { FEATURES } from '@/lib/subscription/feature-keys'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import { Database } from '@/lib/supabase/database.types'
import { useSubscription } from '@/hooks/useSubscription'
import { MiniNavMenu } from './MiniNavMenu'

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
  const [isLiveSession, setIsLiveSession] = useState(false)
  const [isAuthPage, setIsAuthPage] = useState(false)
  const [isScrolledDown, setIsScrolledDown] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [avatarError, setAvatarError] = useState(false)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)

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
  const { hasAccess: hasLearningPageAccess } = useFeatureAccess(FEATURES.LEARNING_PAGE)

  useEffect(() => {
    setPortalReady(true)
  }, [])

  // Check if we're on auth pages
  useEffect(() => {
    const onAuthPage = pathname?.startsWith('/auth/login') || pathname?.startsWith('/auth/signup')
    setIsAuthPage(onAuthPage)
  }, [pathname])

    // Set isLiveSession for backward compatibility
    useEffect(() => {
      const isLiveSessionPage = pathname === '/trainer' || (pathname?.startsWith('/trainer') && pathname !== '/trainer/select-homeowner' && !pathname?.startsWith('/trainer/upload'))
      setIsLiveSession(isLiveSessionPage)
    }, [pathname])

  // Menu is now always visible - removed hover logic

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
        setAvatarError(false) // Reset avatar error when user data changes
        
        // ARCHIVED: All paywalls removed - software is now free for signed-in users
        // Set subscription as active for all authenticated users
        setHasActiveSubscription(true)
        
      } else {
        logger.warn('Header - No user data found, using auth metadata')
        setAuthMeta({
          id: authUser.id,
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name,
          role: metaRole,
          virtual_earnings: null,
        })
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


    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthMeta(null)
        setHasActiveSubscription(false) // No subscription when signed out
      }
    })

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('avatar:updated', handleAvatarUpdate)
    }
  }, [])

  // ARCHIVED: All paywalls removed - software is now free for signed-in users
  // All authenticated users have access
  const userHasActivePlan = useMemo(() => {
    return hasActiveSubscription || subscription.hasActiveSubscription
  }, [hasActiveSubscription, subscription.hasActiveSubscription])

  const navigation = useMemo(() => {
    type NavItem = {
      name: string
      href: string
      icon: LucideIcon
      desktopOnly?: boolean
    }
    
    const navItems: NavItem[] = [
      { name: 'Home', href: isSignedIn ? '/home' : '/landing', icon: Home },
      { name: 'Practice', href: '/trainer/select-homeowner', icon: Mic },
    ]

    // Sessions - Always show for signed-in users
    if (isSignedIn) {
      navItems.push({ name: 'Sessions', href: '/sessions', icon: FileText })
    }

    // Dashboard - All users go to /dashboard (managers see extra tabs)
    if (userRole === 'rep' || userRole === 'manager' || userRole === 'admin') {
      navItems.push({ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard })
    }

    // Leaderboard - Always show for signed-in users
    if (isSignedIn) {
      navItems.push({ name: 'Leaderboard', href: '/leaderboard', icon: Trophy })
    }

    // Learning: always show for signed-in users
    if (isSignedIn) {
      navItems.push({ name: 'Learning', href: '/learning', icon: NotebookPen })
    }

    // Admin panel - separate from dashboard
    if (userRole === 'admin') {
      navItems.push({
        name: 'Admin',
        href: '/admin',
        icon: ShieldCheck,
        desktopOnly: true,
      })
    }

    return navItems
  }, [userRole, user?.team_id, hasLearningPageAccess, userHasActivePlan, isSignedIn])

  const isManagerLike = userRole === 'manager' || userRole === 'admin'

  const sidebarSections = useMemo(() => {
    const subscriptionPlan = (user as any)?.subscription_plan
    const isIndividualPlan = subscriptionPlan === 'individual' || (!subscriptionPlan && !user?.team_id)
    
    const sections: Array<{
      title: string
      items: Array<{ name: string; href: string; icon: LucideIcon; badge?: string; managerOnly?: boolean; adminOnly?: boolean; repOnly?: boolean; desktopOnly?: boolean }>
    }> = [
      {
        title: 'Workspace',
        items: [
          ...(isSignedIn ? [{ name: 'Home', href: '/home', icon: Home }] : []),
          { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, repOnly: true, desktopOnly: true },
          ...(isIndividualPlan ? [] : [{ name: 'Analytics', href: '/dashboard?tab=performance', icon: BarChart3, repOnly: true, desktopOnly: true }]),
          ...(hasLearningPageAccess ? [{ name: 'Learning', href: '/learning', icon: NotebookPen, desktopOnly: true }] : []),
          { name: 'Admin Panel', href: '/admin', icon: Users, adminOnly: true, desktopOnly: true },
          { name: 'Add Knowledge Base', href: '/dashboard?tab=knowledge', icon: DatabaseIcon, managerOnly: true, desktopOnly: true },
        ],
      },
      {
        title: 'Training',
        items: [
          { name: 'Practice Hub', href: '/trainer/select-homeowner', icon: Award },
          ...(isSignedIn ? [{ name: 'Upload Sales Call', href: '/dashboard?tab=upload', icon: Upload, desktopOnly: true }] : []),
          ...(isSignedIn ? [{ name: 'Session History', href: '/sessions', icon: ClipboardList }] : []),
          ...(user?.team_id ? [{ name: 'Leaderboard', href: '/leaderboard', icon: BarChart2, desktopOnly: true }] : []),
        ],
      },
      {
        title: 'Support & Account',
        items: [
          // Archived: { name: 'Documentation', href: '/documentation', icon: BookOpen },
          // Archived: { name: 'Help Center', href: '/support', icon: HelpCircle },
          // Archived: { name: 'Notifications', href: '/notifications', icon: Bell },
          { name: 'Settings', href: '/settings', icon: SettingsIcon },
        ],
      },
    ]

    // AI Insights removed per user request

    return sections
  }, [isManagerLike, hasActiveSubscription, user?.team_id, (user as any)?.subscription_plan, hasLearningPageAccess, isSignedIn])

  const quickActions = useMemo(() => {
    const actions = [
      { label: 'Start Training', href: '/trainer/select-homeowner', icon: Mic },
    ]
    
    // Only show session-related actions for signed-in users
    if (isSignedIn) {
      actions.push(
        { label: 'Review Sessions', href: '/sessions', icon: ClipboardList },
        { label: 'Invite a Sales Rep', href: '/settings/organization', icon: Users }
      )
    }
    
    return actions
  }, [isSignedIn])

  const profileNavigation = useMemo(() => {
    const subscriptionPlan = (user as any)?.subscription_plan
    const isIndividualPlan = subscriptionPlan === 'individual' || (!subscriptionPlan && !user?.team_id)
    
    const items: Array<{ name: string; href: string; icon: LucideIcon; managerOnly?: boolean; adminOnly?: boolean; repOnly?: boolean; badge?: number }> = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, repOnly: true },
      ...(isIndividualPlan ? [] : [{ name: 'Analytics', href: '/dashboard?tab=performance', icon: BarChart3, repOnly: true }]),
      ...(hasLearningPageAccess ? [{ name: 'Learning', href: '/learning', icon: NotebookPen }] : []),
      { name: 'Admin Panel', href: '/admin', icon: Users, adminOnly: true },
      { name: 'Add Knowledge Base', href: '/dashboard?tab=knowledge', icon: DatabaseIcon, managerOnly: true },
      { name: 'Team', href: '/team', icon: Users },
      // Archived: { name: 'Documentation', href: '/documentation', icon: BookOpen },
      // Archived: { name: 'Support', href: '/support', icon: LifeBuoy },
      // Archived: { name: 'Integrations', href: '/integrations', icon: Plug },
      // Archived: { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: SettingsIcon },
      { name: 'User Profile', href: '/profile', icon: UserCircle },
    ]

    // AI Insights removed per user request

    return items satisfies Array<{ name: string; href: string; icon: LucideIcon; managerOnly?: boolean; adminOnly?: boolean; repOnly?: boolean; badge?: number }>
  }, [isManagerLike, (user as any)?.subscription_plan, user?.team_id, hasLearningPageAccess])

  const handleSignOut = useCallback(async () => {
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
  }, [router])

  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/'

    if (href.startsWith('/dashboard?tab=')) {
      const targetTab = href.split('tab=')[1]
      return pathname === '/dashboard' && searchParams?.get('tab') === targetTab
    }

    const [basePath] = href.split('?')
    return pathname.startsWith(basePath)
  }, [pathname, searchParams])

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

  // Close mobile menu when navigating to bulk-signup
  useEffect(() => {
    if (pathname === '/bulk-signup') {
      setIsMenuOpen(false)
    }
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

  // Public navigation items for non-authenticated users
  const publicNavigation = useMemo(() => [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Practice', href: '/trainer/select-homeowner', icon: Mic },
    { name: 'Sessions', href: '/sessions', icon: FileText },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Learning', href: '/learning', icon: NotebookPen },
    { name: 'Help', href: '/help', icon: LifeBuoy },
    { name: 'Contact Sales', href: '/contact-sales', icon: MessageSquare },
    { name: 'Book Demo', href: '/book-demo', icon: Calendar },
    { name: 'Features', href: '/features', icon: Sparkles },
    { name: 'About', href: '/about', icon: Info },
    { name: 'FAQs', href: '/faqs', icon: HelpCircle },
  ], [])

  return (
    <>
      {/* Public Header - Show when NOT signed in */}
      {!isSignedIn && !isAuthPage && (
        <>
          {/* Desktop Public Header */}
          <header className={`hidden md:flex fixed top-0 left-0 right-0 z-50 items-center gap-1 md:gap-1.5 border-b border-white/10 bg-black/95 backdrop-blur-xl px-4 md:px-6 lg:px-8 py-5 shadow-lg shadow-purple-500/10 overflow-hidden`}>
            {/* Animated grid pattern */}
            <motion.div
              animate={{
                opacity: [0.02, 0.04, 0.02],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 pointer-events-none"
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                  backgroundSize: "60px 60px",
                }}
              />
            </motion.div>

            {/* Animated gradient orbs */}
            <motion.div
              animate={{
                x: [0, 30, 0],
                y: [0, 20, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-gradient-to-br from-indigo-500/10 via-purple-500/8 to-transparent rounded-full blur-[80px] pointer-events-none"
            />
            <motion.div
              animate={{
                x: [0, -25, 0],
                y: [0, 15, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-0 left-1/4 w-[350px] h-[180px] bg-gradient-to-bl from-pink-500/10 via-purple-500/8 to-transparent rounded-full blur-[70px] pointer-events-none"
            />

            {/* Content wrapper */}
            <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
              {/* Left side: Logo and Navigation */}
              <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
                <Link href="/home" className="flex items-center flex-shrink-0">
                  <Image 
                    src="/dooriqlogo.png" 
                    alt="DoorIQ Logo" 
                    width={1280} 
                    height={214} 
                    className="h-[20px] w-auto object-contain max-w-[100px] md:max-w-[120px]"
                    priority
                    unoptimized={false}
                  />
                </Link>

                <div className="h-6 w-px bg-border/20 dark:bg-white/10 flex-shrink-0" />

                <nav className="flex items-center gap-1 md:gap-1.5 flex-1 min-w-0">
                  {publicNavigation.slice(0, 6).map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`inline-flex items-center gap-1 md:gap-1.5 rounded-md px-3 md:px-4 py-3 text-sm md:text-base transition-all flex-shrink-0 font-space
                          ${active ? 'text-white bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}
                      >
                        <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="tracking-tight whitespace-nowrap hidden lg:inline">{item.name}</span>
                      </Link>
                    )
                  })}
                </nav>
              </div>

              {/* Right side: Auth buttons and Sidebar toggle */}
              <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm md:text-base text-white/70 hover:text-white dark:text-slate-300 dark:hover:text-white font-medium transition-all font-space"
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-4 py-2 text-sm md:text-base bg-gray-200 text-gray-900 font-bold rounded-md transition-all hover:bg-gray-300 font-space"
                >
                  Sign Up
                </Link>
                <button
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-white/20 hover:border-purple-500/40 hover:shadow-[0px_0px_12px_rgba(168,85,247,0.3)] hover:scale-105 text-slate-300 hover:text-white transition-all"
                  aria-label="Open menu"
                >
                  <HamburgerIcon open={isSidebarOpen} />
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Public Header */}
          <div className="hidden fixed top-3 right-3 sm:top-4 sm:right-4 z-[9999]">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-4 border-purple-400 bg-purple-600 shadow-2xl shadow-purple-500/50 text-white hover:bg-purple-500 hover:scale-105 transition-all touch-target"
              aria-label="Open menu"
            >
              {isMenuOpen ? <X className="w-7 h-7 sm:w-8 sm:h-8 font-bold" /> : <Menu className="w-7 h-7 sm:w-8 sm:h-8 font-bold" />}
            </button>
          </div>

          {/* Mobile Public Navigation */}
          <AnimatePresence>
            {isMenuOpen && (
              <div className="fixed inset-0 z-[99] md:hidden">
                {/* Backdrop */}
                <motion.div 
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  onClick={() => setIsMenuOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
                {/* Mobile Navigation Panel - Dropdown from top */}
                <motion.div 
                  className="absolute top-0 left-0 right-0 bg-gradient-to-br from-black via-black to-black backdrop-blur-2xl shadow-[0_30px_120px_rgba(109,40,217,0.35)] border-b border-white/10 overflow-y-auto max-h-[85vh]"
                  initial={{ y: -100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -100, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="p-6 pt-20 space-y-2">
                  {publicNavigation
                    .filter(item => 
                      item.name !== 'Help' && 
                      item.name !== 'Contact Sales' && 
                      item.name !== 'Book Demo' && 
                      item.name !== 'Features'
                    )
                    .map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base sm:text-lg font-medium transition-all font-space
                          ${active ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white font-semibold' : 'text-white/70 dark:text-slate-300 hover:bg-white/5 hover:text-white dark:hover:text-white'}`}
                      >
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="tracking-tight">{item.name}</span>
                      </Link>
                    )
                  })}
                  <div className="border-t border-white/10 pt-4 mt-4 space-y-2">
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 rounded-lg text-base sm:text-lg font-medium text-white/70 dark:text-slate-300 hover:bg-white/5 hover:text-white dark:hover:text-white transition-all font-space"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center justify-center px-4 py-3 rounded-lg text-base sm:text-lg font-bold bg-gray-200 text-gray-900 hover:bg-gray-300 transition-all font-space"
                    >
                      Sign Up
                    </Link>
                  </div>
                </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Public Sidebar - Desktop */}
          {portalReady &&
            createPortal(
              <AnimatePresence>
                {isSidebarOpen && !isSignedIn && (
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
                      className="hidden md:flex fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[428px] flex-col overflow-hidden border-l border-white/10 bg-black/95 backdrop-blur-xl shadow-[0_30px_120px_rgba(0,0,0,0.5)]"
                      role="menu"
                      initial={{ opacity: 0, x: 64 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 64 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    >
                      <div className="px-[19px] pt-[14px] pb-[9px] flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/50 font-space">Navigation</p>
                          <h2 className="mt-[5px] text-lg sm:text-xl md:text-2xl font-semibold text-white font-space">DoorIQ</h2>
                        </div>
                        <button
                          onClick={() => setIsSidebarOpen(false)}
                          className="rounded-full bg-white/10 text-white/70 p-[7px] hover:bg-white/20 transition"
                          aria-label="Close menu"
                        >
                          <X className="w-[16.5px] h-[16.5px]" />
                        </button>
                      </div>

                      <nav className="flex-1 overflow-y-auto px-[19px] pt-[14px] pb-[9px]">
                        <div className="space-y-[14px]">
                          {publicNavigation.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            return (
                              <button
                                key={item.name}
                                onClick={() => {
                                  router.push(item.href)
                                  setIsSidebarOpen(false)
                                }}
                                className={`flex w-full items-center justify-between gap-[9px] rounded-xl border border-white/5 px-[14px] py-[9px] text-base sm:text-lg text-white/80 transition-all hover:border-white/15 hover:bg-white/5 font-space ${
                                  active ? 'bg-white/10 border-white/15' : ''
                                }`}
                              >
                                <span className="flex items-center gap-[12px]">
                                  <span className="flex h-[28.5px] w-[28.5px] items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white shrink-0">
                                    <Icon className="h-[16.5px] w-[16.5px]" />
                                  </span>
                                  <span className="text-sm sm:text-base font-medium tracking-tight">{item.name}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </nav>

                      <div className="px-[19px] pb-[14px] space-y-2">
                        <Link
                          href="/auth/login"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex w-full items-center justify-center gap-[9px] rounded-xl border border-white/10 bg-white/5 px-[14px] py-[9px] text-[14px] font-medium text-white/80 transition hover:bg-white/10"
                        >
                          <LogIn className="h-[16.5px] w-[16.5px]" />
                          <span>Log In</span>
                        </Link>
                        <Link
                          href="/auth/signup"
                          onClick={() => setIsSidebarOpen(false)}
                          className="flex w-full items-center justify-center gap-[9px] rounded-xl border border-white/10 bg-gray-200 text-gray-900 px-[14px] py-[9px] text-[14px] font-semibold transition hover:bg-gray-300"
                        >
                          <ArrowRight className="h-[16.5px] w-[16.5px]" />
                          <span>Sign Up</span>
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>,
              document.body
            )}
        </>
      )}

      {/* Mini Navigation Menu - Desktop Only - Only show for signed-in users */}
      {isSignedIn && !isAuthPage && (
        <div className="hidden md:block fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <MiniNavMenu />
        </div>
      )}

      {/* Full-width header - Desktop Only - Only show for signed-in users */}
      {isSignedIn && !isAuthPage && (
        <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center gap-1 md:gap-1.5 border-b border-white/10 bg-black/95 backdrop-blur-xl px-4 md:px-6 lg:px-8 py-5 shadow-lg shadow-purple-500/10 overflow-hidden">
          {/* Animated grid pattern */}
          <motion.div
            animate={{
              opacity: [0.02, 0.04, 0.02],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: "60px 60px",
              }}
            />
          </motion.div>

          {/* Animated gradient orbs */}
          <motion.div
            animate={{
              x: [0, 30, 0],
              y: [0, 20, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 right-1/4 w-[400px] h-[200px] bg-gradient-to-br from-indigo-500/10 via-purple-500/8 to-transparent rounded-full blur-[80px] pointer-events-none"
          />
          <motion.div
            animate={{
              x: [0, -25, 0],
              y: [0, 15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute top-0 left-1/4 w-[350px] h-[180px] bg-gradient-to-bl from-pink-500/10 via-purple-500/8 to-transparent rounded-full blur-[70px] pointer-events-none"
          />

          {/* Content wrapper */}
          <div className="relative z-10 max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-4">
            {/* Left side: Logo and Navigation */}
            <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0">
              <Link href="/" className="flex items-center flex-shrink-0">
                <Image 
                  src="/dooriqlogo.png" 
                  alt="DoorIQ Logo" 
                  width={1280} 
                  height={214} 
                  className="h-[20px] w-auto object-contain max-w-[100px] md:max-w-[120px]"
                  priority
                />
              </Link>

              <div className="h-6 w-px bg-border/20 dark:bg-white/10 flex-shrink-0" />

              <nav className="flex items-center gap-1 md:gap-2 flex-1 min-w-0">
                {navigation.filter(item => !(item as any).desktopOnly).map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`inline-flex items-center gap-1 md:gap-1.5 rounded-md px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base transition-all flex-shrink-0 font-space
                        ${active ? 'text-white bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 font-semibold' : 'text-white/70 hover:text-white hover:bg-white/5 font-medium'}`}
                    >
                      <Icon className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                      <span className="tracking-tight whitespace-nowrap hidden lg:inline">{item.name}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Right side: User info and menu */}
            {isSignedIn && (
              <div className="flex items-center gap-3 md:gap-4 flex-shrink-0">
                <div className="relative min-w-0 max-w-[120px] md:max-w-[150px] hidden lg:block">
                  <p className="text-sm md:text-base text-white/80 leading-4 truncate font-space font-medium">{user?.full_name ?? profileName}</p>
                </div>
                <div className="h-6 w-px bg-border/20 dark:bg-white/10 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <button
                    ref={sidebarButtonRef}
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all overflow-hidden cursor-pointer shrink-0 ${
                      isSidebarOpen
                        ? 'border-purple-500/70 shadow-[0px_0px_20px_rgba(168,85,247,0.5)] ring-2 ring-purple-500/30 scale-105'
                        : 'border-white/20 hover:border-purple-500/40 hover:shadow-[0px_0px_12px_rgba(168,85,247,0.3)] hover:scale-105'
                    }`}
                    aria-haspopup="menu"
                    aria-expanded={isSidebarOpen}
                    aria-label="Open account navigation"
                  >
                    {profileAvatar && !avatarError ? (
                      <>
                        <img 
                          src={profileAvatar} 
                          alt={profileName}
                          className="w-full h-full object-cover rounded-full"
                          onError={() => setAvatarError(true)}
                        />
                        {isSidebarOpen && (
                          <div className="absolute inset-0 bg-purple-500/40 rounded-full ring-2 ring-purple-500/50" />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-full h-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold rounded-full">
                          {profileInitial}
                        </div>
                        {isSidebarOpen && (
                          <div className="absolute inset-0 bg-purple-500/40 rounded-full ring-2 ring-purple-500/50" />
                        )}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all cursor-pointer shrink-0 ${
                      isSidebarOpen
                        ? 'border-purple-500/70 shadow-[0px_0px_20px_rgba(168,85,247,0.5)] ring-2 ring-purple-500/30 scale-105 text-purple-400'
                        : 'border-white/20 hover:border-purple-500/40 hover:shadow-[0px_0px_12px_rgba(168,85,247,0.3)] hover:scale-105 text-slate-300 hover:text-white'
                    }`}
                    aria-label="Toggle menu"
                  >
                    <HamburgerIcon open={isSidebarOpen} />
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </header>
      )}

      {/* Mobile header - Hidden since hamburger is now in bottom nav */}
      {/* Removed mobile hamburger menu - now handled by MobileBottomNav */}

      {/* Mobile Navigation - Only show for signed-in users */}
      <AnimatePresence>
        {isSignedIn && isMenuOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            {/* Mobile Navigation Panel - Dropdown from top */}
            <motion.div 
              className="absolute top-0 left-0 right-0 bg-gradient-to-br from-black via-black to-black backdrop-blur-2xl shadow-[0_30px_120px_rgba(109,40,217,0.35)] border-b border-white/10 overflow-y-auto max-h-[85vh]"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 pt-20 space-y-2">
            {navigation.filter(item => {
              // Exclude Home, Practice, and Sessions from dropdown (they're visible in MiniNavMenu)
              const visibleItems = ['Home', 'Practice', 'Sessions']
              return !(item as any).desktopOnly && !visibleItems.includes(item.name)
            }).map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base sm:text-lg font-medium transition-all font-space
                    ${active ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white font-semibold' : 'text-white/70 dark:text-slate-300 hover:bg-white/5 hover:text-white dark:hover:text-white'}`}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="tracking-tight">{item.name}</span>
                </Link>
              )
            })}
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="px-4 text-xs sm:text-sm uppercase tracking-[0.3em] text-white/50 dark:text-slate-400 font-space">Account</p>
              <div className="mt-2 space-y-2">
                {profileNavigation.filter(item => {
                  if (item.adminOnly) {
                    return userRole === 'admin'
                  }
                  if (item.managerOnly) {
                    return userRole === 'manager' || userRole === 'admin'
                  }
                  if (item.repOnly) {
                    // Dashboard shows ONLY for reps, NOT for managers or admins
                    return userRole === 'rep'
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
                      className={`flex items-center justify-between px-4 py-3 rounded-lg text-base sm:text-lg font-medium transition-all font-space ${
                        active
                          ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white font-semibold'
                          : 'text-white/70 dark:text-slate-300 hover:bg-white/5 hover:text-white dark:hover:text-white'
                      }`}
                    >
                      <span className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
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
                className="mt-4 mx-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-xl border border-white/10 bg-gradient-to-r from-purple-600/30 to-pink-600/30 px-4 py-3 text-base sm:text-lg font-semibold text-white transition hover:from-purple-500/40 hover:to-pink-500/40 font-space"
              >
                <LogOut className="h-4 w-4" />
                <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
              </button>
              {user && (
                <div className="px-4 py-3 border-t border-white/10 mt-4">
                  <p className="text-base sm:text-lg font-medium text-white font-space">{profileName}</p>
                  {/* Credit display removed */}
                </div>
              )}
            </div>
            </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
                  className="hidden md:flex fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-[428px] flex-col overflow-hidden border-l border-white/10 bg-black backdrop-blur-2xl"
                  role="menu"
                  initial={{ opacity: 0, x: 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 64 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                >
                  <div className="px-[19px] pt-[14px] pb-[9px] flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/50 font-space">Account</p>
                      <h2 className="mt-[5px] text-lg sm:text-xl md:text-2xl font-semibold text-white font-space">DoorIQ Control Center</h2>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="rounded-full bg-white/10 text-white/70 p-[7px] hover:bg-white/20 transition"
                      aria-label="Close account navigation"
                    >
                      <X className="w-[16.5px] h-[16.5px]" />
                    </button>
                  </div>

                  <div className="px-[19px]">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-[14px]">
                      <div className="flex items-center gap-[12px]">
                        {profileAvatar && !avatarError ? (
                          <div className="h-[37px] w-[37px] rounded-xl overflow-hidden border border-white/20">
                            <img 
                              src={profileAvatar} 
                              alt={profileName}
                              className="w-full h-full object-cover"
                              onError={() => {
                                console.error('Failed to load profile avatar:', profileAvatar)
                                setAvatarError(true)
                              }}
                            />
                          </div>
                        ) : (
                          <div className="h-[37px] w-[37px] rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white text-[14px] font-semibold">
                            {profileInitial}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-semibold text-white leading-tight truncate font-space">{profileName}</p>
                          <p className="text-xs sm:text-sm text-white/70 leading-tight truncate font-sans">{profileEmail}</p>
                        </div>
                      </div>
                        <div className="mt-[12px] flex items-center justify-between text-sm sm:text-base text-white/70">
                          <div>
                            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-white/50 font-space">Earnings</p>
                            <p className="mt-[2px] text-base sm:text-lg font-semibold text-white font-space">${profileEarnings?.toFixed(2) ?? '0.00'}</p>
                          </div>
                          <button
                            onClick={() => router.push('/settings')}
                            className="inline-flex items-center gap-[5px] rounded-full border border-white/10 bg-white/5 px-[12px] py-[5px] text-xs uppercase tracking-[0.15em] text-white/80 hover:bg-white/10 transition font-space"
                          >
                          Manage Account
                          <ArrowRight className="h-[12px] w-[12px]" />
                        </button>
                      </div>
                    </div>
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
                            className="group flex flex-col items-center justify-center gap-[7px] rounded-xl border border-white/5 bg-white/5 px-[9px] py-[12px] text-xs sm:text-sm text-white/80 transition hover:bg-white/10 hover:border-white/15 font-space"
                          >
                            <span className="flex h-[33px] w-[33px] items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white">
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
                          if (item.adminOnly) {
                            return userRole === 'admin'
                          }
                          if (item.managerOnly) {
                            return userRole === 'manager' || userRole === 'admin'
                          }
                          if (item.repOnly) {
                            // Dashboard shows ONLY for reps, NOT for managers or admins
                            return userRole === 'rep'
                          }
                          // Desktop-only items are filtered out in the rendering (using hidden md:block)
                          return true
                        })

                        // Don't render section if it has no visible items
                        if (visibleItems.length === 0) return null

                        return (
                          <div key={section.title}>
                            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-white/50 mb-[7px] font-space">{section.title}</p>
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
                                    className={`flex w-full items-center justify-between gap-[9px] rounded-xl border border-white/5 px-[14px] py-[9px] text-base sm:text-lg text-white/80 transition-all hover:border-white/15 hover:bg-white/5 font-space ${item.desktopOnly ? 'hidden md:flex' : ''}`}
                                  >
                                    <span className="flex items-center gap-[12px]">
                                      <span className="flex h-[28.5px] w-[28.5px] items-center justify-center rounded-lg bg-white/10 border border-white/20 text-white shrink-0">
                                        <Icon className="h-[16.5px] w-[16.5px]" />
                                      </span>
                                      <span className="text-sm sm:text-base font-medium tracking-tight">{item.name}</span>
                                    </span>
                                    {item.badge && (
                                      <span className={`rounded-full px-[7px] py-[2px] text-[10.5px] font-semibold ${
                                        item.name === 'Messages' && Number(item.badge) > 0
                                          ? 'bg-purple-500 text-white'
                                          : 'bg-purple-500/20 text-purple-400 dark:text-purple-200 uppercase tracking-[0.15em]'
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
                        className="flex w-full items-center justify-center gap-[9px] rounded-xl border border-white/10 bg-gray-200 text-gray-900 px-[14px] py-[9px] text-[14px] font-semibold transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-70"
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
