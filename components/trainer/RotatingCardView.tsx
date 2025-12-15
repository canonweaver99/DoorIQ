'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CoachSuggestion } from './CoachSuggestion'

type ViewType = 'default' | 'sentiment' | 'talkTime' | 'speechAnalysis' | 'objections' | 'techniques' | 'coaching'

interface RotatingCardViewProps {
  children: React.ReactNode // Default view (LiveTranscript or LiveFeedbackFeed)
  sentimentScore?: number
  talkTimeRatio?: number
  speechAnalysis?: {
    wpm?: number
    totalFillerWords?: number
    fillerWordsPerMin?: number
    pitchVariation?: number
    avgVolume?: number
  } | null
  objectionCount?: number
  techniquesUsed?: string[]
  coachSuggestion?: {
    suggestedLine: string
    explanation?: string
    reasoning?: string
    confidence?: 'high' | 'medium' | 'low'
    tacticalNote?: string
    alternatives?: string[]
    isAdapted?: boolean
  } | null
  coachSuggestionLoading?: boolean
  className?: string
}

export function RotatingCardView({ 
  children, 
  sentimentScore = 0, 
  talkTimeRatio = 0,
  speechAnalysis = null,
  objectionCount = 0,
  techniquesUsed = [],
  coachSuggestion = null,
  coachSuggestionLoading = false,
  className 
}: RotatingCardViewProps) {
  // Only include coaching view if coachSuggestion exists or is loading
  const views: ViewType[] = coachSuggestion || coachSuggestionLoading
    ? ['default', 'sentiment', 'talkTime', 'speechAnalysis', 'objections', 'techniques', 'coaching']
    : ['default', 'sentiment', 'talkTime', 'speechAnalysis', 'objections', 'techniques']
  
  // Default to coaching if available, otherwise default view
  const [currentView, setCurrentView] = useState<ViewType>(
    (coachSuggestion || coachSuggestionLoading) ? 'coaching' : 'default'
  )
  
  // Switch to coaching when it becomes available
  useEffect(() => {
    if ((coachSuggestion || coachSuggestionLoading) && currentView === 'default') {
      setCurrentView('coaching')
    }
  }, [coachSuggestion, coachSuggestionLoading, currentView])
  
  const currentIndex = views.indexOf(currentView)

  const nextView = () => {
    const nextIndex = (currentIndex + 1) % views.length
    setCurrentView(views[nextIndex])
  }

  const prevView = () => {
    const prevIndex = (currentIndex - 1 + views.length) % views.length
    setCurrentView(views[prevIndex])
  }

  const getSentimentLabel = (score: number) => {
    if (score >= 70) return 'Positive'
    if (score >= 40) return 'Building'
    return 'Low'
  }

  const getSentimentColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getTalkTimeLabel = (ratio: number) => {
    if (ratio >= 50 && ratio <= 60) return 'Balanced'
    if (ratio < 50) return 'Talk More'
    return 'Talk Less'
  }

  const getTalkTimeColor = (ratio: number) => {
    if (ratio >= 50 && ratio <= 60) return 'text-emerald-400'
    if (ratio < 50) return 'text-orange-400'
    return 'text-blue-400'
  }

  return (
    <div className={cn("relative h-full flex flex-col", className)}>
      {/* Arrow buttons */}
      <div className="absolute top-2 left-2 right-2 flex justify-between z-10 pointer-events-none">
        <button
          onClick={prevView}
          className="pointer-events-auto p-1.5 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/90 transition-colors shadow-lg hover:scale-110 active:scale-95"
          aria-label="Previous view"
        >
          <ChevronLeft className="w-4 h-4 text-slate-300" />
        </button>
        <button
          onClick={nextView}
          className="pointer-events-auto p-1.5 rounded-md bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 hover:bg-slate-800/90 transition-colors shadow-lg hover:scale-110 active:scale-95"
          aria-label="Next view"
        >
          <ChevronRight className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* View content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {currentView === 'default' && (
            <motion.div
              key="default"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          )}
          
          {currentView === 'sentiment' && (
            <motion.div
              key="sentiment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/50 p-8"
            >
              <div className="text-center space-y-6 w-full max-w-md">
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider font-space mb-6">
                    Sale Sentiment
                  </h3>
                  <div className={cn("text-6xl md:text-7xl lg:text-8xl font-bold font-space mb-2", getSentimentColor(sentimentScore))}>
                    {sentimentScore}%
                  </div>
                  <div className={cn("text-base md:text-lg font-medium font-space", getSentimentColor(sentimentScore))}>
                    {getSentimentLabel(sentimentScore)}
                  </div>
                </div>
                <div className="w-full max-w-xs h-4 bg-slate-800/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${sentimentScore}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={cn(
                      "h-full rounded-full",
                      sentimentScore >= 70 ? 'bg-emerald-500' :
                      sentimentScore >= 40 ? 'bg-amber-500' :
                      'bg-red-500'
                    )}
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          {currentView === 'talkTime' && (
            <motion.div
              key="talkTime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/50 p-8"
            >
              <div className="text-center space-y-6 w-full max-w-md">
                <div>
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider font-space mb-6">
                    Talk Time Ratio
                  </h3>
                  <div className={cn("text-6xl md:text-7xl lg:text-8xl font-bold font-space mb-2", getTalkTimeColor(talkTimeRatio))}>
                    {talkTimeRatio}%
                  </div>
                  <div className={cn("text-base md:text-lg font-medium font-space", getTalkTimeColor(talkTimeRatio))}>
                    {getTalkTimeLabel(talkTimeRatio)}
                  </div>
                  {talkTimeRatio >= 50 && talkTimeRatio <= 60 && (
                    <div className="text-xs text-emerald-400/70 font-space mt-1">
                      Ideal range: 50-60%
                    </div>
                  )}
                </div>
                <div className="w-full max-w-xs relative">
                  {/* Target zone indicator */}
                  {talkTimeRatio >= 50 && talkTimeRatio <= 60 && (
                    <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
                      <div className="w-[41.67%] h-4 border-l-2 border-r-2 border-emerald-400/30 rounded" />
                    </div>
                  )}
                  <div className="w-full h-4 bg-slate-800/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${talkTimeRatio}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        talkTimeRatio >= 50 && talkTimeRatio <= 60 ? 'bg-emerald-500' :
                        talkTimeRatio < 50 ? 'bg-orange-500' :
                        'bg-blue-500'
                      )}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          {currentView === 'speechAnalysis' && (
            <motion.div
              key="speechAnalysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/50 p-6 md:p-8"
            >
              {speechAnalysis ? (
                <div className="h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider font-space text-center">
                      Live Speech Analysis
                    </h3>
                  </div>
                  
                  <div className="flex-1 grid grid-cols-2 gap-4 md:gap-6">
                    {/* WPM */}
                    <div className="bg-slate-800/40 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center border border-slate-700/30">
                      <div className="text-xs md:text-sm text-slate-400 font-space mb-3 uppercase tracking-wide">
                        Words/Min
                      </div>
                      <div className={cn(
                        "text-3xl md:text-4xl font-bold font-space",
                        speechAnalysis.wpm && speechAnalysis.wpm >= 140 && speechAnalysis.wpm <= 180 
                          ? 'text-emerald-400' 
                          : speechAnalysis.wpm && speechAnalysis.wpm > 180 
                            ? 'text-orange-400' 
                            : 'text-blue-400'
                      )}>
                        {speechAnalysis.wpm || 0}
                      </div>
                    </div>
                    
                    {/* Filler Words */}
                    <div className="bg-slate-800/40 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center border border-slate-700/30">
                      <div className="text-xs md:text-sm text-slate-400 font-space mb-3 uppercase tracking-wide">
                        Filler Words
                      </div>
                      <div className={cn(
                        "text-3xl md:text-4xl font-bold font-space",
                        speechAnalysis.totalFillerWords !== undefined && speechAnalysis.totalFillerWords <= 3
                          ? 'text-emerald-400'
                          : speechAnalysis.totalFillerWords !== undefined && speechAnalysis.totalFillerWords <= 6
                            ? 'text-amber-400'
                            : 'text-red-400'
                      )}>
                        {speechAnalysis.totalFillerWords !== undefined ? speechAnalysis.totalFillerWords : 0}
                      </div>
                    </div>
                    
                    {/* Pitch Variation */}
                    {speechAnalysis.pitchVariation !== undefined && (
                      <div className="bg-slate-800/40 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center border border-slate-700/30">
                        <div className="text-xs md:text-sm text-slate-400 font-space mb-3 uppercase tracking-wide">
                          Pitch Variation
                        </div>
                        <div className={cn(
                          "text-3xl md:text-4xl font-bold font-space",
                          speechAnalysis.pitchVariation >= 15
                            ? 'text-emerald-400'
                            : speechAnalysis.pitchVariation >= 10
                              ? 'text-amber-400'
                              : 'text-red-400'
                        )}>
                          {speechAnalysis.pitchVariation.toFixed(0)}%
                        </div>
                      </div>
                    )}
                    
                    {/* Volume */}
                    {speechAnalysis.avgVolume !== undefined && speechAnalysis.avgVolume > -60 && (
                      <div className="bg-slate-800/40 rounded-xl p-4 md:p-6 flex flex-col items-center justify-center border border-slate-700/30">
                        <div className="text-xs md:text-sm text-slate-400 font-space mb-3 uppercase tracking-wide">
                          Volume
                        </div>
                        <div className={cn(
                          "text-3xl md:text-4xl font-bold font-space",
                          speechAnalysis.avgVolume >= -30
                            ? 'text-emerald-400'
                            : speechAnalysis.avgVolume >= -40
                              ? 'text-amber-400'
                              : 'text-red-400'
                        )}>
                          {speechAnalysis.avgVolume.toFixed(0)}dB
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider font-space">
                    Live Speech Analysis
                  </h3>
                  <p className="text-sm text-slate-400 font-space">Waiting for speech data...</p>
                </div>
              )}
            </motion.div>
          )}
          
          {currentView === 'objections' && (
            <motion.div
              key="objections"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/50 p-6"
            >
              <div className="text-center space-y-4 w-full">
                <div className="text-4xl mb-2">🚫</div>
                <h3 className="text-lg font-semibold text-white font-space">Objections</h3>
                <div className="text-5xl font-bold font-space text-white">
                  {objectionCount}
                </div>
                <div className="text-sm text-slate-400 font-space">
                  {objectionCount === 0 
                    ? 'No objections yet' 
                    : objectionCount === 1 
                      ? 'Objection detected' 
                      : 'Objections detected'}
                </div>
              </div>
            </motion.div>
          )}
          
          {currentView === 'techniques' && (
            <motion.div
              key="techniques"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/50 p-4"
            >
              {techniquesUsed.length > 0 ? (
                <div className="w-full space-y-4">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">💡</div>
                    <h3 className="text-lg font-semibold text-white font-space">Techniques Used</h3>
                    <div className="text-2xl font-bold font-space text-emerald-400 mt-2">
                      {techniquesUsed.length}
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-[60%] overflow-y-auto custom-scrollbar">
                    {techniquesUsed.map((technique, index) => (
                      <div
                        key={index}
                        className="bg-slate-800/50 rounded-lg px-3 py-2 text-sm font-space text-white text-center"
                      >
                        {technique}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <div className="text-3xl mb-2">💡</div>
                  <h3 className="text-lg font-semibold text-white font-space">Techniques Used</h3>
                  <div className="text-2xl font-bold font-space text-slate-400 mt-2">0</div>
                  <p className="text-sm text-slate-400 font-space">No techniques detected yet</p>
                </div>
              )}
            </motion.div>
          )}

          {currentView === 'coaching' && (
            <motion.div
              key="coaching"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col bg-slate-900/50 backdrop-blur-sm rounded-lg border border-slate-800/50 overflow-hidden shadow-lg"
            >
              <CoachSuggestion 
                suggestion={coachSuggestion} 
                isLoading={coachSuggestionLoading} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
