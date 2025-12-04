'use client'

import Link from 'next/link'
import { Calendar, Clock, User, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

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

interface SessionMobileCardProps {
  session: LiveSession
  formatDuration: (seconds?: number | null) => string
}

export function SessionMobileCard({ session, formatDuration }: SessionMobileCardProps) {
  return (
    <Link href={`/analytics/${session.id}`}>
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 hover:border-purple-500 hover:shadow-md transition-all">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-[#666] flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-space font-medium text-white truncate">
                  {session.users?.full_name || '—'}
                </div>
                <div className="text-xs text-[#a0a0a0] font-sans truncate">
                  {session.users?.email || '—'}
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 ml-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              session.outcome === 'SUCCESS' ? 'bg-green-500/20 text-green-400' : 
              session.outcome === 'FAILURE' ? 'bg-red-500/20 text-red-400' : 
              'bg-amber-500/20 text-amber-400'
            }`}>
              {session.outcome || '—'}
            </span>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
            <Calendar className="w-4 h-4 text-[#666] flex-shrink-0" />
            <span className="font-sans">{format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#a0a0a0]">
            <Clock className="w-4 h-4 text-[#666] flex-shrink-0" />
            <span className="font-sans">{formatDuration(session.duration_seconds)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
          <div>
            <div className="text-xs text-[#a0a0a0] font-sans mb-1">Overall Score</div>
            <div className="text-lg font-space font-semibold text-white">
              {session.overall_score ?? '—'}
            </div>
            <div className="text-xs text-[#a0a0a0] font-sans mt-1">
              R:{session.rapport_score ?? '—'} · O:{session.objection_handling_score ?? '—'}
            </div>
          </div>
          <div className="flex items-center text-purple-400 font-space font-medium">
            View Details
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}

