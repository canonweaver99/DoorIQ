'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface CoachSuggestionProps {
  suggestion: {
    suggestedLine: string
  } | null
  isLoading?: boolean
}

export function CoachSuggestion({ suggestion, isLoading }: CoachSuggestionProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!suggestion?.suggestedLine) {
      setDisplayedText('')
      setIsTyping(false)
      return
    }

    // Reset and start typing animation
    setDisplayedText('')
    setIsTyping(true)
    
    const words = suggestion.suggestedLine.split(' ')
    let currentIndex = 0

    const typeNextWord = () => {
      if (currentIndex < words.length) {
        setDisplayedText(prev => {
          const newText = currentIndex === 0 
            ? words[currentIndex] 
            : prev + ' ' + words[currentIndex]
          return newText
        })
        currentIndex++
        
        // Speed: faster for short words, slightly slower for longer words
        const word = words[currentIndex - 1]
        const delay = word.length > 8 ? 50 : word.length > 4 ? 40 : 30
        
        timeoutRef.current = setTimeout(typeNextWord, delay)
      } else {
        setIsTyping(false)
      }
    }

    // Start typing after a brief delay
    timeoutRef.current = setTimeout(typeNextWord, 50)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [suggestion?.suggestedLine])

  if (!suggestion && !isLoading) {
    return null
  }

  return (
    <AnimatePresence>
      {(suggestion || isLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="h-full flex flex-col justify-center p-6"
        >
          {/* Compact header */}
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">
              Live Coaching
            </span>
          </div>

          {/* Large suggestion text - uses full space with typing effect */}
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 bg-white/10 rounded animate-pulse" />
              <div className="h-6 bg-white/10 rounded animate-pulse w-5/6 mx-auto" />
              <div className="h-6 bg-white/10 rounded animate-pulse w-4/6 mx-auto" />
            </div>
          ) : suggestion ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white text-lg md:text-xl lg:text-2xl leading-relaxed text-center font-medium max-w-4xl">
                {displayedText}
                {isTyping && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="inline-block ml-1"
                  >
                    |
                  </motion.span>
                )}
              </p>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
