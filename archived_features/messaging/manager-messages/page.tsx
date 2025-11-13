'use client'

import { motion } from 'framer-motion'
import MessagingCenter from '@/components/manager/MessagingCenter'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ManagerMessagesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1e1e30]/50 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/manager" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-sm text-slate-400">Communicate with your reps</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Component */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <MessagingCenter />
        </motion.div>
      </div>
    </div>
  )
}
