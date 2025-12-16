'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Gift, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function AffiliateDashboardPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to affiliate program page
    router.replace('/affiliate/program')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md mx-auto px-4"
      >
        <div className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/30 inline-block mb-6">
          <Gift className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Affiliate Dashboard</h1>
        <p className="text-slate-400 mb-8">
          The affiliate dashboard is temporarily unavailable. Please visit our affiliate program page for more information.
        </p>
        <Link href="/affiliate/program">
          <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-8">
            View Affiliate Program
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </motion.div>
    </div>
  )
}

