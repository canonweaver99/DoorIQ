'use client'

import { useState, useEffect } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { LeverSwitch } from '@/components/ui/lever-switch'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface CoachModeToggleProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  challengeModeEnabled?: boolean
  disabled?: boolean
}

export function CoachModeToggle({
  enabled,
  onToggle,
  challengeModeEnabled = false,
  disabled = false
}: CoachModeToggleProps) {
  const isMobile = useIsMobile()
  const [isToggling, setIsToggling] = useState(false)

  // Disable coach mode if challenge mode is enabled
  useEffect(() => {
    if (challengeModeEnabled && enabled) {
      onToggle(false)
    }
  }, [challengeModeEnabled, enabled, onToggle])

  const handleToggle = async (newValue: boolean) => {
    if (disabled || challengeModeEnabled || isToggling) return

    setIsToggling(true)
    try {
      await onToggle(newValue)
    } finally {
      setIsToggling(false)
    }
  }

  const isDisabled = disabled || challengeModeEnabled

  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg",
      "bg-white/5 border border-white/10",
      isDisabled && "opacity-50"
    )}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Sparkles className={cn(
          "w-5 h-5 flex-shrink-0",
          enabled && !isDisabled ? "text-purple-400" : "text-white/40"
        )} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-medium text-sm",
              enabled && !isDisabled ? "text-white" : "text-white/60"
            )}>
              Coach Mode
            </span>
            {challengeModeEnabled && (
              <div className="flex items-center gap-1 text-xs text-orange-400">
                <AlertCircle className="w-3 h-3" />
                <span>Disabled (Challenge Mode active)</span>
              </div>
            )}
          </div>
          <p className="text-xs text-white/50 truncate">
            Real-time script suggestions during practice
          </p>
        </div>
      </div>
      <LeverSwitch
        checked={enabled && !isDisabled}
        onChange={handleToggle}
        disabled={isDisabled}
      />
    </div>
  )
}
