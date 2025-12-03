'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, Users, Settings as SettingsIcon, Lock, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  return (
    <nav className="space-y-1 md:block">
      {/* Desktop: Vertical list */}
      <div className="hidden md:block">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/settings/organization' && pathname?.startsWith('/settings/organization'))

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
      </div>

      {/* Mobile: Horizontal scroll */}
      <div className="md:hidden flex gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href === '/settings/organization' && pathname?.startsWith('/settings/organization'))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0',
                isActive
                  ? 'bg-[#1a1a1a] text-white'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]/50 bg-[#0a0a0a]'
              )}
            >
              <Icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-[#a0a0a0]')} strokeWidth={isActive ? 2 : 1.5} />
              <span className="font-medium text-xs font-sans">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

