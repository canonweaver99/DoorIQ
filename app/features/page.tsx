'use client'

import { motion } from 'framer-motion'
import { useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { GlowCard } from '@/components/ui/spotlight-card'
import { Button } from '@/components/ui/button'
import { useScrollAnimation, fadeInUp, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'

// Lazy load heavy components
const FeatureRequestForm = dynamic(() => import('./FeatureRequestForm'), {
  loading: () => <div className="h-96" />,
  ssr: false
})
import { 
  Users, 
  TrendingUp, 
  BarChart3, 
  Mic, 
  Upload, 
  Trophy, 
  Target, 
  Zap, 
  Shield, 
  FileText,
  Smartphone,
  MessageSquare,
  BookOpen,
  Download
} from 'lucide-react'
import { PERSONA_METADATA } from '@/components/trainer/personas'

const fadeInUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function FeaturesPage() {
  const { ref, controls } = useScrollAnimation(0.2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background dark:from-[#02010A] dark:via-[#0A0420] dark:to-[#120836]">
      <motion.div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
        initial="hidden"
        animate={controls}
        variants={staggerContainer}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-12 sm:mb-16 lg:mb-20"
          variants={fadeInUp}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] leading-[1.2] tracking-tight font-space font-bold text-foreground mb-4 sm:mb-6">
            All DoorIQ <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Features</span>
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-foreground/80 max-w-3xl mx-auto font-sans">
            Everything you need to master door-to-door sales with AI-powered training
          </p>
        </motion.div>

        {/* AI Training Agents Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                AI Training Agents
              </h2>
            </div>
            <p className="text-base sm:text-lg text-foreground/80 font-sans max-w-3xl">
              Practice with 14+ unique AI homeowner personas, each designed to challenge different aspects of your sales skills
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Object.entries(PERSONA_METADATA).map(([name, metadata], index) => (
              <motion.div
                key={name}
                variants={staggerItem}
                className="group"
              >
                <GlowCard
                  glowColor={index % 3 === 0 ? 'purple' : index % 3 === 1 ? 'blue' : 'green'}
                  customSize
                  className="p-6 h-full bg-card/60 dark:bg-black/60"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="text-3xl">{metadata.card.avatar}</div>
                    <div className="flex-1">
                      <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-1 font-space">
                        {name}
                      </h3>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          metadata.card.difficultyKey === 'easy' ? 'bg-green-500/20 text-green-400' :
                          metadata.card.difficultyKey === 'moderate' ? 'bg-yellow-500/20 text-yellow-400' :
                          metadata.card.difficultyKey === 'hard' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {metadata.card.challengeLabel}
                        </span>
                        {metadata.card.recommended && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400 font-medium">
                            Recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/70 mb-3 font-sans">
                    {metadata.bubble.description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs text-foreground/60 font-sans"><strong>Best for:</strong> {metadata.card.bestFor}</p>
                    <p className="text-xs text-foreground/60 font-sans"><strong>Time:</strong> {metadata.card.estimatedTime}</p>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Real-Time Performance Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                Real-Time Performance Metrics
              </h2>
            </div>
            <p className="text-base sm:text-lg text-foreground/80 font-sans max-w-3xl">
              Get instant feedback during every practice session with live metrics and analysis
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: TrendingUp,
                title: 'Sentiment Tracking',
                description: 'Watch customer sentiment evolve from hostile → neutral → interested in real-time',
                color: 'purple' as const
              },
              {
                icon: Target,
                title: 'Objection Counting',
                description: 'Track every objection raised and see how effectively you handle each one',
                color: 'blue' as const
              },
              {
                icon: Shield,
                title: 'Key Moment Detection',
                description: 'Automatic detection of price mentions, safety discussions, and close attempts',
                color: 'green' as const
              },
              {
                icon: Mic,
                title: 'Voice-to-Voice Training',
                description: 'Natural conversations with AI agents using real-time speech recognition',
                color: 'purple' as const
              },
              {
                icon: BarChart3,
                title: 'Live Conversation Timer',
                description: 'Track talk time and pacing to optimize your pitch delivery',
                color: 'blue' as const
              },
              {
                icon: CheckCircle2,
                title: 'Real-Time Scoring',
                description: 'See your performance score update as the conversation progresses',
                color: 'green' as const
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={feature.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 font-space">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed font-sans">
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

        {/* Analytics & Insights Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                Analytics & Insights
              </h2>
            </div>
            <p className="text-base sm:text-lg text-foreground/80 font-sans max-w-3xl">
              Comprehensive post-session analysis to understand what's working and where to improve
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Score Breakdown',
                description: 'Detailed scores for Rapport, Objection Handling, Safety, and Close Effectiveness',
                color: 'purple' as const
              },
              {
                icon: TrendingUp,
                title: 'Improvement Tracking',
                description: 'See your progress over time with trend analysis and performance graphs',
                color: 'blue' as const
              },
              {
                icon: FileText,
                title: 'Detailed Feedback',
                description: 'Line-by-line analysis with specific suggestions for improvement',
                color: 'green' as const
              },
              {
                icon: Target,
                title: 'Timing Analysis',
                description: 'Understand optimal timing for key moments like pricing and closing',
                color: 'purple' as const
              },
              {
                icon: Download,
                title: 'Export Reports',
                description: 'Download detailed session reports in CSV or PDF format for review',
                color: 'blue' as const
              },
              {
                icon: BookOpen,
                title: 'Knowledge Base',
                description: 'Access training materials, best practices, and coaching resources',
                color: 'green' as const
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={feature.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 font-space">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed font-sans">
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

        {/* Team Management Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                Team Management
              </h2>
            </div>
            <p className="text-base sm:text-lg text-foreground/80 font-sans max-w-3xl">
              Powerful tools for managers to track team performance and drive results
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Manager Dashboards',
                description: 'Comprehensive overview of team performance with key metrics and insights',
                color: 'purple' as const
              },
              {
                icon: Users,
                title: 'Team Analytics',
                description: 'Compare performance across team members and identify top performers',
                color: 'blue' as const
              },
              {
                icon: Target,
                title: 'Individual Progress Tracking',
                description: 'Monitor each rep\'s improvement over time with detailed progress reports',
                color: 'green' as const
              },
              {
                icon: Trophy,
                title: 'Team Leaderboards',
                description: 'Foster healthy competition with visible leaderboards and rankings',
                color: 'purple' as const
              },
              {
                icon: MessageSquare,
                title: 'In-App Messaging',
                description: 'Communicate with your team directly through the platform',
                color: 'blue' as const
              },
              {
                icon: Download,
                title: 'Export Capabilities',
                description: 'Generate and export team reports for presentations and reviews',
                color: 'green' as const
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={feature.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 font-space">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed font-sans">
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

        {/* Practice Features Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Mic className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                Practice Features
              </h2>
            </div>
            <p className="text-base sm:text-lg text-foreground/80 font-sans max-w-3xl">
              Flexible training options to practice whenever and however works best for you
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Zap,
                title: 'Unlimited Sessions',
                description: 'Practice as much as you want with no session limits on premium plans',
                color: 'purple' as const
              },
              {
                icon: Mic,
                title: 'Voice-to-Voice Training',
                description: 'Natural conversations using real-time speech recognition and AI responses',
                color: 'blue' as const
              },
              {
                icon: Upload,
                title: 'Pitch Uploads',
                description: 'Upload recorded pitches for AI analysis and grading without live sessions',
                color: 'green' as const
              },
              {
                icon: Smartphone,
                title: 'Mobile Friendly',
                description: 'Practice on any device - desktop, tablet, or mobile phone',
                color: 'purple' as const
              },
              {
                icon: CheckCircle2,
                title: 'Session Recording',
                description: 'Record and replay your practice sessions to review and learn',
                color: 'blue' as const
              },
              {
                icon: Target,
                title: 'Custom Grading',
                description: 'AI-powered grading tailored to your company\'s specific sales methodology',
                color: 'green' as const
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={feature.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 font-space">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed font-sans">
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

        {/* Gamification Section */}
        <motion.section className="mb-16 sm:mb-20 lg:mb-24" variants={fadeInUp}>
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-8 h-8 text-purple-400" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground">
                Gamification
              </h2>
            </div>
            <p className="text-base sm:text-lg text-foreground/80 font-sans max-w-3xl">
              Stay motivated and engaged with achievements, challenges, and friendly competition
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                icon: Trophy,
                title: 'Achievement Badges',
                description: 'Earn badges for milestones like First Success, Speed Runner, Trust Builder, and Safety Star',
                color: 'purple' as const
              },
              {
                icon: Target,
                title: 'Daily Challenges',
                description: 'Complete daily practice challenges to build consistent training habits',
                color: 'blue' as const
              },
              {
                icon: TrendingUp,
                title: 'Practice Streaks',
                description: 'Track your consecutive practice days and maintain your momentum',
                color: 'green' as const
              },
              {
                icon: Users,
                title: 'Team Leaderboards',
                description: 'Compete with teammates and see who\'s performing best',
                color: 'purple' as const
              }
            ].map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div key={feature.title} variants={staggerItem}>
                  <GlowCard
                    glowColor={feature.color}
                    customSize
                    className="p-6 h-full bg-card/60 dark:bg-black/60"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2 font-space">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-foreground/80 leading-relaxed font-sans">
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

        {/* Feature Request CTA Section - Lazy loaded */}
        <motion.section className="mt-20 sm:mt-24" variants={fadeInUp}>
          <div className="max-w-2xl mx-auto">
            <Suspense fallback={<div className="h-96 bg-card/60 dark:bg-black/60 rounded-2xl" />}>
              <FeatureRequestForm />
            </Suspense>
          </div>
        </motion.section>
      </motion.div>
    </div>
  )
}

