'use client'

import { useState } from 'react'
import { AlertTriangle, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CancelSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (cancelImmediately: boolean) => Promise<void>
  currentPeriodEnd?: string | null
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  currentPeriodEnd,
}: CancelSubscriptionModalProps) {
  const [canceling, setCanceling] = useState(false)
  const [cancelImmediately, setCancelImmediately] = useState(false)

  const handleConfirm = async () => {
    setCanceling(true)
    try {
      await onConfirm(cancelImmediately)
      onClose()
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setCanceling(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 dark:bg-black/95 border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription className="text-foreground/70 font-sans">
            Are you sure you want to cancel your subscription?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400 font-sans mb-2">
              <strong>What happens when you cancel:</strong>
            </p>
            <ul className="text-sm text-foreground/80 font-sans space-y-1 list-disc list-inside">
              <li>You'll lose access to premium features</li>
              <li>Your team members will lose access</li>
              <li>All data will be retained for 30 days</li>
              {currentPeriodEnd && !cancelImmediately && (
                <li>You'll have access until {formatDate(currentPeriodEnd)}</li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border/40 cursor-pointer hover:bg-background/30">
              <input
                type="radio"
                checked={!cancelImmediately}
                onChange={() => setCancelImmediately(false)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-foreground">Cancel at Period End</p>
                <p className="text-sm text-foreground/60 font-sans">
                  Keep access until {currentPeriodEnd ? formatDate(currentPeriodEnd) : 'end of billing period'}
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-border/40 cursor-pointer hover:bg-background/30">
              <input
                type="radio"
                checked={cancelImmediately}
                onChange={() => setCancelImmediately(true)}
                className="mt-1"
              />
              <div>
                <p className="font-medium text-foreground">Cancel Immediately</p>
                <p className="text-sm text-foreground/60 font-sans">
                  Lose access right away (no refund)
                </p>
              </div>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={canceling}
            className="border-border/40"
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={canceling}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
          >
            {canceling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Canceling...
              </>
            ) : (
              'Cancel Subscription'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

