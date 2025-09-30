'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { DetailedBreakdown } from './analysis/DetailedBreakdown'
import { MetricsGrid } from './analysis/MetricsGrid'
import { TranscriptViewer } from './analysis/TranscriptViewer'
import { SentimentTimeline } from './analysis/SentimentTimeline'
import { ComparisonChart } from './analysis/ComparisonChart'
import { GradeCard } from './analysis/GradeCard'

type Props = {
  conversationId: string
  userId: string
  agentId?: string
  homeownerName?: string
  homeownerProfile?: string
}

export default function ConversationAnalysis(props: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    analyze()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.conversationId])

  const analyze = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/grade/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: null,
          conversationId: props.conversationId,
          agentId: props.agentId,
          homeownerName: props.homeownerName,
          homeownerProfile: props.homeownerProfile,
          userId: props.userId,
        })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Failed to analyze')
      setResult(json.data)
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze conversation')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-200">
        <motion.div
          className="w-24 h-24 rounded-full border-4 border-slate-600 border-t-blue-500"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
        />
        <div className="mt-6 text-slate-400">Analyzing your conversation...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-900/30 border border-red-700 rounded-lg text-red-200">
        {error}
      </div>
    )
  }

  if (!result) return null

  const { basic, ai, grade } = result

  return (
    <div className="space-y-8">
      <GradeCard score={grade.total} letter={grade.letter} pass={grade.pass} />
      <MetricsGrid metrics={{
        totalTurns: basic.total_turns,
        durationSeconds: basic.conversation_duration_seconds,
        questions: basic.questions_asked_by_austin,
        objections: { raised: basic.objections_raised, resolved: basic.objections_resolved },
        interruptions: basic.interruptions_count,
        fillers: basic.filler_words_count,
        rapport: basic.rapport_score,
        closeAttempted: basic.close_attempted,
      }} />

      <DetailedBreakdown grading={grade} ai={ai} />

      <SentimentTimeline sentiment={ai?.sentiment_progression || ''} />

      <TranscriptViewer 
        transcriptHighlight={{
          keyQuestions: basic.austin_key_questions,
        }}
      />

      <ComparisonChart score={grade.total} />

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-5">
          <h3 className="text-green-300 font-semibold mb-3">What Worked</h3>
          <ul className="list-disc list-inside text-green-100 space-y-1">
            {(ai?.what_worked || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
          </ul>
        </div>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-5">
          <h3 className="text-red-300 font-semibold mb-3">What Failed</h3>
          <ul className="list-disc list-inside text-red-100 space-y-1">
            {(ai?.what_failed || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
        <h3 className="text-slate-200 font-semibold mb-3">Key Learnings</h3>
        <ul className="list-disc list-inside text-slate-200 space-y-1">
          {(ai?.key_learnings || []).map((w: string, i: number) => <li key={i}>{w}</li>)}
        </ul>
      </div>

      <div className="flex gap-3">
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Try Again</button>
        <button className="px-4 py-2 bg-slate-700 text-white rounded">New Scenario</button>
        <button className="px-4 py-2 bg-slate-700 text-white rounded">Save & Review Later</button>
        <button className="px-4 py-2 bg-slate-700 text-white rounded">Share</button>
        <button className="px-4 py-2 bg-slate-700 text-white rounded">Export PDF</button>
      </div>
    </div>
  )
}


