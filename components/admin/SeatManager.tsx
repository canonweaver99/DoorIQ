'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SeatManagerProps {
  organization: {
    id: string
    seat_limit: number
    seats_used: number
    plan_tier?: string
  }
  onInviteClick?: () => void
}

export function SeatManager({ organization, onInviteClick }: SeatManagerProps) {
  const canInvite = organization.seats_used < organization.seat_limit
  const utilizationPct = organization.seat_limit > 0 
    ? (organization.seats_used / organization.seat_limit) * 100 
    : 0
  
  const monthlyCost = organization.seat_limit * 69

  return (
    <div className="p-6 neon-border rounded-lg holographic-card">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-cyan-neon neon-text font-mono">TEAM SEATS</h3>
          <p className="text-gray-500 font-mono text-sm">
            {organization.seats_used} OF {organization.seat_limit} SEATS USED
          </p>
        </div>
        {onInviteClick && (
          <Button 
            onClick={onInviteClick}
            disabled={!canInvite}
            className={cn(
              "neon-border font-mono uppercase tracking-wider",
              canInvite 
                ? "bg-black text-cyan-neon hover:neon-border-glow border-cyan-500" 
                : "opacity-50 cursor-not-allowed bg-black text-gray-600 border-gray-700"
            )}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            INVITE REP +
          </Button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-800 neon-border rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all ${
            utilizationPct > 90 ? 'bg-red-500 neon-glow' : 
            utilizationPct > 80 ? 'bg-yellow-500' : 
            'bg-cyan-500 neon-glow'
          }`}
          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
        />
      </div>
      
      {utilizationPct > 80 && (
        <div className="bg-yellow-500/20 border border-yellow-500/50 neon-border rounded p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-400 font-mono uppercase">
                RUNNING LOW ON SEATS
              </h4>
              <p className="text-sm text-yellow-300 mt-1 font-mono">
                YOU'RE USING {Math.round(utilizationPct)}% OF YOUR AVAILABLE SEATS.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-500 font-mono">
        CURRENT BILLING: ${monthlyCost.toLocaleString()}/MONTH ({organization.seat_limit} SEATS × $69)
      </div>
    </div>
  )
}

