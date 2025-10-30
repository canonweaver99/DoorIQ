'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, Loader2, User, Bot, Mic, MicOff, Volume2 } from 'lucide-react'

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
  const [mode, setMode] = useState<'chat' | 'voice'>('chat')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedVoice, setSelectedVoice] = useState<string>('')
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Load available voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        setAvailableVoices(voices)
        
        // Set default to a good-quality English voice
        if (!selectedVoice && voices.length > 0) {
          const preferredVoices = voices.filter(v => 
            v.lang.startsWith('en') && 
            (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Alex') || v.name.includes('Samantha'))
          )
          if (preferredVoices.length > 0) {
            setSelectedVoice(preferredVoices[0].voiceURI)
          } else {
            const englishVoices = voices.filter(v => v.lang.startsWith('en'))
            if (englishVoices.length > 0) {
              setSelectedVoice(englishVoices[0].voiceURI)
            }
          }
        }
      }
      
      // Load voices immediately
      loadVoices()
      
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  }, [selectedVoice])

  // Stop speech when component unmounts or mode changes
  useEffect(() => {
    return () => {
      if (speechSynthesisRef.current && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    // If switching to voice mode and there's a last assistant message, speak it
    if (mode === 'voice' && messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      if (lastMessage.role === 'assistant' && lastMessage.content) {
        speakText(lastMessage.content)
      }
    } else if (mode === 'chat') {
      // Stop speech when switching to chat
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
      }
    }
  }, [mode, messages])

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()
    setIsSpeaking(false)

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95 // Slightly slower for clarity
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.lang = 'en-US'
    
    // Use selected voice if available
    if (selectedVoice && availableVoices.length > 0) {
      const voice = availableVoices.find(v => v.voiceURI === selectedVoice)
      if (voice) {
        utterance.voice = voice
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true)
    }

    utterance.onend = () => {
      setIsSpeaking(false)
      speechSynthesisRef.current = null
    }

    utterance.onerror = () => {
      setIsSpeaking(false)
      speechSynthesisRef.current = null
    }

    speechSynthesisRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

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
            transcript: fullTranscript
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

      // If in voice mode, speak the response
      if (mode === 'voice') {
        setTimeout(() => {
          speakText(answer)
        }, 100)
      }
    } catch (error) {
      console.error('Error getting coaching:', error)
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

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-gradient-to-br from-slate-800/40 via-slate-800/30 to-slate-900/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      {/* Header with Mode Toggle */}
      <div className="px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI Coaching Assistant</h3>
              <p className="text-xs text-slate-400">
                {mode === 'chat' ? 'Ask questions about your performance' : 'Voice feedback mode'}
              </p>
            </div>
          </div>

          {/* Mode Toggle and Voice Selector */}
          <div className="flex items-center gap-3">
            {/* Voice Selector (only show in voice mode) */}
            {mode === 'voice' && availableVoices.length > 0 && (
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="px-3 py-2 text-xs font-medium rounded-md bg-slate-800/50 border border-slate-600/50 text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50 max-w-[180px]"
                onClick={(e) => e.stopPropagation()}
              >
                {availableVoices
                  .filter(v => v.lang.startsWith('en'))
                  .slice(0, 8) // Limit to 8 best options
                  .map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} {voice.name.includes('Google') || voice.name.includes('Microsoft') || voice.name.includes('Alex') || voice.name.includes('Samantha') ? '⭐' : ''}
                    </option>
                  ))}
              </select>
            )}
            <div className="flex items-center gap-2 bg-slate-900/50 rounded-lg p-1 border border-slate-700/50">
              <button
                onClick={() => setMode('chat')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'chat'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat</span>
                </div>
              </button>
              <button
                onClick={() => setMode('voice')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  mode === 'voice'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSpeaking ? (
                    <>
                      <MicOff className="w-4 h-4" onClick={stopSpeaking} />
                      <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Voice</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="px-6 py-4 min-h-[300px] max-h-[500px] overflow-y-auto space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mb-4">
              {mode === 'chat' ? (
                <MessageCircle className="w-8 h-8 text-purple-400" />
              ) : (
                <Volume2 className="w-8 h-8 text-purple-400" />
              )}
            </div>
            <p className="text-slate-300 font-medium mb-2">
              {mode === 'chat' ? 'Get Personalized Coaching' : 'Voice Coaching Mode'}
            </p>
            <p className="text-slate-500 text-sm max-w-md">
              {mode === 'chat'
                ? 'Select a question below to get AI-powered insights based on your session performance'
                : 'Select a question to hear feedback spoken aloud'}
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
                    {mode === 'voice' ? (
                      <Volume2 className="w-5 h-5 text-white" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
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
              {mode === 'voice' ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <Bot className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 px-4 py-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                <span className="text-sm text-slate-400">
                  {mode === 'voice' ? 'Preparing voice feedback...' : 'Thinking...'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {isSpeaking && mode === 'voice' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg"
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-purple-300 font-medium">Speaking...</span>
            <button
              onClick={stopSpeaking}
              className="ml-2 p-1.5 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <MicOff className="w-4 h-4 text-purple-300" />
            </button>
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
              disabled={loading || isSpeaking}
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
