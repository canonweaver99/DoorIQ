'use client'

import { motion } from 'framer-motion'

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#1e1e30] border border-white/10 rounded-2xl p-4 h-[140px]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
        <div className="w-20 h-3 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="w-16 h-8 bg-white/5 rounded animate-pulse mb-2" />
      <div className="w-full h-6 bg-white/5 rounded animate-pulse" />
    </div>
  )
}

export function SessionCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-[300px] h-[120px] bg-[#1e1e30] border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="w-32 h-4 bg-white/5 rounded animate-pulse mb-2" />
          <div className="w-20 h-3 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="w-12 h-8 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="w-full h-8 bg-white/5 rounded animate-pulse mt-2" />
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
      <p className="text-slate-400 text-sm">{message}</p>
    </motion.div>
  )
}

