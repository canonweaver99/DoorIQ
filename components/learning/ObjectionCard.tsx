'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertCircle, ArrowRight, DollarSign, RefreshCw, Wrench, Users, Clock, Home, CheckCircle2, PlayCircle } from 'lucide-react'
import { LearningObjection } from '@/lib/learning/types'
import { cn } from '@/lib/utils'

interface ObjectionCardProps {
  objection: LearningObjection & { progress?: { completed_at: string | null } | null }
  delay?: number
  isLast?: boolean
  displayNumber?: number
}

// Hook lines for each objection
const hookLines: Record<string, string> = {
  'price': 'They haven\'t seen enough value yet',
  'switchover': 'This is actually your warmest lead',
  'diy': 'They think they can do it themselves',
  'spouse': 'Often it\'s a stall tactic',
  'think-about-it': 'Translation: "You haven\'t convinced me"',
  'renter': 'They don\'t own the home, but they might still decide'
}

// Icons for each objection
const objectionIcons: Record<string, typeof DollarSign> = {
  'price': DollarSign,
  'switchover': RefreshCw,
  'diy': Wrench,
  'spouse': Users,
  'think-about-it': Clock,
  'renter': Home
}

// Objection category colors (amber/orange to match objections category)
const objectionColors = {
  bg: '#3a2a1a',
  border: '#6a4a2a',
  glow: 'rgba(245, 158, 11, 0.1)',
  numberBg: '#6a4a2a',
  iconBg: '#6a4a2a40'
}

export function ObjectionCard({ objection, delay = 0, isLast = false, displayNumber }: ObjectionCardProps) {
  const hookLine = hookLines[objection.slug] || ''
  const IconComponent = objectionIcons[objection.slug] || AlertCircle
  
  const isCompleted = objection.progress?.completed_at !== null
  const cardColors = isCompleted ? objectionColors : {
    bg: '#1a1a1a',
    border: '#3a3a3a',
    glow: 'rgba(148, 163, 184, 0.05)',
    numberBg: '#3a3a3a',
    iconBg: '#3a3a3a40'
  }

  const buttonText = isCompleted ? 'Review' : 'Start'

  return (
    <>
      <Link href={`/learning/objections/${objection.slug}`}>
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay }}
          className="w-full rounded-lg p-7 transition-all duration-300 cursor-pointer flex items-center gap-6 relative overflow-hidden group"
          style={{
            backgroundColor: cardColors.bg,
            border: `2px solid ${cardColors.border}`,
            boxShadow: `inset 0 0 20px ${cardColors.glow}, 0 4px 16px rgba(0, 0, 0, 0.4)`
          }}
        >
          {/* Objection Number */}
          <div className="flex-shrink-0 w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl text-white"
            style={{ backgroundColor: cardColors.numberBg }}>
            {displayNumber !== undefined ? displayNumber : objection.display_order}
          </div>

          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: cardColors.iconBg }}>
              <IconComponent className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-2 font-space line-clamp-1">
              {objection.name}
            </h3>
            {hookLine && (
              <p className="text-base text-white/85 font-sans line-clamp-1">
                {hookLine}
              </p>
            )}
            {objection.scripts && objection.scripts.length > 0 && (
              <p className="text-sm text-white/50 font-sans mt-1">
                {objection.scripts.length} example script{objection.scripts.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Right side: Button */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* Button */}
            <button
              className={cn(
                'px-5 py-2.5 rounded-lg font-semibold text-base transition-all duration-200 flex items-center gap-2 text-white',
                'group-hover:scale-105'
              )}
              style={isCompleted ? {
                backgroundColor: cardColors.numberBg,
              } : {
                backgroundColor: '#3a3a3a',
              }}
              onClick={(e) => {
                e.preventDefault()
                window.location.href = `/learning/objections/${objection.slug}`
              }}
            >
              {buttonText}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Completion Overlay */}
          {isCompleted && (
            <div className="absolute top-3 right-3">
              <CheckCircle2 className="w-7 h-7 text-green-400" />
            </div>
          )}
        </motion.div>
      </Link>
      
      {/* Connecting Line */}
      {!isLast && (
        <div className="flex justify-center py-3">
          <div className="w-1 h-8" style={{ backgroundColor: cardColors.border }} />
        </div>
      )}
    </>
  )
}
