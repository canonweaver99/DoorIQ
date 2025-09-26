'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, MessageSquare, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConversationStatusProps {
  transcript: Array<{ speaker: string; text: string; timestamp: Date | string }>
  duration: number
}

export function ConversationStatus({ transcript, duration }: ConversationStatusProps) {
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative'>('neutral')
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [conversationPhase, setConversationPhase] = useState<string>('Opening')

  useEffect(() => {
    if (transcript.length === 0) return

    const lastEntry = transcript[transcript.length - 1]
    const text = lastEntry.text.toLowerCase()
    
    // Simple sentiment analysis
    if (text.includes('great') || text.includes('yes') || text.includes('sounds good') || text.includes('interested')) {
      setSentiment('positive')
    } else if (text.includes('no') || text.includes('not') || text.includes('busy') || text.includes('expensive')) {
      setSentiment('negative')
    } else {
      setSentiment('neutral')
    }

    // Determine conversation phase
    if (transcript.length < 3) {
      setConversationPhase('Opening')
    } else if (transcript.some(t => t.text.toLowerCase().includes('pest') || t.text.toLowerCase().includes('problem'))) {
      setConversationPhase('Discovery')
    } else if (transcript.some(t => t.text.toLowerCase().includes('service') || t.text.toLowerCase().includes('price'))) {
      setConversationPhase('Presentation')
    } else if (transcript.some(t => t.text.toLowerCase().includes('schedule') || t.text.toLowerCase().includes('appointment'))) {
      setConversationPhase('Closing')
    }

    setLastUpdate(new Date().toLocaleTimeString())
  }, [transcript])

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Minus className="w-5 h-5 text-gray-500" />
    }
  }

  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-300 bg-green-900/30 border-green-700/50'
      case 'negative':
        return 'text-red-300 bg-red-900/30 border-red-700/50'
      default:
        return 'text-slate-300 bg-slate-700/50 border-slate-600/50'
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-sm border border-slate-700 p-4">
      <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Live Conversation Status
      </h3>
      
      <div className="space-y-3">
        {/* Sentiment Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Current Sentiment</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={sentiment}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${getSentimentColor()}`}
            >
              {getSentimentIcon()}
              <span className="capitalize">{sentiment}</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Conversation Phase */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Phase</span>
          <span className="text-sm font-medium text-slate-100 bg-blue-900/50 px-3 py-1 rounded-full border border-blue-700/50">
            {conversationPhase}
          </span>
        </div>

        {/* Duration */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Duration</span>
          <span className="text-sm font-mono text-slate-100 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(duration)}
          </span>
        </div>

        {/* Exchange Count */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Exchanges</span>
          <span className="text-sm font-medium text-slate-100">{transcript.length}</span>
        </div>
      </div>

      {lastUpdate && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            Last updated: {lastUpdate}
          </p>
        </div>
      )}
    </div>
  )
}
