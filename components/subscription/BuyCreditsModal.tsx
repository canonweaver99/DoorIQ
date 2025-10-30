'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, Zap, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface BuyCreditsModalProps {
  isOpen: boolean
  onClose: () => void
  currentCredits?: number
  onCreditsPurchased?: () => void
}

const CREDIT_PACKAGES = [
  { credits: 10, price: 5, popular: false },
  { credits: 25, price: 10, popular: true },
  { credits: 50, price: 18, popular: false },
  { credits: 100, price: 30, popular: false },
]

export function BuyCreditsModal({ 
  isOpen, 
  onClose, 
  currentCredits = 0,
  onCreditsPurchased 
}: BuyCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handlePurchase = async (credits: number) => {
    setLoading(`${credits}`)
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Failed to start checkout')
        setLoading(null)
        return
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Purchase error:', error)
      alert('Failed to start checkout. Please try again.')
      setLoading(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="h-6 w-6 text-purple-500" />
            Purchase Extra Credits
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            You're running low on credits. Purchase extra credits to continue practicing with our AI training agents.
            {currentCredits > 0 && (
              <span className="block mt-2 text-sm">
                You currently have <strong>{currentCredits} credits</strong> remaining.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CREDIT_PACKAGES.map((pkg) => {
              const pricePerCredit = (pkg.price / pkg.credits).toFixed(2)
              const isPopular = pkg.popular
              
              return (
                <div
                  key={pkg.credits}
                  className={`relative p-6 rounded-lg border-2 transition-all ${
                    isPopular
                      ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                      BEST VALUE
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-1">{pkg.credits}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">credits</div>
                    <div className="text-2xl font-bold mb-1">${pkg.price}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      ${pricePerCredit} per credit
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(pkg.credits)}
                      disabled={loading !== null}
                      className={`w-full ${
                        isPopular
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : ''
                      }`}
                      size="lg"
                    >
                      {loading === `${pkg.credits}` ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Purchase
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-semibold mb-1">Credits never expire!</p>
                <p>Purchased credits are added to your account immediately and reset at the start of each month with your subscription credits.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

