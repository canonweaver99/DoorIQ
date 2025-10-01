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
  Sparkles,
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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type User = Database['public']['Tables']['users']['Row']

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const sidebarButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        setUser(userData)
      }
    }

    fetchUser()
  }, [])

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Practice', href: '/trainer/select-homeowner', icon: Mic },
    { name: 'Sessions', href: '/sessions', icon: FileText },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Pricing', href: '/pricing', icon: Trophy },
  ]

  const sidebarSections: Array<{
    title: string
    items: Array<{ name: string; href: string; icon: LucideIcon; badge?: string }>
  }> = [
    {
      title: 'Workspace',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Analytics', href: '/analytics', icon: BarChart3 },
        { name: 'AI Insights', href: '/insights', icon: PieChart },
        { name: 'Playbooks', href: '/playbooks', icon: NotebookPen, badge: 'New' },
      ],
    },
    {
      title: 'Training',
      items: [
        { name: 'Practice Hub', href: '/trainer', icon: Award },
        { name: 'Choose Homeowner', href: '/trainer/select-homeowner', icon: Users },
        { name: 'Session History', href: '/trainer/history', icon: ClipboardList },
        { name: 'Leaderboard', href: '/trainer/leaderboard', icon: BarChart2 },
      ],
    },
    {
      title: 'Support & Account',
      items: [
        { name: 'Coaching', href: '/coaching', icon: Sparkles },
        { name: 'Documentation', href: '/documentation', icon: BookOpen },
        { name: 'Help Center', href: '/support', icon: HelpCircle },
        { name: 'Live Support', href: '/support/live', icon: Headphones },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Settings', href: '/settings', icon: SettingsIcon },
        { name: 'Billing', href: '/billing', icon: CreditCard },
        { name: 'Security', href: '/security', icon: ShieldCheck },
        { name: 'User Profile', href: '/profile', icon: UserCircle },
      ],
    },
  ]

  const quickActions = [
    { label: 'Start Training', href: '/trainer', icon: Mic },
    { label: 'Review Sessions', href: '/sessions', icon: ClipboardList },
    { label: 'Invite Teammate', href: '/invite', icon: Users },
  ]

  const profileNavigation: Array<{ name: string; href: string; icon: LucideIcon }> = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'AI Insights', href: '/insights', icon: PieChart },
    { name: 'Playbooks', href: '/playbooks', icon: NotebookPen },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Documentation', href: '/documentation', icon: BookOpen },
    { name: 'Coaching', href: '/coaching', icon: Sparkles },
    { name: 'Support', href: '/support', icon: LifeBuoy },
    { name: 'Integrations', href: '/integrations', icon: Plug },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'Security', href: '/security', icon: ShieldCheck },
    { name: 'User Profile', href: '/profile', icon: UserCircle },
  ]

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

  // Add manager panel link if user is a manager or admin
  if (user && (user.role === 'manager' || user.role === 'admin')) {
    navigation.splice(4, 0, { 
      name: 'Manager Panel', 
      href: '/manager', 
      icon: FileText 
    })
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
              {user && (
                <div className="pl-2 border-l border-white/10">
                  <p className="text-xs text-slate-300 leading-4">{user.full_name}</p>
                  <p className="text-[11px] text-purple-400 font-semibold">${user.virtual_earnings.toFixed(2)} earned</p>
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
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="px-4 text-xs uppercase tracking-[0.3em] text-slate-400">Account</p>
              <div className="mt-2 space-y-2">
                {profileNavigation.map((item) => {
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
            </div>
            {user && (
              <div className="px-4 py-3 border-t border-white/10">
                <p className="text-sm font-medium text-white">{user.full_name}</p>
                <p className="text-xs text-purple-400 font-semibold mt-1">${user.virtual_earnings.toFixed(2)} earned</p>
              </div>
            )}
          </div>
        )}
      </nav>
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              className="hidden md:block fixed inset-0 z-40 bg-black/60"
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
              className="hidden md:flex fixed top-0 right-0 bottom-0 z-[999] w-full max-w-md flex-col overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#07030f] via-[#0e0b1f] to-[#150c28] backdrop-blur-2xl shadow-[0_30px_120px_rgba(109,40,217,0.35)] pointer-events-auto"
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
                <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-inner shadow-purple-500/10">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">
                      {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white leading-5">{user?.full_name ?? 'Sales Pro'}</p>
                      <p className="text-xs text-slate-300 leading-4">{user?.email ?? 'team@dooriq.app'}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Earnings</p>
                      <p className="mt-1 text-base font-semibold text-white">${user?.virtual_earnings?.toFixed(2) ?? '0.00'}</p>
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
                  {sidebarSections.map((section) => (
                    <div key={section.title}>
                      <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500 mb-3">{section.title}</p>
                      <div className="space-y-2.5">
                        {section.items.map((item) => {
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
                  ))}
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
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-purple-600/35 to-pink-600/35 px-4 py-3 text-sm font-semibold text-white transition hover:from-purple-500/40 hover:to-pink-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={signingOut}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
