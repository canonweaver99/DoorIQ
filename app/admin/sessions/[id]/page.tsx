'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, User, Calendar, Clock } from 'lucide-react'
import ConversationAnalysis from '@/components/ConversationAnalysis'

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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Session not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/admin/sessions" className="inline-flex items-center text-blue-600 hover:text-blue-500">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sessions
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2 text-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <div>
                <div className="font-semibold">{session.users?.full_name}</div>
                <div className="text-xs text-slate-500">{session.users?.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-4 h-4 text-slate-400" />
              {new Date(session.created_at).toLocaleString()}
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              {session.duration_seconds ? `${Math.round(session.duration_seconds / 60)} min` : '—'}
            </div>
          </div>
        </div>

        {/* Full analysis view */}
        <ConversationAnalysis 
          conversationId={session?.analytics?.conversation_id || ''}
          userId={session?.user_id}
          agentId={session?.agent_id}
          homeownerName={session?.analytics?.homeowner_name || 'Austin'}
          homeownerProfile={session?.analytics?.homeowner_profile || 'Standard homeowner persona'}
        />
      </div>
    </div>
  )
}


