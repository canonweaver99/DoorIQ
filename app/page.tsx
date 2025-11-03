'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { HeroSection } from '@/components/ui/hero-section-dark'
import { InteractiveDemoSection } from '@/components/ui/interactive-demo-section'
import { MeetHomeownersSection } from '@/components/ui/meet-homeowners-section'
import { Button } from '@/components/ui/button'
import { GlowCard } from '@/components/ui/spotlight-card'
import { FaqSection } from '@/components/ui/faq-section'
import { TestimonialsColumn, testimonialsData } from '@/components/ui/testimonials-columns-1'
import { Target, Zap, TrendingUp, Users, CheckCircle2, BarChart3 } from 'lucide-react'
import { useScrollAnimation, fadeInUp, fadeInScale, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'
import { vibrate } from '@/lib/utils'

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
      {/* 1) New Hero Section */}
      <HeroSection
        title="Over 10,000+ Pitches Practiced"
        titleHref="/pricing"
        subtitle={{
          regular: "Master Door to Door Sales with ",
          gradient: "AI-Powered Training",
        }}
        description="Practice with AI homeowners • Get instant feedback • Close more deals"
        ctaText="Try Your First AI Roleplay Free"
        ctaHref="/trainer/select-homeowner"
        ctaSecondaryText="Watch Demo"
        ctaSecondaryHref="#dooriq-action"
        bottomImage={undefined}
        gridOptions={{
          angle: 65,
          opacity: 0.3,
          cellSize: 50,
          lightLineColor: "#4a4a4a",
          darkLineColor: "#2a2a2a",
        }}
      />

      {/* 2) Problem/Solution Section */}
      <ProblemSolutionSection />

      {/* 3) Interactive Demo */}
      <InteractiveDemoSection />

      {/* 4) Meet Our Homeowners */}
      <MeetHomeownersSection />

      {/* 5) Social Proof */}
      <SocialProofSection />

      {/* 6) Results / ROI */}
      <ResultsSection />

      {/* 8) FAQ */}
      <FaqSection
        title="Frequently Asked Questions"
        items={faqItems}
        contactInfo={{
          title: 'Have more Questions?',
          description: 'Reach out and our crew will walk you through a live session.',
          buttonText: 'Contact Support',
          onContact: () => window.open('mailto:contact@dooriq.ai?subject=Support%20Request&body=Hi%20DoorIQ%20Team,%0D%0A%0D%0AI%20need%20help%20with:%0D%0A%0D%0A', '_blank')
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
      icon: Target,
      title: "Inconsistent Training",
      description: "Managers don't have time to role-play with every rep, so training quality varies wildly across your team.",
      color: "red"
    },
    {
      icon: Zap,
      title: "Slow Ramp Time",
      description: "New reps take months to get comfortable handling objections, costing you deals and momentum.",
      color: "orange"
    },
    {
      icon: TrendingUp,
      title: "No Performance Data",
      description: "You have no objective way to measure who's improving, who's struggling, or what specific skills need work.",
      color: "yellow"
    }
  ]

  const solutions = [
    {
      icon: Users,
      title: "24/7 Unlimited Practice",
      description: "Every rep gets unlimited, on-demand practice with AI homeowners who behave like real prospects.",
      color: "blue"
    },
    {
      icon: CheckCircle2,
      title: "Instant Skill Development",
      description: "Immediate, objective feedback on tone, pacing, objection handling, and rapport. Reps improve faster.",
      color: "purple"
    },
    {
      icon: BarChart3,
      title: "Clear Performance Metrics",
      description: "Track every rep's progress with detailed analytics. Know exactly who needs help and where.",
      color: "green"
    }
  ]

  return (
    <motion.section 
      ref={ref}
      className="py-16 md:py-20 relative"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8">
        <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12" variants={fadeInUp}>
          <div className="text-center lg:text-left">
            <h2 className="text-[56px] leading-[1.1] tracking-tight font-geist mb-6 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Challenge</span> Every Sales Manager Faces
            </h2>
            <p className="text-lg text-slate-300">
              You know your team needs practice. But between recruiting, coaching, and hitting quotas, there's never enough time.
            </p>
          </div>
          <motion.div 
            className="relative h-96 rounded-2xl overflow-hidden border border-white/10"
            variants={fadeInScale}
          >
            <Image
              src="/website image 1.png"
              alt="Door-to-door sales challenge"
              fill
              className="object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Problems */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
          variants={staggerContainer}
        >
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="p-6 rounded-xl bg-red-900/10 border border-red-500/20"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 flex-shrink-0 rounded-full bg-red-500/20 flex items-center justify-center">
                  <problem.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">{problem.title}</h3>
              </div>
              <p className="text-base text-white leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div 
          className="flex items-center justify-center mb-20"
          variants={fadeInScale}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full max-w-md" />
          <div className="mx-4 text-2xl font-bold text-purple-400">→</div>
          <div className="h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent w-full max-w-md" />
        </motion.div>

        {/* Solutions */}
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12"
          variants={fadeInUp}
        >
          <motion.div 
            className="relative h-96 rounded-2xl overflow-hidden border border-white/10 lg:order-1"
            variants={fadeInScale}
          >
            <Image
              src="/Website image 3.png"
              alt="Confident sales rep after training"
              fill
              className="object-cover"
            />
          </motion.div>
          <div className="text-center lg:text-left lg:order-2">
            <h3 className="text-[56px] leading-[1.1] tracking-tight font-geist bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">DoorIQ</span> Solves This
            </h3>
          </div>
        </motion.div>

        <motion.div 
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
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <solution.icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{solution.title}</h3>
                </div>
                <p className="text-base text-white leading-relaxed">{solution.description}</p>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="text-center mt-12"
          variants={fadeInUp}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link 
              href="/auth/signup" 
              onClick={() => vibrate()}
              className="inline-flex rounded-full text-center items-center justify-center bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 text-white border border-purple-500/30 hover:border-purple-500/50 transition-all px-6 py-3 text-base font-semibold backdrop-blur-sm"
            >
              Get Started Free
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  )
}

// Animated Sections
function SocialProofSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  
  return (
    <motion.section 
      className="py-16" 
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
          <motion.h2 
            className="text-[56px] leading-[1.1] tracking-tight font-geist text-center lg:text-left bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]"
            variants={fadeInUp}
          >
            Results That Move the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Needle</span>
          </motion.h2>
          <motion.div 
            className="relative h-96 rounded-2xl overflow-hidden border border-white/10"
            variants={fadeInScale}
          >
            <Image
              src="/website image 4.png"
              alt="Successful sales rep"
              fill
              className="object-cover"
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
      'DoorIQ integrates with the systems sales leaders already use so insights and recordings stay centralized.',
  },
]
