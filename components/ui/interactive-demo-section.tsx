'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle2, TrendingUp } from 'lucide-react'
import { GlowCard } from '@/components/ui/spotlight-card'
import { useScrollAnimation, fadeInUp, fadeInScale, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'

interface DemoStep {
  id: number
  title: string
  description: string
  icon: 'play' | 'check' | 'trend'
  color: 'blue' | 'purple' | 'green'
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    title: 'Start a Conversation',
    description: 'Your rep knocks on the virtual door and begins their pitch. The AI homeowner responds in real-time with natural voice.',
    icon: 'play',
    color: 'blue'
  },
  {
    id: 2,
    title: 'Navigate Objections',
    description: 'The homeowner raises concerns about price, timing, or competition. Your rep must handle these dynamically.',
    icon: 'check',
    color: 'purple'
  },
  {
    id: 3,
    title: 'Instant Feedback',
    description: 'After the call, get detailed scoring on tone, pacing, objection handling, and rapport building.',
    icon: 'trend',
    color: 'green'
  }
]

export function InteractiveDemoSection() {
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const { ref, controls } = useScrollAnimation(0.2)

  // Auto-play video when scrolled into view
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Set video to muted for autoplay (required by browsers)
    video.muted = true
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && video) {
            // Small delay to ensure video is ready
            setTimeout(() => {
              video.play().catch((error) => {
                console.log('Auto-play prevented:', error)
                // If autoplay fails, try again after a small delay
                setTimeout(() => {
                  video.play().catch(() => {})
                }, 500)
              })
            }, 100)
            setIsPlaying(true)
          } else if (!entry.isIntersecting && video) {
            video.pause()
            setIsPlaying(false)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px' }
    )

    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current)
    }

    return () => {
      if (videoContainerRef.current) {
        observer.unobserve(videoContainerRef.current)
      }
    }
  }, [])

  // Auto-switch steps based on video time
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      const currentTime = video.currentTime
      
      // Switch to step 2 at 19 seconds
      if (currentTime >= 19 && currentTime < 33 && activeStep !== 1) {
        setActiveStep(1)
      }
      // Switch to step 3 at 33 seconds
      else if (currentTime >= 33 && activeStep !== 2) {
        setActiveStep(2)
      }
      // Reset to step 1 if video loops back before 19 seconds
      else if (currentTime < 19 && activeStep !== 0) {
        setActiveStep(0)
      }
    }

    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [activeStep])
  
  const handleStepClick = (index: number) => {
    setActiveStep(index)
  }

  return (
    <motion.section 
      ref={ref}
      className="relative py-16 md:py-20 bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]" 
      id="dooriq-action"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8">
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <h2 className="text-[56px] leading-[1.1] tracking-tight font-geist mb-6 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
            See <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">DoorIQ</span> in Action
          </h2>
          <p className="text-lg text-slate-300 max-w-3xl mx-auto">
            Watch how a sales rep trains with an AI homeowner in under 2 minutes. 
            No scripts. No staged demos. Just real practice.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Demo Video/Player - Takes up more space */}
          <motion.div 
            className="order-2 lg:order-1 lg:col-span-3"
            variants={fadeInScale}
          >
            <motion.div 
              ref={videoContainerRef}
              className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Video Player */}
              <video
                ref={videoRef}
                src="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4"
                controls
                muted
                loop
                autoPlay
                preload="auto"
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={(e) => {
                  console.error('Video loading error:', e)
                }}
                onLoadedData={() => {
                  // Try to play when video data is loaded
                  if (videoRef.current && videoContainerRef.current) {
                    const rect = videoContainerRef.current.getBoundingClientRect()
                    const isVisible = rect.top < window.innerHeight && rect.bottom > 0
                    if (isVisible) {
                      videoRef.current.play().catch(() => {})
                    }
                  }
                }}
                playsInline
              />
              
              {/* Step indicator */}
              <motion.div 
                className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 z-10"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-sm text-white font-medium">Step {demoSteps[activeStep].id}: {demoSteps[activeStep].title}</span>
              </motion.div>
            </motion.div>

            {/* Industry Cards */}
            <motion.div 
              className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              {[
                { name: "Solar", icon: "☀️" },
                { name: "Pest Control", icon: "🐛" },
                { name: "Roofing", icon: "🏠" },
                { name: "Security", icon: "🔒" },
                { name: "Internet", icon: "📡" },
                { name: "Windows", icon: "🪟" }
              ].map((industry, index) => (
                <motion.button
                  key={industry.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + index * 0.05, duration: 0.4 }}
                  className="group relative flex flex-col items-center justify-center p-2 sm:p-3 lg:p-3 rounded-lg border-2 border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 overflow-hidden min-w-[70px] sm:min-w-[80px] lg:min-w-[85px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300 rounded-2xl" />
                  <span className="text-2xl sm:text-2xl lg:text-3xl mb-1 relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                    {industry.icon}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-white relative z-10 text-center">
                    {industry.name}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>

          {/* Steps - Smaller cards */}
          <motion.div 
            className="order-1 lg:order-2 lg:col-span-2 space-y-4"
            variants={staggerContainer}
          >
            {demoSteps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={staggerItem}
                whileHover={{ x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <GlowCard
                  glowColor={step.color}
                  customSize
                  className={`cursor-pointer transition-all duration-500 ${
                    activeStep === index 
                      ? 'p-6 scale-105 opacity-100' 
                      : 'p-4 scale-95 opacity-70 hover:opacity-85'
                  }`}
                  onClick={() => handleStepClick(index)}
                >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-500 ${
                    activeStep === index ? 'w-10 h-10' : 'w-8 h-8'
                  } ${
                    step.color === 'blue' ? 'bg-blue-500/20' :
                    step.color === 'purple' ? 'bg-purple-500/20' :
                    'bg-green-500/20'
                  }`}>
                    {step.icon === 'play' && <Play className={`transition-all duration-500 ${
                      activeStep === index ? 'w-5 h-5' : 'w-4 h-4'
                    } ${
                      step.color === 'blue' ? 'text-blue-400' :
                      step.color === 'purple' ? 'text-purple-400' :
                      'text-green-400'
                    }`} />}
                    {step.icon === 'check' && <CheckCircle2 className={`transition-all duration-500 ${
                      activeStep === index ? 'w-5 h-5' : 'w-4 h-4'
                    } ${
                      step.color === 'blue' ? 'text-blue-400' :
                      step.color === 'purple' ? 'text-purple-400' :
                      'text-green-400'
                    }`} />}
                    {step.icon === 'trend' && <TrendingUp className={`transition-all duration-500 ${
                      activeStep === index ? 'w-5 h-5' : 'w-4 h-4'
                    } ${
                      step.color === 'blue' ? 'text-blue-400' :
                      step.color === 'purple' ? 'text-purple-400' :
                      'text-green-400'
                    }`} />}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs text-slate-500 mb-1 transition-all duration-500 ${activeStep === index ? 'opacity-100' : 'opacity-70'}`}>Step {step.id}</div>
                    <h3 className={`font-semibold text-white mb-1 transition-all duration-500 ${activeStep === index ? 'text-lg' : 'text-base'}`}>{step.title}</h3>
                    <p className={`text-base transition-all duration-300 overflow-hidden ${activeStep === index ? 'max-h-40 opacity-100 mt-2 text-white' : 'max-h-0 opacity-0 text-slate-300'}`}>{step.description}</p>
                  </div>
                </div>
                </GlowCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

