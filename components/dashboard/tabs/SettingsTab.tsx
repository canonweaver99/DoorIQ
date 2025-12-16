'use client'

import { motion } from 'framer-motion'
import { Settings, User, CreditCard, Users, Bell, Shield, ArrowRight, Mail, Lock } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface SettingsOption {
  id: string
  title: string
  description: string
  icon: React.ElementType
  href: string
  color: string
  bgColor: string
}

export default function SettingsTab() {
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserEmail(user.email || null)
    }
    setLoading(false)
  }

  const settingsOptions: SettingsOption[] = [
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your profile, email, and personal information',
      icon: User,
      href: '/settings/account',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'View plans, manage subscription, and payment methods',
      icon: CreditCard,
      href: '/settings/billing',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20'
    },
    {
      id: 'organization',
      title: 'Team & Organization',
      description: 'Manage team members, roles, and organization settings',
      icon: Users,
      href: '/settings/organization',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10 border-green-500/20'
    },
    {
      id: 'preferences',
      title: 'Preferences',
      description: 'Configure notifications and app preferences',
      icon: Bell,
      href: '/settings/preferences',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/20'
    },
    {
      id: 'login',
      title: 'Security & Login',
      description: 'Password, two-factor authentication, and security',
      icon: Lock,
      href: '/settings/login',
      color: 'text-red-400',
      bgColor: 'bg-red-500/10 border-red-500/20'
    }
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Quick Settings Overview */}
      <div className="bg-gradient-to-br from-slate-900/50 to-purple-900/20 border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Settings className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Settings</h2>
            <p className="text-slate-400 text-sm">
              {userEmail || 'Manage your account and preferences'}
            </p>
          </div>
        </div>
      </div>

      {/* Settings Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsOptions.map((option, index) => {
          const Icon = option.icon
          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Link
                href={option.href}
                className="block group"
              >
                <div className={`${option.bgColor} border rounded-xl p-6 hover:scale-[1.02] transition-all duration-300 cursor-pointer h-full`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 ${option.bgColor} rounded-lg border`}>
                      <Icon className={`w-6 h-6 ${option.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                        {option.title}
                      </h3>
                      <p className="text-slate-400 text-sm mb-3">
                        {option.description}
                      </p>
                      <div className="flex items-center gap-2 text-purple-400 text-sm font-medium group-hover:gap-3 transition-all">
                        <span>Manage</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="bg-gradient-to-br from-slate-900/50 to-indigo-900/20 border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/settings/account"
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10"
          >
            <Mail className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-medium text-sm">Update Email</p>
              <p className="text-slate-400 text-xs">Change your email address</p>
            </div>
          </Link>
          <Link
            href="/settings/login"
            className="flex items-center gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/10"
          >
            <Shield className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-white font-medium text-sm">Security</p>
              <p className="text-slate-400 text-xs">Change password</p>
            </div>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  )
}







