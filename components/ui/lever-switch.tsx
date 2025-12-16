'use client'

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface LeverSwitchProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function LeverSwitch({ 
  checked = false, 
  onChange, 
  disabled = false,
  className 
}: LeverSwitchProps) {
  const [isChecked, setIsChecked] = useState(checked)

  useEffect(() => {
    setIsChecked(checked)
  }, [checked])

  const handleToggle = () => {
    if (disabled) return
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange?.(newValue)
  }

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Fire effect when enabled */}
      <AnimatePresence>
        {isChecked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute -inset-4 pointer-events-none"
          >
            {/* Fire particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-gradient-to-t from-orange-500 via-red-500 to-yellow-400"
                initial={{ 
                  x: '50%',
                  y: '50%',
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  x: `${50 + (Math.random() - 0.5) * 100}%`,
                  y: `${50 + (Math.random() - 0.5) * 100}%`,
                  opacity: [0, 1, 0.8, 0],
                  scale: [0, 1.2, 0.8, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
                style={{
                  filter: 'blur(2px)',
                }}
              />
            ))}
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-to-t from-orange-500/30 via-red-500/20 to-yellow-400/30 blur-xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Container */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center justify-center w-20 h-10 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black",
          isChecked ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-slate-700",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        role="switch"
        aria-checked={isChecked}
      >
        {/* Toggle Base */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-300",
            isChecked ? "bg-gradient-to-r from-orange-400/20 to-red-400/20" : "bg-slate-800/50"
          )} />
        </div>

        {/* Toggle Handle */}
        <motion.div
          className="relative z-10"
          animate={{
            x: isChecked ? 20 : -20,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          <div className="relative w-8 h-8">
            {/* Handle Knob */}
            <div className={cn(
              "absolute inset-0 rounded-full shadow-lg transition-all duration-300",
              isChecked 
                ? "bg-gradient-to-br from-yellow-200 via-orange-300 to-red-400" 
                : "bg-white"
            )}>
              {/* Handle Bar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                  "w-0.5 h-3 rounded-full transition-all duration-300",
                  isChecked ? "bg-orange-600" : "bg-slate-400"
                )} />
              </div>
              {/* Fire glow on handle when enabled */}
              {isChecked && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/50 to-orange-500/50 blur-sm"
                  animate={{
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      </button>
    </div>
  )
}



