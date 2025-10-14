'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Mail, Target, Award, TrendingUp, FileText, MessageSquare, Calendar, Loader2 } from 'lucide-react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface RepProfileModalProps {
  rep: {
    id: string
    name: string
    score: number
  }
  onClose: () => void
}

interface RepDetails {
  rep: {
    id: string
    name: string
    email: string
    role: string
    score: number
    virtualEarnings: number
    totalSessions: number
  }
  skillData: Array<{
    skill: string
    score: number
  }>
  recentSessions: Array<{
    id: string
    date: string
    homeowner: string
    score: number
    duration: string
    saleClosed: boolean
    earnings: number
  }>
  insights: {
    strengths: string[]
    improvements: string[]
  }
}

export default function RepProfileModal({ rep, onClose }: RepProfileModalProps) {
  const [details, setDetails] = useState<RepDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRepDetails()
  }, [rep.id])

  const loadRepDetails = async () => {
    try {
      const response = await fetch(`/api/team/rep/${rep.id}`)
      if (response.ok) {
        const data = await response.json()
        setDetails(data)
      }
    } catch (error) {
      console.error('Error loading rep details:', error)
    } finally {
      setLoading(false)
    }
  }

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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold ring-2 ring-purple-500/50">
                {rep.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{rep.name}</h2>
                <p className="text-sm text-slate-300">
                  {loading ? 'Loading...' : `Current Score: ${details?.rep.score || 0}%`}
                </p>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
            </div>
          ) : details ? (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Total Sessions</p>
                  <p className="text-2xl font-bold text-white">{details.rep.totalSessions}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Virtual Earnings</p>
                  <p className="text-2xl font-bold text-green-400">${details.rep.virtualEarnings.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Role</p>
                  <p className="text-2xl font-bold text-purple-400 capitalize">{details.rep.role}</p>
                </div>
              </div>

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
                  {details.skillData.some(s => s.score > 0) ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={details.skillData}>
                          <PolarGrid stroke="#2a2a3e" />
                          <PolarAngleAxis dataKey="skill" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                          <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      <p className="text-sm">No skill data available yet</p>
                    </div>
                  )}
                </div>

                {/* Recent Sessions */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Recent Sessions</h3>
                  {details.recentSessions.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {details.recentSessions.map((session) => (
                        <div key={session.id} className="bg-white/5 border border-white/5 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-white">{session.homeowner}</span>
                            <span className={`text-sm font-bold ${
                              session.score >= 80 ? 'text-green-400' : session.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {session.score}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>{session.date}</span>
                            <span>{session.duration}</span>
                          </div>
                          {session.saleClosed && (
                            <div className="mt-2 text-xs text-green-400">
                              ✓ Sale Closed • ${session.earnings.toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      <p className="text-sm">No sessions yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Insights */}
              {(details.insights.strengths.length > 0 || details.insights.improvements.length > 0) && (
                <div className="bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">AI-Identified Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {details.insights.strengths.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-green-300 mb-2">Strengths</p>
                        <ul className="space-y-2 text-sm text-slate-200">
                          {details.insights.strengths.map((strength, i) => (
                            <li key={i}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {details.insights.improvements.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-amber-300 mb-2">Areas for Improvement</p>
                        <ul className="space-y-2 text-sm text-slate-200">
                          {details.insights.improvements.map((improvement, i) => (
                            <li key={i}>• {improvement}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
            </>
          ) : (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <p>Failed to load rep details</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
