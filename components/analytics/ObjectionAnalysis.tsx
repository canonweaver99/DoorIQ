'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Clock, MessageCircle, TrendingDown, TrendingUp, XCircle, AlertTriangle } from 'lucide-react'

interface ObjectionDetail {
  type: string
  customer_statement: string
  rep_response: string
  technique_used: string
  resolution: 'resolved' | 'partial' | 'unresolved' | 'ignored'
  time_to_resolve: string
  effectiveness_score: number
}

interface ObjectionAnalysis {
  total_objections?: number
  objections_detail?: ObjectionDetail[]
  unresolved_concerns?: string[]
  objection_patterns?: string
}

interface ObjectionAnalysisProps {
  objectionAnalysis: ObjectionAnalysis
}

export default function ObjectionAnalysis({ objectionAnalysis }: ObjectionAnalysisProps) {
  if (!objectionAnalysis || !objectionAnalysis.objections_detail || objectionAnalysis.objections_detail.length === 0) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <CheckCircle2 className="w-12 h-12" />
          <div>
            <p className="text-lg font-semibold">No Objections Raised</p>
            <p className="text-sm">Customer had no concerns or objections</p>
          </div>
        </div>
      </div>
    )
  }

  const getResolutionIcon = (resolution: string) => {
    switch (resolution) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'unresolved':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'ignored':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getResolutionColor = (resolution: string) => {
    switch (resolution) {
      case 'resolved':
        return 'border-green-500/30 bg-green-500/10'
      case 'partial':
        return 'border-yellow-500/30 bg-yellow-500/10'
      case 'unresolved':
        return 'border-red-500/30 bg-red-500/10'
      case 'ignored':
        return 'border-orange-500/30 bg-orange-500/10'
      default:
        return 'border-gray-500/30 bg-gray-500/10'
    }
  }

  const getResolutionLabel = (resolution: string) => {
    switch (resolution) {
      case 'resolved':
        return 'Resolved'
      case 'partial':
        return 'Partially Resolved'
      case 'unresolved':
        return 'Unresolved'
      case 'ignored':
        return 'Ignored'
      default:
        return resolution
    }
  }

  const getObjectionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      price: '💰 Price',
      timing: '⏰ Timing',
      competition: '🏢 Competition',
      trust: '🤝 Trust',
      need: '❓ Need',
      authority: '👥 Authority',
      contract_length: '📋 Contract',
      chemical_concerns: '🧪 Chemicals',
      pet_safety: '🐕 Pets',
      previous_experience: '📚 Past Experience',
      rental_property: '🏠 Rental',
      DIY_preference: '🔧 DIY',
      other: '📌 Other'
    }
    return typeMap[type] || `📌 ${type}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const resolvedCount = objectionAnalysis.objections_detail?.filter(o => typeof o === 'object' && o.resolution === 'resolved').length || 0
  const unresolvedCount = objectionAnalysis.objections_detail?.filter(o => typeof o === 'object' && (o.resolution === 'unresolved' || o.resolution === 'ignored')).length || 0
  const resolutionRate = objectionAnalysis.total_objections ? Math.round((resolvedCount / objectionAnalysis.total_objections) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-blue-500/30"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <MessageCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">{objectionAnalysis.total_objections || 0}</h3>
              <p className="text-sm text-gray-400">Total Objections</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-3xl font-bold text-white">{resolutionRate}%</p>
            <p className="text-sm text-gray-400">Resolution Rate</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm text-gray-400">Resolved</p>
              <p className="text-lg font-semibold text-white">{resolvedCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm text-gray-400">Unresolved</p>
              <p className="text-lg font-semibold text-white">{unresolvedCount}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Objection Pattern Analysis */}
      {objectionAnalysis.objection_patterns && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50"
        >
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            Pattern Analysis
          </h4>
          <p className="text-gray-300 leading-relaxed">{objectionAnalysis.objection_patterns}</p>
        </motion.div>
      )}

      {/* Individual Objections */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-400" />
          Objection Details
        </h4>

        {objectionAnalysis.objections_detail?.map((objection, index) => {
          // Handle both string and object formats
          const isString = typeof objection === 'string'
          const type = isString ? 'general' : (objection.type || 'general')
          const statement = isString ? objection : (objection.customer_statement || '')
          const response = isString ? '' : (objection.rep_response || '')
          const resolution = isString ? 'unknown' : (objection.resolution || 'unknown')
          const technique = isString ? '' : (objection.technique_used || '')
          const timeToResolve = isString ? 'N/A' : (objection.time_to_resolve || 'N/A')
          const effectiveness = isString ? 0 : (objection.effectiveness_score || 0)
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className={`rounded-xl p-5 border ${getResolutionColor(resolution)}`}
            >
              {/* Objection Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getObjectionTypeLabel(type).split(' ')[0]}</span>
                  <div>
                    <h5 className="text-lg font-semibold text-white capitalize">
                      {type.replace(/_/g, ' ')}
                    </h5>
                    {!isString && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeToResolve}
                        </span>
                        {effectiveness > 0 && (
                          <span className={`text-xs font-semibold ${getScoreColor(effectiveness)}`}>
                            {effectiveness}/100
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {!isString && (
                    <>
                      <div className="flex items-center gap-2">
                        {getResolutionIcon(resolution)}
                        <span className="text-sm font-medium text-white capitalize">
                          {getResolutionLabel(resolution)}
                        </span>
                      </div>
                      {technique && technique !== 'none' && (
                        <span className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-300">
                          {technique.replace(/_/g, ' ')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Customer Statement */}
              {statement && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Customer Said:</p>
                  <div className="bg-gray-900/50 rounded-lg p-3 border-l-4 border-red-500/50">
                    <p className="text-sm text-gray-200 italic">"{statement}"</p>
                  </div>
                </div>
              )}

              {/* Rep Response */}
              {response && (
                <div>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Rep Responded:</p>
                  <div className="bg-gray-900/50 rounded-lg p-3 border-l-4 border-blue-500/50">
                    <p className="text-sm text-gray-200 italic">"{response}"</p>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Unresolved Concerns */}
      {objectionAnalysis.unresolved_concerns && objectionAnalysis.unresolved_concerns.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-xl p-6 border border-red-500/30"
        >
          <h4 className="text-lg font-semibold text-red-300 mb-3 flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Unresolved Concerns
          </h4>
          <ul className="space-y-2">
            {objectionAnalysis.unresolved_concerns.map((concern, i) => (
              <li key={i} className="flex items-start gap-2 text-gray-300">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{concern}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  )
}

