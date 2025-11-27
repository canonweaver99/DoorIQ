'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, ArrowLeft, Users, UserPlus, UserCog, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WalkthroughStep {
  id: string
  title: string
  description: string
  targetSelector?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  icon?: React.ReactNode
}

const steps: WalkthroughStep[] = [
  {
    id: 'tabs',
    title: 'Team Management Tabs',
    description: 'Use these tabs to navigate between Overview and Team Management. The Overview tab shows your organization stats and quick actions.',
    targetSelector: '[data-walkthrough="tabs"]',
    position: 'bottom',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'invite',
    title: 'Invite Team Members',
    description: 'Send invitations to teammates by entering their email address. They\'ll receive an email with a link to join your organization.',
    targetSelector: '[data-walkthrough="invite-section"]',
    position: 'bottom',
    icon: <UserPlus className="w-5 h-5" />,
  },
  {
    id: 'members',
    title: 'View Team Members',
    description: 'See all members of your organization here. You can view their roles and manage permissions.',
    targetSelector: '[data-walkthrough="members-section"]',
    position: 'top',
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: 'roles',
    title: 'Manage Roles',
    description: 'As a manager, you can change team member roles and remove members if needed. Use the dropdown to change roles between Rep and Manager. If you don\'t have team members yet, invite some first!',
    targetSelector: '[data-walkthrough="roles-section"]',
    position: 'top',
    icon: <UserCog className="w-5 h-5" />,
  },
]

interface TeamManagementWalkthroughProps {
  onComplete: () => void
  onSkip: () => void
}

export function TeamManagementWalkthrough({ onComplete, onSkip }: TeamManagementWalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const currentStepData = steps[currentStep]
  const isLastStep = currentStep === steps.length - 1

  // Find and highlight target element
  useEffect(() => {
    if (!currentStepData.targetSelector) {
      setTargetElement(null)
      setTargetRect(null)
      return
    }

    let retryTimeout: NodeJS.Timeout | null = null

    const findTarget = () => {
      const element = document.querySelector(currentStepData.targetSelector || '') as HTMLElement
      if (element) {
        setTargetElement(element)
        const rect = element.getBoundingClientRect()
        setTargetRect(rect)
        
        // Scroll element into view if needed
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      } else {
        // Retry after a short delay if element not found (elements might not be rendered yet)
        retryTimeout = setTimeout(() => {
          const retryElement = document.querySelector(currentStepData.targetSelector || '') as HTMLElement
          if (retryElement) {
            setTargetElement(retryElement)
            const rect = retryElement.getBoundingClientRect()
            setTargetRect(rect)
            retryElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
          } else {
            // If element still not found, show tooltip in center (element might not exist)
            console.warn(`Walkthrough target not found: ${currentStepData.targetSelector}`)
            setTargetElement(null)
            setTargetRect(null)
          }
        }, 300)
      }
    }

    findTarget()

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [currentStep, currentStepData.targetSelector])

  const handleNext = () => {
    if (isLastStep) {
      handleComplete()
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    // Mark configure_settings step as complete
    try {
      await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'configure_settings' }),
      })
    } catch (error) {
      console.error('Error completing onboarding step:', error)
    }
    onComplete()
  }

  const handleSkip = () => {
    handleComplete()
    onSkip()
  }

  // Calculate spotlight position
  const spotlightStyle = targetRect
    ? {
        clipPath: `polygon(
          0% 0%,
          0% 100%,
          ${targetRect.left}px 100%,
          ${targetRect.left}px ${targetRect.top}px,
          ${targetRect.right}px ${targetRect.top}px,
          ${targetRect.right}px ${targetRect.bottom}px,
          ${targetRect.left}px ${targetRect.bottom}px,
          ${targetRect.left}px 100%,
          100% 100%,
          100% 0%
        )`,
      }
    : {}

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

    const position = currentStepData.position || 'bottom'
    const spacing = 20

    switch (position) {
      case 'top':
        return {
          top: `${targetRect.top - spacing}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        }
      case 'bottom':
        return {
          top: `${targetRect.bottom + spacing}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        }
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - spacing}px`,
          transform: 'translate(-100%, -50%)',
        }
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + spacing}px`,
          transform: 'translate(0, -50%)',
        }
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-auto"
      >
        {/* Dark overlay with spotlight */}
        <motion.div
          className="absolute inset-0 bg-black/80"
          style={spotlightStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Highlight border around target */}
        {targetElement && targetRect && (
          <motion.div
            className="absolute border-2 border-emerald-500 rounded-lg pointer-events-none"
            style={{
              top: `${targetRect.top - 4}px`,
              left: `${targetRect.left - 4}px`,
              width: `${targetRect.width + 8}px`,
              height: `${targetRect.height + 8}px`,
            }}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          className="absolute bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl max-w-md pointer-events-auto"
          style={getTooltipPosition()}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {currentStepData.icon && (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    {currentStepData.icon}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white">{currentStepData.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-zinc-300 mb-6 leading-relaxed">{currentStepData.description}</p>

            {/* Progress bar */}
            <div className="mb-6">
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-zinc-400 hover:text-zinc-300"
                >
                  Skip
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
                >
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

