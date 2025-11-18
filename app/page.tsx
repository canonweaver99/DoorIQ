'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { HeroSection } from '@/components/ui/hero-section-dark'
import { InteractiveDemoSection } from '@/components/ui/interactive-demo-section'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'
import { useScrollAnimation, fadeInUp, fadeInScale, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'
import { vibrate } from '@/lib/utils'
import { Users, TrendingUp, Clock, Smartphone, ChevronRight } from 'lucide-react'

// Dynamic imports for below-the-fold components (code splitting)
const FaqSection = dynamic(() => import('@/components/ui/faq-section').then(mod => ({ default: mod.FaqSection })), {
  loading: () => <div className="min-h-[400px]" />,
  ssr: true,
})

const DashboardHeroPreview = dynamic(() => import('@/components/ui/dashboard-hero-preview').then(mod => ({ default: mod.DashboardHeroPreview })), {
  loading: () => <div className="min-h-[400px]" />,
  ssr: true,
})

const CalendarModal = dynamic(() => import('@/components/ui/calendar-modal').then(mod => ({ default: mod.CalendarModal })), {
  ssr: false, // Modal doesn't need SSR
})

const TestimonialsColumn = dynamic(() => import('@/components/ui/testimonials-columns-1').then(mod => ({ default: mod.TestimonialsColumn })), {
  loading: () => <div className="min-h-[200px]" />,
  ssr: true,
})

import { testimonialsData } from '@/components/ui/testimonials-columns-1'

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
  const router = useRouter()
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)

  // Handle email verification tokens from hash fragments
  useEffect(() => {
    const handleAuthRedirect = async () => {
      // Check if we have auth tokens in the hash fragment
      if (typeof window === 'undefined' || !window.location.hash) return

      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      // Only handle email verification (signup type)
      if (!accessToken || type !== 'signup') return

      try {
        console.log('🔐 Handling email verification from hash fragment')
        const supabase = createClient()

        // Set the session using the tokens from the hash
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        })

        if (error) {
          console.error('❌ Error setting session:', error)
          router.push('/auth/login?error=Unable to sign you in. Please try signing in manually.')
          return
        }

        if (data.session && data.user) {
          console.log('✅ Session set successfully')
          
          // Create user profile if it doesn't exist
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (!existingUser) {
            console.log('📝 Creating user profile in database...')
            const userMetadata = data.user.user_metadata
            
            // Create user profile via API
            const createResponse = await fetch('/api/users/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: data.user.id,
                email: data.user.email,
                full_name: userMetadata.full_name || userMetadata.name || data.user.email?.split('@')[0] || 'User',
              })
            })
            
            if (createResponse.ok) {
              console.log('✅ User profile created')
            } else {
              console.warn('⚠️ Failed to create user profile, but continuing...')
            }
          }
          
          // Clear the hash from URL and redirect
          window.history.replaceState(null, '', window.location.pathname)
          router.push('/dashboard')
          router.refresh()
        }
      } catch (error: any) {
        console.error('❌ Error handling auth redirect:', error)
        router.push('/auth/login?error=Authentication failed. Please try signing in.')
      }
    }

    handleAuthRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      {/* Calendar Modal */}
      <CalendarModal 
        isOpen={isCalendarModalOpen} 
        onClose={() => setIsCalendarModalOpen(false)} 
      />
      
      {/* 1) New Hero Section */}
      <HeroSection
        title="Over 10,000+ Pitches Practiced"
        titleHref="/pricing"
        subtitle={{
          regular: "Master Door to Door Sales with ",
          gradient: "AI-Powered Training",
        }}
        ctaSecondaryText="Book a Demo"
        onCtaSecondaryClick={() => setIsCalendarModalOpen(true)}
        bottomImage={undefined}
        gridOptions={{
          angle: 65,
          opacity: 0.15,
          cellSize: 50,
          lightLineColor: "rgb(100, 100, 120)",
          darkLineColor: "rgb(60, 60, 80)",
        }}
      />

      {/* 2) Interactive Demo - See DoorIQ in Action */}
      <InteractiveDemoSection />

      {/* 3) Meet Our Homeowners - ARCHIVED */}
      {/* <MeetHomeownersSection /> */}

      {/* 4) Dashboard Section */}
      <DashboardSection />

      {/* 5) Problem/Solution Section */}
      <ProblemSolutionSection />

      {/* 5.5) Manager Pricing Section */}
      <ManagerPricingSection onBookDemo={() => setIsCalendarModalOpen(true)} />

      {/* 6) Social Proof */}
      <SocialProofSection />

      {/* 7) Results / ROI - ARCHIVED */}
      {/* <ResultsSection /> */}

      {/* 8) FAQ */}
      <FaqSection
        title="Frequently Asked Questions"
        items={faqItems}
        contactInfo={{
          title: 'Ready to See DoorIQ in Action?',
          description: 'Book a personalized demo and see how DoorIQ can transform your sales training.',
          buttonText: 'Book a Demo',
          onContact: () => setIsCalendarModalOpen(true)
        }}
      />
    </div>
  );
}

// Problem/Solution Section
function ProblemSolutionSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  
  const problems = [
    {
      title: "New Reps Burn Out in Week 1",
      description: "Without real practice, they're learning on actual customers"
    },
    {
      title: "No Way to Practice Without Knocking",
      description: "Role-play doesn't cut it, but you can't waste leads"
    },
    {
      title: "You're Guessing What Works",
      description: "No data on objection handling, talk time, or close rates"
    }
  ]

  const solutions = [
    {
      title: "Unlimited Realistic Practice",
      description: "Face 11+ AI homeowner personas from skeptical to eager"
    },
    {
      title: "Reps Ramp 3x Faster",
      description: "Master objections and build confidence before their first real knock"
    },
    {
      title: "Know Exactly What's Working",
      description: "Track objection handling, talk-time, and close techniques with AI-powered grading"
    }
  ]

  return (
    <motion.section 
      ref={ref}
      className="py-12 sm:py-16 md:py-20 relative"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center mb-8 sm:mb-10 lg:mb-12" variants={fadeInUp}>
          <div className="text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.1] tracking-tight font-geist mb-4 sm:mb-5 lg:mb-6 pb-2 sm:pb-3 px-2 sm:px-0 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
              The Reality of Door-to-Door Sales Training
            </h2>
            <div className="mt-4 sm:mt-5 lg:mt-6 space-y-3 sm:space-y-4">
              {problems.map((problem, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-3"
                  initial="hidden"
                  animate={controls}
                  variants={{
                    hidden: { opacity: 0, x: -30 },
                    visible: { 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 1.0, duration: 0.6 }
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-red-600 mt-3" />
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-1 sm:mb-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500">{problem.title}</span>
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl text-slate-300">
                      {problem.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div 
            className="relative h-64 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 mt-6 sm:mt-0"
            variants={fadeInScale}
          >
            <Image
              src="/website image 1.png"
              alt="Frustrated sales rep reviewing notes before a door knock"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
              width={800}
              height={600}
            />
          </motion.div>
        </motion.div>

        {/* Problems - Cards - ARCHIVED */}
        {/* <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          variants={staggerContainer}
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="p-8 rounded-xl bg-red-900/10 border border-red-500/20 h-full"
            >
              <div className="flex items-start gap-4 mb-2 min-h-[4rem]">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-500/20 flex items-center justify-center mt-1">
                  <problem.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-semibold text-white leading-tight">{problem.title}</h3>
              </div>
              <p className="text-lg lg:text-xl text-white leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </motion.div> */}

        {/* Divider */}
        <motion.div 
          className="flex items-center justify-center mb-12 sm:mb-16 lg:mb-20"
          variants={fadeInScale}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full max-w-md" />
          <div className="mx-4 text-2xl font-bold text-purple-400">→</div>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full max-w-md" />
        </motion.div>

        {/* Solutions */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center mb-8 sm:mb-10 lg:mb-12"
          variants={fadeInUp}
        >
          <motion.div 
            className="relative h-64 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 lg:order-1 mt-6 sm:mt-0"
            variants={fadeInScale}
          >
            <Image
              src="/Website image 3.png"
              alt="Confident sales rep after training"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
              width={800}
              height={600}
            />
          </motion.div>
          <div className="text-center lg:text-left lg:order-2">
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.1] tracking-tight font-geist mb-4 sm:mb-5 lg:mb-6 px-2 sm:px-0 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
              Practice on AI Homeowners Before Real Doors
            </h3>
            <div className="mt-4 sm:mt-5 lg:mt-6 space-y-3 sm:space-y-4">
              {solutions.map((solution, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-3"
                  initial="hidden"
                  animate={controls}
                  variants={{
                    hidden: { opacity: 0, x: 30 },
                    visible: { 
                      opacity: 1, 
                      x: 0,
                      transition: { delay: index * 1.0, duration: 0.6 }
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mt-3" />
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white mb-1 sm:mb-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{solution.title}</span>
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl text-slate-300">
                      {solution.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Solutions - Cards - ARCHIVED */}
        {/* <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
        >
          {solutions.map((solution, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <GlowCard
                glowColor={solution.color === 'blue' ? 'blue' : solution.color === 'purple' ? 'purple' : 'green'}
                customSize
                className="p-8 h-full"
              >
                <div className="flex items-start gap-4 mb-2 min-h-[4rem]">
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mt-1">
                    <solution.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-semibold text-white leading-tight">{solution.title}</h3>
                </div>
                <p className="text-lg lg:text-xl text-white leading-relaxed">{solution.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div> */}

        <motion.div 
          className="text-center mt-12 sm:mt-14 lg:mt-16 mb-12 sm:mb-14 lg:mb-16"
          variants={fadeInUp}
        >
          <motion.span 
            className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
              <Link
                href="/pricing"
                onClick={() => vibrate()}
                className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/10 via-purple-400/20 to-transparent dark:from-zinc-300/5 dark:via-purple-400/15 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-purple-400/30 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/25 transition-all py-3.5 px-8 text-base sm:text-lg font-semibold"
              >
                See Pricing
              </Link>
            </div>
          </motion.span>
        </motion.div>
      </div>
    </motion.section>
  )
}

// Manager Pricing Section
function ManagerPricingSection({ onBookDemo }: { onBookDemo: () => void }) {
  const { ref, controls } = useScrollAnimation(0.2)
  
  const benefits = [
    {
      icon: Clock,
      title: "Year-Round Training",
      description: "Not just onboarding - continuous skill development keeps your team sharp all season long"
    },
    {
      icon: Smartphone,
      title: "Virtual Manager in Every Pocket",
      description: "Each rep has 24/7 access to AI coaching, consistent feedback, and practice scenarios"
    },
    {
      icon: TrendingUp,
      title: "Massive ROI Potential",
      description: "Teams see 40% less manager shadowing time and 2x faster rep ramp-up"
    },
    {
      icon: Users,
      title: "Built for Teams 5+",
      description: "Scale your training program without scaling your management overhead"
    }
  ]

  return (
    <motion.section 
      ref={ref}
      className="py-12 sm:py-16 md:py-20 relative"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div 
          className="text-center mb-8 sm:mb-10 lg:mb-12"
          variants={fadeInUp}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.1] tracking-tight font-geist mb-4 sm:mb-5 lg:mb-6 px-2 sm:px-0 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Managers</span>: Scale Your Team's Performance
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-slate-300 max-w-3xl mx-auto">
            Give every rep a virtual manager in their pocket. Year-round training that drives ROI for teams of 5+.
          </p>
        </motion.div>

        {/* Benefits Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12 lg:mb-16"
          variants={staggerContainer}
        >
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <motion.div
                key={index}
                variants={staggerItem}
                className="relative group"
              >
                <GlowCard
                  glowColor={index % 2 === 0 ? 'purple' : 'blue'}
                  customSize
                  className="p-6 sm:p-8 h-full"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                        {benefit.title}
                      </h3>
                      <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            )
          })}
        </motion.div>

        {/* ROI Highlight */}
        <motion.div
          variants={fadeInUp}
          className="bg-gradient-to-br from-emerald-500/10 to-purple-500/10 border border-emerald-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-10 mb-10 sm:mb-12"
        >
          <div className="text-center">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
              The ROI That Matters
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">40%</div>
                <div className="text-base sm:text-lg text-slate-300">Less manager shadowing time</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">2×</div>
                <div className="text-base sm:text-lg text-slate-300">Faster rep ramp-up</div>
              </div>
              <div>
                <div className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-2">24/7</div>
                <div className="text-base sm:text-lg text-slate-300">Virtual manager availability</div>
              </div>
            </div>
            <p className="text-base sm:text-lg text-slate-300 mt-6 max-w-2xl mx-auto">
              When each rep closes just 1 extra deal per month, teams see massive returns. Calculate your ROI with our pricing calculator.
            </p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6"
          variants={fadeInUp}
        >
          <motion.span 
            className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
              <Link
                href="/pricing?reps=5"
                onClick={() => vibrate()}
                className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/10 via-purple-400/20 to-transparent dark:from-zinc-300/5 dark:via-purple-400/15 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-purple-400/30 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/25 transition-all py-3.5 px-8 text-base sm:text-lg font-semibold"
              >
                See Pricing for Your Team
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.span>
          
          <motion.button
            onClick={onBookDemo}
            className="inline-flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white px-8 py-3.5 text-base sm:text-lg font-semibold transition-all hover:scale-105 active:scale-95"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Book a Demo
            <ChevronRight className="w-4 h-4 ml-2" />
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  )
}

// Animated Sections
function DashboardSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  
  return (
    <motion.section 
      ref={ref}
      className="relative w-full max-w-full mx-auto z-1 py-12 sm:py-14 lg:py-16"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-[1400px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-20 xl:px-24 2xl:px-32">
        <motion.div 
          className="text-center mb-6 sm:mb-8 lg:mb-12 px-2 sm:px-0"
          variants={fadeInUp}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.1] tracking-tight font-geist bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] pb-2">
            Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Dashboards</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Analytics</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto mt-4 sm:mt-5 lg:mt-6">
            Track every rep's performance in real-time with detailed analytics and insights
          </p>
        </motion.div>

        {/* Feature Cards - ARCHIVED */}
        {/* <motion.div
          id="features"
          variants={fadeInUp}
          className="mb-8 sm:mb-12"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:justify-center gap-3 sm:gap-3 lg:gap-4 max-w-6xl mx-auto px-4">
            {[
              { feature: "AI-Powered Roleplay", isMobileOnly: true },
              { feature: "Real-Time Feedback", isMobileOnly: true },
              { feature: "Performance Analytics", isMobileOnly: true },
              { feature: "Objection Handling", isMobileOnly: true },
              { feature: "Team Leaderboards", isMobileOnly: true },
              { feature: "Progress Tracking", isMobileOnly: true },
              { feature: "Unlimited Practice", isMobileOnly: true },
              { feature: "Manager Insights", isMobileOnly: true },
            ].map((item, index) => (
              <motion.div
                key={`mobile-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium text-white backdrop-blur-sm transition-all cursor-default text-center whitespace-nowrap overflow-hidden text-ellipsis sm:hidden"
                style={{ contain: 'layout style paint', willChange: 'transform, opacity' }}
              >
                {item.feature}
              </motion.div>
            ))}
            {[
              "AI-Powered Roleplay",
              "Real-Time Feedback",
              "Performance Analytics",
              "Speech Analysis",
              "Objection Handling",
              "Upload Pitch Recordings",
              "Team Leaderboards",
              "Custom Grading",
              "Progress Tracking",
              "Export Reports",
              "Manager Insights",
              "Mobile Friendly",
              "Unlimited Practice",
              "In-App Messaging",
              "Knowledge Base"
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.02 }}
                className="px-4 sm:px-5 lg:px-6 xl:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium text-white backdrop-blur-sm transition-all cursor-default text-center whitespace-nowrap flex-shrink-0 hidden sm:block"
                style={{ contain: 'layout style paint', willChange: 'transform, opacity' }}
              >
                {feature}
              </motion.div>
            ))}
          </div>
        </motion.div> */}

        <motion.div
          variants={fadeInScale}
        >
          <DashboardHeroPreview />
        </motion.div>
      </div>
    </motion.section>
  )
}

function SocialProofSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  
  return (
    <motion.section 
      className="py-2 sm:py-4" 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={fadeInUp}
    >
      <TestimonialsSection />
    </motion.section>
  )
}

function ResultsSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  
  return (
    <motion.section 
      className="py-16 md:py-20" 
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <motion.h2 
              className="text-[56px] leading-[1.1] tracking-tight font-geist text-center lg:text-left bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]"
              variants={fadeInUp}
            >
              Results That Move the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Needle</span>
            </motion.h2>
            <motion.p 
              className="text-lg sm:text-xl text-slate-300 mt-4 text-center lg:text-left max-w-xl"
              variants={fadeInUp}
            >
              See measurable improvements in close rates, ramp time, and team performance
            </motion.p>
          </div>
          <motion.div 
            className="relative h-96 rounded-2xl overflow-hidden border border-white/10"
            variants={fadeInScale}
          >
            <Image
              src="/website image 4.png"
              alt="Successful sales rep"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
          </motion.div>
        </div>
        <motion.div 
          className="mt-12 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6"
          variants={staggerContainer}
        >
          <AnimatedStatCard 
            value={27} 
            suffix="%" 
            prefix="+"
            label="average improvement in close-rate after five sessions" 
            delay={0}
          />
          <AnimatedStatCard 
            value={40} 
            suffix="%" 
            label="less manager time spent on live shadowing" 
            delay={100}
          />
          <AnimatedStatCard 
            value={2} 
            suffix="×" 
            label="faster ramp for new reps" 
            delay={200}
          />
          <AnimatedStatCard 
            rawValue="< 10 min"
            label="to run a high-impact practice session" 
            delay={300}
          />
        </motion.div>
      </div>
    </motion.section>
  )
}

function AnimatedStatCard({ 
  value, 
  rawValue, 
  prefix = '', 
  suffix = '', 
  label, 
  delay = 0 
}: { 
  value?: number
  rawValue?: string
  prefix?: string
  suffix?: string
  label: string
  delay?: number
}) {
  const [hasAnimated, setHasAnimated] = useState(false)
  const [displayValue, setDisplayValue] = useState(0)
  
  // Determine glow color based on delay for variety
  const getGlowColor = () => {
    if (delay === 0) return 'blue';
    if (delay === 100) return 'purple';
    if (delay === 200) return 'green';
    return 'orange';
  };
  
  return (
    <motion.div
      variants={staggerItem}
      onViewportEnter={() => {
        if (!hasAnimated && value) {
          setHasAnimated(true)
          // Animate counting
          const duration = 2000
          const steps = 60
          const increment = value / steps
          let current = 0
          
          const timer = setInterval(() => {
            current += increment
            if (current >= value) {
              setDisplayValue(value)
              clearInterval(timer)
            } else {
              setDisplayValue(Math.floor(current))
            }
          }, duration / steps)
        }
      }}
      viewport={{ once: true, amount: 0.5 }}
    >
      <GlowCard
        glowColor={getGlowColor()}
        customSize
        className="text-center h-full"
      >
        <div className="flex flex-col items-center justify-center h-full">
          <motion.div 
            className="text-4xl font-bold text-slate-100"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay / 1000, duration: 0.5 }}
          >
            {rawValue || `${prefix}${displayValue}${suffix}`}
          </motion.div>
          <div className="mt-2 text-white text-base">{label}</div>
        </div>
      </GlowCard>
    </motion.div>
  )
}

function TestimonialsSection() {
  const { ref, controls } = useScrollAnimation(0.2)

  const columnSize = Math.ceil(testimonialsData.length / 3)
  const firstColumn = testimonialsData.slice(0, columnSize)
  const secondColumn = testimonialsData.slice(columnSize, columnSize * 2)
  const thirdColumn = testimonialsData.slice(columnSize * 2)

  return (
    <motion.div
      ref={ref}
      className="mt-12 px-4 sm:px-0"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="flex justify-center">
        <motion.div 
          className="border py-1 px-4 rounded-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          Testimonials
        </motion.div>
      </div>

      <h3 
        className="text-center text-2xl sm:text-4xl lg:text-[56px] leading-[1.2] sm:leading-[1.1] tracking-tight font-geist mt-6 px-4 sm:px-0 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] break-words"
      >
        What Sales Teams Say About <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">DoorIQ</span>
      </h3>

      <motion.div
        className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[740px] overflow-hidden px-2 sm:px-0"
        variants={{
          hidden: { opacity: 0, y: 50 },
          visible: {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.8,
              staggerChildren: 0.2
            }
          }
        }}
      >
        <motion.div variants={staggerItem}>
          <TestimonialsColumn testimonials={firstColumn} duration={18} />
        </motion.div>
        {secondColumn.length > 0 && (
          <motion.div variants={staggerItem} className="hidden md:block">
            <TestimonialsColumn testimonials={secondColumn} duration={22} />
          </motion.div>
        )}
        {thirdColumn.length > 0 && (
          <motion.div variants={staggerItem} className="hidden lg:block">
            <TestimonialsColumn testimonials={thirdColumn} duration={20} />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
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
      'DoorIQ is designed to replace your current training software entirely. We offer a white label version for companies that includes custom objections tailored to your specific products and services, as well as custom design and branding to match your company\'s identity. This allows you to have a fully branded training platform that reflects your unique sales process and customer interactions.',
  },
]
