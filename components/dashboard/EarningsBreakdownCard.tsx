'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface SessionEarnings {
  id: string
  agentName: string
  virtualEarnings: number
  earningsData: any
  dealDetails: any
  saleClosed: boolean
  startedAt: string
  endedAt: string | null
}

export default function EarningsBreakdownCard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionEarnings[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEarnings, setTotalEarnings] = useState(0)
  const [closedDeals, setClosedDeals] = useState(0)

  useEffect(() => {
    fetchEarningsData()
  }, [])

  const fetchEarningsData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setLoading(false)
        return
      }

      const { data: sessionsData, error } = await supabase
        .from('live_sessions')
        .select('id, agent_name, virtual_earnings, earnings_data, deal_details, sale_closed, started_at, ended_at')
        .eq('user_id', user.id)
        .not('virtual_earnings', 'is', null)
        .gt('virtual_earnings', 0)
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) {
        console.error('Error fetching earnings data:', error)
        setLoading(false)
        return
      }

      const formattedSessions: SessionEarnings[] = (sessionsData || []).map((session: any) => ({
        id: session.id,
        agentName: session.agent_name || 'Unknown',
        virtualEarnings: parseFloat(session.virtual_earnings) || 0,
        earningsData: session.earnings_data || {},
        dealDetails: session.deal_details || {},
        saleClosed: session.sale_closed || false,
        startedAt: session.started_at,
        endedAt: session.ended_at
      }))

      setSessions(formattedSessions)
      
      // Calculate totals
      const total = formattedSessions.reduce((sum, s) => sum + s.virtualEarnings, 0)
      const closed = formattedSessions.filter(s => s.saleClosed).length
      
      setTotalEarnings(total)
      setClosedDeals(closed)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching earnings:', error)
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-12 bg-white/10 rounded w-1/2"></div>
          <div className="h-32 bg-white/10 rounded"></div>
        </div>
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <DollarSign className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2 font-space">No Earnings Yet</h3>
          <p className="text-slate-400 font-sans text-sm">Complete sessions and close deals to earn virtual earnings</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex-1">
          <h2 className="font-space text-white text-lg sm:text-xl md:text-2xl font-bold tracking-tight mb-1">
            Earnings Breakdown
          </h2>
          <p className="font-space text-white/60 text-xs sm:text-sm font-semibold">
            Last 20 Sessions
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Total Earnings</p>
          <p className="text-green-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {formatCurrency(totalEarnings)}
          </p>
        </div>
        <div className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4">
          <p className="text-white/60 text-xs sm:text-sm font-semibold mb-1 font-space">Deals Closed</p>
          <p className="text-purple-400 text-xl sm:text-2xl md:text-3xl font-bold font-space">
            {closedDeals}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {sessions.map((session, index) => {
          const dealValue = session.dealDetails?.total_contract_value || session.earningsData?.closed_amount || 0
          const commission = session.earningsData?.commission_earned || session.virtualEarnings
          const bonuses = session.earningsData?.bonus_modifiers || {}
          const totalBonuses = Object.values(bonuses).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0)
          
          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/[0.05] border border-white/10 rounded-lg p-3 sm:p-4 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer group"
              onClick={() => router.push(`/analytics/${session.id}`)}
            >
              <div className="flex items-center justify-between gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white font-semibold text-sm sm:text-base font-space truncate">
                      {session.agentName}
                    </p>
                    {session.saleClosed && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs font-semibold rounded border border-green-500/30 flex-shrink-0">
                        Closed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Calendar className="w-3 h-3" />
                    <span className="font-sans">
                      {session.endedAt 
                        ? formatDistanceToNow(new Date(session.endedAt), { addSuffix: true })
                        : formatDistanceToNow(new Date(session.startedAt), { addSuffix: true })
                      }
                    </span>
                  </div>
                  {totalBonuses > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Object.entries(bonuses).map(([key, value]: [string, any]) => {
                        if (!value || parseFloat(value) === 0) return null
                        return (
                          <span 
                            key={key}
                            className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30"
                          >
                            {key.replace(/_/g, ' ')}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <p className="text-green-400 text-lg sm:text-xl font-bold font-space">
                    {formatCurrency(session.virtualEarnings)}
                  </p>
                  {dealValue > 0 && (
                    <p className="text-white/40 text-xs font-sans">
                      Deal: {formatCurrency(dealValue)}
                    </p>
                  )}
                  <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors mt-1" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* View All Link */}
      {sessions.length >= 20 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => router.push('/sessions')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/80 hover:text-white text-sm font-semibold transition-all font-space"
          >
            View All Sessions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
