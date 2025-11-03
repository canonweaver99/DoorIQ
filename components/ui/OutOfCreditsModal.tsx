"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, X, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OutOfCreditsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OutOfCreditsModal({ isOpen, onClose }: OutOfCreditsModalProps) {
  const router = useRouter()

  const handlePurchaseCredits = () => {
    router.push('/pricing')
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-xl animate-pulse" />
                  <CreditCard className="relative w-16 h-16 text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  You're Out of Credits
                </h2>
                <p className="text-gray-300 mb-4">
                  You've used all your free credits for this month. Purchase more credits to continue practicing with our AI homeowners and improving your sales skills.
                </p>

                {/* Benefits */}
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-semibold text-white">
                      Why Purchase Credits?
                    </span>
                  </div>
                  <ul className="text-left text-sm text-gray-300 space-y-1">
                    <li>• Unlimited practice with AI homeowners</li>
                    <li>• Real-time feedback on your performance</li>
                    <li>• Track your progress and improve</li>
                    <li>• Never miss a sale opportunity</li>
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handlePurchaseCredits}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" />
                  Purchase Credits
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2 px-6 rounded-xl transition-all border border-white/10"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

