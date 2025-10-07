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
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">All Live Sessions</h1>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name, email, or conversation id"
                className="pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-slate-400"
              />
            </div>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as any)}
              className="py-2 px-3 border border-slate-300 rounded-lg text-sm"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="all">All time</option>
            </select>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="py-2 px-3 border border-slate-300 rounded-lg text-sm"
            >
              <option value="any">Any outcome</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
              <option value="PARTIAL">Partial</option>
            </select>
            <button onClick={fetchSessions} className="inline-flex items-center px-3 py-2 text-sm border border-slate-300 rounded-lg">
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">When</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Rep</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Outcome</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td className="p-8 text-center text-slate-400" colSpan={6}>Loading…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td className="p-8 text-center text-slate-400" colSpan={6}>No sessions found</td></tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {format(new Date(s.created_at), 'MMM d, yyyy h:mm a')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <div className="font-medium">{s.users?.full_name || '—'}</div>
                            <div className="text-slate-500 text-xs">{s.users?.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold">
                          {s.overall_score ?? '—'}
                        </div>
                        <div className="text-xs text-slate-500">R:{s.rapport_score ?? '—'} · O:{s.objection_handling_score ?? '—'}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${s.outcome === 'SUCCESS' ? 'bg-green-100 text-green-700' : s.outcome === 'FAILURE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {s.outcome || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          {formatDuration(s.duration_seconds)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link href={`/analytics/${s.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-500">
                          View <ChevronRight className="w-4 h-4 ml-1" />
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


