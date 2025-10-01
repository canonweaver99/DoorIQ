'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { BackgroundCircles } from '@/components/ui/background-circles'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'
import { FaqSection } from '@/components/ui/faq-section'
import { TestimonialsColumn, testimonialsData } from '@/components/ui/testimonials-columns-1'

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

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      {/* 1) Hero */}
      <section className="relative p-0">
        <div className="w-full">
          <BackgroundCircles 
            title="Practice Before You Knock" 
            description="Lifelike AI homeowners. Instant feedback. Better reps." 
            ctaPrimaryHref="/trainer/select-homeowner"
            ctaPrimaryText="Start Training Now"
            ctaSecondaryHref="#demo"
            ctaSecondaryText="Watch 30-sec Demo"
          />
          <div className="text-center px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-28 lg:-mt-32">
            <p className="text-sm text-white/70 drop-shadow">Powered by enterprise-grade speech + realtime AI.</p>
          </div>
        </div>
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