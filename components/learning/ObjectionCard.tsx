'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { LearningObjection } from '@/lib/learning/types'
import { cn } from '@/lib/utils'

interface ObjectionCardProps {
  objection: LearningObjection
  delay?: number
}

export function ObjectionCard({ objection, delay = 0 }: ObjectionCardProps) {
  return (
    <Link href={`/learning/objections/${objection.slug}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay }}
        whileHover={{ scale: 1.02, y: -2 }}
        className={cn(
          'w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6',
          'hover:border-red-500/50 transition-all duration-300 cursor-pointer',
          'flex flex-col gap-4',
          'shadow-[0_4px_16px_rgba(0,0,0,0.4)]'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="px-2 py-1 rounded text-xs font-semibold border bg-red-500/10 border-red-500/30 text-red-400">
                Objection
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2 font-space line-clamp-2">
              {objection.name}
            </h3>
            {objection.description && (
              <p className="text-sm text-slate-400 line-clamp-2 font-sans">
                {objection.description}
              </p>
            )}
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
        </div>

        {/* Scripts count */}
        {objection.scripts && objection.scripts.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
            <span>{objection.scripts.length} example script{objection.scripts.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </motion.div>
    </Link>
  )
}


