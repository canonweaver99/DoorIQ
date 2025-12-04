'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Mail, Phone, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ThankYouPage() {
  const router = useRouter()
  const [demoData, setDemoData] = useState<any>(null)

  useEffect(() => {
    // Get demo request data from sessionStorage
    const stored = sessionStorage.getItem('demo_request_data')
    if (stored) {
      try {
        setDemoData(JSON.parse(stored))
        // Clear after reading
        sessionStorage.removeItem('demo_request_data')
      } catch (e) {
        console.error('Error parsing demo data:', e)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
        </motion.div>

        {/* Thank You Message */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
        >
          Thank You!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-lg sm:text-xl text-slate-300 mb-8"
        >
          {demoData?.firstName 
            ? `Thanks ${demoData.firstName}, your demo has been scheduled!`
            : 'Your demo has been scheduled!'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border border-slate-700 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">What's Next?</h2>
          
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 font-bold">1</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Check Your Email</h3>
                <p className="text-slate-400 text-sm">
                  You'll receive a confirmation email with meeting details and calendar invite.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Prepare for Your Demo</h3>
                <p className="text-slate-400 text-sm">
                  Think about your sales team's current challenges and goals. We'll tailor the demo to your needs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 font-bold">3</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Join the Meeting</h3>
                <p className="text-slate-400 text-sm">
                  We'll show you how DoorIQ can transform your sales training and improve rep performance.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
        >
          <p className="text-slate-400 mb-6">Don't miss out on the opportunity to transform your organization.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-slate-300">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              <a href="mailto:sales@dooriq.ai" className="hover:text-white transition-colors">
                sales@dooriq.ai
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-emerald-400" />
              <a href="tel:+18555203699" className="hover:text-white transition-colors">
                (855) 520-3699
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <span className="text-sm">Lehi, Utah</span>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Return to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  )
}

