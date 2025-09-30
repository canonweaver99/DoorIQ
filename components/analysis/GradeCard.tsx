'use client'

import { motion } from 'framer-motion'

export function GradeCard({ score, letter, pass }: { score: number; letter: string; pass: boolean }) {
  const color = score >= 85 ? 'bg-emerald-600' : score >= 70 ? 'bg-blue-600' : score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
  const badge = pass ? 'PASS' : 'FAIL'
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex items-center justify-between">
      <div>
        <div className="text-slate-300">Overall Score</div>
        <div className="text-4xl font-bold text-slate-100">{score}</div>
        <span className={`inline-block mt-2 text-xs px-2 py-1 rounded ${pass ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}>{badge}</span>
      </div>
      <motion.div
        className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${color}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {letter}
      </motion.div>
    </div>
  )
}


