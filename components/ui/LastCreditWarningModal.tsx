"use client"

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LastCreditWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onContinue: () => void
}

export function LastCreditWarningModal({ isOpen, onClose, onContinue }: LastCreditWarningModalProps) {
  const router = useRouter()

  const handleGetDiscount = () => {
    router.push('/pricing?discount=LASTCREDIT20')
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
              className="relative bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-purple-500/30 rounded-2xl shadow-2xl max-w-md w-full p-6"
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
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                  <AlertTriangle className="relative w-16 h-16 text-yellow-400" />
                </div>
              </div>

              {/* Content */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Last Credit Warning!
                </h2>
                <p className="text-gray-300 mb-4">
                  You're about to use your <span className="font-semibold text-yellow-400">last free credit</span>. After this session, you'll need to purchase more credits to continue practicing.
                </p>

                {/* Discount offer */}
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-lg font-semibold text-white">
                      Special Offer Just For You!
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">
                    Since you've enjoyed DoorIQ enough to use all your credits, we're offering you a <span className="font-bold text-purple-400">20% discount</span> on your next credit purchase!
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleGetDiscount}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30"
                >
                  Get 20% Discount
                </button>
                <button
                  onClick={onContinue}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all border border-white/10"
                >
                  Continue Anyway
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

