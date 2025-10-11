'use client'

import { useState } from 'react'
import { User, Bot, Search, Maximize2, Minimize2, MessageSquare, Clock, TrendingUp, Lightbulb, AlertTriangle, ChevronRight, Sparkles, Target, Zap, BadgeCheck, Flag, Share2, Smile, Meh, Frown } from 'lucide-react'
import { motion } from 'framer-motion'

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
  const [compactView, setCompactView] = useState(false)
  const [selectedLine, setSelectedLine] = useState<number | null>(null)

  const ratingsMap = new Map(lineRatings.map(r => [r.line_number, r]))

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

  const getEffectivenessStyle = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return { bg: 'from-emerald-500/10 to-green-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: BadgeCheck }
      case 'good':
        return { bg: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: Sparkles }
      case 'average':
        return { bg: 'from-amber-500/10 to-yellow-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: Zap }
      case 'poor':
        return { bg: 'from-red-500/10 to-orange-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: Target }
      default:
        return { bg: 'from-slate-800/30 to-slate-900/30', border: 'border-slate-700/30', text: 'text-slate-400', icon: MessageSquare }
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
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl p-8 text-center border border-slate-800/50">
        <Bot className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Metrics and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            CONVERSATION TRANSCRIPT
          </h2>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
            </span>
            <span>{totalLines} lines</span>
            <span>{speakingRatio}% rep</span>
            {wordCount && <span>{wordCount} words</span>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl bg-slate-900/50 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <button
            onClick={() => setCompactView(!compactView)}
            className="p-2 rounded-xl bg-slate-900/50 border border-slate-700 hover:bg-slate-800 transition-colors"
            title={compactView ? 'Expanded view' : 'Compact view'}
          >
            {compactView ? <Maximize2 className="w-4 h-4 text-slate-400" /> : <Minimize2 className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Transcript Container */}
      <div className="relative">
        <div className="space-y-4 max-w-5xl mx-auto">
          {filteredTranscript.map((line, index) => {
            const rating = ratingsMap.get(index)
            const isRep = line.speaker === 'rep' || line.speaker === 'user'
            const style = rating ? getEffectivenessStyle(rating.effectiveness) : getEffectivenessStyle(undefined)
            const EffIcon = style.icon
            const isSelected = selectedLine === index

            return (
              <motion.div
                key={index}
                id={`line-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex ${isRep ? 'justify-end' : 'justify-start'} group`}
                onClick={() => setSelectedLine(isSelected ? null : index)}
              >
                <div className={`max-w-3xl ${isRep ? 'mr-4' : 'ml-4'} ${compactView ? 'w-full' : ''}`}>
                  {/* Message bubble */}
                  <div
                    className={`
                      relative rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 cursor-pointer
                      ${isRep 
                        ? `bg-gradient-to-br ${style.bg} border ${style.border}` 
                        : 'bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/40'
                      }
                      ${isSelected ? 'ring-2 ring-purple-500/50 scale-[1.02]' : 'hover:scale-[1.01]'}
                    `}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isRep 
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                        }`}>
                          {getSpeakerInitials(line.speaker)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-300">{getSpeakerLabel(line.speaker)}</div>
                          {rating?.timestamp && (
                            <div className="text-xs text-slate-500 font-mono">{rating.timestamp}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-600">#{index}</span>
                        {rating?.effectiveness && (
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/50 backdrop-blur-sm border ${style.border}`}>
                            <EffIcon className={`w-3 h-3 ${style.text}`} />
                            <span className={`text-xs font-medium ${style.text} capitalize`}>
                              {rating.effectiveness}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Message text - better typography */}
                    <p className="text-[15px] leading-relaxed text-white/90" style={{ lineHeight: '1.7' }}>
                      {getLineText(line)}
                    </p>

                    {/* Metadata badges */}
                    {rating && !compactView && (
                      <div className="mt-4 pt-3 border-t border-slate-700/30 space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {rating.sentiment && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                              {rating.sentiment === 'positive' && <Smile className="w-3 h-3 text-emerald-400" />}
                              {rating.sentiment === 'neutral' && <Meh className="w-3 h-3 text-slate-400" />}
                              {rating.sentiment === 'negative' && <Frown className="w-3 h-3 text-red-400" />}
                              <span className="text-xs text-slate-300 capitalize">{rating.sentiment}</span>
                            </div>
                          )}
                          
                          {rating.customer_engagement && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                              <TrendingUp className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-slate-300 capitalize">{rating.customer_engagement}</span>
                            </div>
                          )}
                          
                          {rating.score !== undefined && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                              <span className="text-xs text-slate-300">
                                Score: <span className="font-semibold">{rating.score}/100</span>
                              </span>
                            </div>
                          )}

                          {rating.category && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                              <span className="text-xs text-slate-400 capitalize">{rating.category.replace('_', ' ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Techniques used */}
                        {rating.techniques_used && rating.techniques_used.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {rating.techniques_used.map((technique, i) => (
                              <span 
                                key={i}
                                className="px-2.5 py-1 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 backdrop-blur-sm"
                              >
                                {technique}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick actions on hover */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:bg-slate-800 transition-colors">
                        <Flag className="w-3 h-3 text-slate-400" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-700 hover:bg-slate-800 transition-colors">
                        <Share2 className="w-3 h-3 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Improvement suggestions - below message */}
                  {rating && rating.improvement_notes && (rating.effectiveness === 'poor' || rating.effectiveness === 'average') && !compactView && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-blue-500/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">Better Approach</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed mb-3">
                        {rating.improvement_notes}
                      </p>
                      {rating.alternative_lines && rating.alternative_lines.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-blue-400 font-medium uppercase tracking-wider">Try saying:</p>
                          {rating.alternative_lines.map((alt, i) => (
                            <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-blue-500/10 hover:border-blue-500/30 transition-colors cursor-pointer">
                              <p className="text-sm text-white/90 italic leading-relaxed">"{alt}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Missed opportunities */}
                  {rating && rating.missed_opportunities && rating.missed_opportunities.length > 0 && !compactView && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/20"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-medium text-amber-300">Missed Opportunities</span>
                      </div>
                      <ul className="space-y-1.5">
                        {rating.missed_opportunities.map((opportunity, i) => (
                          <li key={i} className="text-sm text-white/80 leading-relaxed pl-4 relative">
                            <ChevronRight className="w-3 h-3 absolute left-0 top-1 text-amber-400" />
                            {opportunity}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Search results indicator */}
      {searchTerm && (
        <div className="text-center text-sm text-slate-400 mt-6">
          Showing {filteredTranscript.length} of {transcript.length} lines
        </div>
      )}
    </div>
  )
}

