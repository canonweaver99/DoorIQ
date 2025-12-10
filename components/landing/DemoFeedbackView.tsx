'use client'

import { motion } from 'framer-motion'
import { DollarSign, Clock, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { ProgressRing } from '@/components/analytics/ProgressRing'
import { cn } from '@/lib/utils'

interface DemoFeedbackViewProps {
  overallScore: number
  saleClosed: boolean
  virtualEarnings: number
  earningsData?: any
  dealDetails?: any
}

export function DemoFeedbackView({
  overallScore,
  saleClosed,
  virtualEarnings,
  earningsData,
  dealDetails
}: DemoFeedbackViewProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'
    if (score >= 60) return '#3b82f6'
    if (score >= 40) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'A+'
    if (score >= 90) return 'A'
    if (score >= 85) return 'B+'
    if (score >= 80) return 'B'
    if (score >= 75) return 'C+'
    if (score >= 70) return 'C'
    if (score >= 65) return 'D'
    return 'F'
  }

  // Calculate earnings breakdown
  const calculatedTotalValue = (dealDetails?.base_price || 0) + 
    ((dealDetails?.monthly_value || 0) * (dealDetails?.contract_length || 0))
  
  const dealValue = dealDetails?.total_contract_value || calculatedTotalValue || 0
  
  const totalEarned = earningsData?.closed_amount || earningsData?.total_earned || virtualEarnings || 0

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full space-y-6"
      >
        {/* Overall Performance Card */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-xl border border-slate-700/50 p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Left Column - Score */}
              <div className="flex-[2]">
                <div className="mb-6">
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-500 mb-2 font-sans">Demo Session Results</div>
                  <h2 className="text-2xl font-bold text-white font-space mb-6">Overall Performance</h2>
                  
                  <div className="flex items-start gap-6 mb-6">
                    <div className="flex flex-col">
                      <div className={`text-6xl font-bold mb-1 font-space`} style={{ color: getScoreColor(overallScore) }}>
                        {overallScore}
                      </div>
                      <div className="text-sm text-slate-400 font-sans">Overall Score</div>
                      <div 
                        className="inline-block mt-2 px-4 py-1.5 rounded-full text-lg font-semibold font-space"
                        style={{ 
                          background: `${getScoreColor(overallScore)}20`,
                          color: getScoreColor(overallScore),
                          border: `1px solid ${getScoreColor(overallScore)}40`
                        }}
                      >
                        {getScoreGrade(overallScore)} Grade
                      </div>
                    </div>
                    <ProgressRing
                      value={overallScore}
                      max={100}
                      size={100}
                      strokeWidth={10}
                      color={getScoreColor(overallScore)}
                    />
                  </div>
                </div>
              </div>
              
              {/* Right Column - Earnings Card */}
              <div className="flex-[3] min-w-0">
                <div className={`relative rounded-3xl backdrop-blur-xl p-6 overflow-hidden flex flex-col justify-between w-full ${
                  saleClosed && virtualEarnings > 0
                    ? 'bg-gradient-to-br from-emerald-900/70 to-green-800/70 border-2 border-emerald-500/60'
                    : dealDetails?.next_step
                      ? 'bg-gradient-to-br from-amber-900/70 to-yellow-800/70 border-2 border-amber-500/60'
                      : 'bg-gradient-to-br from-red-900/70 to-rose-800/70 border-2 border-red-500/60'
                }`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl ${
                    saleClosed && virtualEarnings > 0
                      ? 'bg-gradient-to-br from-emerald-400/40 to-green-400/40'
                      : dealDetails?.next_step
                        ? 'bg-gradient-to-br from-amber-400/40 to-yellow-400/40'
                        : 'bg-gradient-to-br from-red-400/40 to-rose-400/40'
                  }`}></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      {saleClosed && virtualEarnings > 0 ? (
                        <>
                          <DollarSign className="w-5 h-5 text-emerald-300" />
                          <span className="text-sm uppercase tracking-[0.25em] text-emerald-300 font-space font-bold">You Earned</span>
                        </>
                      ) : dealDetails?.next_step ? (
                        <>
                          <Clock className="w-5 h-5 text-yellow-300" />
                          <span className="text-sm uppercase tracking-[0.25em] text-yellow-300 font-space font-bold">Soft Close</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-300" />
                          <span className="text-sm uppercase tracking-[0.25em] text-red-300 font-space font-bold">Close Failed</span>
                        </>
                      )}
                    </div>
                    
                    <div className={`text-4xl font-bold text-white mb-4 font-space ${
                      !saleClosed || virtualEarnings === 0 ? 'line-through opacity-50' : ''
                    }`}>
                      ${saleClosed && virtualEarnings > 0 ? dealValue.toFixed(2) : '0.00'}
                    </div>

                    <div className="flex-1 flex flex-col justify-end">
                      {saleClosed && virtualEarnings > 0 ? (
                        <div className="space-y-3">
                          {dealDetails?.product_sold && (
                            <div className="flex justify-between text-base mb-2">
                              <span className="text-slate-300 font-sans">Service</span>
                              <span className="text-white font-medium font-sans">{dealDetails.product_sold}</span>
                            </div>
                          )}
                          
                          {(dealDetails?.base_price || dealDetails?.monthly_value) && (
                            <div className="pt-2 border-t border-emerald-500/20 space-y-1.5">
                            {dealDetails?.base_price && dealDetails.base_price > 0 && (
                              <div className="flex justify-between text-base">
                                <span className="text-slate-300 font-sans">Initial Service</span>
                                <span className="text-white font-medium font-sans">${dealDetails.base_price.toFixed(2)}</span>
                              </div>
                            )}
                            {dealDetails?.monthly_value && dealDetails.monthly_value > 0 && dealDetails?.contract_length && dealDetails.contract_length > 0 && (
                              <div className="flex justify-between text-base">
                                <span className="text-white/70 font-sans">
                                  Monthly ({dealDetails.contract_length} {dealDetails.contract_length === 1 ? 'month' : 'months'})
                                </span>
                                <span className="text-white font-medium font-sans">
                                  ${dealDetails.monthly_value.toFixed(2)}/mo × {dealDetails.contract_length} = ${(dealDetails.monthly_value * dealDetails.contract_length).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                          )}
                          
                          <div className="flex justify-between text-base pt-2 border-t border-emerald-500/20">
                            <span className="text-slate-300 font-sans">Total Deal Value</span>
                            <span className="text-white font-medium font-sans">${dealValue.toFixed(2)}</span>
                          </div>
                        </div>
                      ) : dealDetails?.next_step ? (
                        <div className="space-y-3">
                          <div className="text-xl font-bold text-amber-300 font-space">Next Step ✓</div>
                          <p className="text-sm text-white font-medium leading-relaxed font-sans">{dealDetails.next_step}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex justify-between text-base">
                            <span className="text-slate-300 font-medium font-sans">Potential Deal Value</span>
                            <span className="text-white/70 font-semibold line-through font-sans">$--</span>
                          </div>
                          <div className="flex justify-between text-base">
                            <span className="text-slate-300 font-medium font-sans">Missed Commission</span>
                            <span className="text-red-300 font-semibold font-sans">$0.00</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signup CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-3xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-xl border border-indigo-500/30 p-8 text-center"
        >
          <h3 className="text-2xl font-bold text-white mb-2 font-space">
            Ready to Level Up?
          </h3>
          <p className="text-slate-300 mb-6 font-sans">
            Sign up for unlimited practice sessions and detailed analytics
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-white/95 transition-all font-sans"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
