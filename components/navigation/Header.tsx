'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Mic,
  FileText,
  Trophy,
  User as UserIcon,
  Menu,
  X,
  LayoutDashboard,
  BarChart3,
  BookOpen,
  Settings as SettingsIcon,
  CreditCard,
  UserCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type User = Database['public']['Tables']['users']['Row']

export default function Header() {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const sidebarRef = useRef<HTMLDivElement | null>(null)
  const sidebarButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
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

  const profileNavigation: Array<{ name: string; href: string; icon: LucideIcon }> = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Documentation', href: '/documentation', icon: BookOpen },
    { name: 'Settings', href: '/settings', icon: SettingsIcon },
    { name: 'Billing', href: '/billing', icon: CreditCard },
    { name: 'User Profile', href: '/profile', icon: UserCircle },
  ]

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
    setIsSidebarOpen(false)
  }, [pathname])

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
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-all border border-white/10 ${
                  isSidebarOpen
                    ? 'text-white bg-gradient-to-r from-purple-600/20 to-pink-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
                aria-haspopup="menu"
                aria-expanded={isSidebarOpen}
              >
                <UserIcon className="w-4 h-4" />
                <span className="tracking-tight">Profile</span>
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
      {isSidebarOpen && (
        <div className="hidden md:block">
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={sidebarRef}
            className="fixed top-20 right-6 z-50 w-72 rounded-3xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl shadow-purple-500/20 p-6"
            role="menu"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.3em] text-slate-400">Account</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close profile menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {user && (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white leading-5">{user.full_name}</p>
                <p className="text-xs text-slate-300 leading-4">{user.email}</p>
                <p className="text-xs text-purple-400 font-semibold mt-2">${user.virtual_earnings.toFixed(2)} earned</p>
              </div>
            )}
            <nav className="mt-4 space-y-2">
              {profileNavigation.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-white/10 text-white'
                        : 'text-slate-200 border border-transparent hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="tracking-tight">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
