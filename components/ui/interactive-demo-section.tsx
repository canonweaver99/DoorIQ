'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle2, TrendingUp } from 'lucide-react'
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
  const sectionRef = useRef<HTMLElement | null>(null)
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasAutoSwitchedRef = useRef(false)
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

  // Auto-switch steps every 2 seconds when section first comes into view
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAutoSwitchedRef.current) {
            // Start auto-switching when section comes into view
            hasAutoSwitchedRef.current = true
            setActiveStep(0) // Reset to first step
            
            // Clear any existing interval
            if (stepIntervalRef.current) {
              clearInterval(stepIntervalRef.current)
            }
            
            // Switch steps every 2 seconds using functional state updates
            stepIntervalRef.current = setInterval(() => {
              setActiveStep((prevStep) => (prevStep + 1) % demoSteps.length)
            }, 2000)
          } else if (!entry.isIntersecting) {
            // Stop auto-switching when section goes out of view
            if (stepIntervalRef.current) {
              clearInterval(stepIntervalRef.current)
              stepIntervalRef.current = null
            }
            // Reset flag so it can auto-switch again when scrolled back into view
            hasAutoSwitchedRef.current = false
            setActiveStep(0)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px' }
    )

    observer.observe(section)

    return () => {
      observer.disconnect()
      if (stepIntervalRef.current) {
        clearInterval(stepIntervalRef.current)
      }
    }
  }, [])
  
  const handleStepClick = (index: number) => {
    setActiveStep(index)
    // Stop auto-switching when user manually clicks a step
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current)
      stepIntervalRef.current = null
      hasAutoSwitchedRef.current = true // Prevent auto-switching from restarting
    }
  }

  return (
    <motion.section 
      ref={(node) => {
        // Combine refs for both framer-motion and intersection observer
        if (ref && node) {
          ref.current = node as HTMLDivElement
        }
        sectionRef.current = node
      }}
      className="relative pt-6 sm:pt-10 md:pt-14 pb-12 sm:pb-16 md:pb-20" 
      id="dooriq-action"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-6 sm:mb-8 lg:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 20,
            mass: 1.5
          }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[56px] leading-[1.1] tracking-tight font-space font-bold mb-3 sm:mb-4 lg:mb-6 px-2 sm:px-0 text-white">
            See <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">DoorIQ</span> in Action
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-100 max-w-3xl mx-auto px-2 sm:px-0 font-sans leading-relaxed">
            Watch how a sales rep trains with an AI homeowner in under 2 minutes. 
            No scripts. No staged demos. Just real practice.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 items-start">
          {/* Demo Video/Player - Takes up more space */}
          <motion.div 
            className="order-1 lg:order-1 lg:col-span-3"
            variants={fadeInScale}
          >
            <motion.div 
              ref={videoContainerRef}
              className="relative aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black/50 backdrop-blur-sm border border-indigo-500/30 shadow-lg shadow-indigo-500/10"
              whileHover={{ scale: 1.01 }}
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
                className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 z-10 border border-indigo-500/30"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
              >
                <span className="text-xs sm:text-sm text-white font-semibold font-space">Step {demoSteps[activeStep].id}: {demoSteps[activeStep].title}</span>
              </motion.div>
            </motion.div>

            {/* Industry Cards - ARCHIVED */}
            {/* <motion.div 
              className="flex flex-wrap justify-center gap-1.5 sm:gap-2 w-full mt-4 sm:mt-5 lg:mt-6"
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
                  className="group relative flex flex-col items-center justify-center p-2 sm:p-2.5 lg:p-3 rounded-lg sm:rounded-xl border border-indigo-500/30 bg-black/50 backdrop-blur-sm hover:border-indigo-400/50 hover:bg-indigo-500/10 transition-all hover:scale-105 active:scale-95 overflow-hidden min-w-[60px] sm:min-w-[70px] lg:min-w-[80px]"
                >
                  <span className="text-xl sm:text-2xl lg:text-2xl mb-1 relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                    {industry.icon}
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold text-white relative z-10 text-center font-sans">
                    {industry.name}
                  </span>
                </motion.button>
              ))}
            </motion.div> */}
          </motion.div>

          {/* Steps - Smaller cards */}
          <motion.div 
            className="order-2 lg:order-2 lg:col-span-2 space-y-3 sm:space-y-4 mt-6 sm:mt-0"
            variants={staggerContainer}
          >
            {demoSteps.map((step, index) => (
              <motion.div
                key={step.id}
                variants={staggerItem}
                whileHover={{ x: 5 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  onClick={() => handleStepClick(index)}
                  className={`cursor-pointer rounded-lg sm:rounded-xl border transition-all duration-300 ${
                    activeStep === index 
                      ? 'border-indigo-500/50 bg-black/70 backdrop-blur-sm p-4 sm:p-5 lg:p-6 scale-[1.02] shadow-lg shadow-indigo-500/20' 
                      : 'border-indigo-500/30 bg-black/50 backdrop-blur-sm p-3 sm:p-4 hover:border-indigo-400/40 hover:bg-black/60 opacity-80 hover:opacity-90'
                  }`}
                  whileHover={{ scale: activeStep === index ? 1.02 : 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={`flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      activeStep === index ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-8 h-8 sm:w-10 sm:h-10'
                    } ${
                      activeStep === index 
                        ? 'bg-gradient-to-br from-indigo-500/30 to-purple-500/30' 
                        : 'bg-indigo-500/20'
                    }`}>
                      {step.icon === 'play' && <Play className={`transition-all duration-300 ${
                        activeStep === index ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4'
                      } text-indigo-400`} />}
                      {step.icon === 'check' && <CheckCircle2 className={`transition-all duration-300 ${
                        activeStep === index ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4'
                      } text-purple-400`} />}
                      {step.icon === 'trend' && <TrendingUp className={`transition-all duration-300 ${
                        activeStep === index ? 'w-5 h-5 sm:w-6 sm:h-6' : 'w-4 h-4'
                      } text-pink-400`} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs sm:text-sm font-semibold text-indigo-400 mb-1 transition-all duration-300 font-space ${activeStep === index ? 'opacity-100' : 'opacity-70'}`}>
                        Step {step.id}
                      </div>
                      <h3 className={`font-semibold text-white mb-1 transition-all duration-300 font-space ${
                        activeStep === index 
                          ? 'text-base sm:text-lg lg:text-xl' 
                          : 'text-sm sm:text-base'
                      }`}>
                        {step.title}
                      </h3>
                      <motion.p 
                        initial={false}
                        animate={{
                          height: activeStep === index ? 'auto' : 0,
                          opacity: activeStep === index ? 1 : 0,
                        }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className={`text-sm sm:text-base overflow-hidden text-slate-100 leading-relaxed font-sans ${
                          activeStep === index ? 'mt-2' : ''
                        }`}
                      >
                        {step.description}
                      </motion.p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

