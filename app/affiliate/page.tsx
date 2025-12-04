'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Gift, ArrowRight, CheckCircle2, TrendingUp, Users, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AffiliateLandingPage() {
  const router = useRouter()
  const [referralId, setReferralId] = useState<string | null>(null)
  const [agentCount, setAgentCount] = useState<number>(12)

  useEffect(() => {
    // Check if Rewardful is loaded and has a referral ID
    if (typeof window !== 'undefined') {
      const checkRewardful = () => {
        const rewardful = (window as any).Rewardful
        if (rewardful?.referral) {
          setReferralId(rewardful.referral)
        } else {
          // Retry after a short delay if Rewardful hasn't loaded yet
          setTimeout(checkRewardful, 500)
        }
      }
      checkRewardful()
    }

    // Fetch agent count from API
    fetch('/api/agents/count')
      .then(res => res.json())
      .then(data => {
        if (data.count) {
          setAgentCount(data.count)
        }
      })
      .catch(error => {
        console.error('Error fetching agent count:', error)
        // Keep default of 12 if fetch fails
      })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {/* Referral Badge */}
          {referralId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-full mb-6"
            >
              <Gift className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">
                You're here via an affiliate link!
              </span>
            </motion.div>
          )}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Master Door-to-Door Sales with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              AI-Powered Training
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Practice with realistic AI homeowners, get instant feedback, and close more deals. 
            Join thousands of sales reps mastering their pitch.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth/signup')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold"
            >
              Start for Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            {
              icon: Users,
              title: `${agentCount} Realistic AI Homeowners`,
              description: 'Practice with different personalities and scenarios'
            },
            {
              icon: TrendingUp,
              title: 'Instant Performance Feedback',
              description: 'Get scored on rapport, discovery, objection handling, and closing'
            },
            {
              icon: Zap,
              title: 'Track Your Progress',
              description: 'Monitor improvement over time with detailed analytics'
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-purple-500/50 transition-colors"
            >
              <feature.icon className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-6 text-center">
            Why Sales Reps Love DoorIQ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              '5 free practice sessions to get started',
              `Access to all ${agentCount} AI training agents`,
              'Real-time scoring and feedback',
              'Detailed analytics and performance tracking',
              'Practice anytime, anywhere',
              'No contracts, cancel anytime'
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Master Your Pitch?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Join thousands of sales reps who are improving their close rates with DoorIQ
          </p>
          <Button
            size="lg"
            onClick={() => router.push('/auth/signup')}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold"
          >
            Get Started Free
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

