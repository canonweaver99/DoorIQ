'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, Clock } from 'lucide-react'

export default function AdminSessionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [params.id])

  const fetchSession = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('live_sessions')
        .select('*, users:users!inner(full_name, email)')
        .eq('id', params.id as string)
        .single()
      if (!error) setSession(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-[#a0a0a0] font-sans">Session not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/sessions" className="inline-flex items-center text-purple-400 hover:text-purple-300 min-h-[44px] sm:min-h-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sessions
          </Link>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-white">
              <User className="w-4 h-4 text-[#666] flex-shrink-0" />
              <div className="min-w-0">
                <div className="font-semibold font-space truncate">{session.users?.full_name}</div>
                <div className="text-xs text-[#a0a0a0] font-sans truncate">{session.users?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-4 h-4 text-[#666] flex-shrink-0" />
              <span className="text-sm sm:text-base font-sans">{new Date(session.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <Clock className="w-4 h-4 text-[#666] flex-shrink-0" />
              <span className="text-sm sm:text-base font-sans">{session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-white mb-4 font-space">Session Details</h2>
          
          {/* Transcript */}
          {session.full_transcript && session.full_transcript.length > 0 && (
            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-3 font-space">Transcript</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {session.full_transcript.map((line: any, idx: number) => (
                  <div key={idx} className="p-3 sm:p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a]">
                    <span className="font-semibold text-purple-400 font-space">{line.speaker}:</span>{' '}
                    <span className="text-[#a0a0a0] font-sans break-words">{line.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Score */}
          {session.overall_score && (
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 font-space">Score</h3>
              <div className="text-2xl sm:text-3xl font-bold text-purple-400 font-space">{session.overall_score}/100</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


