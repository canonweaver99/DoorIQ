'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Gift, Flame, Trophy, Sparkles, DollarSign, X } from 'lucide-react'
import { useDailyReward } from '@/hooks/useDailyReward'
import { useState } from 'react'
import confetti from 'canvas-confetti'

export default function DailyRewardBanner() {
  const { canClaim, currentStreak, currentBalance, loading, claimReward, claiming } = useDailyReward()
  const [showCelebration, setShowCelebration] = useState(false)
  const [rewardResult, setRewardResult] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  const handleClaim = async () => {
    const result = await claimReward()
    if (result?.success) {
      setRewardResult(result)
      setShowCelebration(true)
      
      // Trigger confetti
      const duration = 2000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        const particleCount = 50 * (timeLeft / duration)
        confetti({
          ...defaults,
          particleCount,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#9370DB']
        })
      }, 250)

      // Auto-hide celebration after 5 seconds
      setTimeout(() => {
        setShowCelebration(false)
      }, 5000)
    }
  }

  if (loading || dismissed || !canClaim) {
    return null
  }

  return (
    <>
      {/* Daily Reward Claim Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="relative overflow-hidden"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 animate-pulse" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-600/10 via-transparent to-transparent" />
        
        <div className="relative bg-gradient-to-r from-amber-600/30 via-orange-600/30 to-yellow-600/30 border border-amber-500/40 rounded-2xl p-6 backdrop-blur-sm">
          <button
            onClick={() => setDismissed(true)}
            className="absolute top-4 right-4 text-amber-200 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-4">
              {/* Animated gift icon */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatDelay: 3
                }}
                className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/30"
              >
                <Gift className="w-8 h-8 text-white" />
              </motion.div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-white">
                    Daily Reward Ready!
                  </h3>
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                </div>
                <p className="text-amber-100 text-sm mb-2">
                  Claim your <span className="font-bold text-yellow-300">$25</span> daily bonus
                  {currentStreak > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="font-semibold text-orange-300">{currentStreak} day streak</span>
                    </span>
                  )}
                </p>
                {currentStreak >= 2 && currentStreak < 7 && (
                  <p className="text-xs text-amber-200 flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    {7 - currentStreak} more days until $50 week bonus!
                  </p>
                )}
                {currentStreak >= 7 && (
                  <p className="text-xs text-yellow-200 flex items-center gap-1 font-semibold">
                    <Trophy className="w-3 h-3" />
                    Week streak! Claim for $75 total today! 🔥
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-xs text-amber-200 mb-1">Current Balance</div>
                <div className="text-2xl font-bold text-white flex items-center gap-1">
                  <DollarSign className="w-5 h-5 text-yellow-300" />
                  {currentBalance.toFixed(0)}
                </div>
              </div>

              <motion.button
                onClick={handleClaim}
                disabled={claiming}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-amber-400 hover:to-orange-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {claiming ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </motion.div>
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Claim Reward
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && rewardResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="relative max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/40 to-orange-500/40 rounded-3xl blur-2xl" />
              
              <div className="relative bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900 rounded-2xl p-8 border border-amber-500/50 shadow-2xl">
                <button
                  onClick={() => setShowCelebration(false)}
                  className="absolute top-4 right-4 text-amber-200 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center space-y-6">
                  {/* Animated reward icon */}
                  <motion.div
                    animate={{
                      rotate: [0, 360],
                      scale: [1, 1.2, 1]
                    }}
                    transition={{ duration: 1 }}
                    className="flex items-center justify-center w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-orange-500 rounded-full shadow-2xl shadow-amber-500/50"
                  >
                    <DollarSign className="w-16 h-16 text-white" />
                  </motion.div>

                  <div>
                    <h2 className="text-4xl font-bold text-white mb-2">
                      ${rewardResult.reward}
                    </h2>
                    <p className="text-amber-200 text-lg mb-1">
                      {rewardResult.message}
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <div className="flex items-center gap-2 text-orange-300">
                        <Flame className="w-5 h-5" />
                        <span className="font-semibold">{rewardResult.streak} Day Streak</span>
                      </div>
                      {rewardResult.isStreakBonus && (
                        <div className="flex items-center gap-2 text-yellow-300">
                          <Trophy className="w-5 h-5" />
                          <span className="font-semibold">Bonus!</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/10 border border-white/20 rounded-xl p-4 backdrop-blur-sm">
                    <div className="text-sm text-amber-200 mb-1">New Balance</div>
                    <div className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                      <DollarSign className="w-6 h-6 text-yellow-300" />
                      {rewardResult.newBalance.toFixed(0)}
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCelebration(false)}
                    className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg"
                  >
                    Awesome! 🎉
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

