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
  
  // Check if team plan is unavailable (user is on enterprise tier - can't downgrade)
  const isTeamUnavailable = tier === 'team' && currentTier === 'enterprise'
  
  // Determine if plan is unavailable
  const isUnavailable = isStarterUnavailable || isTeamUnavailable

  return (
    <div
      className={cn(
        'relative rounded-xl border-2 p-4 sm:p-6 bg-card/60 dark:bg-black/60 transition-all flex flex-col h-full w-full',
        isCurrent
          ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/10'
          : 'border-border/40 hover:border-border/60',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {isCurrent && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500/90 text-white border-0 text-xs px-2 py-0.5">
          Current Plan
        </Badge>
      )}

      <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            config.color === 'purple' && 'bg-purple-500/20',
            config.color === 'emerald' && 'bg-emerald-500/20',
            config.color === 'blue' && 'bg-blue-500/20'
          )}>
            <Icon className={cn(
              'w-5 h-5 sm:w-6 sm:h-6',
              config.color === 'purple' && 'text-purple-400',
              config.color === 'emerald' && 'text-emerald-400',
              config.color === 'blue' && 'text-blue-400'
            )} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-foreground font-space">{config.name}</h3>
            <p className="text-xs sm:text-sm text-foreground/60 font-sans">
              {minSeats}-{maxSeats === 500 ? '500+' : maxSeats} reps
            </p>
          </div>
        </div>

        {/* Price */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1">
            <span className="text-2xl sm:text-3xl font-black text-foreground font-mono">
              ${pricePerSeat}
            </span>
            <span className="text-xs sm:text-sm text-foreground/60 font-sans">/month per rep</span>
          </div>
        </div>

        {/* Features */}
        <ul className="space-y-2 sm:space-y-2.5 flex-1">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 sm:gap-2.5">
              <CheckCircle2 className={cn(
                'w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5',
                config.color === 'purple' && 'text-purple-400',
                config.color === 'emerald' && 'text-emerald-400',
                config.color === 'blue' && 'text-blue-400'
              )} />
              <span className="text-xs sm:text-sm text-foreground font-sans leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA - Always at bottom */}
        <div className="mt-auto pt-3 sm:pt-4">
          {(onSelect || onContactSales) && (
            <div className="space-y-2">
              <Button
                onClick={tier === 'enterprise' && onContactSales ? onContactSales : onSelect}
                disabled={disabled || isCurrent || isUnavailable}
                className={cn(
                  'w-full min-h-[48px] sm:min-h-[40px] h-auto py-3 sm:py-2 text-sm sm:text-base',
                  'touch-manipulation active:scale-95',
                  isCurrent
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                    : isUnavailable
                      ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-[#666] cursor-not-allowed opacity-50'
                      : 'bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#2a2a2a] hover:border-[#3a3a3a]'
                )}
              >
                {isCurrent 
                  ? 'Current Plan' 
                  : isUnavailable 
                    ? 'Unavailable'
                    : tier === 'enterprise' 
                      ? 'Contact Sales' 
                      : tier === 'team' && currentTier === 'starter'
                        ? 'Upgrade'
                        : 'Unavailable'}
              </Button>
              {isUnavailable && (
                <p className="text-xs text-foreground/60 font-sans text-center px-2">
                  * Unavailable due to excess in seats
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

