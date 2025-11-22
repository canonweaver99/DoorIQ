'use client'

import { useState } from 'react'
import { Users, Plus, Minus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SeatCounterProps {
  currentSeats: number
  seatsUsed: number
  seatLimit: number
  planTier: string
  onAddSeats: (seats: number) => Promise<void>
  onRemoveSeats: (seats: number) => Promise<void>
  disabled?: boolean
}

export function SeatCounter({
  currentSeats,
  seatsUsed,
  seatLimit,
  planTier,
  onAddSeats,
  onRemoveSeats,
  disabled = false,
}: SeatCounterProps) {
  const [seatsToAdd, setSeatsToAdd] = useState(1)
  const [seatsToRemove, setSeatsToRemove] = useState(1)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(false)

  const handleAdd = async () => {
    if (seatsToAdd <= 0) return
    setAdding(true)
    try {
      await onAddSeats(seatsToAdd)
      setSeatsToAdd(1)
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async () => {
    if (seatsToRemove <= 0) return
    setRemoving(true)
    try {
      await onRemoveSeats(seatsToRemove)
      setSeatsToRemove(1)
    } finally {
      setRemoving(false)
    }
  }

  const maxSeats = planTier === 'starter' ? 20 : planTier === 'team' ? 100 : 500
  const canAdd = currentSeats < maxSeats
  const canRemove = currentSeats > seatsUsed && currentSeats > 1

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-background/30 border border-border/40">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-purple-400" />
          <div>
            <p className="font-medium text-foreground">Seats</p>
            <p className="text-sm text-foreground/60 font-sans">
              {seatsUsed} of {currentSeats} used
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground font-space">{currentSeats}</p>
          <p className="text-xs text-foreground/50 font-sans">Total seats</p>
        </div>
      </div>

      {/* Add Seats */}
      {canAdd && (
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Plus className="w-5 h-5 text-emerald-400" />
            <p className="font-medium text-foreground">Add Seats</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSeatsToAdd(Math.max(1, seatsToAdd - 1))}
              disabled={disabled || adding || seatsToAdd <= 1}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              min="1"
              max={maxSeats - currentSeats}
              value={seatsToAdd}
              onChange={(e) => setSeatsToAdd(Math.max(1, Math.min(maxSeats - currentSeats, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 text-center rounded-lg border border-emerald-500/30 bg-background/50 text-foreground font-medium"
              disabled={disabled || adding}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSeatsToAdd(Math.min(maxSeats - currentSeats, seatsToAdd + 1))}
              disabled={disabled || adding || seatsToAdd >= maxSeats - currentSeats}
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleAdd}
              disabled={disabled || adding || seatsToAdd <= 0}
              className="ml-auto bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {adding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add {seatsToAdd} Seat{seatsToAdd !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Remove Seats */}
      {canRemove && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Minus className="w-5 h-5 text-red-400" />
            <p className="font-medium text-foreground">Remove Seats</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSeatsToRemove(Math.max(1, seatsToRemove - 1))}
              disabled={disabled || removing || seatsToRemove <= 1}
              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <Minus className="w-4 h-4" />
            </Button>
            <input
              type="number"
              min="1"
              max={currentSeats - seatsUsed}
              value={seatsToRemove}
              onChange={(e) => setSeatsToRemove(Math.max(1, Math.min(currentSeats - seatsUsed, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 text-center rounded-lg border border-red-500/30 bg-background/50 text-foreground font-medium"
              disabled={disabled || removing}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSeatsToRemove(Math.min(currentSeats - seatsUsed, seatsToRemove + 1))}
              disabled={disabled || removing || seatsToRemove >= currentSeats - seatsUsed}
              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleRemove}
              disabled={disabled || removing || seatsToRemove <= 0}
              className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
            >
              {removing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Minus className="w-4 h-4 mr-2" />
                  Remove {seatsToRemove} Seat{seatsToRemove !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {!canAdd && !canRemove && (
        <p className="text-sm text-foreground/60 text-center font-sans">
          {currentSeats >= maxSeats
            ? `Maximum seats reached for ${planTier} plan`
            : 'No seats available to remove'}
        </p>
      )}
    </div>
  )
}

