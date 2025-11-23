'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Settings, 
  Mic, 
  Compass, 
  CheckCircle2, 
  ArrowRight, 
  Loader2,
  X,
  BookOpen,
  Video,
  MessageCircle,
  Mail,
  CreditCard,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface OnboardingStatus {
  onboarding_completed: boolean
  steps_completed: {
    invite_team: boolean
    configure_settings: boolean
    first_session: boolean
    explore_features: boolean
  }
  onboarding_dismissed: boolean
}

interface Organization {
  id: string
  name: string
  plan_tier: string
  seat_limit: number
  seats_used: number
  stripe_subscription_id?: string
}

interface PlanData {
  tier: string
  seatLimit: number
  seatsUsed: number
  subscription?: {
    currentPeriodEnd: string
  }
}

export default function GettingStartedPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'rep' | 'manager'>('rep')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [dismissing, setDismissing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch onboarding status
      const statusRes = await fetch('/api/onboarding/status')
      if (statusRes.ok) {
        const statusData = await statusRes.json()
        setOnboardingStatus(statusData)
      }

      // Fetch organization data
      const orgRes = await fetch('/api/organizations/current')
      if (orgRes.ok) {
        const orgData = await orgRes.json()
        setOrganization(orgData.organization)
      }

      // Fetch plan data
      const planRes = await fetch('/api/billing/current-plan')
      if (planRes.ok) {
        const planData = await planRes.json()
        setPlanData(planData.plan)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return

    try {
      setInviteLoading(true)
      const response = await fetch('/api/invites/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      // Mark step as complete if plan has >1 seat
      if (planData && planData.seatLimit > 1) {
        await fetch('/api/onboarding/complete-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'invite_team' }),
        })
        await fetchData() // Refresh status
      }

      setShowInviteModal(false)
      setInviteEmail('')
      setInviteRole('rep')
    } catch (err: any) {
      alert(err.message || 'Failed to send invite')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      setCompleting(true)
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
      })

      if (response.ok) {
        // Redirect to dashboard after short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 500)
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
    } finally {
      setCompleting(false)
    }
  }

  const handleDismiss = async () => {
    try {
      setDismissing(true)
      await fetch('/api/onboarding/dismiss', {
        method: 'POST',
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('Error dismissing onboarding:', error)
    } finally {
      setDismissing(false)
    }
  }

  const getPlanName = () => {
    if (!planData) return 'your plan'
    return planData.tier === 'starter' ? 'Starter Plan' : 'Team Plan'
  }

  const getCompletedStepsCount = () => {
    if (!onboardingStatus) return 0
    return Object.values(onboardingStatus.steps_completed).filter(Boolean).length
  }

  const allStepsCompleted = getCompletedStepsCount() === 4

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00d4aa]" />
      </div>
    )
  }

  const steps = [
    {
      id: 'invite_team',
      icon: Users,
      title: 'Invite Your Sales Reps',
      description: `Add your team members so they can start practicing. You have ${planData?.seatLimit || 0} seats available.`,
      completed: onboardingStatus?.steps_completed.invite_team || false,
      action: () => setShowInviteModal(true),
      actionLabel: 'Invite Team Members',
      skipLabel: 'Skip for now',
    },
    {
      id: 'configure_settings',
      icon: Settings,
      title: 'Set Up Practice Preferences',
      description: 'Choose default difficulty levels and scenarios that match your sales approach.',
      completed: onboardingStatus?.steps_completed.configure_settings || false,
      action: () => router.push('/settings/preferences'),
      actionLabel: 'Configure Settings',
      skipLabel: 'Skip for now',
    },
    {
      id: 'first_session',
      icon: Mic,
      title: 'Take a Practice Session',
      description: 'Experience DoorIQ firsthand. Practice with one of our AI homeowners.',
      completed: onboardingStatus?.steps_completed.first_session || false,
      action: () => router.push('/trainer'),
      actionLabel: 'Start Practice Session',
      skipLabel: 'Skip for now',
    },
    {
      id: 'explore_features',
      icon: Compass,
      title: 'Explore Advanced Features',
      description: 'Get familiar with everything DoorIQ offers',
      completed: onboardingStatus?.steps_completed.explore_features || false,
      action: () => router.push('/analytics'),
      actionLabel: 'Take a Tour',
      skipLabel: 'Skip for now',
    },
  ]

  // Recommended personas for Step 3
  const recommendedPersonas: AllowedAgentName[] = [
    'Average Austin',
    'No Problem Nancy',
    'Busy Beth',
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to DoorIQ! 🎉
          </h1>
          <p className="text-gray-400 text-lg">
            You're now on the <span className="text-[#00d4aa] font-semibold">{getPlanName()}</span>. Here's how to get your team training in minutes.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {[1, 2, 3, 4].map((stepNum) => {
              const isCompleted = getCompletedStepsCount() >= stepNum
              return (
                <div key={stepNum} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isCompleted
                        ? 'bg-[#00d4aa] text-black'
                        : 'bg-[#1a1a1a] border border-[#2a2a2a] text-gray-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : stepNum}
                  </div>
                  {stepNum < 4 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        isCompleted ? 'bg-[#00d4aa]' : 'bg-[#1a1a1a]'
                      }`}
                    />
                  )}
                </div>
              )
            })}
          </div>
          <p className="text-center text-gray-400 text-sm">
            {getCompletedStepsCount()} of 4 steps completed
          </p>
        </div>

        {/* Completion State */}
        {allStepsCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-[#00d4aa]/20 to-purple-500/20 border border-[#00d4aa]/30 rounded-lg text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">
              🎉 You're all set! Your team is ready to start training.
            </h2>
            <p className="text-gray-300 mb-4">
              You've completed all setup steps. Start training your team now!
            </p>
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-semibold"
            >
              {completing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Steps Column */}
          <div className="lg:col-span-2 space-y-6">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 bg-[#1a1a1a] border rounded-lg ${
                    step.completed
                      ? 'border-[#00d4aa]/50'
                      : 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                  } transition-all`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        step.completed
                          ? 'bg-[#00d4aa]/20 text-[#00d4aa]'
                          : 'bg-[#2a2a2a] text-gray-400'
                      }`}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-white">
                          {step.title}
                        </h3>
                        {step.completed && (
                          <CheckCircle2 className="w-5 h-5 text-[#00d4aa]" />
                        )}
                      </div>
                      <p className="text-gray-400 mb-4">{step.description}</p>

                      {/* Step 1: Show seat usage */}
                      {step.id === 'invite_team' && planData && (
                        <div className="mb-4 p-3 bg-[#0a0a0a] rounded border border-[#2a2a2a]">
                          <p className="text-sm text-gray-300">
                            <span className="font-semibold text-white">
                              {planData.seatsUsed}
                            </span>{' '}
                            of{' '}
                            <span className="font-semibold text-white">
                              {planData.seatLimit}
                            </span>{' '}
                            seats used
                          </p>
                        </div>
                      )}

                      {/* Step 2: Show checklist */}
                      {step.id === 'configure_settings' && (
                        <div className="mb-4 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-4 h-4 border border-[#2a2a2a] rounded" />
                            Select default AI persona difficulty
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-4 h-4 border border-[#2a2a2a] rounded" />
                            Choose primary sales scenarios
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-4 h-4 border border-[#2a2a2a] rounded" />
                            Set session duration preferences
                          </div>
                        </div>
                      )}

                      {/* Step 3: Show recommended personas */}
                      {step.id === 'first_session' && (
                        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {recommendedPersonas.map((personaName) => {
                            const persona = PERSONA_METADATA[personaName]
                            if (!persona) return null
                            return (
                              <div
                                key={personaName}
                                className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">
                                    {persona.card.avatar}
                                  </span>
                                  <span className="font-semibold text-white text-sm">
                                    {personaName}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mb-1">
                                  {persona.bubble.subtitle}
                                </p>
                                <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">
                                  {persona.bubble.difficulty}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Step 4: Show feature grid */}
                      {step.id === 'explore_features' && (
                        <div className="mb-4 grid grid-cols-2 gap-3">
                          <Link
                            href="/analytics"
                            className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:border-[#00d4aa]/50 transition-colors"
                          >
                            <div className="text-2xl mb-1">📊</div>
                            <div className="font-semibold text-white text-sm">
                              Analytics Dashboard
                            </div>
                            <div className="text-xs text-gray-400">
                              Track team performance
                            </div>
                          </Link>
                          <Link
                            href="/leaderboard"
                            className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded hover:border-[#00d4aa]/50 transition-colors"
                          >
                            <div className="text-2xl mb-1">🏆</div>
                            <div className="font-semibold text-white text-sm">
                              Leaderboard
                            </div>
                            <div className="text-xs text-gray-400">
                              Motivate with competition
                            </div>
                          </Link>
                          <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded opacity-60">
                            <div className="text-2xl mb-1">📝</div>
                            <div className="font-semibold text-white text-sm">
                              Custom Scenarios
                            </div>
                            <div className="text-xs text-gray-400">
                              Create your own scripts
                            </div>
                            {planData?.tier === 'team' && (
                              <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded mt-1 inline-block">
                                Team+
                              </span>
                            )}
                          </div>
                          <div className="p-3 bg-[#0a0a0a] border border-[#2a2a2a] rounded opacity-60">
                            <div className="text-2xl mb-1">🎯</div>
                            <div className="font-semibold text-white text-sm">
                              Performance Insights
                            </div>
                            <div className="text-xs text-gray-400">
                              Identify improvement areas
                            </div>
                            {planData?.tier === 'team' && (
                              <span className="text-xs px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded mt-1 inline-block">
                                Team+
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Button
                          onClick={step.action}
                          disabled={step.completed}
                          className={`${
                            step.completed
                              ? 'bg-[#00d4aa]/20 text-[#00d4aa] cursor-not-allowed'
                              : 'bg-[#00d4aa] hover:bg-[#00c19a] text-black'
                          } font-semibold`}
                        >
                          {step.completed ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Completed
                            </>
                          ) : (
                            <>
                              {step.actionLabel}{' '}
                              <ArrowRight className="ml-2 w-4 h-4" />
                            </>
                          )}
                        </Button>
                        {!step.completed && (
                          <button
                            onClick={() => {
                              // Skip logic - just mark as complete for now
                              fetch('/api/onboarding/complete-step', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ step: step.id }),
                              }).then(() => fetchData())
                            }}
                            className="text-sm text-gray-400 hover:text-gray-300"
                          >
                            {step.skipLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Quick Stats Card */}
            <div className="p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-400">Current Plan</div>
                  <div className="text-lg font-semibold text-[#00d4aa]">
                    {getPlanName()}
                  </div>
                </div>
                {planData && (
                  <>
                    <div>
                      <div className="text-sm text-gray-400">Seats</div>
                      <div className="text-lg font-semibold text-white">
                        {planData.seatsUsed} of {planData.seatLimit} used
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Billing</div>
                      <div className="text-lg font-semibold text-white">
                        ${planData.seatLimit * (planData.tier === 'starter' ? 99 : planData.tier === 'enterprise' ? 49 : 69)}/month
                      </div>
                    </div>
                  </>
                )}
                <Link href="/settings/billing">
                  <Button
                    variant="outline"
                    className="w-full border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                </Link>
              </div>
            </div>

            {/* Resources Card */}
            <div className="p-6 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
              <h3 className="text-lg font-bold text-white mb-4">
                Helpful Resources
              </h3>
              <div className="space-y-2">
                <Link
                  href="/help"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  Documentation
                </Link>
                <a
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Video className="w-4 h-4" />
                  Video Tutorials
                </a>
                <a
                  href="#"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Join Community
                </a>
                <Link
                  href="/contact-sales"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        {!allStepsCompleted && (
          <div className="mt-8 text-center">
            <Button
              onClick={handleComplete}
              disabled={completing}
              className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-semibold px-8"
            >
              {completing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                "I'm ready to go"
              )}
            </Button>
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="ml-4 text-gray-400 hover:text-gray-300 text-sm"
            >
              {dismissing ? 'Dismissing...' : 'Remind me later'}
            </button>
          </div>
        )}

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Invite Team Member</h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="mt-2 bg-[#0a0a0a] border-[#2a2a2a] text-white"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                  />
                </div>

                <div>
                  <Label htmlFor="role" className="text-gray-300">
                    Role
                  </Label>
                  <select
                    id="role"
                    value={inviteRole}
                    onChange={(e) =>
                      setInviteRole(e.target.value as 'rep' | 'manager')
                    }
                    className="mt-2 w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2 text-white"
                  >
                    <option value="rep">Sales Rep</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteEmail('')
                  }}
                  className="flex-1 border-[#2a2a2a] text-gray-300 hover:bg-[#2a2a2a]"
                  disabled={inviteLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={inviteLoading || !inviteEmail.trim()}
                  className="flex-1 bg-[#00d4aa] hover:bg-[#00c19a] text-black font-semibold"
                >
                  {inviteLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Invite'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

