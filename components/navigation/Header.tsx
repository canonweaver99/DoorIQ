'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  MessageCircle,
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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type User = Database['public']['Tables']['users']['Row']
type UserRole = User['role']

type AuthMeta = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: UserRole | null
}

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const sidebarButtonRef = useRef<HTMLButtonElement | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  const [authMeta, setAuthMeta] = useState<AuthMeta | null>(null)

  const userRole: UserRole | null = user?.role ?? authMeta?.role ?? null
  const isSignedIn = Boolean(user || authMeta)
  const profileName = (user?.full_name || authMeta?.full_name || authMeta?.email || 'Sales Pro') as string
  const profileEmail = user?.email || authMeta?.email || 'team@dooriq.app'
  const profileInitial = profileName.charAt(0).toUpperCase()
  const profileEarnings = user?.virtual_earnings

  useEffect(() => {
    setPortalReady(true)
  }, [])

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
      setAuthMeta({
        id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name,
        role: authUser.user_metadata?.role,
      })

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (userData) {
        setUser(userData)
        setAuthMeta(null)
      }
    }

    // Initial fetch
    fetchUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUser()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAuthMeta(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const navigation = useMemo(() => {
    const navItems = [
      { name: 'Home', href: '/', icon: Home },
      { name: 'Practice', href: '/trainer/select-homeowner', icon: Mic },
      { name: 'Sessions', href: '/sessions', icon: FileText },
      { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
      { name: 'Pricing', href: '/pricing', icon: Trophy },
    ]

    if (userRole === 'manager' || userRole === 'admin') {
      const insertIndex = Math.min(4, navItems.length)
      navItems.splice(insertIndex, 0, {
        name: 'Manager Panel',
        href: '/manager',
        icon: FileText,
      })
    }

    return navItems
  }, [userRole])

  const sidebarSections: Array<{
    title: string
    items: Array<{ name: string; href: string; icon: LucideIcon; badge?: string; managerOnly?: boolean }>
  }> = [
    {
      title: 'Workspace',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'AI Insights', href: '/insights', icon: PieChart },
        { name: 'Playbooks', href: '/playbooks', icon: NotebookPen, badge: 'New' },
        { name: 'Add Knowledge Base', href: '/knowledge-base', icon: DatabaseIcon, managerOnly: true },
      ],
    },
    {
      title: 'Training',
      items: [
        { name: 'Practice Hub', href: '/trainer', icon: Award },
        { name: 'Session History', href: '/sessions', icon: ClipboardList },
        { name: 'Leaderboard', href: '/leaderboard', icon: BarChart2 },
      ],
    },
    {
      title: 'Support & Account',
      items: [
        { name: 'Messages', href: '/messages', icon: MessageCircle },
        { name: 'Documentation', href: '/documentation', icon: BookOpen },
        { name: 'Help Center', href: '/support', icon: HelpCircle },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
        { name: 'Billing', href: '/billing', icon: CreditCard },
        { name: 'User Profile', href: '/profile', icon: UserCircle },
      ],
    },
  ]

  const quickActions = [
    { label: 'Start Training', href: '/trainer', icon: Mic },
    { label: 'Review Sessions', href: '/sessions', icon: ClipboardList },
    { label: 'Invite Teammate', href: '/invite', icon: Users },
  ]

  const profileNavigation = useMemo(() => {
    return [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'AI Insights', href: '/insights', icon: PieChart },
      { name: 'Playbooks', href: '/playbooks', icon: NotebookPen },
      { name: 'Add Knowledge Base', href: '/knowledge-base', icon: DatabaseIcon, managerOnly: true },
      { name: 'Team', href: '/team', icon: Users },
      { name: 'Documentation', href: '/documentation', icon: BookOpen },
      { name: 'Messages', href: '/messages', icon: MessageCircle },
      { name: 'Support', href: '/support', icon: LifeBuoy },
      { name: 'Integrations', href: '/integrations', icon: Plug },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Settings', href: '/settings', icon: SettingsIcon },
      { name: 'Billing', href: '/billing', icon: CreditCard },
      { name: 'User Profile', href: '/profile', icon: UserCircle },
    ] satisfies Array<{ name: string; href: string; icon: LucideIcon; managerOnly?: boolean }>
  }, [])

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
    return pathname.startsWith(href)
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-16">
          {/* Centered bar */}
          <div className="hidden md:flex items-center space-x-6 rounded-full border border-white/10 bg-black/40 backdrop-blur-xl px-4 py-2 shadow-lg shadow-purple-500/10">
            <Link href="/" className="flex items-center pr-2 mr-2 border-r border-white/10">
              <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">DoorIQ</span>
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

            <div className="flex items-center gap-3">
              {profileEarnings !== undefined && (
                <div className="pl-2 border-l border-white/10">
                  <p className="text-xs text-slate-300 leading-4">{user?.full_name ?? profileName}</p>
                  <p className="text-[11px] text-purple-400 font-semibold">${profileEarnings.toFixed(2)} earned</p>
                </div>
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
          <div className="flex md:hidden items-center justify-between w-full">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight">DoorIQ</span>
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
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
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-all ${
                          active
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-white/10 text-white'
                            : 'text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="tracking-tight">{item.name}</span>
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
                    <p className="text-xs text-purple-400 font-semibold mt-1">${profileEarnings?.toFixed(2) ?? '0.00'} earned</p>
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
        )}
      </nav>
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
                  className="hidden md:flex fixed top-0 right-0 bottom-0 z-[9999] w-full max-w-lg flex-col overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28] backdrop-blur-2xl shadow-[0_30px_120px_rgba(109,40,217,0.35)]"
                  role="menu"
                  initial={{ opacity: 0, x: 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 64 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                >
                  <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.4em] text-slate-400">Account</p>
                      <h2 className="mt-2 text-lg font-semibold text-white">DoorIQ Control Center</h2>
                    </div>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="rounded-full bg-white/10 text-slate-300 p-2 hover:bg-white/20 transition"
                      aria-label="Close account navigation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-6">
                    {isSignedIn ? (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-inner shadow-purple-500/10">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                            {profileInitial}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-5">{profileName}</p>
                            <p className="text-xs text-slate-300 leading-4">{profileEmail}</p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Earnings</p>
                            <p className="mt-1 text-base font-semibold text-white">${profileEarnings?.toFixed(2) ?? '0.00'}</p>
                          </div>
                          <button
                            onClick={() => router.push('/leaderboard')}
                            className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] text-slate-200 hover:bg-white/10 transition"
                          >
                            Leaderboard
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-inner shadow-purple-500/10">
                        <p className="text-sm font-semibold text-white mb-3">Get Started with DoorIQ</p>
                        <p className="text-xs text-slate-300 leading-relaxed mb-4">Sign in to track your progress, compete on the leaderboard, and unlock all features.</p>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              router.push('/auth/login')
                              setIsSidebarOpen(false)
                            }}
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500"
                          >
                            Sign In
                          </button>
                          <button
                            onClick={() => {
                              router.push('/auth/signup')
                              setIsSidebarOpen(false)
                            }}
                            className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                          >
                            Sign Up
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pt-6">
                    <div className="grid grid-cols-3 gap-3">
                      {quickActions.map((action) => {
                        const Icon = action.icon
                        return (
                          <button
                            key={action.label}
                            onClick={() => {
                              router.push(action.href)
                              setIsSidebarOpen(false)
                            }}
                            className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/5 bg-white/5 px-3 py-4 text-xs text-slate-200 transition hover:bg-white/10 hover:border-white/15"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/40 to-indigo-500/40 text-white">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="text-center leading-tight font-medium">{action.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-6 pt-6 pb-4">
                    <div className="space-y-6">
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
                            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-3">{section.title}</p>
                            <div className="space-y-2.5">
                              {visibleItems.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.href)
                                return (
                                  <button
                                    key={item.name}
                                    onClick={() => {
                                      router.push(item.href)
                                      setIsSidebarOpen(false)
                                    }}
                                    className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition-all ${
                                      active
                                        ? 'border-white/25 bg-white/10 text-white shadow-[0_18px_48px_rgba(109,40,217,0.25)]'
                                        : 'border-white/5 text-slate-200 hover:border-white/15 hover:bg-white/5'
                                    }`}
                                  >
                                    <span className="flex items-center gap-3">
                                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600/30 to-indigo-600/30 text-white">
                                        <Icon className="h-4 w-4" />
                                      </span>
                                      <span className="text-sm font-medium tracking-tight">{item.name}</span>
                                    </span>
                                    {item.badge && (
                                      <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-200">
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

                  <div className="px-6 pb-6">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 mb-4 text-xs text-slate-300">
                      <p className="font-semibold text-white text-sm mb-1">Need a hand?</p>
                      <p className="leading-relaxed">Chat with a live coach or browse the knowledge base for quick answers.</p>
                      <button
                        onClick={() => {
                          router.push('/support')
                          setIsSidebarOpen(false)
                        }}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500"
                      >
                        Message Support
                        <MessageCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {isSignedIn && (
                      <button
                        onClick={handleSignOut}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/35 to-pink-600/35 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-500/40 hover:to-pink-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                        disabled={signingOut}
                      >
                        <LogOut className="h-4 w-4" />
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
    </header>
  )
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
