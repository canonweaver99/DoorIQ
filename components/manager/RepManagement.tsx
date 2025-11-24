'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, MoreVertical, Mail, Target, X, TrendingUp, TrendingDown, CheckSquare, UserCheck, MessageSquare, Eye, Download, ArrowUpRight, ArrowDownRight, ChevronRight, Trash2, AlertTriangle } from 'lucide-react'
import RepProfileModal from './RepProfileModal'

interface Rep {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  status: string
  score: number
  sessionsWeek: number
  trend: number
  trendUp: boolean
  lastActive: string
  virtualEarnings: number
}

interface RepPerformance {
  id: string
  name: string
  sessions: number
  avgScore: number
  trend: number
  skills: {
    rapport: number
    discovery: number
    objections: number
    closing: number
  }
  revenue: number
  lastActive: string
  closePercentage?: number
}

export default function RepManagement() {
  const [reps, setReps] = useState<Rep[]>([])
  const [repPerformance, setRepPerformance] = useState<RepPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [performanceLoading, setPerformanceLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [selectedReps, setSelectedReps] = useState<string[]>([])
  const [selectedRep, setSelectedRep] = useState<Rep | null>(null)
  const [actionMenuRepId, setActionMenuRepId] = useState<string | null>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)
  const [repToRemove, setRepToRemove] = useState<Rep | null>(null)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  // Load reps data
  useEffect(() => {
    loadReps()
    loadRepPerformance()
  }, [])

  const loadReps = async () => {
    try {
      const response = await fetch('/api/team/reps')
      if (response.ok) {
        const data = await response.json()
        setReps(data.reps || [])
      }
    } catch (error) {
      console.error('Error loading reps:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRepPerformance = async () => {
    try {
      const response = await fetch('/api/team/analytics?period=30')
      if (response.ok) {
        const data = await response.json()
        setRepPerformance(data.analytics?.repPerformance || [])
      }
    } catch (error) {
      console.error('Error loading rep performance:', error)
    } finally {
      setPerformanceLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!actionMenuRepId) return
      if (actionMenuRef.current?.contains(event.target as Node)) return
      setActionMenuRepId(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [actionMenuRepId])

  const handleAction = (action: 'message' | 'profile' | 'remove', repId: string) => {
    switch (action) {
      case 'message':
        // Navigate to messages tab for this rep
        window.location.href = `/manager?tab=messages&rep=${repId}`
        break
      case 'profile':
        // Navigate to rep's individual dashboard
        window.location.href = `/manager/rep/${repId}`
        break
      case 'remove':
        const rep = reps.find(r => r.id === repId)
        if (rep) {
          setRepToRemove(rep)
        }
        break
    }
    setActionMenuRepId(null)
  }

  const handleRemoveRep = async () => {
    if (!repToRemove) return

    setRemoving(true)
    setRemoveError(null)

    try {
      const response = await fetch(`/api/team/members/${repToRemove.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        // Remove rep from local state and refresh
        await loadReps()
        await loadRepPerformance()
        setRepToRemove(null)
      } else {
        setRemoveError(data.error || 'Failed to remove rep')
      }
    } catch (error: any) {
      console.error('Error removing rep:', error)
      setRemoveError(error.message || 'Failed to remove rep')
    } finally {
      setRemoving(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Training':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'In Field':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'Available':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30'
    }
  }

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'In Training':
        return 'bg-blue-400'
      case 'In Field':
        return 'bg-green-400'
      case 'Available':
        return 'bg-yellow-400'
      default:
        return 'bg-slate-400'
    }
  }

  const toggleRepSelection = (id: string) => {
    setSelectedReps(prev =>
      prev.includes(id) ? prev.filter(repId => repId !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedReps(selectedReps.length === reps.length ? [] : reps.map(r => r.id))
  }

  // Filter and sort reps
  const filteredReps = reps
    .filter(rep => {
      // Search filter
      if (searchQuery && !rep.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Status filter
      if (statusFilter !== 'all' && rep.status.toLowerCase().replace(' ', '') !== statusFilter) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'name':
          return a.name.localeCompare(b.name)
        case 'sessions':
          return b.sessionsWeek - a.sessionsWeek
        case 'lastActive':
          return 0 // Could implement time-based sorting
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (reps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UserCheck className="w-16 h-16 text-slate-600 mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2 font-space">No Team Members Yet</h3>
        <p className="text-slate-400 font-sans">Invite team members to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Rep Performance Section */}
      {!performanceLoading && repPerformance.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 font-space">Complete Team Performance</h3>
              <p className="text-sm text-white/60 font-sans">Individual rep metrics and trends</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white/80 transition-all">
              <Download className="w-4 h-4" />
              Export Team Report
            </button>
          </div>
          <div className="space-y-3">
            {repPerformance.map((rep, idx) => (
              <motion.div
                key={rep.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 bg-black/20 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all group cursor-pointer"
                onClick={() => window.location.href = `/manager/rep/${rep.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                        rep.avgScore >= 80 ? 'from-emerald-500/30 to-green-500/30 border-emerald-400/30' :
                        rep.avgScore >= 70 ? 'from-blue-500/30 to-cyan-500/30 border-blue-400/30' :
                        'from-amber-500/30 to-orange-500/30 border-amber-400/30'
                      } border flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg font-space">{rep.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-[#1a1a2e] flex items-center justify-center ${
                        rep.trend >= 0 ? 'bg-emerald-500' : 'bg-red-500'
                      }`}>
                        {rep.trend >= 0 ? (
                          <ArrowUpRight className="w-3 h-3 text-white" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3 text-white" />
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold text-lg font-space">{rep.name}</p>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${
                          rep.avgScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                          rep.avgScore >= 70 ? 'bg-blue-500/20 text-blue-300' :
                          'bg-amber-500/20 text-amber-300'
                        }`}>
                          {rep.avgScore >= 80 ? 'Excellent' : rep.avgScore >= 70 ? 'Good' : 'Needs Work'}
                        </span>
                      </div>
                      <p className="text-sm text-white/60">{rep.sessions} sessions • Last active {rep.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white mb-1 font-space">{rep.avgScore}%</p>
                      <p className="text-xs text-white/50 font-sans">Avg Score</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-300 mb-1 font-space">${(rep.revenue / 1000).toFixed(1)}k</p>
                      <p className="text-xs text-white/50 font-sans">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-300 mb-1 font-space">{rep.closePercentage || 0}%</p>
                      <p className="text-xs text-white/50 font-sans">Close %</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        {Object.entries(rep.skills).map(([skill, score]) => (
                          <div key={skill} className="flex items-center gap-2">
                            <span className="text-xs text-white/50 w-20 text-right capitalize">{skill}:</span>
                            <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  score >= 80 ? 'bg-emerald-500' :
                                  score >= 70 ? 'bg-blue-500' :
                                  'bg-amber-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-xs text-white/70 w-8">{score}%</span>
                          </div>
                        ))}
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search reps by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#1e1e30] border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 bg-[#1e1e30] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all appearance-none cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="intraining">In Training</option>
          <option value="infield">In Field</option>
          <option value="available">Available</option>
          <option value="offline">Offline</option>
        </select>

        {/* Sort By */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-3 bg-[#1e1e30] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all appearance-none cursor-pointer"
        >
          <option value="score">Sort by Score</option>
          <option value="name">Sort by Name</option>
          <option value="sessions">Sort by Sessions</option>
          <option value="lastActive">Sort by Last Active</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedReps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-white font-medium font-sans">
              {selectedReps.length} rep{selectedReps.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all font-space">
                Assign Training
              </button>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all font-space">
                Send Message
              </button>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all font-space">
                Set Challenge
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rep Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-[#1e1e30] border border-white/10 rounded-2xl overflow-visible"
      >
        {/* Table Header */}
        <div className="border-b border-white/10 bg-white/5 px-6 py-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-1">
              <input
                type="checkbox"
                checked={selectedReps.length === filteredReps.length && filteredReps.length > 0}
                onChange={toggleSelectAll}
                className="custom-checkbox"
              />
            </div>
            <div className="col-span-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-space">Rep</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</span>
            </div>
            <div className="col-span-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Score</span>
            </div>
            <div className="col-span-2 hidden lg:block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sessions</span>
            </div>
            <div className="col-span-1 hidden xl:block">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Trend</span>
            </div>
            <div className="col-span-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</span>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-white/5 overflow-visible">
          {filteredReps.map((rep, index) => (
            <motion.div
              key={rep.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
              className="px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
              onClick={() => window.location.href = `/manager/rep/${rep.id}`}
            >
              <div className="grid grid-cols-12 gap-4 items-center">
                {/* Checkbox */}
                <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedReps.includes(rep.id)}
                    onChange={() => toggleRepSelection(rep.id)}
                    className="custom-checkbox"
                  />
                </div>

                {/* Profile */}
                <div className="col-span-3 flex items-center gap-3">
                  {rep.avatar_url ? (
                    <img 
                      src={rep.avatar_url} 
                      alt={rep.name}
                      className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10">
                      {rep.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-white font-space">{rep.name}</p>
                    <p className="text-xs text-slate-400 font-sans">{rep.lastActive}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${getStatusColor(rep.status)}`}>
                    <div className={`w-2 h-2 rounded-full ${getStatusDot(rep.status)} ${rep.status !== 'Offline' ? 'animate-pulse' : ''}`} />
                    {rep.status}
                  </div>
                </div>

                {/* Score */}
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold font-space ${
                      rep.score >= 80 ? 'text-green-400' : rep.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {rep.score}%
                    </span>
                  </div>
                </div>

                {/* Sessions */}
                <div className="col-span-2 hidden lg:block">
                  <span className="text-sm font-semibold text-white font-sans">{rep.sessionsWeek} sessions</span>
                </div>

                {/* Trend */}
                <div className="col-span-1 hidden xl:block">
                  {rep.trend !== 0 && (
                    <div className={`flex items-center gap-1 ${rep.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                      {rep.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-semibold font-space">{Math.abs(rep.trend)}%</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    onClick={() => setActionMenuRepId((prev) => (prev === rep.id ? null : rep.id))}
                    aria-haspopup="menu"
                    aria-expanded={actionMenuRepId === rep.id}
                    aria-label={`Open actions for ${rep.name}`}
                  >
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>

                  <AnimatePresence>
                    {actionMenuRepId === rep.id && (
                      <motion.div
                        ref={actionMenuRef}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#1f1f32] shadow-lg shadow-purple-600/20 z-10"
                        role="menu"
                        aria-label="Rep actions"
                      >
                        {[
                          {
                            key: 'profile' as const,
                            label: 'View Dashboard',
                            icon: <Eye className="w-4 h-4 text-green-300" />,
                          },
                          {
                            key: 'message' as const,
                            label: 'Send Message',
                            icon: <MessageSquare className="w-4 h-4 text-purple-300" />,
                          },
                          {
                            key: 'remove' as const,
                            label: 'Remove from Team',
                            icon: <Trash2 className="w-4 h-4 text-red-300" />,
                          },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => handleAction(item.key, rep.id)}
                            className={`flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors ${
                              item.key === 'remove'
                                ? 'text-red-300 hover:text-red-200 hover:bg-red-500/10'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                            }`}
                            role="menuitem"
                          >
                            {item.icon}
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rep Profile Modal */}
      <AnimatePresence>
        {selectedRep && (
          <RepProfileModal
            rep={selectedRep}
            onClose={() => setSelectedRep(null)}
          />
        )}
      </AnimatePresence>

      {/* Remove Rep Confirmation Modal */}
      <AnimatePresence>
        {repToRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => !removing && setRepToRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white font-space">Remove Sales Rep</h3>
              </div>

              <p className="text-slate-300 mb-6">
                Are you sure you want to remove <span className="font-semibold text-white">{repToRemove.name}</span> from your team? 
                They will no longer have access to team features, but their account and session history will be preserved.
              </p>

              {removeError && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-400">{removeError}</p>
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setRepToRemove(null)
                    setRemoveError(null)
                  }}
                  disabled={removing}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed font-space"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveRep}
                  disabled={removing}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-space"
                >
                  {removing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
