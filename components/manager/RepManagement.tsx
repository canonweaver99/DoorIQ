'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { Search, Filter, ChevronDown, MoreVertical, Mail, Target, X, TrendingUp, TrendingDown, CheckSquare, UserCheck, MessageSquare, Eye } from 'lucide-react'
import RepProfileModal from './RepProfileModal'

interface Rep {
  id: string
  name: string
  email: string
  role: string
  status: string
  score: number
  sessionsWeek: number
  trend: number
  trendUp: boolean
  lastActive: string
  virtualEarnings: number
}

export default function RepManagement() {
  const [reps, setReps] = useState<Rep[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [selectedReps, setSelectedReps] = useState<string[]>([])
  const [selectedRep, setSelectedRep] = useState<Rep | null>(null)
  const [actionMenuRepId, setActionMenuRepId] = useState<string | null>(null)
  const actionMenuRef = useRef<HTMLDivElement | null>(null)

  // Load reps data
  useEffect(() => {
    loadReps()
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!actionMenuRepId) return
      if (actionMenuRef.current?.contains(event.target as Node)) return
      setActionMenuRepId(null)
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [actionMenuRepId])

  const handleAction = (action: 'message' | 'promote' | 'profile', repId: string) => {
    switch (action) {
      case 'message':
        // placeholder: wire up messaging flow when backend available
        break
      case 'promote':
        // placeholder: integrate promotion flow when role management is ready
        break
      case 'profile':
        setSelectedRep(reps.find((rep) => rep.id === repId) ?? null)
        break
    }
    setActionMenuRepId(null)
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
        <h3 className="text-xl font-semibold text-white mb-2">No Team Members Yet</h3>
        <p className="text-slate-400">Invite team members to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
            <p className="text-sm text-white font-medium">
              {selectedReps.length} rep{selectedReps.length > 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all">
                Assign Training
              </button>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all">
                Send Message
              </button>
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all">
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
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rep</span>
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
              className="px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => setSelectedRep(rep)}
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
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white/10">
                    {rep.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{rep.name}</p>
                    <p className="text-xs text-slate-400">{rep.lastActive}</p>
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
                    <span className={`text-lg font-bold ${
                      rep.score >= 80 ? 'text-green-400' : rep.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {rep.score}%
                    </span>
                  </div>
                </div>

                {/* Sessions */}
                <div className="col-span-2 hidden lg:block">
                  <span className="text-sm font-semibold text-white">{rep.sessionsWeek} sessions</span>
                </div>

                {/* Trend */}
                <div className="col-span-1 hidden xl:block">
                  {rep.trend !== 0 && (
                    <div className={`flex items-center gap-1 ${rep.trendUp ? 'text-green-400' : 'text-red-400'}`}>
                      {rep.trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-semibold">{Math.abs(rep.trend)}%</span>
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
                            key: 'message' as const,
                            label: 'Send Message',
                            icon: <MessageSquare className="w-4 h-4 text-purple-300" />,
                          },
                          {
                            key: 'promote' as const,
                            label: 'Promote to Manager',
                            icon: <UserCheck className="w-4 h-4 text-blue-300" />,
                          },
                          {
                            key: 'profile' as const,
                            label: 'View Profile',
                            icon: <Eye className="w-4 h-4 text-green-300" />,
                          },
                        ].map((item) => (
                          <button
                            key={item.key}
                            onClick={() => handleAction(item.key, rep.id)}
                            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
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
    </div>
  )
}
