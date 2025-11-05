'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { 
  Gift, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Copy, 
  CheckCircle2, 
  ExternalLink,
  BarChart3,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AffiliateStats {
  totalEarnings: number
  totalReferrals: number
  activeReferrals: number
  conversionRate: number
  clicks: number
  pendingEarnings: number
}

export default function AffiliateDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [referralCode, setReferralCode] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [stats, setStats] = useState<AffiliateStats>({
    totalEarnings: 0,
    totalReferrals: 0,
    activeReferrals: 0,
    conversionRate: 0,
    clicks: 0,
    pendingEarnings: 0
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      router.push('/auth/login?next=/affiliate/dashboard')
      return
    }
    setUser(authUser)
    
    // Generate referral code from user ID (you can customize this)
    const code = authUser.id.substring(0, 8).toUpperCase()
    setReferralCode(code)
    
    // Load affiliate stats (this would come from your database/API)
    // For now, showing placeholder data
    setStats({
      totalEarnings: 0,
      totalReferrals: 0,
      activeReferrals: 0,
      conversionRate: 0,
      clicks: 0,
      pendingEarnings: 0
    })
    
    setLoading(false)
  }

  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/affiliate?ref=${referralCode}`
    : ''

  const copyToClipboard = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Affiliate Dashboard</h1>
              <p className="text-slate-400">Track your referrals and earnings</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              icon: DollarSign,
              label: 'Total Earnings',
              value: `$${stats.totalEarnings.toFixed(2)}`,
              color: 'text-green-400',
              bgColor: 'bg-green-500/20',
              borderColor: 'border-green-500/30'
            },
            {
              icon: Users,
              label: 'Total Referrals',
              value: stats.totalReferrals.toString(),
              color: 'text-blue-400',
              bgColor: 'bg-blue-500/20',
              borderColor: 'border-blue-500/30'
            },
            {
              icon: TrendingUp,
              label: 'Conversion Rate',
              value: `${stats.conversionRate.toFixed(1)}%`,
              color: 'text-purple-400',
              bgColor: 'bg-purple-500/20',
              borderColor: 'border-purple-500/30'
            },
            {
              icon: BarChart3,
              label: 'Total Clicks',
              value: stats.clicks.toString(),
              color: 'text-yellow-400',
              bgColor: 'bg-yellow-500/20',
              borderColor: 'border-yellow-500/30'
            },
            {
              icon: Users,
              label: 'Active Referrals',
              value: stats.activeReferrals.toString(),
              color: 'text-indigo-400',
              bgColor: 'bg-indigo-500/20',
              borderColor: 'border-indigo-500/30'
            },
            {
              icon: Calendar,
              label: 'Pending Earnings',
              value: `$${stats.pendingEarnings.toFixed(2)}`,
              color: 'text-pink-400',
              bgColor: 'bg-pink-500/20',
              borderColor: 'border-pink-500/30'
            }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className={`bg-white/5 backdrop-blur-sm border ${stat.borderColor} rounded-xl p-6`}
            >
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Referral Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Your Referral Link</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center gap-3">
              <code className="flex-1 text-sm text-white break-all">{referralUrl || 'Loading...'}</code>
            </div>
            <Button
              onClick={copyToClipboard}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-slate-400 mt-4">
            Share this link with your network. When someone signs up through your link and subscribes, you'll earn a commission.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Get Marketing Materials</h3>
            <p className="text-slate-400 mb-4">
              Download banners, social media posts, and email templates to promote DoorIQ.
            </p>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => router.push('/affiliate/materials')}
            >
              Download Materials
              <ExternalLink className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Learn Best Practices</h3>
            <p className="text-slate-400 mb-4">
              Discover strategies to maximize your referrals and earnings.
            </p>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => router.push('/affiliate/program')}
            >
              View Guide
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No activity yet. Start sharing your referral link to see stats here!</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

