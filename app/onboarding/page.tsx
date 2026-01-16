'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

import { OnboardingProgress, OnboardingStep } from '@/components/onboarding/OnboardingProgress'
import { AccountSetup } from '@/components/onboarding/AccountSetup'
import { RoleSelection } from '@/components/onboarding/RoleSelection'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { FeaturesStep } from '@/components/onboarding/FeaturesStep'
import { TeamInviteStep } from '@/components/onboarding/TeamInviteStep'
import { FirstSessionStep } from '@/components/onboarding/FirstSessionStep'
import { PERSONA_METADATA } from '@/components/trainer/personas'

// Step IDs for both flows
const MANAGER_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Account' },
  { id: 'role', title: 'Role' },
  { id: 'welcome', title: 'Welcome' },
  { id: 'features', title: 'Features' },
  { id: 'team', title: 'Team' },
  { id: 'session', title: 'First Session' },
]

const REP_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Account' },
  { id: 'role', title: 'Role' },
  { id: 'welcome', title: 'Welcome' },
  { id: 'features', title: 'Features' },
  { id: 'session', title: 'First Session' },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL params from Stripe redirect
  // Also check sessionStorage as fallback (in case OAuth didn't preserve query params)
  const [sessionId, setSessionId] = useState(searchParams.get('session_id'))
  const [emailParam, setEmailParam] = useState(searchParams.get('email'))
  
  // Fallback to sessionStorage if query params are missing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!sessionId && sessionStorage.getItem('onboarding_session_id')) {
        const storedSessionId = sessionStorage.getItem('onboarding_session_id')
        setSessionId(storedSessionId)
        // Update URL to include session_id
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('session_id', storedSessionId!)
        window.history.replaceState({}, '', newUrl.toString())
      }
      if (!emailParam && sessionStorage.getItem('onboarding_email')) {
        const storedEmail = sessionStorage.getItem('onboarding_email')
        setEmailParam(storedEmail)
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('email', storedEmail!)
        window.history.replaceState({}, '', newUrl.toString())
      }
      // Clear sessionStorage after reading
      sessionStorage.removeItem('onboarding_session_id')
      sessionStorage.removeItem('onboarding_email')
      sessionStorage.removeItem('onboarding_redirect')
    }
  }, [sessionId, emailParam])

  // State
  const [currentStep, setCurrentStep] = useState(0)
  const [role, setRole] = useState<'manager' | 'rep' | null>(null)
  const [email, setEmail] = useState(emailParam || '')
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const [planName, setPlanName] = useState<string>('Team Plan')

  // Determine steps based on role
  const steps = role === 'manager' ? MANAGER_STEPS : REP_STEPS

  // Check authentication status and load user data
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        setEmail(user.email || emailParam || '')

        // Load user profile including checkout_session_id and role
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role, onboarding_current_step, onboarding_role, onboarding_completed, checkout_session_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name || '')
          
          // CRITICAL: If user already has a role set (manager/rep/admin) AND no checkout session,
          // they should NOT be in onboarding - redirect to home immediately
          const hasCheckoutSession = !!sessionId || !!profile.checkout_session_id
          const hasExistingRole = !!profile.role && (profile.role === 'manager' || profile.role === 'rep' || profile.role === 'admin')
          
          if (hasExistingRole && !hasCheckoutSession) {
            console.log('✅ User already has role set and no checkout session - redirecting to home')
            router.push('/home')
            return
          }
          
          // CRITICAL: If user has a checkout_session_id, they MUST complete onboarding
          // This ensures users who just completed checkout go through full onboarding
          const mustCompleteOnboarding = hasCheckoutSession && !profile.onboarding_completed

          // Fetch organization seat limit to determine plan name
          const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()

          if (userData?.organization_id) {
            const { data: org } = await supabase
              .from('organizations')
              .select('seat_limit')
              .eq('id', userData.organization_id)
              .single()

            if (org?.seat_limit) {
              setPlanName(org.seat_limit === 1 ? 'Individual Plan' : 'Team Plan')
            }
          } else if (sessionId || profile.checkout_session_id) {
            // If organization doesn't exist yet, check checkout session metadata
            const sessionToCheck = sessionId || profile.checkout_session_id
            try {
              const response = await fetch(`/api/checkout/session?session_id=${sessionToCheck}`)
              if (response.ok) {
                const sessionData = await response.json()
                const seatCount = parseInt(
                  sessionData.metadata?.seat_count || 
                  sessionData.subscription_data?.metadata?.seat_count || 
                  '1', 
                  10
                )
                setPlanName(seatCount === 1 ? 'Individual Plan' : 'Team Plan')
              }
            } catch (error) {
              console.error('Error fetching checkout session:', error)
            }
          }

          // CRITICAL: If user already has a role set (manager/rep/admin) AND no checkout_session_id in database,
          // they should NOT be in onboarding - redirect to home immediately
          // This prevents users who already completed onboarding from being forced through it again
          if (hasExistingRole && !profile.checkout_session_id) {
            console.log('✅ User already has role set and no checkout session in DB - redirecting to home')
            router.push('/home')
            return
          }
          
          // CRITICAL: If user has checkout_session_id in database (from recent checkout),
          // they MUST complete onboarding flow, even if they've completed it before
          // This handles the case where they completed onboarding before but just did a new checkout
          if (profile.checkout_session_id) {
            if (profile.onboarding_completed) {
              console.log('🔄 User has checkout session in DB - resetting onboarding completion status')
              await supabase
                .from('users')
                .update({
                  onboarding_completed: false,
                  onboarding_completed_at: null,
                })
                .eq('id', user.id)
            }
          } else if (profile.onboarding_completed) {
            // No checkout session and onboarding is completed - redirect to home
            router.push('/home')
            return
          }

          // Resume from saved step
          if (profile.onboarding_role) {
            setRole(profile.onboarding_role as 'manager' | 'rep')
          }
          if (profile.onboarding_current_step && profile.onboarding_current_step > 0) {
            setCurrentStep(profile.onboarding_current_step)
          } else {
            // Skip account setup if already authenticated
            setCurrentStep(1) // Go to role selection
          }
        } else {
          // New user, skip to role selection
          setCurrentStep(1)
        }
      } else if (emailParam) {
        // Not authenticated but have email from Stripe
        setEmail(emailParam)
        setCurrentStep(0) // Start at account setup
      } else {
        // No email param and not authenticated - redirect to checkout
        router.push('/checkout')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [emailParam, router])

  // Save progress to database
  const saveProgress = async (step: number, selectedRole?: 'manager' | 'rep') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const updateData: Record<string, any> = {
        onboarding_current_step: step,
      }

      if (selectedRole) {
        updateData.onboarding_role = selectedRole
        updateData.role_selected_at = new Date().toISOString()
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
    }
  }

  // Handle account setup completion
  const handleAccountComplete = async () => {
    setIsAuthenticated(true)
    
    // Fetch user data
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name, organization_id')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserName(profile.full_name || '')

        // Fetch organization seat limit to determine plan name
        if (profile.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('seat_limit')
            .eq('id', profile.organization_id)
            .single()

          if (org?.seat_limit) {
            setPlanName(org.seat_limit === 1 ? 'Individual Plan' : 'Team Plan')
          }
        } else if (sessionId) {
          // If organization doesn't exist yet, check checkout session metadata
          try {
            const response = await fetch(`/api/checkout/session?session_id=${sessionId}`)
            if (response.ok) {
              const sessionData = await response.json()
              const seatCount = parseInt(
                sessionData.metadata?.seat_count || 
                sessionData.subscription_data?.metadata?.seat_count || 
                '1', 
                10
              )
              setPlanName(seatCount === 1 ? 'Individual Plan' : 'Team Plan')
            }
          } catch (error) {
            console.error('Error fetching checkout session:', error)
          }
        }
      }

      // Mark account setup complete
      await supabase
        .from('users')
        .update({
          account_setup_completed_at: new Date().toISOString(),
          checkout_session_id: sessionId,
        })
        .eq('id', user.id)
    }

    setCurrentStep(1) // Move to role selection
    await saveProgress(1)
  }

  // Handle role selection
  const handleRoleSelect = async (selectedRole: 'manager' | 'rep') => {
    setRole(selectedRole)
    
    // Update user role in database
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('users')
        .update({
          role: selectedRole,
          onboarding_role: selectedRole,
          role_selected_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    setCurrentStep(2) // Move to welcome
    await saveProgress(2, selectedRole)
  }

  // Navigation helpers
  const goToStep = async (step: number) => {
    setCurrentStep(step)
    await saveProgress(step)
  }

  const nextStep = () => goToStep(currentStep + 1)
  const prevStep = () => goToStep(Math.max(0, currentStep - 1))

  // Handle starting first session - navigate to trainer with Average Austin
  const handleStartFirstSession = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Mark onboarding as completed and clear checkout_session_id
      // This allows them to access the app normally after completing onboarding
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          checkout_session_id: null, // Clear checkout session so they're not forced into onboarding again
        })
        .eq('id', user.id)

      // Mark first_session step as completed
      try {
        await fetch('/api/onboarding/complete-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'first_session' }),
        })
      } catch (error) {
        console.error('Error marking onboarding step complete:', error)
      }
    }

    // Navigate to trainer with Average Austin
    const austinAgentId = PERSONA_METADATA['Average Austin']?.card?.elevenAgentId
    if (austinAgentId) {
      router.push(`/trainer?agent=${encodeURIComponent(austinAgentId)}`)
    } else {
      // Fallback to trainer page without agent selection
      router.push('/trainer')
    }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/60 font-sans">Loading your onboarding...</p>
        </div>
      </div>
    )
  }

  // Get current step ID
  const getCurrentStepId = () => {
    if (currentStep === 0) return 'account'
    if (currentStep === 1) return 'role'

    // After role selection, use role-specific steps
    const roleSteps = role === 'manager' ? MANAGER_STEPS : REP_STEPS
    return roleSteps[currentStep]?.id || 'session'
  }

  const currentStepId = getCurrentStepId()

  return (
    <div className="py-8 md:py-12">
      {/* Progress indicator - show after account setup */}
      {currentStep > 0 && role && (
        <div className="mb-8 md:mb-12">
          <OnboardingProgress steps={steps} currentStep={currentStep} />
        </div>
      )}

      {/* Step content */}
      <div className="animate-in fade-in duration-300">
        {currentStepId === 'account' && (
          <AccountSetup
            email={email}
            sessionId={sessionId || undefined}
            onComplete={handleAccountComplete}
          />
        )}

        {currentStepId === 'role' && (
          <RoleSelection onSelect={handleRoleSelect} />
        )}

        {currentStepId === 'welcome' && role && (
          <WelcomeStep
            userName={userName}
            role={role}
            planName={planName}
            onContinue={nextStep}
          />
        )}

        {currentStepId === 'features' && role && (
          <FeaturesStep
            role={role}
            onContinue={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStepId === 'team' && role === 'manager' && (
          <TeamInviteStep
            onContinue={nextStep}
            onBack={prevStep}
            onSkip={nextStep}
          />
        )}

        {currentStepId === 'session' && role && (
          <FirstSessionStep
            role={role}
            onContinue={handleStartFirstSession}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-white/60 font-sans">Loading...</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}

