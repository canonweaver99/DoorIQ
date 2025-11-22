'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, UserPlus } from 'lucide-react'

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
    <div className="p-6 border rounded-lg bg-white dark:bg-slate-900">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold">Team Seats</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {organization.seats_used} of {organization.seat_limit} seats used
          </p>
        </div>
        {onInviteClick && (
          <Button 
            onClick={onInviteClick}
            disabled={!canInvite}
            className={canInvite ? "" : "opacity-50 cursor-not-allowed"}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Rep +
          </Button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4">
        <div 
          className={`h-2 rounded-full transition-all ${
            utilizationPct > 90 ? 'bg-red-500' : 
            utilizationPct > 80 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`}
          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
        />
      </div>
      
      {utilizationPct > 80 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3 mb-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Running low on seats
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                You're using {Math.round(utilizationPct)}% of your available seats.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Current billing: ${monthlyCost.toLocaleString()}/month ({organization.seat_limit} seats × $69)
      </div>
    </div>
  )
}

