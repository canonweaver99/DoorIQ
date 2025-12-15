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
  defaultToCoaching?: boolean // If true, defaults to coaching when available (for transcript cards)
  coachModeEnabled?: boolean // If true, always include coaching view even without suggestion
  // Shared state props to prevent duplicate cards
  otherCardView?: ViewType | null // The current view of the other card
  onViewChange?: (view: ViewType) => void // Callback when view changes
  cardId?: string // Unique identifier for this card instance
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
  className,
  defaultToCoaching = false, // Only transcript cards should default to coaching
  coachModeEnabled = false, // If true, always include coaching view
  otherCardView = null, // The current view of the other card
  onViewChange, // Callback when view changes
  cardId // Unique identifier for this card instance
}: RotatingCardViewProps) {
  // Include coaching view if:
  // 1. coachSuggestion exists or is loading, OR
  // 2. defaultToCoaching is true (for transcript cards that should show coaching pre-session)
  const shouldIncludeCoaching = (coachSuggestion || coachSuggestionLoading) || (defaultToCoaching && coachModeEnabled)
  
  const views: ViewType[] = shouldIncludeCoaching
    ? ['default', 'sentiment', 'talkTime', 'speechAnalysis', 'objections', 'techniques', 'coaching']
    : ['default', 'sentiment', 'talkTime', 'speechAnalysis', 'objections', 'techniques']
  
  // Filter out views that are currently shown in the other card (except 'default' which can be duplicated)
  const getAvailableViews = () => {
    if (!otherCardView || otherCardView === 'default') {
      return views
    }
    return views.filter(view => view === 'default' || view !== otherCardView)
  }
  
  const availableViews = getAvailableViews()
  
  // Default to coaching if defaultToCoaching is true (even if no suggestion yet)
  // Otherwise default to 'default' view (transcript or feedback)
  // If the default view is taken by the other card, pick the first available view
  const getInitialView = (): ViewType => {
    if (defaultToCoaching && shouldIncludeCoaching) {
      return 'coaching'
    }
    // If 'default' is available, use it; otherwise use first available
    if (availableViews.includes('default')) {
      return 'default'
    }
    return availableViews[0] || 'default'
  }
  
  const [currentView, setCurrentView] = useState<ViewType>(getInitialView)
  
  // Update view if the other card's view conflicts with ours
  useEffect(() => {
    const currentAvailableViews = getAvailableViews()
    if (otherCardView && otherCardView !== 'default' && currentView === otherCardView) {
      // Find next available view
      const nextAvailable = currentAvailableViews.find(view => view !== currentView && view !== otherCardView) || currentAvailableViews[0]
      if (nextAvailable) {
        setCurrentView(nextAvailable)
        onViewChange?.(nextAvailable)
      }
    }
  }, [otherCardView, currentView, onViewChange])
  
  // Switch to coaching when it becomes available or when defaultToCoaching is true
  useEffect(() => {
    if (defaultToCoaching && shouldIncludeCoaching && currentView === 'default') {
      setCurrentView('coaching')
      onViewChange?.('coaching')
    }
  }, [coachSuggestion, coachSuggestionLoading, currentView, defaultToCoaching, shouldIncludeCoaching])
  
  const currentIndex = availableViews.indexOf(currentView)

  const changeView = (direction: 'next' | 'prev') => {
    let newIndex: number
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % availableViews.length
    } else {
      newIndex = (currentIndex - 1 + availableViews.length) % availableViews.length
    }
    
    const newView = availableViews[newIndex]
    
    // If the new view conflicts with the other card, skip to the next one
    if (otherCardView && otherCardView !== 'default' && newView === otherCardView) {
      const nextAvailable = availableViews.find((view, idx) => 
        idx !== newIndex && view !== otherCardView && view !== currentView
      ) || availableViews.find(view => view !== otherCardView && view !== currentView) || availableViews[0]
      
      if (nextAvailable) {
        setCurrentView(nextAvailable)
        onViewChange?.(nextAvailable)
        return
      }
    }
    
    setCurrentView(newView)
    onViewChange?.(newView)
  }

  const nextView = () => changeView('next')
  const prevView = () => changeView('prev')

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
                <div className="w-full max-w-xs mx-auto flex flex-col items-center">
                  <div className="w-full h-4 bg-slate-800/50 rounded-full overflow-hidden">
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
                  <div className="w-full flex justify-between text-xs text-slate-400 font-space mt-1">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
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
                <div className="w-full max-w-xs mx-auto flex flex-col items-center relative">
                  {/* Target zone indicator */}
                  {talkTimeRatio >= 50 && talkTimeRatio <= 60 && (
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-1 pointer-events-none">
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
                  <div className="w-full flex justify-between text-xs text-slate-400 font-space mt-1">
                    <span>0%</span>
                    <span>100%</span>
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
                showPlaceholder={defaultToCoaching && coachModeEnabled && !coachSuggestion && !coachSuggestionLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
