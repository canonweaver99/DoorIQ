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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Seat Limit</DialogTitle>
          <DialogDescription>
            Change the number of seats for this organization. This will update your Stripe subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="seats">Number of Seats</Label>
            <Input
              id="seats"
              type="number"
              min={organization.seats_used}
              max={1000}
              value={newSeats}
              onChange={(e) => setNewSeats(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum: {organization.seats_used} seats (current usage)
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Current monthly cost:</span>
              <span className="font-medium">${(organization.seat_limit * 69).toLocaleString()}/month</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">New monthly cost:</span>
              <span className="font-medium">${newMonthlyCost.toLocaleString()}/month</span>
            </div>
            {priceDiff !== 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-slate-700">
                <span className="text-gray-600 dark:text-gray-400">Change:</span>
                <span className={`font-medium ${priceDiff > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {priceDiff > 0 ? '+' : ''}${priceDiff.toLocaleString()}/month
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading || newSeats === organization.seat_limit}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Seats
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

