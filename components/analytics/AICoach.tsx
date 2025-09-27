'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Bot, User } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  citations?: { line: number, speaker: string, text: string }[]
}

interface AICoachProps {
  sessionData: any // The complete session data including transcript and analytics
  className?: string
}

export default function AICoach({ sessionData, className = "" }: AICoachProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add initial message when chat opens
      setMessages([{
        role: 'assistant',
        content: "I'm your AI coach! Ask me about specific moments in your conversation or how to improve your score. For example: \"Why did I score low on objection handling?\" or \"How could I have handled that price objection better?\"",
        timestamp: new Date()
      }])
    }
  }, [isOpen, messages.length])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const extractCitations = (text: string): { line: number, speaker: string, text: string }[] => {
    try {
      const refs = new Set<number>()
      const regex = /Line\s+(\d+)/gi
      let match
      while ((match = regex.exec(text)) !== null) {
        const n = parseInt(match[1], 10)
        if (!isNaN(n)) refs.add(n)
      }
      const transcript: any[] = Array.isArray((sessionData as any)?.transcript) ? (sessionData as any).transcript : []
      const out: { line: number, speaker: string, text: string }[] = []
      for (const lineNum of Array.from(refs).sort((a, b) => a - b)) {
        const idx = lineNum - 1
        if (idx >= 0 && idx < transcript.length) {
          const entry = transcript[idx]
          const speaker = (entry?.speaker === 'user' || entry?.speaker === 'rep') ? 'Sales Rep' : 'Austin Rodriguez'
          out.push({ line: lineNum, speaker, text: String(entry?.text || '') })
        }
      }
      return out
    } catch {
      return []
    }
  }

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/analytics/coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionData: sessionData,
          conversationHistory: messages
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response from AI coach')
      }

      const data = await response.json()
      const citations = extractCitations(String(data.response || ''))
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        citations
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className={className}>
      {/* Floating Chat Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50 flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-20 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Chat Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-96 bg-slate-800 shadow-2xl z-50 flex flex-col border-l border-slate-700"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-700 bg-blue-600 text-white">
                <div className="flex items-center">
                  <Bot className="w-6 h-6 mr-2" />
                  <div>
                    <h3 className="font-semibold">AI Coach</h3>
                    <p className="text-sm text-blue-100">Ask me about your performance</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900">
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-100 border border-slate-600'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        {message.role === 'assistant' ? (
                          <Bot className="w-4 h-4 mr-1 text-blue-400" />
                        ) : (
                          <User className="w-4 h-4 mr-1" />
                        )}
                        <span className="text-xs opacity-75">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.role === 'assistant' && message.citations && message.citations.length > 0 && (
                        <div className="mt-3">
                          <details className="bg-slate-800 border border-slate-600 rounded-md p-3">
                            <summary className="cursor-pointer text-sm text-slate-200">
                              Referenced transcript lines ({message.citations.length})
                            </summary>
                            <div className="mt-2 space-y-2">
                              {message.citations.map((c) => (
                                <div key={c.line} className="text-sm bg-slate-900 border border-slate-700 rounded p-2">
                                  <div className="text-slate-400 mb-1">Line {c.line} • {c.speaker}</div>
                                  <blockquote className="text-slate-100">“{c.text}”</blockquote>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-slate-700 text-slate-100 rounded-lg px-4 py-2 max-w-[85%] border border-slate-600">
                      <div className="flex items-center">
                        <Bot className="w-4 h-4 mr-2 text-blue-400" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Preset prompts + Input */}
              <div className="p-4 border-t border-slate-700 bg-slate-800">
                {/* Preset buttons */}
                <div className="mb-3 flex flex-wrap gap-2">
                  {[
                    "What could I have done better?",
                    "How could I have closed sooner?",
                    "Which part hurt my score most?"
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        if (!isLoading) {
                          setInputValue(preset)
                          setTimeout(() => sendMessage(), 0)
                        }
                      }}
                      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-100 border border-slate-600 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isLoading}
                      type="button"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your performance..."
                    className="flex-1 px-3 py-2 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-700 text-slate-100 placeholder-slate-400"
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
