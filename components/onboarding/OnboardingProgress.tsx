'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface OnboardingStep {
  id: string
  title: string
  description?: string
}

interface OnboardingProgressProps {
  steps: OnboardingStep[]
  currentStep: number
  className?: string
}

export function OnboardingProgress({ steps, currentStep, className }: OnboardingProgressProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Desktop: horizontal progress */}
      <div className="hidden md:flex items-start justify-center gap-2">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep

          return (
            <div key={step.id} className="flex items-start">
              {/* Step indicator */}
              <div className="flex flex-col items-center relative">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative z-10',
                    isCompleted && 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white',
                    isCurrent && 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white ring-4 ring-purple-500/30',
                    isPending && 'bg-white/[0.06] text-white/40 border-2 border-white/12'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors max-w-[80px] text-center',
                    isCompleted && 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400',
                    isCurrent && 'text-white',
                    isPending && 'text-white/40'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line - centered with circle */}
              {index < steps.length - 1 && (
                <div className="flex items-center mx-2 h-10">
                  <div
                    className={cn(
                      'w-16 h-0.5 transition-colors',
                      index < currentStep ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500' : 'bg-white/20'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile: simple step counter */}
      <div className="md:hidden flex items-center justify-center gap-3">
        <div className="flex items-center gap-1.5">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                index < currentStep && 'bg-purple-600',
                index === currentStep && 'bg-purple-500 w-6',
                index > currentStep && 'bg-white/20'
              )}
            />
          ))}
        </div>
        <span className="text-white/60 text-sm">
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>
    </div>
  )
}

