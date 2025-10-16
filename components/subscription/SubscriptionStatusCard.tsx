'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Crown, Calendar, CreditCard, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '@/components/ui/skeleton'

export function SubscriptionStatusCard() {
  const subscription = useSubscription()

  if (subscription.loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </Card>
    )
  }

  const getStatusInfo = () => {
    if (subscription.isTrialing) {
      return {
        icon: Crown,
        title: 'Free Trial Active',
        description: `You have ${subscription.daysRemainingInTrial || 0} days remaining in your trial`,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10'
      }
    }

    if (subscription.hasActiveSubscription) {
      return {
        icon: Crown,
        title: 'Premium Active',
        description: 'You have full access to all features',
        color: 'text-green-500',
        bgColor: 'bg-green-500/10'
      }
    }

    if (subscription.isPastDue) {
      return {
        icon: AlertCircle,
        title: 'Payment Issue',
        description: 'Please update your payment method',
        color: 'text-red-500',
        bgColor: 'bg-red-500/10'
      }
    }

    return {
      icon: CreditCard,
      title: 'Free Plan',
      description: 'Upgrade to unlock all features',
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10'
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{statusInfo.title}</h3>
            <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
          </div>
        </div>
      </div>

      {subscription.hasActiveSubscription && (
        <div className="space-y-2 mb-4 pt-4 border-t">
          {subscription.trialEndsAt && subscription.isTrialing && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Trial Ends
              </span>
              <span className="font-medium">{formatDate(subscription.trialEndsAt)}</span>
            </div>
          )}
          {subscription.currentPeriodEnd && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {subscription.cancelAtPeriodEnd ? 'Cancels On' : 'Renews On'}
              </span>
              <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <Link href="/billing" className="flex-1">
          <Button variant="outline" className="w-full">
            Manage Subscription
          </Button>
        </Link>
        {!subscription.hasActiveSubscription && (
          <Link href="/pricing" className="flex-1">
            <Button className="w-full">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade
            </Button>
          </Link>
        )}
      </div>
    </Card>
  )
}

