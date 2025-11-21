'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { HeroSection } from '@/components/ui/hero-section-dark'
import { InteractiveDemoSection } from '@/components/ui/interactive-demo-section'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'
import { useScrollAnimation, fadeInUp, fadeInScale, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'
import { vibrate, cn } from '@/lib/utils'
import { Users, TrendingUp, Clock, Smartphone, ChevronRight } from 'lucide-react'

// Dynamic imports for below-the-fold components (code splitting)

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
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836]">
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
      <motion.section
        className="py-8 sm:py-12 md:py-16 lg:py-20 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mb-12 max-w-5xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ 
              delay: 0.2,
              type: "spring",
              stiffness: 100,
              damping: 15,
              mass: 1
            }}
          >
            <h4 className="text-2xl sm:text-3xl md:text-4xl lg:text-[56px] leading-[1.2] sm:leading-[1.15] lg:leading-[1.1] tracking-tight font-space font-bold text-foreground mb-6 sm:mb-8 lg:mb-12 text-center">
              Frequently Asked Questions
            </h4>
            <div className="space-y-3 max-w-3xl mx-auto">
              {faqItems.map((faq, index) => (
                <div key={index} className="rounded-lg border border-border/20 dark:border-white/20 bg-card dark:bg-black overflow-hidden">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    className="w-full p-5 flex items-center justify-between text-left hover:bg-background/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <h5 className="text-foreground font-semibold text-base sm:text-lg lg:text-xl font-space pr-4">{faq.question}</h5>
                    <ChevronRight 
                      className={`w-5 h-5 text-foreground flex-shrink-0 transition-transform ${openFAQ === index ? 'rotate-90' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {openFAQ === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-base sm:text-lg lg:text-xl text-foreground/80 font-sans leading-relaxed px-5 pb-5 pt-0">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>
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
      description: "Face 14 AI homeowner personas from skeptical to eager"
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
      className="py-8 sm:py-12 md:py-16 lg:py-20 relative"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center mb-6 sm:mb-8 lg:mb-12" variants={fadeInUp}>
          <div className="text-center lg:text-left">
            <motion.h2 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[56px] leading-[1.2] sm:leading-[1.15] lg:leading-[1.1] tracking-tight font-space font-bold mb-3 sm:mb-4 lg:mb-6 pb-2 sm:pb-3 px-2 sm:px-0 text-foreground"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 1
              }}
            >
              The Reality of Door-to-Door Sales Training
            </motion.h2>
            <motion.div 
              className="mt-3 sm:mt-4 lg:mt-6 space-y-2.5 sm:space-y-3 lg:space-y-4"
              variants={staggerContainer}
            >
              {problems.map((problem, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-2 sm:gap-3"
                  variants={staggerItem}
                >
                  <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-orange-400 to-red-500 mt-1.5 sm:mt-2" />
                  <div className="flex-1">
                    <p className="text-lg sm:text-xl lg:text-3xl font-semibold mb-1 sm:mb-2 font-space">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-400 to-pink-500">{problem.title}</span>
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl text-foreground/80 font-sans leading-relaxed">
                      {problem.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <motion.div 
            className="relative h-64 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl overflow-hidden border border-orange-500/20 dark:border-orange-500/20 mt-6 sm:mt-0 bg-card/60 dark:bg-slate-800/60 shadow-lg shadow-orange-500/10 dark:shadow-orange-500/10"
            variants={fadeInScale}
          >
            <Image
              src="/website image 1.png"
              alt="Frustrated sales rep reviewing notes before a door knock"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
              quality={90}
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
          className="flex items-center justify-center mb-8 sm:mb-12 lg:mb-20"
          variants={fadeInScale}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full max-w-md" />
          <div className="mx-2 sm:mx-4 text-lg sm:text-xl lg:text-2xl font-bold text-indigo-400">→</div>
          <div className="h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-full max-w-md" />
        </motion.div>

        {/* Solutions */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center mb-6 sm:mb-8 lg:mb-12"
          variants={fadeInUp}
        >
          <motion.div 
            className="relative h-64 sm:h-80 lg:h-96 rounded-xl sm:rounded-2xl overflow-hidden border border-indigo-500/20 dark:border-indigo-500/20 lg:order-1 mt-6 sm:mt-0 bg-card/60 dark:bg-slate-800/60 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/10"
            variants={fadeInScale}
          >
            <Image
              src="/Website image 3.png"
              alt="Confident sales rep after training"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
              quality={90}
            />
          </motion.div>
          <div className="text-center lg:text-left lg:order-2">
            <motion.h3 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-[56px] leading-[1.2] sm:leading-[1.15] lg:leading-[1.1] tracking-tight font-space font-bold mb-3 sm:mb-4 lg:mb-6 px-2 sm:px-0 text-white"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 15,
                mass: 1
              }}
            >
              Practice on AI Homeowners Before Real Doors
            </motion.h3>
            <motion.div 
              className="mt-3 sm:mt-4 lg:mt-6 space-y-2.5 sm:space-y-3 lg:space-y-4"
              variants={staggerContainer}
            >
              {solutions.map((solution, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-2 sm:gap-3"
                  variants={staggerItem}
                >
                  <div className="flex-shrink-0 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 mt-1.5 sm:mt-2" />
                  <div className="flex-1">
                    <p className="text-lg sm:text-xl lg:text-3xl font-semibold mb-1 sm:mb-2 font-space">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">{solution.title}</span>
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl text-slate-100 font-sans leading-relaxed">
                      {solution.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
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
      </div>
    </motion.section>
  )
}

// Manager Pricing Section
function ManagerPricingSection({ onBookDemo }: { onBookDemo: () => void }) {
  const { ref, controls } = useScrollAnimation(0.2)
  const [numReps, setNumReps] = useState(15)
  const [roiDealValue, setRoiDealValue] = useState(300)
  
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
      title: "40% Less Shadowing",
      description: "Teams see significantly reduced manager shadowing time, freeing up leadership for strategic initiatives"
    },
    {
      icon: Users,
      title: "Built for Teams 5+",
      description: "Scale your training program without scaling your management overhead"
    }
  ]

  // Calculate pricing based on number of reps - Monthly pricing by tier (matching pricing page)
  const calculatePricing = (reps: number) => {
    let monthlyPrice: number
    let perRepRate: number
    let tierName: string
    let tierRange: string
    
    // Determine tier and pricing (matching pricing page)
    if (reps === 1) {
      // Solo/Startup tier: $99/month for 1 rep
      monthlyPrice = 99
      perRepRate = 99
      tierName = 'SOLO/STARTUP'
      tierRange = '1 rep'
    } else if (reps >= 5 && reps <= 20) {
      // Team tier: $79/month per rep, min 5 reps
      monthlyPrice = Math.max(5, reps) * 79
      perRepRate = 79
      tierName = 'TEAM'
      tierRange = '5-20 reps'
    } else if (reps >= 21 && reps <= 100) {
      // Growth tier: $59/month per rep
      monthlyPrice = reps * 59
      perRepRate = 59
      tierName = 'GROWTH'
      tierRange = '21-100 reps'
    } else if (reps > 100) {
      // Enterprise tier: $39/month per rep (starting at $39)
      monthlyPrice = reps * 39
      perRepRate = 39
      tierName = 'ENTERPRISE'
      tierRange = '100+ reps'
    } else {
      // Less than 5 reps (not Team tier yet) - defaults to Solo
      monthlyPrice = 99
      perRepRate = 99
      tierName = 'SOLO/STARTUP'
      tierRange = '1 rep'
    }
    
    // Calculate annual pricing (15% discount)
    const annualTotalPrice = Math.round(monthlyPrice * 12 * 0.85)
    const annualPerRepRate = Math.round(perRepRate * 0.85)
    
    return { 
      monthlyPrice,
      perRepRate,
      annualTotalPrice,
      annualPerRepRate,
      tierName,
      tierRange
    }
  }

  // Calculate Monthly ROI (matching pricing page calculation)
  const calculateMonthlyROI = (reps: number, monthlyCost: number, dealValue: number) => {
    // Simple calculation: reps × dealValue (1 extra deal per rep per month)
    const extraRevenue = reps * dealValue
    const netProfit = extraRevenue - monthlyCost
    const roi = monthlyCost > 0 ? (netProfit / monthlyCost) * 100 : 0
    const roiMultiplier = monthlyCost > 0 ? extraRevenue / monthlyCost : 0
    
    return {
      extraRevenue,
      monthlyCost,
      netProfit,
      roi,
      roiMultiplier
    }
  }

  const pricing = calculatePricing(numReps)
  // Use monthly pricing for ROI calculation
  const roiData = calculateMonthlyROI(numReps, pricing.monthlyPrice, roiDealValue)

  return (
    <motion.section 
      ref={ref}
      className="pt-6 sm:pt-8 md:pt-10 pb-8 sm:pb-10 md:pb-12 relative min-h-[85vh] flex items-center"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Compact Header */}
        <motion.div 
          className="text-center mb-6 sm:mb-8"
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight tracking-tight font-space font-bold mb-3 sm:mb-4 text-foreground">
            Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Managers</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-foreground/70 max-w-2xl mx-auto font-sans">
            Scale your team's performance with AI-powered training that delivers measurable results
          </p>
        </motion.div>

        {/* 50/50 Split - Benefits Left, ROI Calculator Right */}
        <motion.div
          variants={fadeInUp}
          className="mb-6"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-start">
            {/* Left Side - Benefits Grid */}
            <div className="relative">
              <motion.div 
                className="grid grid-cols-1 gap-[12px] sm:gap-[16px] h-full"
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
                        className="px-[16px] py-[14.44px] sm:px-[20px] sm:py-[18.05px] h-full bg-card/60 dark:bg-black/60"
                      >
                        <div className="flex items-start gap-[12px]">
                          <div className="flex-shrink-0 w-[40px] h-[40px] rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                            <Icon className="w-[20px] h-[20px] text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-[3.61px] sm:mb-[5.415px] font-space">
                              {benefit.title}
                            </h3>
                            <p className="text-sm sm:text-base text-foreground/80 leading-[1.35375] font-sans">
                              {benefit.description}
                            </p>
                          </div>
                        </div>
                      </GlowCard>
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            {/* Right Side - ROI Calculator */}
            <div className="relative">
              {/* Grid Background */}
              <div
                className={cn(
                  'z-[-10] pointer-events-none absolute -inset-8',
                  'bg-[linear-gradient(to_right,theme(colors.white/.06)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.white/.06)_1px,transparent_1px)]',
                  'bg-[size:24px_24px]',
                  '[mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,var(--background)_20%,transparent_70%)]',
                )}
              />
              
              {/* ROI Calculator Card */}
              <div className="bg-gradient-to-br from-card via-card/95 to-card dark:from-black dark:via-slate-950 dark:to-black border-2 border-border/40 dark:border-white/40 rounded-2xl p-5 sm:p-6 md:p-8 relative z-10 shadow-2xl shadow-purple-500/10">
              {/* ROI Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-2 tracking-tight font-space" style={{ letterSpacing: '-0.02em' }}>
                  Calculate Your ROI
                </h3>
              </div>

              {/* Inputs Side by Side */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Number of Sales Reps */}
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-foreground mb-3 text-center tracking-wide font-space">
                      Number of Sales Reps:
                    </label>
                    <div className="text-center">
                      <input
                        type="number"
                        min="5"
                        max="500"
                        value={numReps}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 5
                          setNumReps(Math.max(5, Math.min(500, value)))
                        }}
                        className="inline-block px-4 py-2 rounded-lg border-2 border-border/40 dark:border-white/40 bg-background dark:bg-black text-foreground text-xl font-bold font-space text-center w-24 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                      <span className="text-foreground text-base ml-2 font-sans">reps</span>
                    </div>
                  </div>

                  {/* Value per Extra Deal */}
                  <div>
                    <label className="block text-sm sm:text-base font-bold text-foreground mb-3 text-center tracking-wide font-space">
                      Value per Extra Deal ($):
                    </label>
                    <div className="text-center">
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="50"
                        value={roiDealValue || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                          setRoiDealValue(Math.max(0, Math.min(1000, value)))
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            setRoiDealValue(300)
                          }
                        }}
                        className="inline-block px-4 py-2 rounded-lg border-2 border-border/40 dark:border-white/40 bg-background dark:bg-black text-foreground text-xl font-bold font-space text-center w-32 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Cards - Monthly and Annual */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                {/* Monthly Card */}
                <div className="relative w-full rounded-lg border border-border/30 dark:border-white/30 px-3 sm:px-4 pt-3 pb-3 bg-card/60 dark:bg-black/60">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 font-space">Monthly</h3>
                  <div className="text-foreground flex items-end gap-0.5">
                    <span className="text-sm">$</span>
                    <motion.span 
                      key={pricing.perRepRate}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.3 }}
                      className="text-foreground -mb-0.5 text-xl sm:text-2xl font-extrabold tracking-tighter font-space"
                    >
                      {pricing.perRepRate.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </motion.span>
                    <span className="text-xs">/rep</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-foreground/70 font-semibold font-sans mt-1">
                    ${pricing.monthlyPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month total
                  </div>
                </div>

                {/* Annual Card */}
                <div className="relative w-full rounded-lg border-2 border-emerald-500/50 px-3 sm:px-4 pt-3 pb-3 overflow-hidden bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                  {/* Green Triangle Corner */}
                  <div className="absolute top-0 right-0 z-20 w-0 h-0 border-l-[28px] border-l-transparent border-t-[28px] border-t-emerald-500"></div>
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 font-space flex items-center gap-1">
                    Annual
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500 text-black font-bold rounded">Save 15%</span>
                  </h3>
                  <div className="text-foreground flex items-end gap-0.5">
                    <span className="text-sm">$</span>
                    <motion.span 
                      key={pricing.annualPerRepRate}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 0.3 }}
                      className="text-foreground -mb-0.5 text-xl sm:text-2xl font-extrabold tracking-tighter font-space"
                    >
                      {pricing.annualPerRepRate.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </motion.span>
                    <span className="text-xs">/rep</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-300 font-semibold font-sans mt-1">
                    ${pricing.annualTotalPrice.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/year total
                  </div>
                </div>
              </div>

              {/* ROI Results - Enhanced (Monthly) */}
              <div className="space-y-3 border-t-2 border-border/30 dark:border-white/30 pt-5 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-medium font-sans">Extra Revenue:</span>
                  <div className="flex items-center gap-2">
                    <motion.span 
                      key={Math.round(roiData.extraRevenue)}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.3 }}
                      className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-300 text-lg sm:text-xl font-bold font-space"
                    >
                      +${Math.round(roiData.extraRevenue).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                    </motion.span>
                  </div>
                </div>
                <div className="flex justify-end -mt-2">
                  <Link
                    href={`/pricing?reps=${numReps}`}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-medium font-sans transition-colors underline decoration-emerald-400/50 hover:decoration-emerald-300"
                  >
                    See calc
                  </Link>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-medium font-sans">DoorIQ Cost:</span>
                  <span className="text-red-500 dark:text-red-400 text-lg sm:text-xl font-bold font-space">
                    -${roiData.monthlyCost.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                  </span>
                </div>
                <div className="border-t-2 border-emerald-500/40 pt-3 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent rounded-lg px-3 py-2 -mx-3 sm:-mx-4">
                  <span className="text-foreground text-base font-semibold font-sans">Net Profit:</span>
                  <motion.div
                    key={Math.round(roiData.netProfit)}
                    initial={{ scale: 1 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-end gap-1"
                  >
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-400 text-2xl sm:text-3xl md:text-4xl font-black font-space">
                      ${Math.round(roiData.netProfit).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}/month
                    </span>
                    <span className="text-emerald-400 text-sm font-semibold font-sans">
                      {roiData.roiMultiplier.toFixed(1)}x ROI ({Math.round(roiData.roi)}%)
                    </span>
                  </motion.div>
                </div>
                <p className="text-xs text-foreground/60 italic font-sans pt-2 border-t border-border/20">
                  *Assumes each rep closes just 1 extra deal per month
                </p>
              </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Prominent Book Demo CTA */}
        <motion.div 
          className="flex flex-col items-center justify-center gap-3 sm:gap-4"
          variants={fadeInUp}
        >
          <motion.span 
            className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
          >
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
            <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                    try {
                      navigator.vibrate(10)
                    } catch {}
                  }
                  onBookDemo()
                }}
                className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-transparent dark:from-indigo-500/15 dark:via-purple-500/15 text-white border-indigo-500/30 border-[1px] hover:bg-gradient-to-tr hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-transparent dark:hover:from-indigo-500/25 dark:hover:via-purple-500/25 transition-all py-3.5 px-8 text-base sm:text-lg font-semibold"
              >
                Book a Demo
                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.span>
          
          <Link
            href="/pricing?reps=5"
            onClick={() => vibrate()}
            className="text-sm text-foreground/60 hover:text-foreground/80 font-medium font-sans transition-colors flex items-center gap-1 group"
          >
            See Full Pricing Details
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[56px] leading-[1.1] tracking-tight font-space font-bold text-foreground pb-2">
            Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Dashboards</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Analytics</span>
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-foreground/80 max-w-3xl mx-auto mt-3 sm:mt-4 lg:mt-6 font-sans leading-relaxed">
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
              className="text-lg sm:text-xl text-slate-200 mt-4 text-center lg:text-left max-w-xl"
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
            className="text-4xl font-bold text-foreground"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: delay / 1000, duration: 0.5 }}
          >
            {rawValue || `${prefix}${displayValue}${suffix}`}
          </motion.div>
          <div className="mt-2 text-foreground text-base">{label}</div>
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
          className="border border-indigo-500/30 bg-indigo-500/10 py-1 px-4 rounded-lg text-indigo-300"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          Testimonials
        </motion.div>
      </div>

      <motion.h3 
        className="text-center text-xl sm:text-2xl lg:text-[56px] leading-[1.2] sm:leading-[1.1] tracking-tight font-space font-bold mt-4 sm:mt-5 lg:mt-6 px-4 sm:px-0 text-foreground break-words"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 15,
          mass: 1
        }}
      >
        What Sales Teams Say About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">DoorIQ</span>
      </motion.h3>

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
    question: "Can I try DoorIQ before committing?",
    answer: "Yes! We offer a 14-day free trial. Try DoorIQ risk-free and see the results for yourself."
  },
  {
    question: "How quickly can my team start practicing?",
    answer: "Your team can start practicing within minutes of signup. No lengthy onboarding or setup required."
  },
  {
    question: "How is this different from roleplay?",
    answer: "Real AI conversations, not awkward coworker practice. Our AI adapts to each rep's responses in real-time, providing authentic scenarios that mirror actual customer interactions."
  },
  {
    question: "Can I track individual rep progress?",
    answer: "Yes, detailed analytics for each rep. You'll see session completion rates, improvement trends, areas of strength, and specific skills that need development."
  },
  {
    question: "What if I need to add or remove reps?",
    answer: "You can adjust your team size anytime. We'll prorate your billing based on the changes."
  }
]
