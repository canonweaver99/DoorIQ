'use client'

import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Rep {
  id: string
  name: string
  avatar?: string
}

interface RepComparisonProps {
  availableReps: Rep[]
  selectedReps: string[]
  onSelectionChange: (repIds: string[]) => void
  maxSelection?: number
}

export default function RepComparison({
  availableReps,
  selectedReps,
  onSelectionChange,
  maxSelection = 4
}: RepComparisonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleRep = (repId: string) => {
    if (selectedReps.includes(repId)) {
      onSelectionChange(selectedReps.filter(id => id !== repId))
    } else if (selectedReps.length < maxSelection) {
      onSelectionChange([...selectedReps, repId])
    }
  }

  const removeRep = (repId: string) => {
    onSelectionChange(selectedReps.filter(id => id !== repId))
  }

  const selectedRepNames = selectedReps
    .map(id => availableReps.find(r => r.id === id)?.name)
    .filter(Boolean)

  return (
    <div className="relative">
      {/* Selected reps display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 
                   bg-white/[0.02] border border-white/[0.08] rounded-xl
                   hover:border-white/[0.12] transition-all duration-200"
      >
        <div className="flex-1 min-w-0">
          {selectedReps.length === 0 ? (
            <span className="text-white/50 text-sm">Select reps to compare...</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedReps.slice(0, 2).map(repId => {
                const rep = availableReps.find(r => r.id === repId)
                return (
                  <span
                    key={repId}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg
                             bg-purple-500/20 text-purple-200 text-xs"
                  >
                    {rep?.name}
                  </span>
                )
              })}
              {selectedReps.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 rounded-lg
                               bg-white/5 text-white/60 text-xs">
                  +{selectedReps.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/50 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 p-2 
                       bg-[#0A0420] border border-white/[0.12] rounded-xl
                       shadow-2xl shadow-black/50"
          >
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {availableReps.map(rep => {
                const isSelected = selectedReps.includes(rep.id)
                const isDisabled = !isSelected && selectedReps.length >= maxSelection

                return (
                  <button
                    key={rep.id}
                    onClick={() => !isDisabled && toggleRep(rep.id)}
                    disabled={isDisabled}
                    className={`
                      w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-150
                      ${isSelected 
                        ? 'bg-purple-500/20 text-purple-200' 
                        : isDisabled
                        ? 'text-white/30 cursor-not-allowed'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {rep.avatar ? (
                        <img
                          src={rep.avatar}
                          alt={rep.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 
                                      flex items-center justify-center text-white text-xs font-medium">
                          {rep.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-medium">{rep.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-purple-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {selectedReps.length >= maxSelection && (
              <div className="mt-2 pt-2 border-t border-white/[0.08]">
                <p className="text-xs text-white/50 text-center">
                  Maximum {maxSelection} reps selected
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

