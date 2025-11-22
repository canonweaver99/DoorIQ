'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
  LayoutDashboard, Building2, Users, FileText, 
  ChevronRight, Shield 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
    { href: '/admin/sales-leads', label: 'Sales Leads', icon: Users },
    { href: '/admin/sessions', label: 'Sessions', icon: FileText },
  ]

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen batcave-bg relative">
      {/* Grid overlay */}
      <div className="fixed inset-0 batcave-grid pointer-events-none opacity-30" />
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 batcave-bg-secondary border-r neon-border z-10 p-6">
        <div className="mb-8 relative">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-6 h-6 text-cyan-neon" />
            <h1 className="text-xl font-bold text-cyan-neon">ADMIN</h1>
          </div>
          <p className="text-sm text-gray-300 font-mono">SYSTEM CONTROL</p>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname?.startsWith(item.href))
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 transition-all relative group',
                  isActive
                    ? 'neon-border-glow bg-black/50 text-cyan-neon'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-black/30 border border-transparent hover:neon-border'
                )}
              >
                <Icon className={cn(
                  'w-5 h-5 transition-all',
                  isActive && 'text-cyan-neon'
                )} />
                <span className={cn(
                  'font-medium font-mono text-sm tracking-wider',
                  isActive && 'text-cyan-neon'
                )}>{item.label.toUpperCase()}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-cyan-neon" />
                )}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500/50" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 pt-6 relative z-0">
        {children}
      </div>
    </div>
  )
}
