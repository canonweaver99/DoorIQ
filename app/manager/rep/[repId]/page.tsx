'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, Clock, TrendingUp, MessageSquare, 
  DollarSign, Target, ChevronRight, Send, AlertCircle 
} from 'lucide-react'
import { format } from 'date-fns'

type User = Database['public']['Tables']['users']['Row']
type Session = Database['public']['Tables']['live_sessions']['Row']
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: { full_name: string }
}

export default function RepDetailPage() {
  const router = useRouter()
  const params = useParams()
  const repId = params.repId as string
  
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [rep, setRep] = useState<User | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState('')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [repId])

  const checkAccess = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const current = userData as any
    if (!current || (current.role !== 'manager' && current.role !== 'admin')) {
      router.push('/')
      return
    }

    setCurrentUser(current)
    fetchRepData()
  }

  const fetchRepData = async () => {
    const supabase = createClient()
    
    // Fetch rep info
    const { data: repData } = await supabase
      .from('users')
      .select('*')
      .eq('id', repId)
      .single()
    
    if (!repData) {
      router.push('/manager')
      return
    }
    
    setRep(repData as any)
    
    // Fetch sessions
    const { data: sessionsData } = await supabase
      .from('live_sessions')
      .select('*')
      .eq('user_id', repId)
      .order('created_at', { ascending: false })
    
    setSessions((sessionsData || []) as any)
    
    // Fetch messages
    const { data: messagesData } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(full_name)
      `)
      .or(`sender_id.eq.${repId},recipient_id.eq.${repId}`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setMessages((messagesData as any) || [])
    
    // Mark messages as read
    if (currentUser) {
      await (supabase as any)
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', repId)
        .eq('recipient_id', (currentUser as any).id)
    }
    
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !currentUser || !rep) return

    setSending(true)
    const supabase = createClient()
    
    const { error } = await (supabase as any)
      .from('messages')
      .insert({
        sender_id: (currentUser as any).id,
        recipient_id: (rep as any).id,
        session_id: (selectedSession as any)?.id || (sessions[0] as any)?.id || '',
        message: messageText.trim()
      })

    if (!error) {
      setMessageText('')
      setSelectedSession(null)
      fetchRepData() // Refresh messages
    } else {
      alert('Failed to send message')
    }
    
    setSending(false)
  }

  const calculateStats = () => {
    const scoredSessions = sessions.filter(s => s.overall_score !== null)
    const avgScore = scoredSessions.length > 0
      ? Math.round(scoredSessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scoredSessions.length)
      : 0
    
    const totalEarnings = sessions.reduce((sum, s) => sum + (s.virtual_earnings || 0), 0)
    
    const recentTrend = sessions.length >= 2 && sessions[0].overall_score && sessions[1].overall_score
      ? sessions[0].overall_score - sessions[1].overall_score
      : 0
    
    return { avgScore, totalEarnings, recentTrend, totalSessions: sessions.length }
  }

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-slate-400'
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/manager"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{rep?.full_name}</h1>
              <p className="text-slate-400">{rep?.email}</p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Average Score</h3>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.avgScore}%</p>
            {stats.recentTrend !== 0 && (
              <p className={`text-sm mt-1 ${stats.recentTrend > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.recentTrend > 0 ? '+' : ''}{stats.recentTrend}% from last session
              </p>
            )}
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Total Earnings</h3>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Sessions</h3>
              <Calendar className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-white">{stats.totalSessions}</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Messages</h3>
              <MessageSquare className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-white">{messages.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sessions List */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Training Sessions</h2>
              </div>
              
              <div className="divide-y divide-slate-700">
                {sessions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No sessions found
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="p-6 hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm text-slate-400">
                            {format(new Date(session.created_at), 'MMM d, yyyy h:mm a')}
                          </p>
                          {session.duration_seconds && (
                            <p className="text-xs text-slate-500 mt-1">
                              Duration: {Math.round(session.duration_seconds / 60)} minutes
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(session.overall_score)}`}>
                            {session.overall_score || '--'}%
                          </p>
                          {session.virtual_earnings !== null && session.virtual_earnings > 0 && (
                            <p className="text-sm text-green-400 mt-1">
                              ${session.virtual_earnings.toFixed(2)} earned
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Score Breakdown */}
                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="bg-slate-900/50 rounded p-2">
                          <p className="text-xs text-slate-400">Rapport</p>
                          <p className={`text-sm font-medium ${getScoreColor(session.rapport_score)}`}>
                            {session.rapport_score || '--'}%
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <p className="text-xs text-slate-400">Objections</p>
                          <p className={`text-sm font-medium ${getScoreColor(session.objection_handling_score)}`}>
                            {session.objection_handling_score || '--'}%
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <p className="text-xs text-slate-400">Safety</p>
                          <p className={`text-sm font-medium ${getScoreColor(session.safety_score)}`}>
                            {session.safety_score || '--'}%
                          </p>
                        </div>
                        <div className="bg-slate-900/50 rounded p-2">
                          <p className="text-xs text-slate-400">Closing</p>
                          <p className={`text-sm font-medium ${getScoreColor(session.close_effectiveness_score)}`}>
                            {session.close_effectiveness_score || '--'}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Link
                          href={`/analytics/${session.id}`}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          View Details →
                        </Link>
                        <button
                          onClick={() => setSelectedSession(session)}
                          className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                          Send Feedback →
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Messaging Panel */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 sticky top-20">
              <div className="px-6 py-4 border-b border-slate-700">
                <h2 className="text-xl font-semibold text-white">Messages</h2>
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-b border-slate-700">
                {selectedSession && (
                  <div className="mb-3 p-2 bg-slate-900/50 rounded text-xs text-slate-400">
                    Regarding session from {format(new Date(selectedSession.created_at), 'MMM d')}
                  </div>
                )}
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Send feedback or coaching tips..."
                  className="w-full h-24 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim() || sending}
                  className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Message'}
                </button>
              </div>
              
              {/* Messages List */}
              <div className="max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No messages yet
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {messages.map((message) => {
                      const isFromManager = message.sender_id === currentUser?.id
                      
                      return (
                        <div
                          key={message.id}
                          className={`rounded-lg p-3 ${
                            isFromManager
                              ? 'bg-blue-600/20 ml-4'
                              : 'bg-slate-900/50 mr-4'
                          }`}
                        >
                          <p className="text-xs text-slate-400 mb-1">
                            {isFromManager ? 'You' : message.sender.full_name} •{' '}
                            {format(new Date(message.created_at), 'MMM d, h:mm a')}
                          </p>
                          <p className="text-sm text-white">{message.message}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
