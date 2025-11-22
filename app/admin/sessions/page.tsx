'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { format } from 'date-fns'
import { Search, Filter, RefreshCw, Calendar, Clock, User, ChevronRight } from 'lucide-react'

type LiveSession = {
  id: string
  created_at: string
  user_id: string
  agent_id: string | null
  overall_score: number | null
  rapport_score: number | null
  objection_handling_score: number | null
  safety_score: number | null
  close_effectiveness_score: number | null
  duration_seconds: number | null
  conversation_id: string | null
  outcome: string | null
  sale_closed: boolean | null
  analytics: any
  users?: { full_name: string; email: string }
}

export default function AdminSessionsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [q, setQ] = useState('')
  const [range, setRange] = useState<'week'|'month'|'all'>('week')
  const [outcome, setOutcome] = useState<'any'|'SUCCESS'|'FAILURE'|'PARTIAL'>('any')

  useEffect(() => { fetchSessions() }, [range, outcome])

  const fetchSessions = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('live_sessions')
        .select(`*, users:users!inner(full_name, email)`) as any
      
      // Date range
      if (range !== 'all') {
        const d = new Date()
        if (range === 'week') d.setDate(d.getDate() - 7)
        if (range === 'month') d.setMonth(d.getMonth() - 1)
        query = query.gte('created_at', d.toISOString())
      }
      // Outcome filter
      if (outcome !== 'any') query = query.eq('outcome', outcome)

      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data) setSessions(data as any)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return sessions
    return sessions.filter(s => {
      const name = s.users?.full_name?.toLowerCase() || ''
      const email = s.users?.email?.toLowerCase() || ''
      const cid = s.conversation_id?.toLowerCase() || ''
      return name.includes(term) || email.includes(term) || cid.includes(term)
    })
  }, [q, sessions])

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return '—'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen batcave-bg p-6 relative scanlines">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-neon mb-2 font-mono tracking-wider">
            TRAINING SESSIONS
          </h1>
          <p className="text-gray-500 font-mono text-sm">VIEW ALL LIVE SESSIONS</p>
          <div className="mt-4 h-px w-32 bg-gradient-to-r from-cyan-500 to-transparent" />
        </div>
        
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, or conversation id"
                className="pl-9 pr-3 py-2 batcave-bg-tertiary neon-border rounded-lg text-sm text-white placeholder-gray-600 font-mono focus:outline-none focus:neon-border-glow transition-all"
              />
            </div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="py-2 px-3 batcave-bg-tertiary neon-border text-white rounded-lg text-sm font-mono focus:outline-none focus:neon-border-glow transition-all"
            >
              <option value="week">LAST 7 DAYS</option>
              <option value="month">LAST 30 DAYS</option>
              <option value="all">ALL TIME</option>
            </select>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="py-2 px-3 batcave-bg-tertiary neon-border text-white rounded-lg text-sm font-mono focus:outline-none focus:neon-border-glow transition-all"
            >
              <option value="any">ANY OUTCOME</option>
              <option value="SUCCESS">SUCCESS</option>
              <option value="FAILURE">FAILURE</option>
              <option value="PARTIAL">PARTIAL</option>
            </select>
            <button 
              onClick={fetchSessions} 
              className="inline-flex items-center px-3 py-2 text-sm neon-border bg-black text-gray-400 hover:text-cyan-neon hover:border-cyan-500 rounded-lg font-mono transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> REFRESH
            </button>
          </div>
        </div>

        <div className="holographic-card neon-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b neon-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">When</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">Rep</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase font-mono tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr><td className="p-8 text-center text-gray-500 font-mono" colSpan={6}>LOADING…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="p-8 text-center text-gray-500 font-mono" colSpan={6}>NO SESSIONS FOUND</td></tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-black/30 transition-colors border-b neon-border">
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {format(new Date(s.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium font-mono">{s.users?.full_name || '—'}</div>
                            <div className="text-gray-500 text-xs font-mono">{s.users?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-cyan-neon data-display">
                          {s.overall_score ?? '—'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">R:{s.rapport_score ?? '—'} · O:{s.objection_handling_score ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-mono uppercase border ${
                          s.outcome === 'SUCCESS' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/50 neon-border' 
                            : s.outcome === 'FAILURE' 
                            ? 'bg-red-500/20 text-red-400 border-red-500/50 neon-border' 
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/50 neon-border'
                        }`}>
                          {s.outcome || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-300 font-mono">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {formatDuration(s.duration_seconds)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/analytics/${s.id}`} className="inline-flex items-center text-cyan-neon hover:text-cyan-400 font-mono transition-colors">
                          VIEW <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


