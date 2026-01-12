'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Users, User, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoleSelectionProps {
  onSelect: (role: 'manager' | 'rep') => void
  loading?: boolean
}

export function RoleSelection({ onSelect, loading }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'manager' | 'rep' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleContinue = async () => {
    if (!selectedRole) return
    setIsSubmitting(true)
    await onSelect(selectedRole)
  }

  const roles = [
    {
      id: 'manager' as const,
      icon: Users,
      title: "I'm a Manager",
      description: 'I lead a sales team and want to track performance, onboard reps, and improve team results.',
      features: [
        'Team performance dashboard',
        'Invite and manage reps',
        'Custom training materials',
        'Analytics & reporting',
      ],
    },
    {
      id: 'rep' as const,
      icon: User,
      title: "I'm a Sales Rep",
      description: 'I want to practice my pitch, improve my skills, and close more deals.',
      features: [
        'AI practice sessions',
        'Personalized coaching',
        'Performance tracking',
        'Leaderboard competition',
      ],
    },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="text-center mb-10">
        <h1 className="font-space text-3xl md:text-4xl font-bold text-white mb-4">
          What's your role?
        </h1>
        <p className="text-white/70 text-lg">
          This helps us personalize your DoorIQ experience
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {roles.map((role) => {
          const Icon = role.icon
          const isSelected = selectedRole === role.id

          return (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              disabled={loading || isSubmitting}
              className={cn(
                'relative p-6 rounded-2xl border-2 text-left transition-all duration-200',
                'hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                isSelected
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
              )}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}

              {/* Icon */}
              <div
                className={cn(
                  'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                  isSelected
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-white/10 text-white/60'
                )}
              >
                <Icon className="w-7 h-7" />
              </div>

              {/* Title & description */}
              <h3
                className={cn(
                  'font-space text-xl font-semibold mb-2',
                  isSelected ? 'text-white' : 'text-white/90'
                )}
              >
                {role.title}
              </h3>
              <p className="text-white/60 text-sm mb-4">{role.description}</p>

              {/* Features */}
              <ul className="space-y-2">
                {role.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 text-sm text-white/70"
                  >
                    <div
                      className={cn(
                        'w-1.5 h-1.5 rounded-full',
                        isSelected ? 'bg-purple-400' : 'bg-white/40'
                      )}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={!selectedRole || loading || isSubmitting}
          className="h-14 px-10 bg-purple-600 hover:bg-purple-700 text-white font-medium text-lg disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

