'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface DateRange {
  label: string
  value: string
}

const dateRanges: DateRange[] = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 14 days', value: '14d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'This month', value: 'month' },
  { label: 'Last month', value: 'last-month' },
  { label: 'This quarter', value: 'quarter' },
  { label: 'This year', value: 'year' }
]

interface DateRangePickerProps {
  value: string
  onChange: (value: string) => void
}

export default function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentRange = dateRanges.find(r => r.label === value) || dateRanges[0]

  const handleSelect = (range: DateRange) => {
    onChange(range.label)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 
                   bg-white/[0.02] border border-white/[0.08] rounded-xl
                   hover:border-white/[0.12] transition-all duration-200
                   text-white/70 hover:text-white text-sm min-w-[160px]"
      >
        <Calendar className="w-4 h-4" />
        <span className="flex-1 text-left">{currentRange.label}</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-48 p-2 
                       bg-[#0A0420] border border-white/[0.12] rounded-xl
                       shadow-2xl shadow-black/50 z-50"
            >
              {dateRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleSelect(range)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm
                    transition-all duration-150
                    ${range.label === value
                      ? 'bg-purple-500/20 text-purple-200'
                      : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }
                  `}
                >
                  {range.label}
                </button>
              ))}
            </motion.div>

            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

