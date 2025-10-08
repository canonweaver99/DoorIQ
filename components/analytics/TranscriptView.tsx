'use client'

import { User, Bot, Lightbulb } from 'lucide-react'

interface TranscriptLine {
  speaker: 'rep' | 'homeowner' | 'system' | 'user' | 'agent' | 'ai'
  text?: string
  message?: string  // Support both text and message fields
  timestamp?: number | string
  id?: string
}

interface LineRating {
  line_number: number
  effectiveness: 'excellent' | 'good' | 'average' | 'poor'
  score: number
  alternative_lines?: string[]
  improvement_notes?: string
  category?: string
}

interface TranscriptViewProps {
  transcript: TranscriptLine[]
  lineRatings: LineRating[]
}

export default function TranscriptView({ transcript, lineRatings }: TranscriptViewProps) {
  // Create a map of line ratings by line number
  const ratingsMap = new Map(lineRatings.map(r => [r.line_number, r]))

  const getLineEffectiveness = (lineIndex: number, speaker: string): LineRating | null => {
    // Only rate rep/user lines
    if (speaker !== 'rep' && speaker !== 'user') return null
    
    return ratingsMap.get(lineIndex) || null
  }

  // Get the text content from either text or message field
  const getLineText = (line: TranscriptLine): string => {
    return line.text || line.message || ''
  }

  const getEffectivenessLabel = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'average':
        return 'Average'
      case 'poor':
        return 'Needs Improvement'
      default:
        return ''
    }
  }

  const formatTimestamp = (timestamp?: number | string) => {
    if (!timestamp) return ''

    if (typeof timestamp === 'string') {
      const date = new Date(timestamp)
      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    }

    if (typeof timestamp === 'number') {
      const minutes = Math.floor(timestamp / 60)
      const seconds = Math.floor(timestamp % 60)
      return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    return ''
  }

  const getBubbleClasses = (speaker: string, rating: LineRating | null) => {
    const isRep = speaker === 'rep' || speaker === 'user'
    if (!isRep) {
      return 'bg-slate-900/70 border border-slate-700 text-slate-100'
    }

    switch (rating?.effectiveness) {
      case 'excellent':
        return 'bg-emerald-500/10 border border-emerald-400/60 text-emerald-50 shadow-[0_10px_30px_-15px_rgba(16,185,129,0.7)]'
      case 'good':
      case 'average':
        return 'bg-amber-400/10 border border-amber-300/60 text-amber-50 shadow-[0_10px_30px_-15px_rgba(250,204,21,0.7)]'
      case 'poor':
        return 'bg-rose-500/10 border border-rose-400/60 text-rose-50 shadow-[0_10px_30px_-15px_rgba(244,63,94,0.7)]'
      default:
        return 'bg-indigo-600/70 border border-indigo-400/60 text-white shadow-[0_12px_35px_-18px_rgba(99,102,241,0.8)]'
    }
  }

  const getSpeakerIcon = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') {
      return <User className="w-4 h-4" />
    }
    return <Bot className="w-4 h-4" />
  }

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'You'
    if (speaker === 'homeowner' || speaker === 'agent' || speaker === 'ai') return 'Homeowner'
    return 'System'
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold text-slate-200 mb-6">Full Transcript</h2>

      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <div className="space-y-4">
          {transcript.map((line, index) => {
            const rating = getLineEffectiveness(index, line.speaker)
            const isRep = line.speaker === 'rep' || line.speaker === 'user'
            const bubbleClasses = getBubbleClasses(line.speaker, rating)

            return (
              <div key={index} className={`flex ${isRep ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl md:max-w-2xl lg:max-w-3xl rounded-2xl px-4 py-3 shadow-lg transition-transform duration-200 ${bubbleClasses}`}>
                  <div className={`flex items-center text-xs mb-2 uppercase tracking-wide ${isRep ? 'text-white/70' : 'text-slate-400/80'}`}>
                    {getSpeakerIcon(line.speaker)}
                    <span className="ml-2 font-semibold">{getSpeakerLabel(line.speaker)}</span>
                    {rating && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-medium">
                        {getEffectivenessLabel(rating.effectiveness)}
                      </span>
                    )}
                    {line.timestamp !== undefined && (
                      <span className="ml-auto text-[10px] opacity-70">{formatTimestamp(line.timestamp)}</span>
                    )}
                  </div>

                  <p className={`leading-relaxed text-sm md:text-base ${isRep ? 'text-white/90' : 'text-slate-100/90'}`}>
                    {getLineText(line)}
                  </p>

                  {rating && rating.alternative_lines && rating.alternative_lines.length > 0 && (
                    <div className={`mt-3 rounded-xl border border-white/10 bg-black/20 p-3 space-y-2`}
                    >
                      <div className="flex items-center text-xs font-semibold text-amber-200">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Suggested Alternative
                      </div>
                      {rating.alternative_lines.map((alt, altIndex) => (
                        <p key={altIndex} className="text-xs text-amber-50/90 italic">“{alt}”</p>
                      ))}
                      {rating.improvement_notes && (
                        <p className="text-[11px] text-amber-100/80">💡 {rating.improvement_notes}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-8 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-3">Effectiveness Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-emerald-500/50 bg-emerald-500/10"></div>
            <span className="text-xs text-slate-400">Excellent Response</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-amber-500/50 bg-amber-500/10"></div>
            <span className="text-xs text-slate-400">Good/Average Response</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border border-red-500/50 bg-red-500/10"></div>
            <span className="text-xs text-slate-400">Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  )
}

