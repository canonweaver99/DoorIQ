'use client'

import { motion } from 'framer-motion'

export function MetricCardSkeleton() {
  return (
    <div className="bg-[#1e1e30] border border-white/10 rounded-2xl px-4 py-3 h-[90px] max-h-[90px] flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/5 rounded-lg animate-pulse" />
          <div className="w-20 h-3 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="w-12 h-3 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="w-16 h-10 bg-white/5 rounded animate-pulse" />
    </div>
  )
}

export function SessionCardSkeleton() {
  return (
    <div className="w-full h-[80px] bg-[#1e1e30] border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="w-32 h-4 bg-white/5 rounded animate-pulse mb-2" />
        <div className="w-20 h-3 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="flex-1 min-w-0 hidden md:block">
        <div className="w-full h-8 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="flex-shrink-0 w-16 h-10 bg-white/5 rounded-lg animate-pulse" />
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

