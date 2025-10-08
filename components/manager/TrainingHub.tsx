'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Plus, BookOpen, Users, Clock, CheckCircle, Play, Edit, Trash, Upload } from 'lucide-react'

const trainingModules = [
  { id: 1, name: 'Advanced Objection Handling', type: 'Required', completionRate: 87, avgScore: 82, lastUpdated: '2 days ago', assignedTo: 24 },
  { id: 2, name: 'Assumptive Language Mastery', type: 'Optional', completionRate: 65, avgScore: 78, lastUpdated: '1 week ago', assignedTo: 18 },
  { id: 3, name: 'Door Approach Techniques', type: 'Certification', completionRate: 92, avgScore: 85, lastUpdated: '3 days ago', assignedTo: 24 },
  { id: 4, name: 'Price Anchoring Strategies', type: 'Required', completionRate: 45, avgScore: 75, lastUpdated: '5 days ago', assignedTo: 12 },
]

const assignments = [
  { id: 1, rep: 'Marcus Johnson', module: 'Advanced Objection Handling', dueDate: 'Oct 10', status: 'In Progress', progress: 75 },
  { id: 2, rep: 'Sarah Chen', module: 'Price Anchoring Strategies', dueDate: 'Oct 12', status: 'Not Started', progress: 0 },
  { id: 3, rep: 'Alex Rivera', module: 'Door Approach Techniques', dueDate: 'Oct 9', status: 'Overdue', progress: 25 },
]

export default function TrainingHub() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Training Management</h2>
          <p className="text-slate-400">Create, assign, and track training modules</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30"
        >
          <Plus className="w-5 h-5" />
          Create New Training
        </button>
      </div>

      {/* Training Library */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Training Library</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {trainingModules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="bg-[#1e1e30] border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-white">{module.name}</h4>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      module.type === 'Required' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      module.type === 'Certification' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {module.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Updated {module.lastUpdated}</p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Edit className="w-4 h-4 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <Trash className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-2xl font-bold text-purple-300">{module.completionRate}%</p>
                  <p className="text-xs text-slate-400">Completion Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{module.avgScore}%</p>
                  <p className="text-xs text-slate-400">Avg Score</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  <Users className="w-3 h-3 inline mr-1" />
                  {module.assignedTo} reps assigned
                </p>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 transition-colors">
                  <Play className="w-3 h-3" />
                  Assign
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Active Assignments */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Active Assignments</h3>
        <div className="bg-[#1e1e30] border border-white/10 rounded-xl overflow-hidden">
          <div className="border-b border-white/10 bg-white/5 px-6 py-3">
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-3"><span className="text-xs font-semibold text-slate-400 uppercase">Rep</span></div>
              <div className="col-span-3"><span className="text-xs font-semibold text-slate-400 uppercase">Module</span></div>
              <div className="col-span-2"><span className="text-xs font-semibold text-slate-400 uppercase">Due Date</span></div>
              <div className="col-span-2"><span className="text-xs font-semibold text-slate-400 uppercase">Status</span></div>
              <div className="col-span-2"><span className="text-xs font-semibold text-slate-400 uppercase">Actions</span></div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {assignments.map((assignment, index) => (
              <motion.div
                key={assignment.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="px-6 py-4 hover:bg-white/5 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <span className="text-sm text-white">{assignment.rep}</span>
                  </div>
                  <div className="col-span-3">
                    <span className="text-sm text-slate-300">{assignment.module}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-sm text-slate-400">{assignment.dueDate}</span>
                  </div>
                  <div className="col-span-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      assignment.status === 'In Progress' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      assignment.status === 'Overdue' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                      'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <button className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                      Remind
                    </button>
                    <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                      Extend
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performer Recordings */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Top Performer Recordings</h3>
        <div className="bg-[#1e1e30] border border-white/10 rounded-xl p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Upload Best Practice Recordings</p>
              <p className="text-sm text-slate-400 mb-4">Share successful calls as training material</p>
              <button className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-sm font-medium text-purple-300 transition-colors">
                Upload Recording
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

