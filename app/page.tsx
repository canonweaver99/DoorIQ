'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react'
import { BackgroundCircles } from '@/components/ui/background-circles'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'
import { FaqSection } from '@/components/ui/faq-section'
import { TestimonialsColumn, testimonialsData } from '@/components/ui/testimonials-columns-1'
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from '@/components/trainer/personas'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'

// Hook for intersection observer
function useInView(threshold = 0.1) {
  const [isInView, setIsInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return [ref, isInView] as const
}

// Hook for counting animation
function useCountUp(end: number, duration = 2000, startWhen = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!startWhen) return

    let startTime: number
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [end, duration, startWhen])

  return count
}

// Create agent data with avatars
const AGENTS_WITH_AVATARS = ALLOWED_AGENT_ORDER.map((agentName) => {
  const metadata = PERSONA_METADATA[agentName]
  return {
    name: agentName,
    subtitle: metadata.bubble.subtitle,
    difficulty: metadata.bubble.difficulty,
    image: metadata.bubble.image,
    color: metadata.bubble.color,
  }
}).filter((agent) => agent.image)

export default function Home() {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0)
  const currentAgent = AGENTS_WITH_AVATARS[currentAgentIndex]
  const variantStyles = COLOR_VARIANTS[currentAgent?.color as keyof typeof COLOR_VARIANTS]

  const nextAgent = () => {
    setCurrentAgentIndex((prev) => (prev + 1) % AGENTS_WITH_AVATARS.length)
  }

  const prevAgent = () => {
    setCurrentAgentIndex((prev) => (prev - 1 + AGENTS_WITH_AVATARS.length) % AGENTS_WITH_AVATARS.length)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      {/* 1) Hero with Agent Avatars */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>
          <div className="absolute top-1/3 left-1/3 w-[600px] h-[600px] bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
          {/* Social Proof Badge */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-md px-4 py-2 rounded-full border border-emerald-500/20">
              <span className="text-xs sm:text-sm text-white/90">🔥 500+ reps improving close rates daily</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 sm:mb-6 leading-tight px-4">
              <span className="bg-gradient-to-b from-white via-white to-slate-300 bg-clip-text text-transparent">
                Close
              </span>{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                27% More Deals
              </span>
              <br />
              <span className="bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent">
                With AI Training
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto px-4">
              Train with lifelike AI homeowners. Get instant feedback. Watch your close rate climb—backed by real data.
            </p>
          </div>

          {/* Agent Avatar Carousel */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-8 sm:mb-12">
            {/* Previous Button */}
            <button
              onClick={prevAgent}
              className="p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
              aria-label="Previous agent"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            {/* Agent Avatar with Animated Circles */}
            <div className="relative">
              <div className="relative h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96">
                {/* Animated Circles */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent"
                    style={{
                      borderColor: variantStyles?.border[i]?.replace('border-', '') || 'rgb(255,255,255,0.2)',
                    }}
                    animate={{
                      rotate: 360,
                      scale: [1, 1.05 + i * 0.05, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  />
                ))}

                {/* Agent Avatar */}
                {currentAgent?.image && (
                  <motion.div 
                    key={currentAgentIndex}
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      scale: {
                        duration: 5,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      },
                      opacity: {
                        duration: 0.3,
                      }
                    }}
                  >
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                      <Image
                        src={currentAgent.image}
                        alt={currentAgent.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 256px, (max-width: 768px) 320px, 384px"
                        priority
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Agent Info Below */}
              <div className="text-center mt-6">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentAgent?.name}</h3>
                <p className="text-sm sm:text-base text-slate-400 mb-3">{currentAgent?.subtitle}</p>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentAgent?.difficulty}
                </div>
              </div>

              {/* Agent Counter */}
              <div className="text-center mt-4">
                <div className="text-xs text-slate-500">
                  {currentAgentIndex + 1} / {AGENTS_WITH_AVATARS.length}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={nextAgent}
              className="p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm"
              aria-label="Next agent"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6 px-4">
            <Link href="/trainer/select-homeowner" className="w-full sm:w-auto">
              <Button className="w-full px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold shadow-2xl hover:shadow-emerald-500/25 transition-all hover:scale-105 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500">
                Start Training Free
              </Button>
            </Link>
            <Link href="#demo" className="w-full sm:w-auto">
              <Button className="w-full px-8 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-semibold bg-white/10 hover:bg-white/20 border border-white/20 text-white backdrop-blur-sm">
                See Live Demo (30 sec)
              </Button>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-white/60 mb-6 sm:mb-8 px-4">
            <span className="flex items-center gap-1">✓ No credit card</span>
            <span className="flex items-center gap-1">✓ 5-min setup</span>
            <span className="flex items-center gap-1">✓ Results in first session</span>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 justify-center items-center px-4">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">12,847</div>
              <div className="text-xs sm:text-sm text-slate-400">Sessions Today</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">+27%</div>
              <div className="text-xs sm:text-sm text-slate-400">Avg Close Rate ↑</div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">4.9/5</div>
              <div className="text-xs sm:text-sm text-slate-400">User Rating ⭐</div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </section>

      {/* 2) Social Proof */}
      <SocialProofSection />

      {/* 3) How It Works (3 steps) */}
      <HowItWorksSection />

      {/* 4) Results / ROI */}
      <ResultsSection />

      {/* Demo anchor placeholder */}
      <section id="demo" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="aspect-video w-full rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
            30-sec demo coming soon
          </div>
        </div>
      </section>

      <FaqSection
        title="Frequently Asked Questions"
        description="Get quick answers as you evaluate DoorIQ for your team."
        items={faqItems}
        contactInfo={{
          title: 'Still need help?',
          description: 'Reach out and our crew will walk you through a live session.',
          buttonText: 'Contact Support',
          onContact: () => window.open('mailto:hello@dooriq.com', '_blank')
        }}
      />
    </div>
  );
}

// Animated Sections
function SocialProofSection() {
  const [ref, isInView] = useInView(0.2)
  
  return (
    <section className="py-16" ref={ref}>
      <div className={`transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <TestimonialsSection />
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const [ref, isInView] = useInView(0.2)
  
  return (
    <section className="py-20" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`text-4xl font-bold text-slate-100 text-center transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Your New Training Loop
        </h2>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Train with AI Homeowners",
              body: "Have real voice conversations with an AI homeowner who interrupts, hesitates, and pushes back like the real world."
            },
            {
              title: "Get Instant Feedback", 
              body: "Objective scoring on tone, pace, discovery, and objection handling - with concrete next steps."
            },
            {
              title: "Make Virtual Money",
              body: "Climb the leaderboard and earn virtual rewards. Compete with teammates and track your ranking as you improve your close rate."
            }
          ].map((item, index) => (
            <GlowCard
              key={index}
              glowColor={index === 0 ? 'blue' : index === 1 ? 'purple' : 'green'}
              customSize
              className={`transition-all duration-1000 h-full min-h-[240px] md:min-h-[280px] p-6 md:p-8 ${
                isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${index * 200}ms` } as React.CSSProperties}
            >
              <div className="flex flex-col h-full justify-center">
                <h3 className="text-2xl md:text-3xl font-semibold bg-gradient-to-b from-white to-slate-300 bg-clip-text text-transparent drop-shadow">
                  {item.title}
                </h3>
                <p className="mt-4 text-base md:text-lg text-slate-200/90 leading-relaxed">
                  {item.body}
                </p>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>
    </section>
  )
}

function ResultsSection() {
  const [ref, isInView] = useInView(0.2)
  
  return (
    <section className="py-20" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className={`text-4xl font-bold text-slate-100 text-center transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          Numbers That Move the Leaderboard
        </h2>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStatCard 
            value={27} 
            suffix="%" 
            prefix="+"
            label="average improvement in close-rate after five sessions" 
            startAnimation={isInView}
            delay={0}
          />
          <AnimatedStatCard 
            value={40} 
            suffix="%" 
            label="less manager time spent on live shadowing" 
            startAnimation={isInView}
            delay={200}
          />
          <AnimatedStatCard 
            value={2} 
            suffix="×" 
            label="faster ramp for new reps" 
            startAnimation={isInView}
            delay={400}
          />
          <AnimatedStatCard 
            rawValue="< 10 min"
            label="to run a high-impact practice session" 
            startAnimation={isInView}
            delay={600}
          />
        </div>
        <p className={`text-center text-slate-300 mt-10 max-w-3xl mx-auto transition-all duration-1000 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '800ms' }}>
          Give your team the reps that actually matter - the hard ones.
        </p>
      </div>
    </section>
  )
}

function AnimatedStatCard({ 
  value, 
  rawValue, 
  prefix = '', 
  suffix = '', 
  label, 
  startAnimation, 
  delay = 0 
}: { 
  value?: number
  rawValue?: string
  prefix?: string
  suffix?: string
  label: string
  startAnimation: boolean
  delay?: number
}) {
  const animatedValue = useCountUp(value || 0, 2000, startAnimation)
  
  // Determine glow color based on delay for variety
  const getGlowColor = () => {
    if (delay === 0) return 'blue';
    if (delay === 200) return 'purple';
    if (delay === 400) return 'green';
    return 'orange';
  };
  
  return (
    <GlowCard
      glowColor={getGlowColor()}
      customSize
      className={`text-center transition-all duration-1000 h-full ${
        startAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` } as React.CSSProperties}
    >
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-4xl font-bold text-slate-100">
          {rawValue || `${prefix}${animatedValue}${suffix}`}
        </div>
        <div className="mt-2 text-slate-300 text-sm">{label}</div>
      </div>
    </GlowCard>
  )
}

function TestimonialsSection() {
  const [ref, isInView] = useInView(0.2)

  const columnSize = Math.ceil(testimonialsData.length / 3)
  const firstColumn = testimonialsData.slice(0, columnSize)
  const secondColumn = testimonialsData.slice(columnSize, columnSize * 2)
  const thirdColumn = testimonialsData.slice(columnSize * 2)

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 mt-12 ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="flex justify-center">
        <div className="border py-1 px-4 rounded-lg">Testimonials</div>
      </div>

      <h3 className="text-center text-3xl md:text-4xl font-semibold text-white mt-6">
        What teams say about DoorIQ
      </h3>

      <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden">
        <TestimonialsColumn testimonials={firstColumn} duration={18} />
        {secondColumn.length > 0 && (
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={22} />
        )}
        {thirdColumn.length > 0 && (
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={20} />
        )}
      </div>
    </div>
  )
}

const faqItems = [
  {
    question: 'How quickly can we get reps practicing?',
    answer:
      'Most teams run their first session in under 15 minutes. Invite reps, pick a homeowner persona, and start holding real-feel conversations immediately.',
  },
  {
    question: 'Does DoorIQ replace live manager coaching?',
    answer:
      'DoorIQ gives managers leverage - reps can practice high-frequency reps independently while leaders review the tough moments together.',
  },
  {
    question: 'Can new hires ramp with guided scenarios?',
    answer:
      'Yes. New teammates get curated objection flows and pacing tips that match their experience level so confidence builds from day one.',
  },
  {
    question: 'How do we track improvement over time?',
    answer:
      'You will see trends for objection handling, tone, discovery depth, and more. Scores roll into the leaderboard so progress stays visible.',
  },
  {
    question: 'Can DoorIQ plug into our existing tools?',
    answer:
      'DoorIQ integrates with the systems sales leaders already use so insights and recordings stay centralized.',
  },
]