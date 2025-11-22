'use client'

import { AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  isOpen: boolean
  onClose: () => void
  currentTier: string
  requiredTier: string
  maxSeats: number
  message?: string
}

export function UpgradePrompt({
  isOpen,
  onClose,
  currentTier,
  requiredTier,
  maxSeats,
  message,
}: UpgradePromptProps) {
  const router = useRouter()

  const tierNames: Record<string, string> = {
    starter: 'Starter',
    team: 'Team',
    enterprise: 'Enterprise',
  }

  const handleUpgrade = () => {
    onClose()
    if (requiredTier === 'enterprise') {
      router.push('/enterprise/signup')
    } else {
      router.push('/pricing')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card/95 dark:bg-black/95 border-border/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="text-foreground/70 font-sans">
            {message || `You need to upgrade to ${tierNames[requiredTier]} plan to add more seats.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">
                  Current Plan: {tierNames[currentTier]}
                </p>
                <p className="text-sm text-foreground/70 font-sans">
                  Maximum seats: {maxSeats}
                </p>
                <p className="font-medium text-emerald-400 mt-2">
                  Required Plan: {tierNames[requiredTier]}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Benefits of upgrading:</p>
            <ul className="text-sm text-foreground/70 font-sans space-y-1 list-disc list-inside">
              {requiredTier === 'team' && (
                <>
                  <li>Up to 100 seats (vs 20 on Starter)</li>
                  <li>Advanced analytics & reporting</li>
                  <li>Custom sales playbook</li>
                </>
              )}
              {requiredTier === 'enterprise' && (
                <>
                  <li>Up to 500+ seats</li>
                  <li>Custom AI personas</li>
                  <li>White-label options</li>
                  <li>Dedicated account team</li>
                </>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border/40"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
          >
            View Plans
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

