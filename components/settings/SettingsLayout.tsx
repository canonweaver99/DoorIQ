'use client'

import Link from 'next/link'
import { Home } from 'lucide-react'
import { motion } from 'framer-motion'

export function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#000000] relative">
      {/* Home Button in Corner */}
      <Link
        href="/dashboard"
        className="fixed top-4 right-4 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a]/80 transition-all duration-200"
      >
        <Home className="w-5 h-5" />
      </Link>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2 font-space">
            Settings
          </h1>
          <p className="text-base text-[#a0a0a0] font-sans">
            Manage your account, billing, team, and preferences
          </p>
        </motion.div>

        {/* Main Content - Centered Single Column */}
        <main className="max-w-[800px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

