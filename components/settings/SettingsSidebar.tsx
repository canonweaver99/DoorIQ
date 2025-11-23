'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, Users, Settings as SettingsIcon, Lock, Download, UserCog } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  {
    name: 'Account',
    href: '/settings/account',
    icon: User,
  },
  {
    name: 'Login',
    href: '/settings/login',
    icon: Lock,
  },
  {
    name: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
  },
  {
    name: 'Organization',
    href: '/settings/organization',
    icon: Users,
  },
  {
    name: 'Preferences',
    href: '/settings/preferences',
    icon: SettingsIcon,
  },
  {
    name: 'Reports',
    href: '/settings/reports',
    icon: Download,
  },
]

export function SettingsSidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
          if (userData) {
            setUserRole(userData.role)
          }
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchUserRole()
  }, [])

  const isManager = userRole === 'manager' || userRole === 'admin'

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              isActive
                ? 'bg-[#1a1a1a] text-white'
                : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]/50'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[#a0a0a0]')} strokeWidth={isActive ? 2 : 1.5} />
            <span className="font-medium text-sm font-sans">{item.name}</span>
          </Link>
        )
      })}
      {!loading && isManager && (
        <Link
          href="/settings/organization/teams"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ml-4',
            pathname === '/settings/organization/teams'
              ? 'bg-[#1a1a1a] text-white'
              : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]/50'
          )}
        >
          <UserCog className={cn('w-5 h-5', pathname === '/settings/organization/teams' ? 'text-white' : 'text-[#a0a0a0]')} strokeWidth={pathname === '/settings/organization/teams' ? 2 : 1.5} />
          <span className="font-medium text-sm font-sans">Team Management</span>
        </Link>
      )}
    </nav>
  )
}

