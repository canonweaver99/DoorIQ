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
import { ProTipsStep } from '@/components/onboarding/ProTipsStep'

// Step IDs for both flows
const MANAGER_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Account' },
  { id: 'role', title: 'Role' },
  { id: 'welcome', title: 'Welcome' },
  { id: 'features', title: 'Features' },
  { id: 'team', title: 'Team' },
  { id: 'session', title: 'First Session' },
  { id: 'tips', title: 'Pro Tips' },
]

const REP_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Account' },
  { id: 'role', title: 'Role' },
  { id: 'welcome', title: 'Welcome' },
  { id: 'features', title: 'Features' },
  { id: 'session', title: 'First Session' },
  { id: 'tips', title: 'Pro Tips' },
]

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL params from Stripe redirect
  const sessionId = searchParams.get('session_id')
  const emailParam = searchParams.get('email')

  // State
  const [currentStep, setCurrentStep] = useState(0)
  const [role, setRole] = useState<'manager' | 'rep' | null>(null)
  const [email, setEmail] = useState(emailParam || '')
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)

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

        // Load user profile
        const { data: profile } = await supabase
          .from('users')
          .select('full_name, onboarding_current_step, onboarding_role, onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name || '')

          // If onboarding is completed, redirect to home
          if (profile.onboarding_completed) {
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
        .select('full_name')
        .eq('id', user.id)
        .single()

      if (profile) {
        setUserName(profile.full_name || '')
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

  // Complete onboarding
  const completeOnboarding = async () => {
    setCompleting(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id)
    }

    // Redirect to home
    router.push('/home')
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
    return roleSteps[currentStep]?.id || 'tips'
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
            onContinue={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStepId === 'tips' && role && (
          <ProTipsStep
            role={role}
            onComplete={completeOnboarding}
            onBack={prevStep}
            loading={completing}
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

