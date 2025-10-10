'use client'

import { AlertTriangle, XCircle, SkipForward, RefreshCw, Target, AlertOctagon } from 'lucide-react'

interface FailureAnalysisProps {
  failureAnalysis: {
    critical_moments?: Array<{
      line: number
      event: string
      customer_reaction: string
      rep_recovery_attempted: boolean
      success: boolean
      better_approach: string
    }>
    point_of_no_return?: {
      line: number
      reason: string
      could_have_saved: boolean
      how: string
    }
    missed_pivots?: Array<{
      line: number
      opportunity: string
      suggested_pivot: string
    }>
    recovery_failures?: Array<{
      line: number
      attempt: string
      why_failed: string
      better_approach: string
    }>
  }
}

export default function FailureAnalysis({ failureAnalysis }: FailureAnalysisProps) {
  const {
    critical_moments = [],
    point_of_no_return,
    missed_pivots = [],
    recovery_failures = []
  } = failureAnalysis

  const hasData = critical_moments.length > 0 || point_of_no_return?.line || 
                  missed_pivots.length > 0 || recovery_failures.length > 0

  if (!hasData) {
    return (
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl p-6">
        <div className="text-center text-slate-400">
          <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No critical failures detected - good job!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Point of No Return */}
      {point_of_no_return?.line > 0 && (
        <div className="relative rounded-2xl bg-gradient-to-br from-red-950/40 to-red-900/40 backdrop-blur-xl p-6 border-2 border-red-500/40">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30">
              <AlertOctagon className="w-6 h-6 text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-300 text-lg mb-2">Point of No Return</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-mono text-red-400 mt-0.5">Line {point_of_no_return.line}</span>
                  <p className="text-white/90">{point_of_no_return.reason}</p>
                </div>
                {point_of_no_return.could_have_saved && (
                  <div className="p-4 rounded-xl bg-white/5 border border-red-500/20">
                    <p className="text-xs uppercase tracking-wider text-red-400 mb-2">Could Have Saved It:</p>
                    <p className="text-sm text-white/80">{point_of_no_return.how}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Critical Moments */}
      {critical_moments.length > 0 && (
        <div className="relative rounded-2xl bg-gradient-to-br from-orange-900/20 to-red-800/20 backdrop-blur-xl p-6 border border-orange-500/20">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-orange-500/20">
              <XCircle className="w-5 h-5 text-orange-400" />
            </div>
            <h3 className="font-medium text-white">Critical Moments</h3>
            <span className="ml-auto text-sm text-orange-400">{critical_moments.length} moments</span>
          </div>
          
          <div className="space-y-4">
            {critical_moments.map((moment, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-orange-500/10">
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm font-mono text-orange-400">Line {moment.line}</span>
                  <div className="flex items-center gap-2">
                    {moment.rep_recovery_attempted && (
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                        moment.success 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        <RefreshCw className="w-3 h-3" />
                        Recovery {moment.success ? 'Succeeded' : 'Failed'}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-orange-400/70 mb-1">What Happened:</p>
                    <p className="text-sm text-white/90">{moment.event}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-orange-400/70 mb-1">Customer Reaction:</p>
                    <p className="text-sm text-white/80">{moment.customer_reaction}</p>
                  </div>
                  
                  <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20">
                    <p className="text-xs text-yellow-400 mb-1">Better Approach:</p>
                    <p className="text-sm text-white/90">{moment.better_approach}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missed Pivots & Recovery Failures */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Missed Pivots */}
        {missed_pivots.length > 0 && (
          <div className="relative rounded-2xl bg-gradient-to-br from-amber-900/20 to-yellow-800/20 backdrop-blur-xl p-6 border border-amber-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-amber-500/20">
                <SkipForward className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-medium text-white">Missed Pivots</h3>
            </div>
            
            <div className="space-y-3">
              {missed_pivots.map((pivot, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-amber-500/10">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-xs font-mono text-amber-400">L{pivot.line}</span>
                    <p className="text-sm text-white/90 flex-1">{pivot.opportunity}</p>
                  </div>
                  <div className="ml-7 p-2 rounded-lg bg-amber-500/10">
                    <p className="text-xs text-amber-300">Suggested: {pivot.suggested_pivot}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recovery Failures */}
        {recovery_failures.length > 0 && (
          <div className="relative rounded-2xl bg-gradient-to-br from-purple-900/20 to-pink-800/20 backdrop-blur-xl p-6 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <AlertTriangle className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-medium text-white">Recovery Failures</h3>
            </div>
            
            <div className="space-y-3">
              {recovery_failures.map((failure, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/5 border border-purple-500/10">
                  <div className="mb-2">
                    <span className="text-xs font-mono text-purple-400">L{failure.line}</span>
                    <p className="text-sm text-white/90 mt-1">{failure.attempt}</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="text-red-400">Why it failed: {failure.why_failed}</p>
                    <p className="text-green-400">Better: {failure.better_approach}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
