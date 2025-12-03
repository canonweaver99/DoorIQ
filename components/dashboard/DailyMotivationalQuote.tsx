'use client'

import { motion } from 'framer-motion'

const motivationalQuotes = [
  {
    text: "Every expert was once a beginner. Every pro was once an amateur.",
    author: "Robin Sharma"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown"
  },
  {
    text: "Don't stop when you're tired. Stop when you're done.",
    author: "Unknown"
  },
  {
    text: "Practice makes progress, not perfection.",
    author: "Unknown"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown"
  },
  {
    text: "Push yourself, because no one else is going to do it for you.",
    author: "Unknown"
  }
]

interface DailyMotivationalQuoteProps {
  streak?: number
  overallScore?: number
}

export default function DailyMotivationalQuote({ streak, overallScore }: DailyMotivationalQuoteProps) {
  // Select quote based on day of year for consistency
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
  const selectedQuote = motivationalQuotes[dayOfYear % motivationalQuotes.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="text-center py-20 md:py-24 lg:py-28"
    >
      <p className="text-white text-xl md:text-2xl lg:text-3xl xl:text-4xl font-light leading-relaxed italic mb-3">
        "{selectedQuote.text}"
      </p>
      <p className="text-white/60 text-base md:text-lg font-thin">
        — {selectedQuote.author}
      </p>
    </motion.div>
  )
}
