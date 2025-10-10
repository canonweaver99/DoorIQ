'use client'

import { motion } from 'framer-motion'

interface BonusModifiers {
  quick_close?: number
  upsell?: number
  retention?: number
  same_day_start?: number
  referral_secured?: number
  perfect_pitch?: number
}

interface EarningsData {
  base_amount?: number
  closed_amount?: number
  commission_rate?: number
  commission_earned?: number
  bonus_modifiers?: BonusModifiers
  total_earned?: number
}

interface DealDetails {
  product_sold?: string
  service_type?: string
  base_price?: number
  monthly_value?: number
  contract_length?: number
  total_contract_value?: number
  payment_method?: string
  add_ons?: string[]
  start_date?: string
}

interface EarningsBreakdownProps {
  earningsData: EarningsData
  dealDetails: DealDetails
  saleClosed: boolean
}

export default function EarningsBreakdown({ 
  earningsData, 
  dealDetails, 
  saleClosed 
}: EarningsBreakdownProps) {
  if (!saleClosed) {
    return (
      <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-center gap-3 text-gray-400">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-lg font-semibold">No Sale Closed</p>
            <p className="text-sm">Complete a sale to earn commission</p>
          </div>
        </div>
      </div>
    )
  }

  const bonuses = earningsData.bonus_modifiers || {}
  const totalBonuses = Object.values(bonuses).reduce((sum, val) => sum + (val || 0), 0)
  
  const bonusItems = [
    { key: 'quick_close', label: '⚡ Quick Close', description: 'Closed in under 15 min' },
    { key: 'upsell', label: '📈 Upsell', description: 'Premium package/add-ons' },
    { key: 'retention', label: '🔒 Retention', description: 'Annual/multi-year contract' },
    { key: 'same_day_start', label: '🚀 Same Day', description: 'Starts today/tomorrow' },
    { key: 'referral_secured', label: '👥 Referral', description: 'Got neighbor recommendation' },
    { key: 'perfect_pitch', label: '⭐ Perfect Pitch', description: 'Overall score 90+' },
  ]

  return (
    <div className="space-y-6">
      {/* Total Earnings Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-xl p-6 border border-green-500/30"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Total Earned</p>
            <p className="text-4xl font-bold text-green-400">
              ${(earningsData.total_earned || 0).toFixed(2)}
            </p>
          </div>
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Deal Details */}
      {dealDetails.product_sold && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Deal Details
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Product</p>
              <p className="text-sm font-medium text-white">{dealDetails.product_sold}</p>
            </div>
            
            {dealDetails.total_contract_value && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Contract Value</p>
                <p className="text-sm font-medium text-green-400">
                  ${dealDetails.total_contract_value.toFixed(2)}
                </p>
              </div>
            )}
            
            {dealDetails.service_type && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Service Type</p>
                <p className="text-sm font-medium text-white capitalize">{dealDetails.service_type}</p>
              </div>
            )}
            
            {dealDetails.contract_length && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Contract Length</p>
                <p className="text-sm font-medium text-white">{dealDetails.contract_length} months</p>
              </div>
            )}
            
            {dealDetails.monthly_value && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Monthly Value</p>
                <p className="text-sm font-medium text-white">${dealDetails.monthly_value.toFixed(2)}/mo</p>
              </div>
            )}
            
            {dealDetails.start_date && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <p className="text-sm font-medium text-white capitalize">{dealDetails.start_date}</p>
              </div>
            )}
          </div>
          
          {dealDetails.add_ons && dealDetails.add_ons.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">Add-ons</p>
              <div className="flex flex-wrap gap-2">
                {dealDetails.add_ons.map((addon, i) => (
                  <span 
                    key={i}
                    className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400"
                  >
                    {addon}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Commission Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/30 rounded-xl p-6 border border-gray-700/50"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Commission Breakdown
        </h3>
        
        <div className="space-y-3">
          {/* Base Commission */}
          {earningsData.commission_earned !== undefined && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Base Commission</span>
                {earningsData.commission_rate && (
                  <span className="text-xs text-gray-500">
                    ({(earningsData.commission_rate * 100).toFixed(0)}% of ${(earningsData.closed_amount || 0).toFixed(2)})
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-white">
                ${earningsData.commission_earned.toFixed(2)}
              </span>
            </div>
          )}
          
          {/* Bonuses */}
          {totalBonuses > 0 && (
            <>
              <div className="border-t border-gray-700/50 pt-3">
                <p className="text-xs text-gray-500 mb-3">Performance Bonuses</p>
                <div className="space-y-2">
                  {bonusItems.map(({ key, label, description }) => {
                    const value = bonuses[key as keyof BonusModifiers]
                    if (!value || value === 0) return null
                    
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-white">{label}</span>
                          <p className="text-xs text-gray-500">{description}</p>
                        </div>
                        <span className="text-sm font-medium text-green-400">
                          +${value.toFixed(2)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="border-t border-gray-700/50 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-300">Total Bonuses</span>
                  <span className="text-sm font-semibold text-green-400">
                    +${totalBonuses.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
          
          {/* Total */}
          <div className="border-t border-gray-700/50 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">Total Earned</span>
              <span className="text-base font-bold text-green-400">
                ${(earningsData.total_earned || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

