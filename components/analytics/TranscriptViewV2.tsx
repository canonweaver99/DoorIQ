'use client'

import { useState } from 'react'
import { User, Bot, Search, Maximize2, Minimize2, MessageSquare, Clock, TrendingUp, Lightbulb, AlertTriangle, ChevronRight, ChevronDown, Sparkles, Target, Zap, BadgeCheck, Flag, Share2, Smile, Meh, Frown, Copy, CheckCircle2 } from 'lucide-react'
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
  lineRatings: LineRating[]
  duration?: number
  wordCount?: number
}

export default function TranscriptViewV2({ transcript, lineRatings, duration = 600, wordCount }: TranscriptViewV2Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedAlternatives, setExpandedAlternatives] = useState<Set<number>>(new Set())
  const [hoveredLine, setHoveredLine] = useState<number | null>(null)
  const [copiedLine, setCopiedLine] = useState<number | null>(null)

  const ratingsMap = new Map(lineRatings.map(r => [r.line_number, r]))
  
  const toggleAlternatives = (lineIndex: number) => {
    setExpandedAlternatives(prev => {
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
  
  // Group transcript by conversation phase
  const groupByPhase = () => {
    const phases: { name: string; lines: Array<{ line: TranscriptLine; index: number; rating?: LineRating }> }[] = [
      { name: 'Introduction', lines: [] },
      { name: 'Discovery', lines: [] },
      { name: 'Trust Building', lines: [] },
      { name: 'Objections', lines: [] },
      { name: 'Closing', lines: [] }
    ]
    
    transcript.forEach((line, index) => {
      const rating = ratingsMap.get(index)
      const category = rating?.category?.toLowerCase() || ''
      
      let phaseIndex = 4 // Default to closing
      if (category.includes('introduction')) phaseIndex = 0
      else if (category.includes('discovery') || category.includes('needs')) phaseIndex = 1
      else if (category.includes('rapport')) phaseIndex = 2
      else if (category.includes('objection')) phaseIndex = 3
      else if (category.includes('closing')) phaseIndex = 4
      else if (index < transcript.length * 0.2) phaseIndex = 0
      else if (index < transcript.length * 0.4) phaseIndex = 1
      else if (index < transcript.length * 0.6) phaseIndex = 2
      else if (index < transcript.length * 0.8) phaseIndex = 3
      
      phases[phaseIndex].lines.push({ line, index, rating })
    })
    
    return phases.filter(phase => phase.lines.length > 0)
  }
  
  const phases = groupByPhase()

  const getLineText = (line: TranscriptLine): string => {
    return line.text || line.message || ''
  }

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'Sales Rep'
    if (speaker === 'homeowner' || speaker === 'agent' || speaker === 'ai') return 'Customer'
    return 'System'
  }

  const getSpeakerInitials = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'SR'
    return 'C'
  }

  const getEffectivenessIcon = (effectiveness: string) => {
    switch (effectiveness) {
      case 'excellent':
        return { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: '🟢' }
      case 'good':
        return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: '🔵' }
      case 'average':
        return { label: 'Average', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: '🟡' }
      case 'poor':
        return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: '🔴' }
      default:
        return { label: '', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', icon: '⚪' }
    }
  }

  // Calculate conversation metrics
  const totalLines = transcript.length
  const repLines = transcript.filter(l => l.speaker === 'rep' || l.speaker === 'user').length
  const customerLines = totalLines - repLines
  const speakingRatio = Math.round((repLines / totalLines) * 100)

  // Filter transcript by search
  const filteredTranscript = searchTerm
    ? transcript.filter((line, i) => 
        getLineText(line).toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.toString().includes(searchTerm)
      )
    : transcript

  if (!transcript || transcript.length === 0) {
    return (
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-12 text-center">
        <Bot className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Compact Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Conversation Transcript</h2>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </span>
              <span>{totalLines} lines</span>
              <span>{speakingRatio}% rep</span>
              {wordCount && <span>{wordCount.toLocaleString()} words</span>}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-lg bg-slate-900/50 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 w-48"
            />
          </div>
        </div>
      </div>

      {/* Condensed Transcript by Phase */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl border border-slate-700/50 p-6">
        <div className="space-y-1.5">
          {(searchTerm ? [{ name: 'Search Results', lines: filteredTranscript.map((line, i) => ({ line, index: i, rating: ratingsMap.get(i) })) }] : phases).map((phase, phaseIdx) => (
            <div key={phaseIdx} className="space-y-1.5">
              {/* Phase Header */}
              {!searchTerm && phase.lines.length > 0 && (
                <div className="sticky top-0 z-10 px-3 py-1.5 bg-slate-800/80 backdrop-blur-sm border-l-2 border-purple-500/50 mb-2">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{phase.name}</span>
                </div>
              )}
              
              {/* Messages */}
              {phase.lines.map(({ line, index, rating }) => {
                const isRep = line.speaker === 'rep' || line.speaker === 'user'
                const text = getLineText(line)
                const effectivenessInfo = rating ? getEffectivenessIcon(rating.effectiveness) : null
                const isHovered = hoveredLine === index
                const showAlternatives = expandedAlternatives.has(index) || rating?.effectiveness === 'poor'
                const hasAlternatives = rating?.alternative_lines && rating.alternative_lines.length > 0
                
                return (
                  <motion.div
                    key={index}
                    id={`line-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className={`group rounded-xl p-3 transition-all duration-200 ${
                      isHovered ? 'bg-slate-800/50' : 'bg-transparent'
                    } ${
                      rating?.effectiveness === 'poor' ? 'border-l-2 border-red-500/50 pl-4' : ''
                    }`}
                    onMouseEnter={() => setHoveredLine(index)}
                    onMouseLeave={() => setHoveredLine(null)}
                  >
                    {/* Message Header - Inline */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                          isRep ? 'text-purple-400' : 'text-slate-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            isRep ? 'bg-purple-400' : 'bg-slate-400'
                          }`}></span>
                          [{getSpeakerInitials(line.speaker)}] {getSpeakerLabel(line.speaker)}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {rating?.timestamp || ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Performance Badge */}
                        {effectivenessInfo && isRep && (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${effectivenessInfo.bg} ${effectivenessInfo.border} border ${effectivenessInfo.color}`}>
                            <span>{effectivenessInfo.icon}</span>
                            <span>{effectivenessInfo.label}</span>
                          </div>
                        )}
                        
                        {/* Copy Button on Hover */}
                        {isHovered && (
                          <button
                            onClick={() => copyToClipboard(text, index)}
                            className="p-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                            title="Copy message"
                          >
                            {copiedLine === index ? (
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-slate-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Message Text - Condensed */}
                    <p className="text-sm leading-[1.4] text-white/90 mb-1.5 pl-4">
                      {text}
                    </p>
                    
                    {/* Alternative Responses */}
                    {isRep && hasAlternatives && (
                      <div className="pl-4">
                        {/* Collapsible Trigger for Good/Excellent */}
                        {rating.effectiveness !== 'poor' && !showAlternatives && (
                          <button
                            onClick={() => toggleAlternatives(index)}
                            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors mt-1"
                          >
                            <ChevronDown className="w-3 h-3" />
                            <span>See alternatives</span>
                          </button>
                        )}
                        
                        {/* Expanded Alternatives */}
                        <AnimatePresence>
                          {showAlternatives && rating.alternative_lines && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2 space-y-1.5"
                            >
                              {rating.effectiveness === 'poor' && (
                                <div className="flex items-center gap-1.5 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-red-400" />
                                  <span className="text-xs font-semibold text-red-400">Better approaches:</span>
                                </div>
                              )}
                              {rating.effectiveness !== 'poor' && (
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-green-400">Alternative responses:</span>
                                  <button
                                    onClick={() => toggleAlternatives(index)}
                                    className="text-xs text-slate-500 hover:text-slate-400"
                                  >
                                    <ChevronDown className="w-3 h-3 rotate-180" />
                                  </button>
                                </div>
                              )}
                              {rating.alternative_lines.map((alt, i) => (
                                <div
                                  key={i}
                                  className={`p-2 rounded-lg text-xs italic ${
                                    rating.effectiveness === 'poor'
                                      ? 'bg-green-500/10 border border-green-500/20 text-green-300'
                                      : 'bg-slate-800/50 border border-slate-700/30 text-slate-300'
                                  }`}
                                >
                                  <span className="opacity-60">→</span> "{alt}"
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Search results indicator */}
      {searchTerm && (
        <div className="text-center text-xs text-slate-500">
          Showing {filteredTranscript.length} of {transcript.length} lines
        </div>
      )}
    </div>
  )
}

