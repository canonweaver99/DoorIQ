'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

/**
 * ARCHIVED: Pricing page has been archived
 * Software is now FREE for all signed-in users
 * This page redirects users to sign in or home
 */
export default function PricingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after showing message
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4 font-space">
            Good News! DoorIQ is Now Free
          </h1>
          <p className="text-xl text-slate-400 mb-6 font-sans">
            All paywalls have been archived. DoorIQ is now completely free for all signed-in users.
          </p>
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
            <p className="text-slate-300 font-sans">
              Simply <strong className="text-white">sign in</strong> to access all features including:
            </p>
            <ul className="mt-4 space-y-2 text-left text-slate-300 font-sans">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                Unlimited practice sessions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                Full analytics and insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                Learning modules and playbooks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                All premium features
              </li>
            </ul>
          </div>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push('/auth/login')}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors font-sans"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors font-sans"
            >
              Go Home
            </button>
          </div>
          <p className="mt-6 text-sm text-slate-500 font-sans">
            Redirecting to home in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  )
}

