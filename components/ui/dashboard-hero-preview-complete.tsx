'use client'

import { useState } from 'react'

export function DashboardHeroPreview() {
  const [activeTab, setActiveTab] = useState('overview')
  
  // Calculate date range
  const startDate = new Date('2024-09-08')
  const today = new Date()
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'performance', label: 'Performance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'learning', label: 'Learning', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { id: 'upload', label: 'Upload', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
    { id: 'team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'messages', label: 'Messages', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
  ]

  const getColor = (pct: number) => {
    if (pct >= 90) return '#10b981'
    if (pct >= 80) return '#22c55e'
    if (pct >= 70) return '#eab308'
    if (pct >= 60) return '#f97316'
    return '#ef4444'
  }

  return (
    <div className="w-full max-w-[2000px] mx-auto bg-[#0a0a0a] rounded-2xl overflow-hidden shadow-[0_20px_70px_rgba(139,92,246,0.2)] border border-white/10 font-sans">
      <div className="px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Dashboard</h2>
            <p className="text-sm font-medium text-gray-400">{formatDate(startDate)} - {formatDate(today)}</p>
          </div>
          <button className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors">
            Download
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 mb-6 border-b border-white/10 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-semibold whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                </svg>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Rapport */}
              <div className="bg-gradient-to-br from-emerald-900/20 to-emerald-800/10 rounded-xl p-5 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-emerald-300">Rapport</h3>
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1.5 tabular-nums">88%</div>
                <p className="text-xs font-medium text-green-400">+5% from last month</p>
              </div>

              {/* Discovery */}
              <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 rounded-xl p-5 border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-300">Discovery</h3>
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1.5 tabular-nums">82%</div>
                <p className="text-xs font-medium text-green-400">+13% from last month</p>
              </div>

              {/* Objection Handling */}
              <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 rounded-xl p-5 border border-amber-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-amber-300">Objection Handling</h3>
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1.5 tabular-nums">79%</div>
                <p className="text-xs font-medium text-green-400">+8% from last month</p>
              </div>

              {/* Closing */}
              <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-5 border border-purple-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-purple-300">Closing</h3>
                  <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="text-3xl font-bold text-white mb-1.5 tabular-nums">85%</div>
                <p className="text-xs font-medium text-green-400">+6% from last month</p>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Chart */}
              <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/10 to-transparent rounded-xl p-5 border border-purple-500/10">
                <h3 className="text-lg font-bold text-white mb-4">Overall Performance Overview</h3>
                <div className="relative h-64">
                  <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-xs font-semibold text-white">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                  </div>
                  
                  <div className="ml-10 h-full pb-8 relative">
                    <svg viewBox="0 0 280 280" className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#A855F7" />
                          <stop offset="50%" stopColor="#EC4899" />
                          <stop offset="100%" stopColor="#F472B6" />
                        </linearGradient>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#EC4899" stopOpacity="0.05" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 180 C 20 165, 35 140, 50 120 C 65 100, 80 110, 95 105 C 110 100, 125 85, 140 80 C 155 75, 170 90, 185 95 C 200 100, 215 110, 230 105 C 245 100, 260 85, 280 75 L 280 280 L 0 280 Z"
                        fill="url(#areaGradient)"
                      />
                      <path
                        d="M 0 180 C 20 165, 35 140, 50 120 C 65 100, 80 110, 95 105 C 110 100, 125 85, 140 80 C 155 75, 170 90, 185 95 C 200 100, 215 110, 230 105 C 245 100, 260 85, 280 75"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs font-semibold text-white px-1">
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                        <span key={day}>{day}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-gradient-to-br from-pink-900/10 to-transparent rounded-xl p-5 border border-pink-500/10">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">Recent Sessions</h3>
                  <p className="text-xs font-medium text-gray-400">Top performing this month.</p>
                </div>
                
                <div className="space-y-3">
                  {[
                    { name: 'Skeptical Sam', earned: '93', percent: 87, avatar: '/agents/sam.png', color: 'from-purple-500/30' },
                    { name: 'Busy Beth', earned: '78', percent: 73, avatar: '/agents/beth.png', color: 'from-red-500/30' },
                    { name: 'Too Expensive Tim', earned: '89', percent: 84, avatar: '/agents/tim.png', color: 'from-blue-500/30' },
                    { name: 'Think About It Tina', earned: '85', percent: 81, avatar: '/agents/tina.png', color: 'from-purple-500/30' },
                    { name: 'Not Interested Nick', earned: '82', percent: 76, avatar: '/agents/nick.png', color: 'from-purple-500/30' }
                  ].map((session, index) => {
                    const circumference = 2 * Math.PI * 20
                    const strokeDashoffset = circumference - (session.percent / 100) * circumference
                    
                    return (
                      <div key={index} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="relative">
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${session.color} to-transparent blur-sm`}></div>
                            <img 
                              src={session.avatar}
                              alt={session.name}
                              className="relative w-9 h-9 rounded-full ring-2 ring-white/10 flex-shrink-0"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white">{session.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <div className="relative w-11 h-11">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                              <defs>
                                <linearGradient id={`scoreGrad-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#A855F7" />
                                  <stop offset="100%" stopColor="#EC4899" />
                                </linearGradient>
                              </defs>
                              <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
                              <circle
                                cx="24"
                                cy="24"
                                r="20"
                                stroke={getColor(session.percent)}
                                strokeWidth="4"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                fill="none"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-white">{session.percent}%</span>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-purple-300 tabular-nums">+${session.earned}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="min-h-[400px] bg-gradient-to-br from-blue-900/5 to-transparent rounded-xl p-8 border border-blue-500/10">
            <h3 className="text-2xl font-bold text-white mb-6">Detailed Performance Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Overall Average', value: '83%', color: 'text-green-400' },
                { label: 'Sessions Completed', value: '47', color: 'text-blue-400' },
                { label: 'Improvement Rate', value: '+12%', color: 'text-purple-400' },
                { label: 'Consistency Score', value: '91%', color: 'text-emerald-400' },
              ].map((metric, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <p className="text-xs text-gray-400 mb-2">{metric.label}</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>{metric.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="min-h-[400px] bg-gradient-to-br from-purple-900/5 to-transparent rounded-xl p-8 border border-purple-500/10">
            <h3 className="text-2xl font-bold text-white mb-6">Coaching Tips & Resources</h3>
            <div className="space-y-4">
              {[
                { title: 'Handling Price Objections', desc: 'Learn proven techniques to overcome budget concerns', progress: 75 },
                { title: 'Building Instant Rapport', desc: 'Master the first 30 seconds of every conversation', progress: 90 },
                { title: 'Advanced Closing Techniques', desc: 'Close more deals with assumptive language', progress: 60 },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 rounded-lg p-5 border border-white/10">
                  <h4 className="text-base font-semibold text-white mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-400 mb-3">{item.desc}</p>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600" style={{ width: `${item.progress}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="min-h-[400px] bg-gradient-to-br from-indigo-900/5 to-transparent rounded-xl p-8 border border-indigo-500/10 flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-purple-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-2xl font-bold text-white mb-2">Upload Training Materials</h3>
            <p className="text-gray-400 text-center max-w-md mb-6">Drop your sales scripts, playbooks, or training videos here to enhance AI training</p>
            <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all">
              Choose Files
            </button>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="min-h-[400px] bg-gradient-to-br from-emerald-900/5 to-transparent rounded-xl p-8 border border-emerald-500/10">
            <h3 className="text-2xl font-bold text-white mb-6">Team Leaderboard</h3>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Sarah Chen', score: 892, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop' },
                { rank: 2, name: 'Marcus Johnson', score: 875, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' },
                { rank: 3, name: 'Alex Rivera (You)', score: 840, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', isYou: true },
                { rank: 4, name: 'David Martinez', score: 825, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop' },
                { rank: 5, name: 'Emma Wilson', score: 810, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
              ].map((member) => (
                <div key={member.rank} className={`flex items-center justify-between p-4 rounded-lg ${member.isYou ? 'bg-purple-500/10 border-2 border-purple-500/30' : 'bg-white/5 border border-white/10'}`}>
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-purple-400">#{member.rank}</div>
                    <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full ring-2 ring-white/20" />
                    <span className="text-base font-semibold text-white">{member.name}</span>
                  </div>
                  <div className="text-xl font-bold text-purple-300">{member.score}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="min-h-[400px] bg-gradient-to-br from-pink-900/5 to-transparent rounded-xl p-8 border border-pink-500/10">
            <h3 className="text-2xl font-bold text-white mb-6">Team Messages</h3>
            <div className="space-y-4">
              {[
                { from: 'Manager', msg: 'Great job on handling objections this week!', time: '2h ago', unread: true },
                { from: 'Coach Sarah', msg: 'New training module available for closing techniques', time: '1d ago', unread: true },
                { from: 'System', msg: 'You earned a new achievement badge', time: '2d ago', unread: false },
              ].map((message, i) => (
                <div key={i} className={`p-5 rounded-lg border ${message.unread ? 'bg-purple-500/5 border-purple-500/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base font-semibold text-white">{message.from}</span>
                    <span className="text-xs text-gray-500">{message.time}</span>
                  </div>
                  <p className="text-sm text-gray-300">{message.msg}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

