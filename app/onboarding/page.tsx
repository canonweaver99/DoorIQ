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
  const sessionId = searchParams.get('session_id')
  const emailParam = searchParams.get('email')

  const [currentStep, setCurrentStep] = useState(0)
  const [role, setRole] = useState<'manager' | 'rep' | null>(null)
  const [email, setEmail] = useState(emailParam || '')
  const [userName, setUserName] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [planName, setPlanName] = useState<string>('Team Plan')

  const steps = role === 'manager' ? MANAGER_STEPS : REP_STEPS

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsAuthenticated(true)
        setEmail(user.email || emailParam || '')

        const { data: profile } = await supabase
          .from('users')
          .select('full_name, role, onboarding_current_step, onboarding_role')
          .eq('id', user.id)
          .single()

        if (profile) {
          // SIMPLE RULE: If user has a role, go to home immediately
          if (profile.role && ['manager', 'rep', 'admin'].includes(profile.role)) {
            router.replace('/home')
            return
          }

          setUserName(profile.full_name || '')
          if (profile.onboarding_role) setRole(profile.onboarding_role as 'manager' | 'rep')
          if (profile.onboarding_current_step && profile.onboarding_current_step > 0) {
            setCurrentStep(profile.onboarding_current_step)
          } else {
            setCurrentStep(1) // Skip to role selection if authenticated
          }
        } else {
          setCurrentStep(1)
        }
      } else if (emailParam) {
        setEmail(emailParam)
        setCurrentStep(0)
      } else {
        router.push('/checkout')
        return
      }

      setLoading(false)
    }

    checkAuth()
  }, [emailParam, router])

  const saveProgress = async (step: number, selectedRole?: 'manager' | 'rep') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({
        onboarding_current_step: step,
        ...(selectedRole && { onboarding_role: selectedRole, role_selected_at: new Date().toISOString() }),
      }).eq('id', user.id)
    }
  }

  const handleAccountComplete = async () => {
    setIsAuthenticated(true)
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
        if (profile.organization_id) {
          const { data: org } = await supabase
            .from('organizations')
            .select('seat_limit')
            .eq('id', profile.organization_id)
            .single()
          if (org?.seat_limit) {
            setPlanName(org.seat_limit === 1 ? 'Individual Plan' : 'Team Plan')
          }
        }
      }

      await supabase.from('users').update({
        account_setup_completed_at: new Date().toISOString(),
        checkout_session_id: sessionId,
      }).eq('id', user.id)
    }

    setCurrentStep(1)
    await saveProgress(1)
  }

  const handleRoleSelect = async (selectedRole: 'manager' | 'rep') => {
    setRole(selectedRole)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase.from('users').update({
        role: selectedRole,
        onboarding_role: selectedRole,
        role_selected_at: new Date().toISOString(),
      }).eq('id', user.id)
    }

    setCurrentStep(2)
    await saveProgress(2, selectedRole)
  }

  const goToStep = async (step: number) => {
    setCurrentStep(step)
    await saveProgress(step)
  }

  const nextStep = () => goToStep(currentStep + 1)
  const prevStep = () => goToStep(Math.max(0, currentStep - 1))

  const handleStartFirstSession = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await supabase.from('users').update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
        checkout_session_id: null,
      }).eq('id', user.id)

      try {
        await fetch('/api/onboarding/complete-step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'first_session' }),
        })
      } catch {}
    }

    const austinAgentId = PERSONA_METADATA['Average Austin']?.card?.elevenAgentId
    router.push(austinAgentId ? `/trainer?agent=${encodeURIComponent(austinAgentId)}` : '/trainer')
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white/60 font-sans">Loading...</p>
        </div>
      </div>
    )
  }

  const getCurrentStepId = () => {
    if (currentStep === 0) return 'account'
    if (currentStep === 1) return 'role'
    const roleSteps = role === 'manager' ? MANAGER_STEPS : REP_STEPS
    return roleSteps[currentStep]?.id || 'session'
  }

  const currentStepId = getCurrentStepId()

  return (
    <div className="py-8 md:py-12">
      {currentStep > 0 && role && (
        <div className="mb-8 md:mb-12">
          <OnboardingProgress steps={steps} currentStep={currentStep} />
        </div>
      )}

      <div className="animate-in fade-in duration-300">
        {currentStepId === 'account' && (
          <AccountSetup email={email} sessionId={sessionId || undefined} onComplete={handleAccountComplete} />
        )}
        {currentStepId === 'role' && <RoleSelection onSelect={handleRoleSelect} />}
        {currentStepId === 'welcome' && role && (
          <WelcomeStep userName={userName} role={role} planName={planName} onContinue={nextStep} />
        )}
        {currentStepId === 'features' && role && (
          <FeaturesStep role={role} onContinue={nextStep} onBack={prevStep} />
        )}
        {currentStepId === 'team' && role === 'manager' && (
          <TeamInviteStep onContinue={nextStep} onBack={prevStep} onSkip={nextStep} />
        )}
        {currentStepId === 'session' && role && (
          <FirstSessionStep role={role} onContinue={handleStartFirstSession} onBack={prevStep} />
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
