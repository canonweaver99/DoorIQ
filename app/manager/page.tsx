'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'
import { useRouter } from 'next/navigation'
import { Users, MessageSquare, TrendingUp, Calendar, ChevronRight, Send, X } from 'lucide-react'
import { format } from 'date-fns'

type User = Database['public']['Tables']['users']['Row']
type Session = Database['public']['Tables']['training_sessions']['Row']
type Message = Database['public']['Tables']['messages']['Row'] & {
  sender: { full_name: string }
  recipient: { full_name: string }
}

interface RepWithStats extends User {
  sessions: Session[]
  recentSession?: Session
  avgScore: number
  totalEarnings: number
  unreadMessages: number
}

export default function ManagerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [reps, setReps] = useState<RepWithStats[]>([])
  const [selectedRep, setSelectedRep] = useState<RepWithStats | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    checkAccess()
  }, [])

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
    fetchReps(current.id as string)
  }

  const fetchReps = async (managerId: string) => {
    const supabase = createClient()
    
    // For now, fetch all reps. In production, you'd use manager_rep_assignments
    const { data: repsData } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'rep')
      .order('virtual_earnings', { ascending: false })

    if (!repsData) {
      setLoading(false)
      return
    }

    const repsAny = repsData as any[]

    // Fetch stats for each rep
    const repsWithStats = await Promise.all(
      repsAny.map(async (rep: any) => {
        // Fetch sessions
        const { data: sessions } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('user_id', rep.id as string)
          .order('created_at', { ascending: false })

        // Count unread messages from this rep
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('sender_id', rep.id as string)
          .eq('recipient_id', managerId)
          .eq('is_read', false)

        const sessionsData = (sessions || []) as any[]
        const scored = sessionsData.filter((s) => s.overall_score !== null)
        const avgScore = scored.length > 0
          ? Math.round(
              scored.reduce((sum, s) => sum + (s.overall_score || 0), 0) / scored.length
            )
          : 0

        return {
          ...(rep as any),
          sessions: sessionsData,
          recentSession: sessionsData[0],
          avgScore,
          totalEarnings: rep.virtual_earnings || 0,
          unreadMessages: unreadCount || 0
        } as any
      })
    )

    setReps(repsWithStats as any)
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!selectedRep || !messageText.trim() || !currentUser) return

    setSending(true)
    const supabase = createClient()
    
    const { error } = await (supabase as any)
      .from('messages')
      .insert({
        sender_id: (currentUser as any).id,
        recipient_id: (selectedRep as any).id,
        session_id: (selectedSession as any)?.id || (selectedRep as any).recentSession?.id || '',
        message: messageText.trim()
      })

    if (!error) {
      setMessageText('')
      setShowMessageModal(false)
      // Show success message
      alert('Message sent successfully!')
    } else {
      alert('Failed to send message')
    }
    
    setSending(false)
  }

  const getPerformanceTrend = (rep: RepWithStats) => {
    if (rep.sessions.length < 2) return 'neutral'
    
    const recentScores = rep.sessions
      .slice(0, 5)
      .filter(s => s.overall_score !== null)
      .map(s => s.overall_score as number)
    
    if (recentScores.length < 2) return 'neutral'
    
    const recentAvg = recentScores[0]
    const previousAvg = recentScores.slice(1).reduce((a, b) => a + b, 0) / (recentScores.length - 1)
    
    if (recentAvg > previousAvg + 5) return 'up'
    if (recentAvg < previousAvg - 5) return 'down'
    return 'neutral'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Manager Dashboard</h1>
          <p className="text-slate-400">Monitor and coach your sales team</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Total Reps</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-white">{reps.length}</p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Avg Team Score</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {reps.length > 0 
                ? Math.round(reps.reduce((sum, r) => sum + r.avgScore, 0) / reps.length)
                : 0}%
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Total Earnings</h3>
              <TrendingUp className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              ${reps.reduce((sum, r) => sum + r.totalEarnings, 0).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-400">Unread Messages</h3>
              <MessageSquare className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-white">
              {reps.reduce((sum, r) => sum + r.unreadMessages, 0)}
            </p>
          </div>
        </div>

        {/* Reps Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Sales Representatives</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Rep Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Last Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Earnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {reps.map((rep) => {
                  const trend = getPerformanceTrend(rep)
                  
                  return (
                    <tr key={rep.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {rep.full_name}
                            {rep.unreadMessages > 0 && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600 text-white">
                                {rep.unreadMessages} new
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400">{rep.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {rep.recentSession 
                          ? format(new Date(rep.recentSession.created_at), 'MMM d, yyyy')
                          : 'No sessions'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {rep.avgScore > 0 ? `${rep.avgScore}%` : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-400">
                          ${rep.totalEarnings.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {trend === 'up' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {trend === 'down' && <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />}
                        {trend === 'neutral' && <div className="w-5 h-5 bg-slate-600 rounded-full" />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedRep(rep)
                              router.push(`/manager/rep/${rep.id}`)
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            View Sessions
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRep(rep)
                              setSelectedSession(rep.recentSession || null)
                              setShowMessageModal(true)
                            }}
                            className="text-indigo-400 hover:text-indigo-300"
                          >
                            Message
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && selectedRep && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Send Message to {selectedRep.full_name}
              </h3>
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {selectedSession && (
              <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400">Regarding session from:</p>
                <p className="text-sm text-white">
                  {format(new Date(selectedSession.created_at), 'MMM d, yyyy h:mm a')}
                </p>
                {selectedSession.overall_score && (
                  <p className="text-sm text-slate-400 mt-1">
                    Score: {selectedSession.overall_score}%
                  </p>
                )}
              </div>
            )}
            
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your feedback or coaching message..."
              className="w-full h-32 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowMessageModal(false)
                  setMessageText('')
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sendMessage}
                disabled={!messageText.trim() || sending}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
