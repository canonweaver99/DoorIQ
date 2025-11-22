'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, CreditCard, Users, Settings as SettingsIcon, ChevronRight } from 'lucide-react'
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
    name: 'Team',
    href: '/settings/team',
    icon: Users,
  },
  {
    name: 'Preferences',
    href: '/settings/preferences',
    icon: SettingsIcon,
  },
]

export function SettingsNav() {
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
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
              isActive
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'text-foreground/70 hover:text-foreground hover:bg-white/5'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive ? 'text-purple-400' : 'text-foreground/50')} />
            <span className="font-medium font-sans">{item.name}</span>
            {isActive && <ChevronRight className="w-4 h-4 ml-auto text-purple-400" />}
          </Link>
        )
      })}
    </nav>
  )
}

