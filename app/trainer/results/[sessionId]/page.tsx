'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Trophy, Home, RotateCcw } from 'lucide-react'

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const sessionId = params.sessionId
      const resp = await fetch(`/api/session?id=${sessionId}`)
      
      if (!resp.ok) {
        throw new Error('Session not found')
      }
      
      const data = await resp.json()
      setSession(data)
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Session not found</h2>
          <button
            onClick={() => router.push('/trainer')}
            className="text-blue-400 hover:text-blue-300"
          >
            Back to training
          </button>
        </div>
      </div>
    )
  }

  const transcript = session.full_transcript || []
  const score = session.overall_score || 0

  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-8 mb-6 border border-slate-700 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-4xl font-bold text-slate-100 mb-2">Session Complete!</h1>
          <p className="text-slate-400">Here's how you did with {session.agent_name}</p>
        </div>

        {/* Score */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-8 mb-6 border border-slate-700 text-center">
          <div className={`text-6xl font-bold mb-2 ${
            score >= 80 ? 'text-green-400' :
            score >= 60 ? 'text-yellow-400' :
            'text-red-400'
          }`}>
            {score}/100
          </div>
          <div className="text-xl text-slate-300 mb-4">
            {score >= 80 ? 'Great Job!' :
             score >= 60 ? 'Good Effort!' :
             'Keep Practicing!'}
          </div>
          <div className="text-sm text-slate-400">
            Duration: {Math.floor((session.duration_seconds || 0) / 60)}:{String((session.duration_seconds || 0) % 60).padStart(2, '0')}
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-slate-800 rounded-xl shadow-xl p-8 mb-6 border border-slate-700">
          <h2 className="text-2xl font-semibold text-slate-100 mb-4">Conversation</h2>
          <div className="space-y-3">
            {transcript.length > 0 ? (
              transcript.map((line: any, idx: number) => (
                <div key={idx} className={`p-3 rounded-lg ${
                  line.speaker === 'rep' || line.speaker === 'user' 
                    ? 'bg-blue-900/20 border-l-4 border-blue-500' 
                    : 'bg-slate-700/30'
                }`}>
                  <div className="text-xs text-slate-400 mb-1">
                    {line.speaker === 'rep' || line.speaker === 'user' ? 'You' : 'Agent'}
                  </div>
                  <div className="text-slate-200">{line.text}</div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-4">No transcript available</p>
            )}
          </div>
        </div>

        {/* Feedback */}
        {session.what_worked && session.what_worked.length > 0 && (
          <div className="bg-slate-800 rounded-xl shadow-xl p-8 mb-6 border border-slate-700">
            <h2 className="text-2xl font-semibold text-green-400 mb-4">What Worked Well</h2>
            <ul className="space-y-2">
              {session.what_worked.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start text-slate-200">
                  <span className="text-green-400 mr-2">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {session.what_failed && session.what_failed.length > 0 && (
          <div className="bg-slate-800 rounded-xl shadow-xl p-8 mb-6 border border-slate-700">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Areas to Improve</h2>
            <ul className="space-y-2">
              {session.what_failed.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start text-slate-200">
                  <span className="text-yellow-400 mr-2">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/trainer')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 text-white font-semibold rounded-lg hover:bg-slate-600 transition-colors"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>
      </div>
    </div>
  )
}
