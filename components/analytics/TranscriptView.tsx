'use client'

import { User, Bot, Lightbulb, Clock, AlertTriangle, TrendingUp, Smile, Meh, Frown, Activity, Sparkles, Target, Zap, BadgeCheck, ChevronRight } from 'lucide-react'

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
  words_per_minute?: number
  filler_words?: string[]
  is_question?: boolean
}

interface TranscriptViewProps {
  transcript: TranscriptLine[]
  lineRatings: LineRating[]
  agentName?: string // Agent name for formatting Tag Team transcripts
}

// Helper function to format Tag Team Tanya & Tom transcript
function formatTagTeamTranscript(text: string): string {
  // Replace <Tanya>text</Tanya> with Tanya: text
  text = text.replace(/<Tanya>(.*?)<\/Tanya>/gi, 'Tanya: $1')
  // Replace <Tom>text</Tom> with Tom: text
  text = text.replace(/<Tom>(.*?)<\/Tom>/gi, 'Tom: $1')
  return text
}

export default function TranscriptView({ transcript, lineRatings, agentName }: TranscriptViewProps) {
  const ratingsMap = new Map(lineRatings.map(r => [r.line_number, r]))

  const getLineEffectiveness = (lineIndex: number, speaker: string): LineRating | null => {
    if (speaker !== 'rep' && speaker !== 'user') return null
    return ratingsMap.get(lineIndex) || null
  }

  const getLineText = (line: TranscriptLine): string => {
    const text = line.text || line.message || ''
    // Format for Tag Team Tanya & Tom if speaker is not rep/user
    if (agentName === 'Tag Team Tanya & Tom' && line.speaker !== 'rep' && line.speaker !== 'user') {
      return formatTagTeamTranscript(text)
    }
    return text
  }

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'Sales Rep'
    if (speaker === 'homeowner' || speaker === 'agent' || speaker === 'ai') return 'Customer'
    return 'System'
  }

  const getEffectivenessStyle = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return {
          gradient: 'from-emerald-500/10 to-green-500/10',
          border: 'border-emerald-500/20',
          icon: <BadgeCheck className="w-4 h-4 text-emerald-400" />,
          label: 'Excellent',
          labelColor: 'text-emerald-400',
          shadow: ''
        }
      case 'good':
        return {
          gradient: 'from-blue-500/10 to-indigo-500/10',
          border: 'border-blue-500/20',
          icon: <Sparkles className="w-4 h-4 text-blue-400" />,
          label: 'Good',
          labelColor: 'text-blue-400',
          shadow: ''
        }
      case 'average':
        return {
          gradient: 'from-amber-500/10 to-yellow-500/10',
          border: 'border-amber-500/20',
          icon: <Zap className="w-4 h-4 text-amber-400" />,
          label: 'Average',
          labelColor: 'text-amber-400',
          shadow: ''
        }
      case 'poor':
        return {
          gradient: 'from-red-500/10 to-orange-500/10',
          border: 'border-red-500/20',
          icon: <Target className="w-4 h-4 text-red-400" />,
          label: 'Needs Work',
          labelColor: 'text-red-400',
          shadow: ''
        }
      default:
        return {
          gradient: 'from-slate-800/50 to-slate-900/50',
          border: 'border-slate-700/50',
          icon: null,
          label: '',
          labelColor: '',
          shadow: ''
        }
    }
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl p-8 text-center border border-slate-800/50">
        <Bot className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
            CONVERSATION ANALYSIS
          </h2>
          <p className="text-sm text-slate-500 uppercase tracking-[0.25em] mt-1">Review the full transcript with AI insights</p>
        </div>
        
        {/* Legend */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Response Quality</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-slate-400">Excellent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-slate-400">Good</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">Average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-red-400" />
              <span className="text-xs text-slate-400">Needs Work</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Container */}
      <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/30 to-slate-800/30 backdrop-blur-xl border border-slate-800/50 p-8">
        <div className="space-y-6 relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-700/30 via-slate-700/20 to-transparent"></div>

          {transcript.map((line, index) => {
            const rating = getLineEffectiveness(index, line.speaker)
            const isRep = line.speaker === 'rep' || line.speaker === 'user'
            const style = rating ? getEffectivenessStyle(rating.effectiveness) : getEffectivenessStyle(undefined)

            return (
              <div key={index} className="relative flex gap-4">
                {/* Avatar and line number */}
                <div className="flex-shrink-0 relative z-10">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center backdrop-blur-xl ${
                    isRep 
                      ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30' 
                      : 'bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-700/50'
                  }`}>
                    {isRep ? (
                      <User className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Bot className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 text-[10px] font-mono text-slate-500 bg-slate-900/90 backdrop-blur-sm rounded-lg px-1.5 py-0.5 border border-slate-700/50">
                    {index}
                  </div>
                </div>

                {/* Message Content */}
                <div className="flex-1 space-y-3">
                  <div className={`
                    rounded-2xl p-5 backdrop-blur-xl transition-all duration-300
                    ${isRep 
                      ? `bg-gradient-to-br ${style.gradient} border ${style.border}` 
                      : 'bg-gradient-to-br from-slate-900/40 to-slate-800/40 border border-slate-700/40'
                    }
                  `}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-300">
                          {getSpeakerLabel(line.speaker)}
                        </span>
                        {rating?.timestamp && (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>{rating.timestamp}</span>
                          </div>
                        )}
                      </div>
                      {rating?.effectiveness && (
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50">
                          {style.icon}
                          <span className={`text-xs font-medium ${style.labelColor}`}>
                            {style.label}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Message text */}
                    <p className="leading-relaxed text-[15px] text-white/90">
                      {getLineText(line)}
                    </p>

                    {/* Metadata badges */}
                    {rating && (
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
                              <Activity className="w-3 h-3 text-blue-400" />
                              <span className="text-xs text-slate-300">
                                Engagement: <span className="capitalize font-medium">{rating.customer_engagement}</span>
                              </span>
                            </div>
                          )}
                          
                          {rating.score !== undefined && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                              <TrendingUp className="w-3 h-3 text-purple-400" />
                              <span className="text-xs text-slate-300">
                                Score: <span className="font-medium">{rating.score}/100</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Techniques */}
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
                  </div>

                  {/* Improvement Suggestions - Only for poor/average */}
                  {rating && rating.improvement_notes && (rating.effectiveness === 'poor' || rating.effectiveness === 'average') && (
                    <div className="relative rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 backdrop-blur-xl border border-blue-500/20 p-4">
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
                            <div key={i} className="p-3 rounded-xl bg-slate-900/50 border border-blue-500/10">
                              <p className="text-sm text-white/90 italic">"{alt}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Missed Opportunities */}
                  {rating && rating.missed_opportunities && rating.missed_opportunities.length > 0 && (
                    <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-500/20 p-4">
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
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mobile Legend */}
      <div className="sm:hidden">
        <div className="rounded-2xl bg-gradient-to-br from-slate-900/30 to-slate-800/30 backdrop-blur-xl border border-slate-800/50 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Response Quality</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-slate-400">Good</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Average</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-red-400" />
              <span className="text-xs text-slate-400">Needs Work</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}