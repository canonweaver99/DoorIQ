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
  disabled = false,
}: PlanCardProps) {
  const config = tierConfig[tier]
  const Icon = config.icon
  const isCurrent = currentTier === tier

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
      {popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500/90 text-black border-0">
          <Star className="w-3 h-3 inline-block mr-1 fill-current" />
          {badge || 'Most Popular'}
        </Badge>
      )}

      {isCurrent && (
        <Badge className="absolute -top-3 right-4 bg-purple-500/90 text-white border-0">
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
        {onSelect && (
          <Button
            onClick={onSelect}
            disabled={disabled || isCurrent}
            className={cn(
              'w-full',
              isCurrent
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                : config.color === 'purple'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                  : config.color === 'emerald'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white'
            )}
          >
            {isCurrent ? 'Current Plan' : tier === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
          </Button>
        )}
      </div>
    </div>
  )
}

