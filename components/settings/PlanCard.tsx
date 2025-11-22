'use client'

import { CheckCircle2, Star, Building2, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PlanCardProps {
  tier: 'starter' | 'team' | 'enterprise'
  currentTier?: string
  pricePerSeat: number
  minSeats: number
  maxSeats: number
  features: string[]
  badge?: string
  popular?: boolean
  onSelect?: () => void
  onContactSales?: () => void
  disabled?: boolean
}

const tierConfig = {
  starter: {
    name: 'STARTER',
    icon: TrendingUp,
    color: 'purple',
  },
  team: {
    name: 'TEAM',
    icon: TrendingUp,
    color: 'emerald',
  },
  enterprise: {
    name: 'ENTERPRISE',
    icon: Building2,
    color: 'blue',
  },
}

export function PlanCard({
  tier,
  currentTier,
  pricePerSeat,
  minSeats,
  maxSeats,
  features,
  badge,
  popular,
  onSelect,
  onContactSales,
  disabled = false,
}: PlanCardProps) {
  const config = tierConfig[tier]
  const Icon = config.icon
  const isCurrent = currentTier === tier
  
  // Check if starter plan is unavailable (user is on higher tier)
  const isStarterUnavailable = tier === 'starter' && currentTier && 
    (currentTier === 'team' || currentTier === 'enterprise')

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-6 bg-card/60 dark:bg-black/60 transition-all',
        isCurrent
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
          : 'border-border/40 hover:border-border/60',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isCurrent && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500/90 text-white border-0">
          Current Plan
        </Badge>
      )}

        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center',
              config.color === 'purple' && 'bg-purple-500/20',
              config.color === 'emerald' && 'bg-emerald-500/20',
              config.color === 'blue' && 'bg-blue-500/20'
            )}>
              <Icon className={cn(
                'w-6 h-6',
                config.color === 'purple' && 'text-purple-400',
                config.color === 'emerald' && 'text-emerald-400',
                config.color === 'blue' && 'text-blue-400'
              )} />
            </div>
          <div>
            <h3 className="text-xl font-bold text-foreground font-space">{config.name}</h3>
            <p className="text-sm text-foreground/60 font-sans">
              {minSeats}-{maxSeats === 500 ? '500+' : maxSeats} reps
            </p>
          </div>
        </div>

        {/* Price */}
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-foreground font-mono">
              ${pricePerSeat}
            </span>
            <span className="text-sm text-foreground/60 font-sans">/month per rep</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <CheckCircle2 className={cn(
                'w-5 h-5 flex-shrink-0 mt-0.5',
                config.color === 'purple' && 'text-purple-400',
                config.color === 'emerald' && 'text-emerald-400',
                config.color === 'blue' && 'text-blue-400'
              )} />
              <span className="text-sm text-foreground font-sans">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        {(onSelect || onContactSales) && (
          <div className="space-y-2">
            <Button
              onClick={tier === 'enterprise' && onContactSales ? onContactSales : onSelect}
              disabled={disabled || isCurrent || isStarterUnavailable}
              className={cn(
                'w-full',
                isCurrent
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                  : isStarterUnavailable
                    ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] cursor-not-allowed opacity-50'
                    : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:border-[#3a3a3a]'
              )}
            >
              {isCurrent 
                ? 'Current Plan' 
                : isStarterUnavailable 
                  ? 'Unavailable'
                  : tier === 'enterprise' 
                    ? 'Contact Sales' 
                    : 'Upgrade'}
            </Button>
            {isStarterUnavailable && (
              <p className="text-xs text-foreground/60 font-sans text-center">
                * Unavailable due to excess in seats
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

