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
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 md:pt-24 pb-20 sm:pb-12 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white mb-1 sm:mb-2 font-space">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-[#a0a0a0] font-sans">
            Manage your account, billing, team, and preferences
          </p>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-8">
          {/* Sidebar Navigation - Hidden on mobile, shown on desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <SettingsSidebar />
            </div>
          </aside>

          {/* Mobile Navigation - Horizontal scroll on mobile */}
          <div className="md:hidden -mx-4 px-4 mb-4">
            <SettingsSidebar />
          </div>

          {/* Main Content - Centered Single Column */}
          <main className="flex-1 max-w-[800px] w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

