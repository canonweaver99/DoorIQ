'use client'

import { Users, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SeatManagerProps {
  seatsUsed: number
  seatLimit: number
  monthlyCost: number
  onInviteClick: () => void
  onUpgradeClick?: () => void
}

export function SeatManager({
  seatsUsed,
  seatLimit,
  monthlyCost,
  onInviteClick,
  onUpgradeClick,
}: SeatManagerProps) {
  const utilizationPct = seatLimit > 0 ? (seatsUsed / seatLimit) * 100 : 0
  const canInvite = seatsUsed < seatLimit
  const isWarning = utilizationPct > 80

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Team Seats
          </h3>
          <p className="text-gray-400 mt-1">
            {seatsUsed} of {seatLimit} seats used
          </p>
        </div>
        <Button
          onClick={onInviteClick}
          disabled={!canInvite}
          className={canInvite 
            ? "bg-purple-600 hover:bg-purple-700" 
            : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }
        >
          Invite Rep +
        </Button>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
        <div
          className={`h-3 rounded-full transition-all ${
            isWarning ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
        />
      </div>

      {/* Warning message */}
      {isWarning && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-200 text-sm font-semibold">
              Running low on seats
            </p>
            <p className="text-yellow-300 text-xs mt-1">
              You're using {utilizationPct.toFixed(0)}% of your seats. Consider upgrading your plan.
            </p>
            {onUpgradeClick && (
              <button
                onClick={onUpgradeClick}
                className="text-yellow-400 hover:text-yellow-300 underline text-xs mt-2"
              >
                Upgrade plan
              </button>
            )}
          </div>
        </div>
      )}

      {/* Billing info */}
      <div className="text-sm text-gray-400">
        Current billing: <span className="text-white font-semibold">${monthlyCost.toLocaleString()}/month</span>
        <span className="text-gray-500 ml-1">($69 × {seatLimit} seats)</span>
      </div>
    </div>
  )
}

