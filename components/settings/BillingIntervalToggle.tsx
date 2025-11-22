'use client'

import { useState } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface BillingIntervalToggleProps {
  currentInterval: 'monthly' | 'annual'
  onSwitch: (interval: 'monthly' | 'annual') => Promise<void>
  disabled?: boolean
}

export function BillingIntervalToggle({
  currentInterval,
  onSwitch,
  disabled = false,
}: BillingIntervalToggleProps) {
  const [switching, setSwitching] = useState(false)

  const handleSwitch = async (interval: 'monthly' | 'annual') => {
    if (interval === currentInterval || disabled || switching) return

    setSwitching(true)
    try {
      await onSwitch(interval)
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSwitching(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-purple-400" />
        <span className="text-sm font-medium text-foreground">Billing Period</span>
      </div>
      
      <div className="relative inline-flex items-center bg-background/30 rounded-lg p-1 border border-border/40">
        <button
          onClick={() => handleSwitch('monthly')}
          disabled={disabled || switching}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            currentInterval === 'monthly'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'text-white hover:text-white/80',
            (disabled || switching) && 'opacity-50 cursor-not-allowed'
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => handleSwitch('annual')}
          disabled={disabled || switching}
          className={cn(
            'px-4 py-2 rounded-md text-sm font-medium transition-all relative',
            currentInterval === 'annual'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'text-white hover:text-white/80',
            (disabled || switching) && 'opacity-50 cursor-not-allowed'
          )}
        >
          Annual
          {currentInterval === 'annual' && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-emerald-500 text-black rounded-full">
              2M FREE
            </span>
          )}
        </button>
      </div>

      {switching && (
        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
      )}
    </div>
  )
}

