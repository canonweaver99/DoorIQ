'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Play, MessageSquare, Zap, Target, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

export default function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { icon: Play, label: 'Start Training', href: '/trainer', color: 'from-purple-500 to-indigo-500' },
    { icon: MessageSquare, label: 'View Last Feedback', href: '/analytics', color: 'from-blue-500 to-cyan-500' },
    { icon: Zap, label: 'Quick Practice', href: '/trainer/quick', color: 'from-amber-500 to-orange-500' },
    { icon: Target, label: "Today's Challenge", href: '/dashboard?tab=learning', color: 'from-green-500 to-emerald-500' },
  ]

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 space-y-3 mb-2"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={action.href}
                  className="group flex items-center gap-3 bg-[#1e1e30] border border-white/10 rounded-full px-4 py-3 hover:border-purple-500/50 transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <div className={`p-2 bg-gradient-to-br ${action.color} rounded-full`}>
                    <action.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-white whitespace-nowrap pr-2">
                    {action.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 transition-shadow duration-300"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Plus className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>
    </div>
  )
}

