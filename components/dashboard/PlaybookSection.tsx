'use client'

import { motion } from 'framer-motion'
import { Book, Search, TrendingUp, Play, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const playbooks = [
  {
    id: 1,
    title: 'Handling "Too Expensive"',
    category: 'Objections',
    usageCount: 45,
    successRate: 82,
    color: 'from-amber-600/20 to-orange-600/20',
    borderColor: 'border-amber-500/30',
  },
  {
    id: 2,
    title: 'The Assumptive Close',
    category: 'Closes',
    usageCount: 38,
    successRate: 88,
    color: 'from-green-600/20 to-emerald-600/20',
    borderColor: 'border-green-500/30',
  },
  {
    id: 3,
    title: 'Building Instant Rapport',
    category: 'Openings',
    usageCount: 52,
    successRate: 79,
    color: 'from-blue-600/20 to-cyan-600/20',
    borderColor: 'border-blue-500/30',
  },
  {
    id: 4,
    title: 'Spouse Decision Maker',
    category: 'Objections',
    usageCount: 29,
    successRate: 75,
    color: 'from-purple-600/20 to-indigo-600/20',
    borderColor: 'border-purple-500/30',
  },
]

const categories = ['All', 'Objections', 'Openings', 'Closes', 'Industry Specific']

export default function PlaybookSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-[#1e1e30] border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20">
          <Book className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Playbooks</h3>
          <p className="text-xs text-slate-400">Quick access</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search playbooks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Playbook Cards */}
      <div className="space-y-3 mb-4">
        {playbooks.map((playbook, index) => (
          <motion.div
            key={playbook.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 + index * 0.05 }}
            whileHover={{ scale: 1.02, x: 4 }}
            className="group relative"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${playbook.color} rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            
            <div className={`relative bg-white/5 border ${playbook.borderColor} rounded-xl p-4 transition-all duration-300`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">{playbook.title}</h4>
                  <p className="text-xs text-slate-400">{playbook.category}</p>
                </div>
                
                <button className="p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg border border-purple-500/20 transition-colors">
                  <Play className="w-4 h-4 text-purple-400" />
                </button>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-slate-300">{playbook.successRate}% success</span>
                </div>
                <div className="text-slate-400">
                  {playbook.usageCount} uses
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ArrowRight className="w-4 h-4 text-purple-300" />
          </div>
          <div>
            <p className="text-sm font-medium text-white mb-1">Quick Tip</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Practice "Too Expensive" objections during peak hours (2-4 PM) for best results
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

