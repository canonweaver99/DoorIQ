'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'
import Image from 'next/image'
import { GlowCard } from '@/components/ui/spotlight-card'
import { useScrollAnimation, fadeInUp, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'
import { 
  Target, 
  Zap, 
  Users, 
  TrendingUp,
  Lightbulb,
  Rocket,
  Heart,
  Code,
  GraduationCap,
  Dumbbell
} from 'lucide-react'

export default function AboutPage() {
  const { ref, controls } = useScrollAnimation(0.2)

  // Ensure animation triggers immediately on mount
  useEffect(() => {
    controls.start('visible')
  }, [controls])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836]">
      <motion.div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 lg:pb-20"
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
      >
        {/* Hero Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          variants={fadeInUp}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.2] tracking-tight font-space font-bold text-foreground mb-4 sm:mb-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">DoorIQ</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-white max-w-3xl mx-auto font-sans">
            We help door-to-door teams practice the hard conversations before they knock. Our AI homeowners push back, hesitate, and ask real questions so reps can build confidence and close more deals.
          </p>
        </motion.div>

        {/* Mission Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <GlowCard
            glowColor="purple"
            customSize
            className="p-8 sm:p-10 lg:p-12 bg-card/60 dark:bg-black/60"
          >
            <div className="flex items-start gap-6 mb-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground mb-4">
                  Our Mission
                </h2>
                <p className="text-base sm:text-lg text-white leading-relaxed font-sans">
                  Deliver realistic training reps love, and analytics managers trust. We're building tools that give sales teams unfair leverage—the kind that comes from practicing with AI that doesn't hold back.
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.section>

        {/* What We're Building Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Rocket className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                What We're Building
              </h2>
            </div>
            <p className="text-base sm:text-lg text-white font-sans max-w-3xl">
              Tools that actually help people get better at what they do
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Zap,
                title: 'Lifelike Voice Conversations',
                description: 'Real-time voice-to-voice training with AI homeowners that challenge, push back, and ask real questions',
                color: 'purple' as const
              },
              {
                icon: TrendingUp,
                title: 'Instant Feedback & Scoring',
                description: 'Objective scoring and detailed analytics that help reps understand exactly where to improve',
                color: 'blue' as const
              },
              {
                icon: Users,
                title: 'Team Performance Tools',
                description: 'Leaderboards, coaching loops, and progress tracking that managers trust and reps actually use',
                color: 'green' as const
              }
            ].map((feature) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={feature.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-foreground mb-3 font-space">
                          {feature.title}
                        </h3>
                        <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-sans flex-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Founder/CEO Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                Meet the Founder
              </h2>
            </div>
          </div>
          
          <GlowCard
            glowColor="purple"
            customSize
            className="p-8 sm:p-10 lg:p-12 bg-card/60 dark:bg-black/60"
          >
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto lg:mx-0 rounded-2xl overflow-hidden border-2 border-purple-500/30 shadow-lg">
                  <Image
                    src="/canon-profile.png"
                    alt="Canon Weaver - Founder & CEO"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 192px, (max-width: 1024px) 224px, 256px"
                  />
                </div>
              </div>

              {/* Bio Content */}
              <div className="flex-1">
                <div className="mb-6">
                  <h3 className="text-2xl sm:text-3xl font-space font-bold text-foreground mb-2">
                    Canon Weaver
                  </h3>
                  <p className="text-lg text-purple-400 font-medium font-sans mb-4">
                    Founder & CEO
                  </p>
                </div>
                
                <div className="space-y-4 text-base sm:text-lg text-white leading-relaxed font-sans">
                  <p>
                    Hey, I am Canon. I was studying economics in college and doing everything the "right" way, but it never felt right to me. I kept learning more from building projects on my own than I ever did sitting through lectures. Eventually I realized I was trying to force myself into a path that just wasn't mine, so I dropped out and committed fully to entrepreneurship and AI development.
                  </p>
                  
                  <p>
                    Since then I have been building nonstop. I design software, train AI agents, and create tools that actually help people get better at what they do. Door to door sales reps sharpening their pitch. Small schools improving their enrollment. Anyone trying to automate the parts of life that slow them down. If the problem is real, I want to build the solution.
                  </p>
                  
                  <p>
                    I am obsessed with growth, both in the gym and in business. I love creating products that give people unfair leverage, and I am not afraid to take the unconventional path to make it happen. This journey is just getting started and I am here to build something big enough that the risk was worth it.
                  </p>
                </div>

                {/* Personal Interests */}
                <div className="mt-8 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                    <Code className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white font-sans">AI Development</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                    <Dumbbell className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white font-sans">Fitness</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/30">
                    <Rocket className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white font-sans">Entrepreneurship</span>
                  </div>
                </div>
              </div>
            </div>
          </GlowCard>
        </motion.section>

        {/* Values Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                What We Stand For
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                icon: Zap,
                title: 'Unconventional Paths',
                description: 'We take risks and build solutions that others won\'t. The conventional path isn\'t always the right one.',
                color: 'purple' as const
              },
              {
                icon: Target,
                title: 'Real Problems, Real Solutions',
                description: 'We focus on problems that actually matter. If it doesn\'t help people get better, we don\'t build it.',
                color: 'blue' as const
              },
              {
                icon: TrendingUp,
                title: 'Unfair Leverage',
                description: 'We create tools that give people advantages they couldn\'t get anywhere else. That\'s the point.',
                color: 'green' as const
              },
              {
                icon: Heart,
                title: 'Obsessed with Growth',
                description: 'We\'re here to build something big. Something that makes the risk worth it.',
                color: 'purple' as const
              }
            ].map((value) => {
              const Icon = value.icon
              return (
                <motion.div key={value.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={value.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex flex-col h-full">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-lg font-semibold text-foreground mb-3 font-space">
                          {value.title}
                        </h3>
                        <p className="text-base sm:text-lg text-foreground/90 leading-relaxed font-sans flex-1">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              )
            })}
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}
