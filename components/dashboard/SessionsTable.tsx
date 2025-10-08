'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, User, Award, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Session {
  id: number
  date: string
  time: string
  homeowner: string
  duration: string
  score: number
  feedback: string
}

interface SessionsTableProps {
  sessions: Session[]
}

export default function SessionsTable({ sessions }: SessionsTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/10 border-green-500/30'
    if (score >= 60) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    return 'text-red-400 bg-red-500/10 border-red-500/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Sessions</h3>
            <p className="text-xs text-slate-400">Last 5 training sessions</p>
          </div>
        </div>
        
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {sessions.map((session, index) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 + index * 0.05 }}
          >
            <button
              onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl p-4 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* Expand Icon */}
                <div className="text-slate-400">
                  {expandedId === session.id ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>

                {/* Date & Time */}
                <div className="flex-shrink-0 text-left">
                  <p className="text-sm font-medium text-white">{session.date}</p>
                  <p className="text-xs text-slate-400">{session.time}</p>
                </div>

                {/* Homeowner */}
                <div className="hidden md:flex items-center gap-2 flex-1 text-left">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{session.homeowner}</span>
                </div>

                {/* Duration */}
                <div className="hidden lg:flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">{session.duration}</span>
                </div>

                {/* Score */}
                <div className={`px-3 py-1.5 rounded-lg border font-semibold text-sm ${getScoreColor(session.score)}`}>
                  {session.score}%
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            <AnimatePresence>
              {expandedId === session.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white/5 border border-white/5 rounded-xl p-4 mt-2 ml-9">
                    <div className="flex items-start gap-3">
                      <Award className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-white mb-1">Key Feedback</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{session.feedback}</p>
                        <Link
                          href={`/analytics/${session.id}`}
                          className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors mt-3"
                        >
                          View Detailed Analysis
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

