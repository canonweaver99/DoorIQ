'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, Loader2, User, Bot } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CoachingChatProps {
  sessionId: string
  overallScore: number
  scores: Record<string, number>
  feedback: {
    strengths: string[]
    improvements: string[]
  }
  fullTranscript?: Array<{ speaker: string, text?: string, message?: string }>
  saleClosed?: boolean
  virtualEarnings?: number
}

const SUGGESTED_QUESTIONS = [
  {
    id: 'improve_close',
    label: "How can I improve my closing technique?",
    icon: "🎯"
  },
  {
    id: 'objection_tips',
    label: "What's the best way to handle the objections I faced?",
    icon: "💡"
  },
  {
    id: 'next_practice',
    label: "What should I focus on in my next practice session?",
    icon: "🚀"
  },
  {
    id: 'rapport_building',
    label: "How did I do building rapport?",
    icon: "🤝"
  },
  {
    id: 'missed_opportunities',
    label: "What opportunities did I miss?",
    icon: "👀"
  },
  {
    id: 'best_moments',
    label: "What were my best moments in this call?",
    icon: "⭐"
  }
]

export default function CoachingChat({
  sessionId,
  overallScore,
  scores,
  feedback,
  fullTranscript = [],
  saleClosed = false,
  virtualEarnings = 0
}: CoachingChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const handleQuestionClick = async (question: string) => {
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: question,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await fetch('/api/coach/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          sessionContext: {
            overallScore,
            scores,
            feedback,
            saleClosed,
            virtualEarnings,
            transcriptLength: fullTranscript.length,
            transcript: fullTranscript // Send actual transcript for quotes
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get coaching response')
      }

      const { answer } = await response.json()

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: answer,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error getting coaching:', error)
      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Coaching Assistant</h3>
            <p className="text-xs text-slate-400">Ask questions about your performance</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="px-6 py-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-slate-300 font-medium mb-2">Get Personalized Coaching</p>
            <p className="text-slate-500 text-sm max-w-md">
              Select a question below to get AI-powered insights based on your session performance
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-5 py-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                      : 'bg-slate-800/60 border border-slate-700/50 text-slate-200'
                  }`}
                >
                  <p className="text-base leading-relaxed whitespace-pre-wrap font-medium">{message.content}</p>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-slate-400">Thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Question Buttons */}
      <div className="px-6 py-4 border-t border-slate-700/50 bg-slate-900/40">
        <p className="text-xs text-slate-400 mb-3 uppercase tracking-wider">Quick Questions</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => handleQuestionClick(q.label)}
              disabled={loading}
              className="flex items-center gap-3 px-4 py-3 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-purple-500/50 rounded-xl text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <span className="text-xl">{q.icon}</span>
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors font-medium">
                {q.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

