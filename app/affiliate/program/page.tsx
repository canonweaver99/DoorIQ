'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Gift, DollarSign, Users, TrendingUp, CheckCircle2, ArrowRight, BarChart3, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AffiliateProgramPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl mb-6 shadow-lg shadow-purple-500/30">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            DoorIQ Affiliate Program
          </h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Earn money by sharing DoorIQ with your network. Help sales professionals improve their skills while building passive income.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8 py-6 text-lg font-semibold"
            >
              <Link href="/affiliate">
                Join the Program
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg"
            >
              <Link href="/auth/signup">Sign Up for DoorIQ</Link>
            </Button>
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            {
              icon: DollarSign,
              value: 'Up to 30%',
              label: 'Commission Rate',
              description: 'Earn competitive commissions on every referral'
            },
            {
              icon: Users,
              value: 'Unlimited',
              label: 'Referrals',
              description: 'No cap on how many people you can refer'
            },
            {
              icon: TrendingUp,
              value: 'Recurring',
              label: 'Earnings',
              description: 'Earn on subscription renewals, not just initial signups'
            }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 text-center"
            >
              <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-4" />
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-lg font-semibold text-purple-300 mb-2">{stat.label}</div>
              <p className="text-sm text-slate-400">{stat.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Sign Up',
                description: 'Create your DoorIQ account and join our affiliate program'
              },
              {
                step: '2',
                title: 'Share Your Link',
                description: 'Get your unique affiliate link and share it with your network'
              },
              {
                step: '3',
                title: 'Earn Commissions',
                description: 'Get paid when people sign up and subscribe through your link'
              }
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className="relative"
              >
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400">{step.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-600 to-transparent transform -translate-y-1/2" />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-12 mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Why Join Our Affiliate Program?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              'High commission rates (up to 30%)',
              'Recurring revenue on subscriptions',
              'Real-time tracking and analytics',
              'Fast and reliable payments',
              'Marketing materials provided',
              'Dedicated affiliate support',
              'No minimum payout threshold',
              'Track clicks, conversions, and earnings'
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300 text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Affiliate Dashboard Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                icon: BarChart3,
                title: 'Analytics Dashboard',
                description: 'Track your performance with detailed analytics and insights'
              },
              {
                icon: Zap,
                title: 'Real-Time Tracking',
                description: 'See clicks, conversions, and earnings as they happen'
              },
              {
                icon: DollarSign,
                title: 'Payment History',
                description: 'View your payment history and upcoming payouts'
              },
              {
                icon: TrendingUp,
                title: 'Performance Metrics',
                description: 'Monitor your conversion rates and optimize your strategy'
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
              >
                <feature.icon className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-center bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-2xl p-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
            Join our affiliate program today and start earning money by sharing DoorIQ with your network.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-10 py-6 text-lg font-semibold"
          >
            <Link href="/affiliate">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

