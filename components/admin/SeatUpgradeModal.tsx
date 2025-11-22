'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface SeatUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: {
    id: string
    seat_limit: number
    seats_used: number
  }
  onUpdate: (newSeatLimit: number) => Promise<void>
}

export function SeatUpgradeModal({ 
  open, 
  onOpenChange, 
  organization, 
  onUpdate 
}: SeatUpgradeModalProps) {
  const [newSeats, setNewSeats] = useState(organization.seat_limit)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const priceDiff = (newSeats - organization.seat_limit) * 69
  const newMonthlyCost = newSeats * 69

  const handleUpdate = async () => {
    if (newSeats < organization.seats_used) {
      setError(`Cannot set seats below current usage (${organization.seats_used} seats)`)
      return
    }

    if (newSeats === organization.seat_limit) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      await onUpdate(newSeats)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to update seats')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="batcave-bg-secondary neon-border-glow">
        <DialogHeader>
          <DialogTitle className="text-cyan-neon neon-text font-mono uppercase tracking-wider">
            UPDATE SEAT LIMIT
          </DialogTitle>
          <DialogDescription className="text-gray-500 font-mono">
            CHANGE THE NUMBER OF SEATS FOR THIS ORGANIZATION. THIS WILL UPDATE YOUR STRIPE SUBSCRIPTION.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="seats" className="text-gray-400 font-mono uppercase text-sm">NUMBER OF SEATS</Label>
            <Input
              id="seats"
              type="number"
              min={organization.seats_used}
              max={1000}
              value={newSeats}
              onChange={(e) => setNewSeats(parseInt(e.target.value) || 0)}
              className="mt-1 batcave-bg-tertiary neon-border text-white font-mono focus:neon-border-glow"
            />
            <p className="text-xs text-gray-500 mt-1 font-mono">
              MINIMUM: {organization.seats_used} SEATS (CURRENT USAGE)
            </p>
          </div>

          <div className="batcave-bg-tertiary neon-border rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm font-mono">
              <span className="text-gray-500">CURRENT MONTHLY COST:</span>
              <span className="font-medium text-white data-display">${(organization.seat_limit * 69).toLocaleString()}/MONTH</span>
            </div>
            <div className="flex justify-between text-sm font-mono">
              <span className="text-gray-500">NEW MONTHLY COST:</span>
              <span className="font-medium text-cyan-neon neon-text data-display">${newMonthlyCost.toLocaleString()}/MONTH</span>
            </div>
            {priceDiff !== 0 && (
              <div className="flex justify-between text-sm pt-2 border-t neon-border">
                <span className="text-gray-500 font-mono">CHANGE:</span>
                <span className={`font-medium font-mono data-display ${priceDiff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {priceDiff > 0 ? '+' : ''}${priceDiff.toLocaleString()}/MONTH
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 neon-border rounded p-3">
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="neon-border bg-black text-gray-400 hover:text-cyan-neon hover:border-cyan-500 font-mono uppercase tracking-wider"
            >
              CANCEL
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading || newSeats === organization.seat_limit}
              className="neon-border-glow bg-black text-cyan-neon border-cyan-500 hover:neon-glow font-mono uppercase tracking-wider"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              UPDATE SEATS
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

