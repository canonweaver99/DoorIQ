'use client'

import { Activity, AlertCircle, TrendingUp, TrendingDown, Zap, MessageSquare, Users } from 'lucide-react'

interface ConversationDynamicsProps {
  conversationDynamics: {
    interruptions?: Array<{
      line: number
      who: string
      impact: string
    }>
    energy_shifts?: Array<{
      line: number
      from: string
      to: string
      trigger: string
    }>
    buying_signals?: Array<{
      line: number
      signal: string
      strength: string
    }>
    momentum_changes?: Array<{
      line: number
      change: string
      reason: string
    }>
    engagement_drops?: Array<{
      line: number
      reason: string
    }>
  }
}

export default function ConversationDynamics({ conversationDynamics }: ConversationDynamicsProps) {
  const {
    interruptions = [],
    energy_shifts = [],
    buying_signals = [],
    momentum_changes = [],
    engagement_drops = []
  } = conversationDynamics

  const hasData = interruptions.length > 0 || energy_shifts.length > 0 || 
                  buying_signals.length > 0 || momentum_changes.length > 0 || 
                  engagement_drops.length > 0

  if (!hasData) {
    return (
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl p-6">
        <div className="text-center text-slate-400">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No significant conversation dynamics detected</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {/* Buying Signals */}
      {buying_signals.length > 0 && (
        <div className="relative rounded-2xl bg-gradient-to-br from-emerald-900/20 to-green-800/20 backdrop-blur-xl p-6 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-medium text-white">Buying Signals Detected</h3>
            <span className="ml-auto text-sm text-emerald-400">{buying_signals.length} signals</span>
          </div>
          <div className="space-y-3">
            {buying_signals.map((signal, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-emerald-500/10">
                <span className="text-xs font-mono text-emerald-400 mt-0.5">L{signal.line}</span>
                <div className="flex-1">
                  <p className="text-sm text-white/90">{signal.signal}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-emerald-400">Strength:</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      signal.strength === 'very_strong' ? 'bg-emerald-500/30 text-emerald-300' :
                      signal.strength === 'strong' ? 'bg-emerald-500/20 text-emerald-400' :
                      signal.strength === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {signal.strength.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Energy Shifts */}
      {energy_shifts.length > 0 && (
        <div className="relative rounded-2xl bg-gradient-to-br from-blue-900/20 to-indigo-800/20 backdrop-blur-xl p-6 border border-blue-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-blue-500/20">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-medium text-white">Energy Shifts</h3>
            <span className="ml-auto text-sm text-blue-400">{energy_shifts.length} shifts</span>
          </div>
          <div className="space-y-3">
            {energy_shifts.map((shift, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-blue-500/10">
                <span className="text-xs font-mono text-blue-400 mt-0.5">L{shift.line}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      shift.from === 'engaged' ? 'bg-green-500/20 text-green-400' :
                      shift.from === 'interested' ? 'bg-blue-500/20 text-blue-400' :
                      shift.from === 'skeptical' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {shift.from}
                    </span>
                    <span className="text-slate-500">→</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      shift.to === 'engaged' ? 'bg-green-500/20 text-green-400' :
                      shift.to === 'interested' ? 'bg-blue-500/20 text-blue-400' :
                      shift.to === 'skeptical' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {shift.to}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{shift.trigger}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Momentum Changes & Engagement Drops */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Momentum Changes */}
        {momentum_changes.length > 0 && (
          <div className="relative rounded-2xl bg-gradient-to-br from-purple-900/20 to-violet-800/20 backdrop-blur-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-medium text-white">Momentum Changes</h3>
            </div>
            <div className="space-y-2">
              {momentum_changes.map((change, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                  <span className="text-xs font-mono text-purple-400 mt-0.5">L{change.line}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white/90">{change.change}</p>
                    <p className="text-xs text-purple-400/70 mt-0.5">{change.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Drops */}
        {engagement_drops.length > 0 && (
          <div className="relative rounded-2xl bg-gradient-to-br from-red-900/20 to-orange-800/20 backdrop-blur-xl p-6 border border-red-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-500/20">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="font-medium text-white">Engagement Drops</h3>
            </div>
            <div className="space-y-2">
              {engagement_drops.map((drop, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
                  <span className="text-xs font-mono text-red-400 mt-0.5">L{drop.line}</span>
                  <div className="flex-1">
                    <p className="text-sm text-white/90">{drop.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Interruptions */}
      {interruptions.length > 0 && (
        <div className="relative rounded-2xl bg-gradient-to-br from-amber-900/20 to-yellow-800/20 backdrop-blur-xl p-6 border border-amber-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-amber-500/20">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <h3 className="font-medium text-white">Interruptions</h3>
            <span className="ml-auto text-sm text-amber-400">{interruptions.length} instances</span>
          </div>
          <div className="space-y-2">
            {interruptions.map((interruption, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5">
                <span className="text-xs font-mono text-amber-400">L{interruption.line}</span>
                <span className="text-sm text-white/90">{interruption.who} interrupted</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                  interruption.impact === 'positive' ? 'bg-green-500/20 text-green-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {interruption.impact}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
