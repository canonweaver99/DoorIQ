'use client'

import { SettingsSidebar } from './SettingsSidebar'
import { motion } from 'framer-motion'

export function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#000000]">
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

        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-24">
              <SettingsSidebar />
            </div>
          </aside>

          {/* Main Content - Centered Single Column */}
          <main className="flex-1 max-w-[800px]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

