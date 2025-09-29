'use client'

import { useEffect, useState } from 'react'

interface MoneyNotificationProps {
  amount: number
  show: boolean
  onComplete: () => void
}

export default function MoneyNotification({ amount, show, onComplete }: MoneyNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'display' | 'exit'>('enter')

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setAnimationPhase('enter')
      
      // Phase 1: Enter animation
      const enterTimer = setTimeout(() => {
        setAnimationPhase('display')
      }, 200)

      // Phase 2: Display
      const displayTimer = setTimeout(() => {
        setAnimationPhase('exit')
      }, 2000)

      // Phase 3: Exit and cleanup
      const exitTimer = setTimeout(() => {
        setIsVisible(false)
        onComplete()
      }, 2500)

      return () => {
        clearTimeout(enterTimer)
        clearTimeout(displayTimer)
        clearTimeout(exitTimer)
      }
    }
  }, [show, onComplete])

  if (!isVisible) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
      animationPhase === 'exit' ? 'opacity-0' : 'opacity-100'
    }`}>
      {/* Simple green bubble */}
      <div className={`relative bg-green-500 rounded-full px-12 py-8 shadow-2xl transform transition-all duration-500 ${
        animationPhase === 'enter' ? 'scale-0' : 
        animationPhase === 'display' ? 'scale-100' : 
        'scale-90 opacity-0'
      }`}>
        
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-40"></div>
        
        {/* Content */}
        <div className="relative text-center text-white">
          <div className="text-5xl font-bold">
            ${amount.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}
