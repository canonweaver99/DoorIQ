'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

// Types
type Persona = {
  id: string
  name: AllowedAgentName
  emoji: string
  tagline: string
  difficulty: 'Easy' | 'Moderate' | 'Hard'
  description: string
  audioPreview?: string
  color: string
  elevenAgentId: string
}

type OnboardingStep = 'welcome' | 'choose-persona' | 'ready'

// Persona data mapped to actual agent names
const PERSONAS: Persona[] = [
  {
    id: 'no-problem-nancy',
    name: 'No Problem Nancy',
    emoji: '😊',
    tagline: 'The Easy Yes',
    difficulty: 'Easy',
    description: 'Friendly and agreeable. Perfect for building confidence and practicing your pitch flow.',
    color: '#22c55e',
    elevenAgentId: 'agent_0101k6dvb96zejkv35ncf1zkj88m'
  },
  {
    id: 'average-austin',
    name: 'Average Austin',
    emoji: '🏡',
    tagline: 'Skeptical but Fair',
    difficulty: 'Moderate',
    description: 'A typical suburban dad. Skeptical at first, but closeable if you earn his trust.',
    color: '#3b82f6',
    elevenAgentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz'
  },
  {
    id: 'busy-beth',
    name: 'Busy Beth',
    emoji: '⏰',
    tagline: 'Time Crunch',
    difficulty: 'Moderate',
    description: "She's got 2 minutes. Hit your value prop fast or she's closing the door.",
    color: '#f59e0b',
    elevenAgentId: 'agent_4801k6dvap8tfnjtgd4f99hhsf10'
  }
]

// Animated door component
const AnimatedDoor = ({ isOpen, onClick }: { isOpen: boolean; onClick?: () => void }) => {
  return (
    <div 
      className="relative w-32 h-48 sm:w-40 sm:h-60 md:w-48 md:h-72 cursor-pointer group"
      onClick={onClick}
    >
      {/* Door frame */}
      <div className="absolute inset-0 bg-zinc-900 rounded-t-lg border-4 border-zinc-700" />
      
      {/* Door */}
      <motion.div
        className="absolute inset-1 bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 rounded-t-md origin-left shadow-2xl"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ 
          rotateY: isOpen ? -75 : 0,
          boxShadow: isOpen 
            ? '20px 0 40px rgba(0,0,0,0.8)' 
            : '5px 0 15px rgba(0,0,0,0.3)'
        }}
        transition={{ 
          type: 'spring', 
          stiffness: 100, 
          damping: 20 
        }}
      >
        {/* Door panels */}
        <div className="absolute inset-4 flex flex-col gap-3">
          <div className="flex-1 border-2 border-amber-700/50 rounded-sm bg-amber-800/30" />
          <div className="flex-1 border-2 border-amber-700/50 rounded-sm bg-amber-800/30" />
        </div>
        
        {/* Door handle */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-3 h-8 bg-yellow-600 rounded-full shadow-lg" />
        </div>
        
        {/* Peephole */}
        <div className="absolute left-1/2 -translate-x-1/2 top-8 w-4 h-4 rounded-full bg-zinc-800 border-2 border-yellow-700" />
      </motion.div>
      
      {/* Light from inside when open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-1 bg-gradient-to-r from-yellow-500/20 to-transparent rounded-t-md"
          />
        )}
      </AnimatePresence>
      
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-t-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-emerald-500/10 pointer-events-none" />
    </div>
  )
}

// Stats ticker component
const StatsTicker = () => {
  const [count, setCount] = useState(847)

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setCount(c => c + 1)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div 
      className="flex items-center gap-2 text-zinc-400 text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1 }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span>
        <motion.span
          key={count}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald-400 font-semibold"
        >
          {count.toLocaleString()}
        </motion.span>
        {' '}reps practiced this week
      </span>
    </motion.div>
  )
}

// Persona card component - using AgentBubbleSelector style
const PersonaCard = ({ 
  persona, 
  isSelected, 
  onSelect,
  index
}: { 
  persona: Persona
  isSelected: boolean
  onSelect: () => void
  index: number
}) => {
  const [isHovered, setIsHovered] = useState(false)
  
  // Get persona metadata for styling
  const personaMetadata = PERSONA_METADATA[persona.name]
  const agentImage = personaMetadata?.bubble?.image
  const variantKey = (personaMetadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
  const variantStyles = COLOR_VARIANTS[variantKey]
  
  const getCardStyle = () => {
    switch (persona.difficulty) {
      case 'Easy':
        return { border: 'border-green-500/40', bg: 'bg-[#1a1a1a]' }
      case 'Moderate':
        return { border: 'border-yellow-500/40', bg: 'bg-[#1a1a1a]' }
      case 'Hard':
        return { border: 'border-orange-500/40', bg: 'bg-[#1a1a1a]' }
      default:
        return { border: 'border-gray-700', bg: 'bg-[#1a1a1a]' }
    }
  }
  
  const cardStyle = getCardStyle()
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="select-none focus:outline-none cursor-pointer"
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "h-full flex flex-col items-center p-5 relative rounded-xl border-2",
          cardStyle.border,
          cardStyle.bg,
          isSelected && "ring-2 ring-emerald-500"
        )}
      >
        {/* Animated Bubble */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          tabIndex={-1}
          className="relative mb-3 focus:outline-none group"
        >
          <div className="relative h-40 w-40 mx-auto">
            {/* Concentric circles */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                  variantStyles.border[i],
                  variantStyles.gradient
                )}
                animate={isHovered ? {
                  rotate: 360,
                  scale: 1,
                  opacity: 1,
                } : {
                  rotate: 360,
                  scale: [1, 1.05, 1],
                  opacity: isSelected ? [1, 1, 1] : [0.7, 0.9, 0.7],
                }}
                transition={isHovered ? {
                  rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  scale: { duration: 0.3 },
                  opacity: { duration: 0.3 },
                } : {
                  rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                  opacity: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                }}
              >
                <div
                  className={cn(
                    "absolute inset-0 rounded-full mix-blend-screen",
                    `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                      "from-",
                      ""
                    )}/20%,transparent_70%)]`
                  )}
                />
              </motion.div>
            ))}

            {/* Profile Image */}
            {agentImage && (
              <motion.div 
                className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
                animate={isHovered ? {
                  scale: 1,
                } : {
                  scale: [1, 1.05, 1],
                }}
                transition={isHovered ? {
                  duration: 0.3,
                } : {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0,
                }}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                  {(() => {
                    const imageStyle = getAgentImageStyle(persona.name)
                    const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                    let translateY = '0'
                    const verticalNum = parseFloat(vertical)
                    if (verticalNum !== 50) {
                      const translatePercent = ((verticalNum - 50) / 150) * 100
                      translateY = `${translatePercent}%`
                    }
                    const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                    
                    return (
                      <Image
                        src={agentImage}
                        alt={persona.name}
                        fill
                        className="object-cover"
                        style={{
                          objectPosition: `${horizontal} ${vertical}`,
                          transform: `scale(${scaleValue}) translateY(${translateY})`,
                        }}
                        sizes="160px"
                        unoptimized={agentImage.includes(' ') || agentImage.includes('&')}
                      />
                    )
                  })()}
                </div>
              </motion.div>
            )}
          </div>
        </motion.button>

        {/* Agent Info */}
        <div className="text-center w-full mt-auto">
          <h3 className="text-lg font-bold text-white mb-2">
            {persona.name}
          </h3>
          <p className="text-sm text-white mb-3">
            {persona.tagline}
          </p>
          {/* Difficulty Dot */}
          <div className="flex items-center justify-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full flex-shrink-0 shadow-lg",
              persona.difficulty === 'Easy' && "bg-green-400 shadow-green-400/50",
              persona.difficulty === 'Moderate' && "bg-yellow-400 shadow-yellow-400/50",
              persona.difficulty === 'Hard' && "bg-orange-400 shadow-orange-400/50",
            )} />
            <span className="text-xs text-white font-medium">
              {persona.difficulty}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Audio preview button
const AudioPreviewButton = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  
  const togglePlay = () => {
    // In production, this would play an actual audio preview
    setIsPlaying(!isPlaying)
    setTimeout(() => setIsPlaying(false), 3000)
  }
  
  return (
    <motion.button
      onClick={togglePlay}
      className="flex items-center gap-3 px-5 py-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-full transition-all group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isPlaying ? 'bg-emerald-500' : 'bg-zinc-700 group-hover:bg-zinc-600'}`}>
        {isPlaying ? (
          <div className="flex items-center gap-0.5">
            <motion.div 
              animate={{ scaleY: [1, 1.5, 1] }} 
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 h-3 bg-white rounded-full"
            />
            <motion.div 
              animate={{ scaleY: [1.5, 1, 1.5] }} 
              transition={{ repeat: Infinity, duration: 0.5 }}
              className="w-1 h-3 bg-white rounded-full"
            />
            <motion.div 
              animate={{ scaleY: [1, 1.5, 1] }} 
              transition={{ repeat: Infinity, duration: 0.5, delay: 0.1 }}
              className="w-1 h-3 bg-white rounded-full"
            />
          </div>
        ) : (
          <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        )}
      </div>
      <div className="text-left">
        <div className="text-white text-sm font-medium">
          {isPlaying ? 'Playing preview...' : 'Hear a sample conversation'}
        </div>
        <div className="text-zinc-500 text-xs">15 second preview</div>
      </div>
    </motion.button>
  )
}

// Microphone permission component
const MicPermission = ({ onGranted }: { onGranted: () => void }) => {
  const [status, setStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
  
  const requestPermission = async () => {
    setStatus('requesting')
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setStatus('granted')
      setTimeout(onGranted, 500)
    } catch (err) {
      setStatus('denied')
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <motion.div
        className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors ${
          status === 'granted' ? 'bg-emerald-500/20' : 
          status === 'denied' ? 'bg-red-500/20' : 
          'bg-zinc-800'
        }`}
        animate={status === 'requesting' ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: status === 'requesting' ? Infinity : 0, duration: 1 }}
      >
        {status === 'granted' ? (
          <motion.svg 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-12 h-12 text-emerald-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </motion.svg>
        ) : status === 'denied' ? (
          <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-12 h-12 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </motion.div>
      
      <h2 className="text-2xl font-bold text-white mb-3">
        {status === 'granted' ? "You're all set!" : 
         status === 'denied' ? 'Microphone blocked' : 
         'One quick thing...'}
      </h2>
      
      <p className="text-zinc-400 mb-6 max-w-md mx-auto">
        {status === 'granted' ? 'Microphone access granted. Ready to knock!' : 
         status === 'denied' ? 'Please enable microphone access in your browser settings to continue.' : 
         'DoorIQ needs microphone access to have a real conversation with you. Your audio is never stored.'}
      </p>
      
      {status !== 'granted' && (
        <motion.button
          onClick={requestPermission}
          disabled={status === 'requesting'}
          className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {status === 'requesting' ? 'Requesting access...' : 
           status === 'denied' ? 'Try again' : 
           'Enable microphone'}
        </motion.button>
      )}
    </motion.div>
  )
}

// Main onboarding component
export default function GettingStartedPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const [doorOpen, setDoorOpen] = useState(false)
  const [micGranted, setMicGranted] = useState(false)
  const [bubbleHovered, setBubbleHovered] = useState(false)
  const [isManager, setIsManager] = useState<boolean | null>(null)
  const [loadingRole, setLoadingRole] = useState(true)
  
  // Check if user is manager/admin
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setLoadingRole(false)
          return
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userData) {
          setIsManager(userData.role === 'manager' || userData.role === 'admin')
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      } finally {
        setLoadingRole(false)
      }
    }

    checkUserRole()
  }, [])
  
  // Auto-open door after initial render
  useEffect(() => {
    const timer = setTimeout(() => setDoorOpen(true), 800)
    return () => clearTimeout(timer)
  }, [])
  
  const handleStartPractice = async () => {
    if (selectedPersona) {
      const persona = PERSONAS.find(p => p.id === selectedPersona)
      if (persona) {
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
        
        // Navigate to trainer with selected persona's eleven_agent_id
        router.push(`/trainer?agent=${encodeURIComponent(persona.elevenAgentId)}`)
      }
    }
  }


  return (
    <div className="min-h-screen bg-zinc-950 text-white relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-[calc(100vh-200px)] flex flex-col">
        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 w-full min-h-[calc(100vh-250px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Welcome */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -100 }}
                className="text-center max-w-2xl mx-auto w-full pt-12 sm:pt-16 md:pt-20"
              >
                {/* Back button */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
                  <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                  </button>
                </div>
                {/* Door animation */}
                <div className="flex justify-center mb-6 md:mb-8">
                  <AnimatedDoor isOpen={doorOpen} onClick={() => setDoorOpen(!doorOpen)} />
        </div>

                {/* Headline */}
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  Your first door
                  <br />
                  <span className="text-emerald-400">is waiting.</span>
                </motion.h1>
                
                <motion.p 
                  className="text-sm sm:text-base md:text-lg text-white mb-6 md:mb-8 max-w-md mx-auto px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Practice with AI homeowners that feel real. Get instant feedback. Close more deals.
                </motion.p>
                
                {/* Audio preview and CTA */}
                <motion.div
                  className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <AudioPreviewButton />
                  <motion.button
                    onClick={() => setStep('choose-persona')}
                    className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black text-lg font-bold rounded-xl transition-colors inline-flex items-center gap-3 group"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Start practicing
                    <svg 
                      className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.button>
                </motion.div>

                
                {/* Stats ticker */}
                <motion.div
                  className="flex justify-center mt-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <StatsTicker />
                </motion.div>
              </motion.div>
            )}
            
            {/* Step 2: Choose persona */}
            {step === 'choose-persona' && (
              <motion.div
                key="choose-persona"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className="w-full max-w-7xl mx-auto pt-12 sm:pt-16 md:pt-20 relative"
              >
                {/* Back button */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                  <button
                    onClick={() => setStep('welcome')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                  </button>
                </div>
                <div className="text-center mb-8 sm:mb-10">
                  <motion.h2 
                    className="text-3xl sm:text-4xl md:text-5xl font-black mb-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    Who's behind the door?
                  </motion.h2>
                  <motion.p 
                    className="text-white text-base sm:text-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    Choose your first challenge. You can always try others later.
                  </motion.p>
          </div>

                {/* Persona cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {PERSONAS.map((persona, index) => (
                    <PersonaCard
                      key={persona.id}
                      persona={persona}
                      isSelected={selectedPersona === persona.id}
                      onSelect={() => {
                        setSelectedPersona(persona.id)
                      }}
                      index={index}
                    />
                  ))}
            </div>

                {/* Copy and CTA */}
                <motion.div 
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-white font-bold text-base sm:text-lg mb-6">
                    Select one to start
                  </p>
                  <p className="text-white text-base sm:text-lg mb-6 max-w-2xl mx-auto">
                    Each homeowner has unique objections and personality traits. Start your first practice session and get instant feedback on your technique.
                  </p>
                  <motion.button
                    onClick={() => selectedPersona && setStep('ready')}
                    disabled={!selectedPersona}
                    className={`px-10 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center gap-3 group ${
                      selectedPersona 
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-black' 
                        : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    }`}
                    whileHover={selectedPersona ? { scale: 1.02 } : {}}
                    whileTap={selectedPersona ? { scale: 0.98 } : {}}
                  >
                    Continue
                    <svg 
                      className="w-5 h-5 transition-transform group-hover:translate-x-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </motion.button>
                </motion.div>

                {/* Back button and skip option */}
                <motion.div 
                  className="flex flex-col items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <button
                    onClick={() => setStep('welcome')}
                    className="px-6 py-3 text-white hover:text-emerald-400 transition-colors"
                  >
                    ← Back
                  </button>
                </motion.div>
              </motion.div>
            )}
            
            {/* Step 3: Ready (mic permission + launch) */}
            {step === 'ready' && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-lg mx-auto pt-6 sm:pt-10 md:pt-14 relative"
              >
                {/* Back button */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
                  <button
                    onClick={() => setStep('choose-persona')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="text-sm">Back</span>
                  </button>
                </div>
                {!micGranted ? (
                  <MicPermission onGranted={() => setMicGranted(true)} />
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    {/* Agent Bubble */}
                    {(() => {
                      const persona = PERSONAS.find(p => p.id === selectedPersona)
                      if (!persona) return null
                      
                      const personaMetadata = PERSONA_METADATA[persona.name]
                      const agentImage = personaMetadata?.bubble?.image
                      const variantKey = (personaMetadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
                      const variantStyles = COLOR_VARIANTS[variantKey]
                      
                      return (
                        <motion.div
                          className="relative w-48 h-48 sm:w-56 sm:h-56 mx-auto mb-8"
                          onMouseEnter={() => setBubbleHovered(true)}
                          onMouseLeave={() => setBubbleHovered(false)}
                        >
                          {/* Concentric circles */}
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className={cn(
                                "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                                variantStyles.border[i],
                                variantStyles.gradient
                              )}
                              animate={bubbleHovered ? {
                                rotate: 360,
                                scale: 1,
                                opacity: 1,
                              } : {
                                rotate: 360,
                                scale: [1, 1.05, 1],
                                opacity: [0.7, 0.9, 0.7],
                              }}
                              transition={bubbleHovered ? {
                                rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                                scale: { duration: 0.3 },
                                opacity: { duration: 0.3 },
                              } : {
                                rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                                scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                                opacity: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                              }}
                            >
                              <div
                                className={cn(
                                  "absolute inset-0 rounded-full mix-blend-screen",
                                  `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                                    "from-",
                                    ""
                                  )}/20%,transparent_70%)]`
                                )}
                              />
                            </motion.div>
                          ))}

                          {/* Profile Image */}
                          {agentImage && (
                            <motion.div 
                              className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
                              animate={{
                                scale: [1, 1.05, 1],
                              }}
                              transition={{
                                duration: 4,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                                delay: 0,
                              }}
                            >
                              <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                                {(() => {
                                  const imageStyle = getAgentImageStyle(persona.name)
                                  const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                                  let translateY = '0'
                                  const verticalNum = parseFloat(vertical)
                                  if (verticalNum !== 50) {
                                    const translatePercent = ((verticalNum - 50) / 150) * 100
                                    translateY = `${translatePercent}%`
                                  }
                                  const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                                  
                                  return (
                                    <Image
                                      src={agentImage}
                                      alt={persona.name}
                                      fill
                                      className="object-cover"
                                      style={{
                                        objectPosition: `${horizontal} ${vertical}`,
                                        transform: `scale(${scaleValue}) translateY(${translateY})`,
                                      }}
                                      sizes="160px"
                                      unoptimized={agentImage.includes(' ') || agentImage.includes('&')}
                                    />
                                  )
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )
                    })()}
                    
                    <h2 className="text-3xl font-black mb-2">Ready to knock?</h2>
                    
                    <p className="text-xl font-bold text-emerald-400 mb-6">
                      {PERSONAS.find(p => p.id === selectedPersona)?.name}
                    </p>
                    
                    {/* Tips */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 mb-6 text-left">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2 text-lg">
                        <span>💡</span> Quick tips
                      </h4>
                      <ul className="space-y-3 text-base text-white">
                        <li className="flex items-start gap-4">
                          <span className="text-emerald-500 text-6xl leading-none flex-shrink-0 -mt-5">•</span>
                          <span>Speak naturally. The AI understands conversational language</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <span className="text-emerald-500 text-6xl leading-none flex-shrink-0 -mt-5">•</span>
                          <span>Use your real pitch. This is practice for real doors</span>
                        </li>
                        <li className="flex items-start gap-4">
                          <span className="text-emerald-500 text-6xl leading-none flex-shrink-0 -mt-5">•</span>
                          <span>You'll get scored on technique, objection handling & more</span>
                        </li>
                      </ul>
              </div>

                    {/* Launch buttons */}
                    <div className="flex flex-col gap-3">
                      <motion.button
                        onClick={handleStartPractice}
                        className="w-full px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-black text-xl font-black rounded-xl transition-colors inline-flex items-center justify-center gap-3 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>🚪</span>
                        Knock on the door
                      </motion.button>
                      
                      <button
                        onClick={() => setStep('choose-persona')}
                        className="text-white hover:text-emerald-400 transition-colors text-sm"
                      >
                        ← Choose a different persona
                      </button>

            </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        
        {/* Footer */}
        <footer className="p-4 sm:p-6 text-center text-zinc-600 text-xs sm:text-sm mt-auto">
          <p>© 2025 DoorIQ. Practice like a pro, close like a champion.</p>
        </footer>
      </div>
    </div>
  )
}
