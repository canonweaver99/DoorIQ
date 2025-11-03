'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Pause, Volume2, CheckCircle2, XCircle, TrendingUp } from 'lucide-react'
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
  const { ref, controls } = useScrollAnimation(0.2)

  const handlePlayDemo = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
    setIsPlaying(!isPlaying)
  }
  
  const handleStepClick = (index: number) => {
    setActiveStep(index)
  }

  return (
    <motion.section 
      ref={ref}
      className="relative py-16 md:py-20" 
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
              className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              {/* Video Player */}
              <video
                ref={videoRef}
                src="/austin-video.mp4"
                controls={isPlaying}
                autoPlay={false}
                loop
                className="w-full h-full object-cover"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                playsInline
              />
              
              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <Button
                      onClick={handlePlayDemo}
                      size="lg"
                      className="w-20 h-20 rounded-full bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/50"
                    >
                      <Play className="w-8 h-8 ml-1 text-white" />
                    </Button>
                  </motion.div>
                </div>
              )}
              
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

            {/* Social Proof */}
            <motion.div 
              className="mt-6 flex items-center justify-center gap-8 text-sm text-slate-400"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>No downloads required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span>Works on any device</span>
              </div>
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

