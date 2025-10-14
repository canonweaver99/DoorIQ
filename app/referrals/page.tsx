'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, Users, DollarSign, CheckCircle, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// Force dynamic rendering - Referral features need migration
export const dynamic = 'force-dynamic'

interface ReferralStats {
  referralCode: string
  totalReferrals: number
  activeReferrals: number
  pendingReferrals: number
  totalEarnings: number
  referrals: Array<{
    id: string
    referred_id: string
    status: string
    commission_earned: number
    created_at: string
    converted_at: string | null
  }>
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await fetch('/api/referrals/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error loading referral stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyReferralLink = async () => {
    if (!stats?.referralCode) return

    const referralUrl = `${window.location.origin}/auth/signup?ref=${stats.referralCode}`
    await navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  const referralUrl = `${window.location.origin}/auth/signup?ref=${stats?.referralCode || ''}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Affiliate Program</h1>
              <p className="text-slate-400">Earn rewards by referring new users</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6">
              <Users className="w-8 h-8 text-purple-400 mb-3" />
              <p className="text-2xl font-bold text-white">{stats?.totalReferrals || 0}</p>
              <p className="text-sm text-slate-400">Total Referrals</p>
            </div>
            
            <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6">
              <CheckCircle className="w-8 h-8 text-green-400 mb-3" />
              <p className="text-2xl font-bold text-white">{stats?.activeReferrals || 0}</p>
              <p className="text-sm text-slate-400">Active Referrals</p>
            </div>

            <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6">
              <DollarSign className="w-8 h-8 text-yellow-400 mb-3" />
              <p className="text-2xl font-bold text-white">${(stats?.totalEarnings || 0).toFixed(2)}</p>
              <p className="text-sm text-slate-400">Total Earnings</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6">
              <Gift className="w-8 h-8 text-white mb-3" />
              <p className="text-2xl font-bold text-white">20%</p>
              <p className="text-sm text-purple-100">Commission Rate</p>
            </div>
          </div>

          {/* Referral Link Section */}
          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Your Referral Link</h2>
            <p className="text-slate-400 mb-6">
              Share this link with friends and earn 20% commission on their first year of subscription!
            </p>
            
            <div className="flex gap-3">
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm">
                {referralUrl}
              </div>
              <button
                onClick={copyReferralLink}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">1. Share Your Link</p>
                <p className="text-xs text-slate-400">Send to friends, post on social media, or embed on your website</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">2. They Sign Up</p>
                <p className="text-xs text-slate-400">When they subscribe to a paid plan, you earn commission</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm font-semibold text-white mb-1">3. Get Paid</p>
                <p className="text-xs text-slate-400">Earn 20% recurring commission on their subscription</p>
              </div>
            </div>
          </div>

          {/* Referral History */}
          <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Referral History</h2>
            
            {stats?.referrals && stats.referrals.length > 0 ? (
              <div className="space-y-3">
                {stats.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        referral.status === 'active' ? 'bg-green-400' :
                        referral.status === 'pending' ? 'bg-yellow-400' :
                        'bg-slate-400'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-white capitalize">{referral.status}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        ${referral.commission_earned.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400">Earned</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No referrals yet</p>
                <p className="text-sm text-slate-500 mt-1">Start sharing your link to earn commissions!</p>
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <p className="text-xs text-slate-400">
              <strong className="text-purple-300">Affiliate Terms:</strong> You'll earn 20% recurring commission on paid subscriptions 
              from users who sign up through your referral link. Commission is paid monthly and requires a minimum balance of $50 to withdraw.
              Terms and conditions apply.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

