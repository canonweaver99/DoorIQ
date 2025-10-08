'use client'

import { User, Bot, Lightbulb } from 'lucide-react'

interface TranscriptLine {
  speaker: 'rep' | 'homeowner' | 'system' | 'user' | 'agent' | 'ai'
  text?: string
  message?: string
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
  const ratingsMap = new Map(lineRatings.map(r => [r.line_number, r]))

  const getLineEffectiveness = (lineIndex: number, speaker: string): LineRating | null => {
    if (speaker !== 'rep' && speaker !== 'user') return null
    return ratingsMap.get(lineIndex) || null
  }

  const getLineText = (line: TranscriptLine): string => {
    return line.text || line.message || ''
  }

  const getEffectivenessColor = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return 'border-emerald-500/40 bg-emerald-500/8'
      case 'good':
        return 'border-blue-500/40 bg-blue-500/8'
      case 'average':
        return 'border-amber-500/40 bg-amber-500/8'
      case 'poor':
        return 'border-red-500/40 bg-red-500/8'
      default:
        return ''
    }
  }

  const getEffectivenessLabel = (effectiveness: string | undefined) => {
    switch (effectiveness) {
      case 'excellent':
        return { label: 'Excellent', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30' }
      case 'good':
        return { label: 'Good', color: 'text-blue-300 bg-blue-500/15 border-blue-500/30' }
      case 'average':
        return { label: 'Average', color: 'text-amber-300 bg-amber-500/15 border-amber-500/30' }
      case 'poor':
        return { label: 'Needs Work', color: 'text-red-300 bg-red-500/15 border-red-500/30' }
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
        <p className="text-slate-400">No transcript available for this session</p>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent mb-8">
        Conversation Transcript
      </h2>

      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {transcript.map((line, index) => {
          const rating = getLineEffectiveness(index, line.speaker)
          const isRep = line.speaker === 'rep' || line.speaker === 'user'
          const effectivenessStyle = rating ? getEffectivenessColor(rating.effectiveness) : ''
          const effectivenessLabel = rating ? getEffectivenessLabel(rating.effectiveness) : null

          return (
            <div key={index} className={`flex ${isRep ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-2xl ${isRep ? 'ml-12' : 'mr-12'}`}>
                <div className={`flex items-center gap-2 mb-2 ${isRep ? 'justify-end' : 'justify-start'}`}>
                  <span className="text-sm font-medium text-slate-400">
                    {getSpeakerLabel(line.speaker)}
                  </span>
                  {effectivenessLabel && effectivenessLabel.label && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${effectivenessLabel.color}`}>
                      {effectivenessLabel.label}
                    </span>
                  )}
                </div>

                <div className={`
                  rounded-2xl p-4 shadow-lg
                  ${isRep 
                    ? `bg-white text-black ${rating ? effectivenessStyle : ''}` 
                    : 'bg-slate-900/80 backdrop-blur text-slate-100 border border-slate-700'
                  }
                `}>
                  <p className="leading-relaxed text-[15px]">
                    {getLineText(line)}
                  </p>
                </div>

                {rating && rating.alternative_lines && rating.alternative_lines.length > 0 && (
                  <div className="mt-3 ml-4 p-4 rounded-xl border border-purple-500/30 bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2 text-purple-200">
                      <Lightbulb className="w-4 h-4" />
                      <span className="text-sm font-medium">Suggested Alternative</span>
                    </div>
                    {rating.alternative_lines.map((alt, altIndex) => (
                      <p key={altIndex} className="text-sm text-slate-200 italic mb-2 leading-relaxed">
                        "{alt}"
                      </p>
                    ))}
                    {rating.improvement_notes && (
                      <p className="text-xs text-purple-200/70 mt-2 leading-relaxed">
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

      <div className="mt-8 p-5 bg-slate-900/50 backdrop-blur rounded-2xl border border-slate-700">
        <h3 className="text-sm font-medium text-slate-300 mb-4 uppercase tracking-[0.15em]">Response Quality Legend</h3>
        <div className="flex flex-wrap gap-3 justify-center">
          <span className="px-3 py-1.5 rounded-full text-xs text-white border border-emerald-500/30" style={{ background: 'rgba(16,185,129,0.2)' }}>Excellent</span>
          <span className="px-3 py-1.5 rounded-full text-xs text-white border border-blue-500/30" style={{ background: 'rgba(59,130,246,0.2)' }}>Good</span>
          <span className="px-3 py-1.5 rounded-full text-xs text-white border border-amber-500/30" style={{ background: 'rgba(245,158,11,0.2)' }}>Average</span>
          <span className="px-3 py-1.5 rounded-full text-xs text-white border border-red-500/30" style={{ background: 'rgba(239,68,68,0.2)' }}>Needs Work</span>
        </div>
      </div>
    </div>
  )
}