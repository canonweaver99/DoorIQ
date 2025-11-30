'use client'

import { useState, useEffect } from 'react'
import { Search, Copy, CheckCircle2, AlertTriangle, ChevronDown, Lightbulb, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface TranscriptLine {
  speaker: 'rep' | 'homeowner' | 'system' | 'user' | 'agent' | 'ai'
  text?: string
  message?: string
  timestamp?: number | string
  id?: string
}

interface LineRating {
  line_number: number
  speaker?: 'rep' | 'customer'
  timestamp?: string
  effectiveness: 'excellent' | 'good' | 'average' | 'poor'
  score: number
  sentiment?: 'positive' | 'neutral' | 'negative'
  customer_engagement?: 'high' | 'medium' | 'low'
  missed_opportunities?: string[]
  techniques_used?: string[]
  alternative_lines?: string[]
  improvement_notes?: string
  category?: string
}

interface TranscriptViewV2Props {
  transcript: TranscriptLine[]
  lineRatings: LineRating[] | any[] // Support both old and new formats
  duration?: number
  wordCount?: number
  sessionId?: string // For polling updates
  agentName?: string // Agent name for formatting Tag Team transcripts
}

export default function TranscriptViewV2({ transcript, lineRatings, duration = 600, wordCount, sessionId, agentName }: TranscriptViewV2Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedFeedback, setExpandedFeedback] = useState<Set<number>>(new Set())
  const [copiedLine, setCopiedLine] = useState<number | null>(null)
  const [currentRatings, setCurrentRatings] = useState<any[]>(lineRatings || [])
  const [isPolling, setIsPolling] = useState(false)

  // Normalize ratings format (support both old LineRating format and new analytics format)
  const normalizeRatings = (ratings: any[]): Map<number, any> => {
    const map = new Map()
    ratings.forEach((r) => {
      const lineIndex = r.line_index ?? r.line_number ?? r.lineIndex
      if (lineIndex !== undefined) {
        map.set(lineIndex, {
          line_number: lineIndex,
          line_index: lineIndex,
          effectiveness: r.rating || r.effectiveness || 'good',
          alternative_lines: r.alternatives || r.alternative_lines || [],
          rating: r.rating || r.effectiveness,
          alternatives: r.alternatives || r.alternative_lines || [],
          text: r.line_text || r.text,
        })
      }
    })
    return map
  }

  const ratingsMap = normalizeRatings(currentRatings)
  const textMap = new Map<string, any>(
    currentRatings
      .filter((r) => {
        const text = r.line_text || r.text
        return typeof text === 'string' && text.length > 0
      })
      .map((r) => {
        const text = r.line_text || r.text
        return [text.slice(0, 200), r]
      })
  )

  // Poll for rating updates if sessionId provided
  useEffect(() => {
    if (!sessionId) return

    const pollForUpdates = async () => {
      try {
        const response = await fetch(`/api/grading/status?sessionId=${sessionId}`)
        if (response.ok) {
          const status = await response.json()
          if (status.lineRatingsCount > currentRatings.length) {
            // Fetch updated session to get latest ratings
            const sessionResponse = await fetch(`/api/session?id=${sessionId}`)
            if (sessionResponse.ok) {
              const session = await sessionResponse.json()
              const newRatings = session.analytics?.line_ratings || []
              if (newRatings.length > currentRatings.length) {
                setCurrentRatings(newRatings)
                setIsPolling(status.lineRatingsStatus !== 'completed')
              }
            }
          }
          setIsPolling(status.lineRatingsStatus === 'processing' || status.lineRatingsStatus === 'queued')
        } else if (response.status === 404) {
          // Session not found yet or grading hasn't started - this is OK, just continue polling
          console.log('Grading status not available yet, continuing to poll...')
        } else {
          console.warn(`Failed to fetch grading status: ${response.status}`)
        }
      } catch (error) {
        console.error('Failed to poll rating updates', error)
      }
    }

    // Poll every 2 seconds if still processing
    const interval = setInterval(pollForUpdates, 2000)
    pollForUpdates() // Initial poll

    return () => clearInterval(interval)
  }, [sessionId, currentRatings.length])
  
  // Format timestamp to M:SS
  const formatTimestamp = (timestamp: string | number | undefined): string => {
    if (!timestamp) return ''
    
    try {
      // If already in M:SS format
      if (typeof timestamp === 'string' && /^\d{1,2}:\d{2}$/.test(timestamp)) {
        return timestamp
      }
      
      // If ISO timestamp, convert to M:SS from session start
      if (typeof timestamp === 'string' && transcript[0]?.timestamp) {
        const currentDate = new Date(timestamp)
        const startDate = new Date(transcript[0].timestamp)
        const secondsFromStart = Math.floor((currentDate.getTime() - startDate.getTime()) / 1000)
        const mins = Math.floor(secondsFromStart / 60)
        const secs = secondsFromStart % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
      
      // Fallback for number timestamps
      if (typeof timestamp === 'number') {
        const mins = Math.floor(timestamp / 60)
        const secs = timestamp % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
      }
    } catch (e) {
      return ''
    }
    
    return ''
  }
  
  const toggleFeedback = (lineIndex: number) => {
    setExpandedFeedback(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lineIndex)) {
        newSet.delete(lineIndex)
      } else {
        newSet.add(lineIndex)
      }
      return newSet
    })
  }
  
  const copyToClipboard = (text: string, lineIndex: number) => {
    navigator.clipboard.writeText(text)
    setCopiedLine(lineIndex)
    setTimeout(() => setCopiedLine(null), 2000)
  }

  // Helper function to format Tag Team Tanya & Tom transcript
  const formatTagTeamTranscript = (text: string): string => {
    // Replace <Tanya>text</Tanya> with Tanya: text
    text = text.replace(/<Tanya>(.*?)<\/Tanya>/gi, 'Tanya: $1')
    // Replace <Tom>text</Tom> with Tom: text
    text = text.replace(/<Tom>(.*?)<\/Tom>/gi, 'Tom: $1')
    return text
  }

  const getLineText = (line: TranscriptLine, agentName?: string): string => {
    const text = line.text || line.message || ''
    // Format for Tag Team Tanya & Tom if speaker is not rep/user
    if (agentName === 'Tag Team Tanya & Tom' && line.speaker !== 'rep' && line.speaker !== 'user') {
      return formatTagTeamTranscript(text)
    }
    return text
  }

  const getSpeaker = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'rep'
    return 'customer'
  }

  // Filter transcript by search
  const filteredTranscript = searchTerm
    ? transcript.filter((line, i) => 
        getLineText(line, agentName).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : transcript

  if (!transcript || transcript.length === 0) {
    return (
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 text-center">
        <p className="text-slate-400">No transcript available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Conversation</h2>
            <p className="text-xs text-slate-400 mt-1">
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} • {transcript.length} messages
            </p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 w-56"
            />
          </div>
        </div>
      </div>

      {/* Chat-style Transcript */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="space-y-2 max-w-4xl mx-auto">
          {filteredTranscript.map((line, index) => {
            const text = getLineText(line, agentName)
            const rating = ratingsMap.get(index) || textMap.get(text.slice(0, 200))
            const isRep = getSpeaker(line.speaker) === 'rep'
            const showFeedback = expandedFeedback.has(index)
            const hasFeedback = rating && ((rating.alternative_lines?.length || rating.alternatives?.length || 0) > 0)
            const isPoor = rating?.effectiveness === 'poor' || rating?.rating === 'poor'
            const isProcessing = isRep && !rating && isPolling
            
            return (
              <div key={index} className={`flex ${isRep ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isRep ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Message Bubble */}
                  <div className="group relative">
                    <div
                      className={`rounded-2xl px-4 py-2.5 ${
                        isRep
                          ? isPoor
                            ? 'bg-red-500/10 border border-red-500/30'
                            : 'bg-purple-500/10 border border-purple-500/20'
                          : 'bg-slate-800/50 border border-slate-700/30'
                      } backdrop-blur-sm transition-all duration-200 group-hover:shadow-lg`}
                    >
                      {/* Timestamp and Copy */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono ${
                          isRep ? 'text-purple-400/60' : 'text-slate-500'
                        }`}>
                          {formatTimestamp(rating?.timestamp || line.timestamp)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(text, index)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                          title="Copy"
                        >
                          {copiedLine === index ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-slate-500 hover:text-slate-300" />
                          )}
                        </button>
                      </div>
                      
                      {/* Message Text */}
                      <p className={`text-sm leading-[1.5] ${
                        isRep ? 'text-white' : 'text-slate-200'
                      }`}>
                        {text}
                      </p>
                      
                      {/* Processing indicator */}
                      {isProcessing && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1.5">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Processing rating...</span>
                        </div>
                      )}

                      {/* Effectiveness indicator - subtle */}
                      {rating && isRep && (rating.effectiveness || rating.rating) && (
                        <div className={`text-[10px] font-semibold uppercase tracking-wide mt-1.5 ${
                          (rating.effectiveness || rating.rating) === 'excellent' ? 'text-green-400' :
                          (rating.effectiveness || rating.rating) === 'good' ? 'text-blue-400' :
                          (rating.effectiveness || rating.rating) === 'average' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {rating.effectiveness || rating.rating}
                        </div>
                      )}
                    </div>
                    
                    {/* Expand feedback button for sales rep messages with alternatives */}
                    {isRep && hasFeedback && !isPoor && (
                      <button
                        onClick={() => toggleFeedback(index)}
                        className="text-[10px] text-purple-400/60 hover:text-purple-400 mt-1 flex items-center gap-0.5 transition-colors"
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${showFeedback ? 'rotate-180' : ''}`} />
                        {showFeedback ? 'Hide' : 'Show'} alternatives
                      </button>
                    )}
                  </div>

                  {/* Feedback Section - Auto-expanded for poor, collapsible for others */}
                  {isRep && hasFeedback && (isPoor || showFeedback) && (rating.alternative_lines || rating.alternatives) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`mt-2 rounded-xl p-3 text-xs space-y-2 ${
                        isPoor
                          ? 'bg-red-900/20 border border-red-500/20'
                          : 'bg-slate-800/30 border border-slate-700/20'
                      }`}
                    >
                      {isPoor && (
                        <div className="flex items-center gap-1.5 text-red-400 mb-2">
                          <AlertTriangle className="w-3 h-3" />
                          <span className="font-semibold">Better approach:</span>
                        </div>
                      )}
                      {(rating.alternative_lines || rating.alternatives || []).map((alt: string, i: number) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg italic ${
                            isPoor
                              ? 'bg-green-500/5 text-green-300/90 border border-green-500/10'
                              : 'bg-slate-900/30 text-slate-300 border border-slate-700/20'
                          }`}
                        >
                          <span className="opacity-50 not-italic">→</span> "{alt}"
                        </div>
                      ))}
                      {!isPoor && (
                        <button
                          onClick={() => toggleFeedback(index)}
                          className="text-[10px] text-slate-500 hover:text-slate-400 w-full text-center pt-1"
                        >
                          Hide alternatives
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Search indicator */}
      {searchTerm && (
        <div className="text-center text-xs text-slate-500">
          {filteredTranscript.length} of {transcript.length} messages
        </div>
      )}
    </div>
  )
}
