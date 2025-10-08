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

  const getEffectivenessColor = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return 'border-purple-500/40 bg-purple-500/10'
      case 'good':
        return 'border-pink-500/40 bg-pink-500/10'
      case 'average':
        return 'border-amber-500/30 bg-amber-500/5'
      case 'poor':
        return 'border-red-500/30 bg-red-500/5'
      default:
        return ''
    }
  }

  const getEffectivenessLabel = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return { label: 'Excellent', color: 'text-purple-300 bg-purple-500/10' }
      case 'good':
        return { label: 'Good', color: 'text-pink-300 bg-pink-500/10' }
      case 'average':
        return { label: 'Average', color: 'text-amber-500 bg-amber-500/10' }
      case 'poor':
        return { label: 'Needs Work', color: 'text-red-500 bg-red-500/10' }
      default:
        return { label: '', color: '' }
    }
  }

  const getSpeakerLabel = (speaker: string) => {
    if (speaker === 'rep' || speaker === 'user') return 'You'
    if (speaker === 'homeowner' || speaker === 'agent' || speaker === 'ai') return 'Homeowner'
    return 'System'
  }

  if (!transcript || transcript.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="space-y-2">
        <div className="text-sm uppercase tracking-[0.3em] text-gray-500">Transcript</div>
        <h2 className="text-2xl font-semibold text-white">Conversation Flow</h2>
      </div>

      {/* Transcript Messages */}
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {transcript.map((line, index) => {
          const rating = getLineEffectiveness(index, line.speaker)
          const isRep = line.speaker === 'rep' || line.speaker === 'user'
          const effectivenessStyle = rating ? getEffectivenessColor(rating.effectiveness) : ''
          const effectivenessLabel = rating ? getEffectivenessLabel(rating.effectiveness) : null

          return (
            <div key={index} className={`flex ${isRep ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${isRep ? 'ml-12' : 'mr-12'}`}>
                {/* Speaker and Rating */}
                <div className={`flex items-center gap-2 mb-2 ${isRep ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-xs uppercase tracking-[0.2em] text-gray-500">
                    {getSpeakerLabel(line.speaker)}
                  </span>
                  {effectivenessLabel && effectivenessLabel.label && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${effectivenessLabel.color}`}>
                      {effectivenessLabel.label}
                    </span>
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 border ${
                    isRep
                      ? `bg-gradient-to-r from-[#2a1042] to-[#3b0f2f] border-purple-500/20 shadow-[0_15px_30px_-20px_rgba(168,85,247,0.6)] text-slate-100`
                      : 'bg-[#12121a] border-white/5 text-gray-200'
                  } ${rating ? effectivenessStyle : ''}`}
                >
                  <p className="leading-relaxed text-[15px]">
                    {getLineText(line)}
                  </p>
                </div>

                {/* Suggestions */}
                {rating && rating.alternative_lines && rating.alternative_lines.length > 0 && (
                  <div className="mt-3 ml-4 p-4 rounded-2xl border border-purple-500/20 bg-purple-500/10">
                    <div className="flex items-center gap-2 mb-2 text-purple-200">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-sm font-medium">Suggested Alternative</span>
                    </div>
                    {rating.alternative_lines.map((alt, altIndex) => (
                      <p key={altIndex} className="text-sm text-gray-100 italic mb-2">
                        "{alt}"
                      </p>
                    ))}
                    {rating.improvement_notes && (
                      <p className="text-xs text-purple-200/80 mt-2">
                        {rating.improvement_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-[#10101a] rounded-2xl border border-white/10">
        <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-[0.2em]">Response Quality Legend</h3>
        <div className="flex flex-wrap gap-3">
          <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: 'rgba(168,85,247,0.25)' }}>Excellent</span>
          <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: 'rgba(236,72,153,0.25)' }}>Good</span>
          <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: 'rgba(250,204,21,0.25)' }}>Average</span>
          <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: 'rgba(239,68,68,0.25)' }}>Needs Work</span>
        </div>
      </div>
    </div>
  )
}