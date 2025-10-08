'use client'

import { motion } from 'framer-motion'
import { X, Mail, Target, Award, TrendingUp, FileText, MessageSquare, Calendar } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface RepProfileModalProps {
  rep: {
    id: number
    name: string
    avatar: string
    status: string
    score: number
    sessionsWeek: number
  }
  onClose: () => void
}

const skillData = [
  { skill: 'Rapport', score: 85 },
  { skill: 'Discovery', score: 78 },
  { skill: 'Objection Handling', score: 92 },
  { skill: 'Closing', score: 88 },
  { skill: 'Active Listening', score: 82 },
  { skill: 'Speaking Pace', score: 75 },
]

const recentSessions = [
  { id: 1, date: 'Oct 8, 2025', homeowner: 'Skeptical Steve', score: 92, duration: '5:30' },
  { id: 2, date: 'Oct 8, 2025', homeowner: 'Budget Betty', score: 88, duration: '4:45' },
  { id: 3, date: 'Oct 7, 2025', homeowner: 'Austin', score: 95, duration: '6:00' },
]

export default function RepProfileModal({ rep, onClose }: RepProfileModalProps) {
  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-4xl md:max-h-[90vh] bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={rep.avatar}
                alt={rep.name}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/50"
              />
              <div>
                <h2 className="text-2xl font-bold text-white">{rep.name}</h2>
                <p className="text-sm text-slate-300">Current Score: {rep.score}%</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
              <Mail className="w-5 h-5 text-purple-400" />
              <span className="text-xs font-medium text-white">Message</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
              <Target className="w-5 h-5 text-blue-400" />
              <span className="text-xs font-medium text-white">Assign Training</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
              <Award className="w-5 h-5 text-green-400" />
              <span className="text-xs font-medium text-white">Set Goals</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-medium text-white">Export Report</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skill Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Skill Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={skillData}>
                    <PolarGrid stroke="#2a2a3e" />
                    <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div key={session.id} className="bg-white/5 border border-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{session.homeowner}</span>
                      <span className={`text-sm font-bold ${
                        session.score >= 80 ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {session.score}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{session.date}</span>
                      <span>{session.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">AI-Identified Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-green-300 mb-2">Strengths</p>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li>• Exceptional objection handling</li>
                  <li>• Strong assumptive language</li>
                  <li>• Consistent performance</li>
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-amber-300 mb-2">Areas for Improvement</p>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li>• Speaking pace (too fast at times)</li>
                  <li>• Discovery question depth</li>
                  <li>• Filler word frequency</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Manager Notes */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Manager Notes</h3>
            <textarea
              placeholder="Add notes about this rep's performance, goals, or development plan..."
              className="w-full h-24 p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all resize-none"
            />
            <button className="mt-3 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-sm font-medium text-purple-300 transition-colors">
              Save Notes
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

