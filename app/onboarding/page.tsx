'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

import { OnboardingProgress, OnboardingStep } from '@/components/onboarding/OnboardingProgress'
import { AccountSetup } from '@/components/onboarding/AccountSetup'
import { RoleSelection } from '@/components/onboarding/RoleSelection'
import { IndustrySelection } from '@/components/onboarding/IndustrySelection'
import { WelcomeStep } from '@/components/onboarding/WelcomeStep'
import { FeaturesStep } from '@/components/onboarding/FeaturesStep'
import { TeamInviteStep } from '@/components/onboarding/TeamInviteStep'
import { FirstSessionStep } from '@/components/onboarding/FirstSessionStep'
import { PERSONA_METADATA } from '@/components/trainer/personas'

const MANAGER_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Account' },
  { id: 'role', title: 'Role' },
  { id: 'industry', title: 'Industry' },
  { id: 'welcome', title: 'Welcome' },
  { id: 'features', title: 'Features' },
  { id: 'team', title: 'Team' },
  { id: 'session', title: 'First Session' },
]

const REP_STEPS: OnboardingStep[] = [
  { id: 'account', title: 'Account' },
  { id: 'role', title: 'Role' },
  { id: 'industry', title: 'Industry' },
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
  const [planName, setPlanName] = useState<string>('Individual Plan')

  const steps = role === 'manager' ? MANAGER_STEPS : REP_STEPS

  useEffect(() => {
    let cancelled = false

    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (cancelled) return

        if (user) {
          setIsAuthenticated(true)
          setEmail(user.email || emailParam || '')

          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('full_name, role, onboarding_current_step, onboarding_role, organization_id')
            .eq('id', user.id)
            .single()

          if (cancelled) return

          if (profile) {
            // SIMPLE RULE: If user has a role, go to home immediately
            if (profile.role && ['manager', 'rep', 'admin'].includes(profile.role)) {
              router.replace('/home')
              return
            }

            setUserName(profile.full_name || '')
            if (profile.onboarding_role) setRole(profile.onboarding_role as 'manager' | 'rep')
            
            // Fetch organization plan name
            if (profile.organization_id) {
              const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('seat_limit')
                .eq('id', profile.organization_id)
                .single()
              
              if (!cancelled && !orgError && org?.seat_limit) {
                setPlanName(org.seat_limit === 1 ? 'Individual Plan' : 'Team Plan')
              }
            }
            
            // Validate step is within bounds
            const roleSteps = profile.onboarding_role === 'manager' ? MANAGER_STEPS : REP_STEPS
            const maxStep = roleSteps.length - 1
            
            if (profile.onboarding_current_step && profile.onboarding_current_step > 0 && profile.onboarding_current_step <= maxStep) {
              setCurrentStep(profile.onboarding_current_step)
            } else {
              setCurrentStep(1) // Skip to role selection if authenticated
            }
          } else {
            if (profileError) {
              console.error('Error fetching profile:', profileError)
            }
            setCurrentStep(1)
          }
        } else if (emailParam) {
          setEmail(emailParam)
          setCurrentStep(0)
        } else {
          router.push('/checkout')
          return
        }
      } catch (error) {
        console.error('Error in checkAuth:', error)
        if (!cancelled) {
          setLoading(false)
        }
        return
      }

      if (!cancelled) {
        setLoading(false)
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [emailParam, router])

  const saveProgress = async (step: number, selectedRole?: 'manager' | 'rep') => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase.from('users').update({
          onboarding_current_step: step,
          ...(selectedRole && { onboarding_role: selectedRole, role_selected_at: new Date().toISOString() }),
        }).eq('id', user.id)
        
        if (error) {
          console.error('Error saving progress:', error)
        }
      }
    } catch (error) {
      console.error('Error in saveProgress:', error)
    }
  }

  const handleAccountComplete = async () => {
    try {
      setIsAuthenticated(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name, organization_id')
          .eq('id', user.id)
          .single()

        if (profile) {
          setUserName(profile.full_name || '')
          if (profile.organization_id) {
            const { data: org, error: orgError } = await supabase
              .from('organizations')
              .select('seat_limit')
              .eq('id', profile.organization_id)
              .single()
            if (orgError) {
              console.error('Error fetching organization:', orgError)
            } else if (org?.seat_limit) {
              setPlanName(org.seat_limit === 1 ? 'Individual Plan' : 'Team Plan')
            }
          }
        } else if (profileError) {
          console.error('Error fetching profile:', profileError)
        }

        const { error: updateError } = await supabase.from('users').update({
          account_setup_completed_at: new Date().toISOString(),
          checkout_session_id: sessionId,
        }).eq('id', user.id)

        if (updateError) {
          console.error('Error updating account setup:', updateError)
        }
      }

      setCurrentStep(1)
      await saveProgress(1)
    } catch (error) {
      console.error('Error in handleAccountComplete:', error)
    }
  }

  const handleRoleSelect = async (selectedRole: 'manager' | 'rep') => {
    try {
      setRole(selectedRole)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase.from('users').update({
          role: selectedRole,
          onboarding_role: selectedRole,
          role_selected_at: new Date().toISOString(),
        }).eq('id', user.id)

        if (error) {
          console.error('Error updating role:', error)
          throw error
        }
      }

      setCurrentStep(2)
      await saveProgress(2, selectedRole)
    } catch (error) {
      console.error('Error in handleRoleSelect:', error)
      // Don't advance step if role update failed
    }
  }

  const goToStep = async (step: number) => {
    // Validate step is within bounds
    const roleSteps = role === 'manager' ? MANAGER_STEPS : REP_STEPS
    const maxStep = roleSteps.length - 1
    const validStep = Math.max(0, Math.min(step, maxStep))
    
    setCurrentStep(validStep)
    await saveProgress(validStep)
  }

  const nextStep = () => {
    const roleSteps = role === 'manager' ? MANAGER_STEPS : REP_STEPS
    const maxStep = roleSteps.length - 1
    if (currentStep < maxStep) {
      goToStep(currentStep + 1)
    }
  }
  
  const prevStep = () => goToStep(Math.max(0, currentStep - 1))

  const handleStartFirstSession = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { error: updateError } = await supabase.from('users').update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          checkout_session_id: null,
        }).eq('id', user.id)

        if (updateError) {
          console.error('Error completing onboarding:', updateError)
          // Continue anyway - don't block user from starting session
        }

        try {
          const response = await fetch('/api/onboarding/complete-step', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step: 'first_session' }),
          })
          
          if (!response.ok) {
            console.error('Error completing onboarding step:', await response.text())
          }
        } catch (fetchError) {
          console.error('Error calling complete-step API:', fetchError)
          // Non-critical - continue to trainer
        }
      }

      const austinAgentId = PERSONA_METADATA['Average Austin']?.card?.elevenAgentId
      router.push(austinAgentId ? `/trainer?agent=${encodeURIComponent(austinAgentId)}` : '/trainer')
    } catch (error) {
      console.error('Error in handleStartFirstSession:', error)
      // Still redirect to trainer even if there's an error
      const austinAgentId = PERSONA_METADATA['Average Austin']?.card?.elevenAgentId
      router.push(austinAgentId ? `/trainer?agent=${encodeURIComponent(austinAgentId)}` : '/trainer')
    }
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
    if (currentStep === 2) return 'industry'
    const roleSteps = role === 'manager' ? MANAGER_STEPS : REP_STEPS
    // Ensure currentStep is within bounds
    const validStep = Math.max(0, Math.min(currentStep, roleSteps.length - 1))
    return roleSteps[validStep]?.id || 'session'
  }

  const handleIndustrySelect = async (industry: string) => {
    setCurrentStep(3) // Move to welcome step
    await saveProgress(3)
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
        {currentStepId === 'industry' && <IndustrySelection onSelect={handleIndustrySelect} />}
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
