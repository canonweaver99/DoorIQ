'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, Users, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  {
    name: 'Account',
    href: '/settings/account',
    icon: User,
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
]

export function SettingsSidebar() {
  const pathname = usePathname()

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
    </nav>
  )
}

