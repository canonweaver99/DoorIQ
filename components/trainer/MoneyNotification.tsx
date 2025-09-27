'use client'

import { useEffect, useState } from 'react'
import { DollarSign, TrendingUp } from 'lucide-react'

interface MoneyNotificationProps {
  amount: number
  show: boolean
  onComplete: () => void
}

export default function MoneyNotification({ amount, show, onComplete }: MoneyNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter')

  useEffect(() => {
    if (show) {
      setIsVisible(true)
      setAnimationPhase('enter')
      
      // Phase 1: Enter animation
      const enterTimer = setTimeout(() => {
        setAnimationPhase('celebrate')
      }, 200)

      // Phase 2: Celebration phase
      const celebrateTimer = setTimeout(() => {
        setAnimationPhase('exit')
      }, 2000)

      // Phase 3: Exit and cleanup
      const exitTimer = setTimeout(() => {
        setIsVisible(false)
        onComplete()
      }, 2800)

      return () => {
        clearTimeout(enterTimer)
        clearTimeout(celebrateTimer)
        clearTimeout(exitTimer)
      }
    }
  }, [show, onComplete])

  if (!isVisible) return null

  return (
    <>
      {/* Backdrop */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        animationPhase === 'exit' ? 'opacity-0' : 'opacity-100'
      }`}>
        
        {/* Main notification */}
        <div className={`relative bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 shadow-2xl transform transition-all duration-500 ${
          animationPhase === 'enter' ? 'scale-0 rotate-12' : 
          animationPhase === 'celebrate' ? 'scale-100 rotate-0' : 
          'scale-75 rotate-3 opacity-0'
        }`}>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
          
          {/* Content */}
          <div className="relative text-center text-white">
            <div className="flex items-center justify-center mb-4">
              <div className={`p-4 bg-white/20 rounded-full ${
                animationPhase === 'celebrate' ? 'animate-bounce' : ''
              }`}>
                <DollarSign className="w-12 h-12" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-2">Deal Closed!</h2>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-5xl font-bold">
                ${amount.toFixed(2)}
              </span>
              <TrendingUp className={`w-8 h-8 ${
                animationPhase === 'celebrate' ? 'animate-pulse' : ''
              }`} />
            </div>
            
            <p className="text-lg opacity-90">
              Added to your virtual wallet!
            </p>
          </div>
          
          {/* Floating money symbols */}
          {animationPhase === 'celebrate' && (
            <>
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute text-2xl text-green-300 animate-float-up`}
                  style={{
                    left: `${20 + (i * 10)}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s'
                  }}
                >
                  💰
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Confetti effect */}
      {animationPhase === 'celebrate' && (
        <div className="fixed inset-0 z-40 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
          {[...Array(20)].map((_, i) => (
            <div
              key={`green-${i}`}
              className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 1}s`,
                animationDuration: `${2 + Math.random()}s`
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}
