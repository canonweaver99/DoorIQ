'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PricingPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page after a short delay
    const timer = setTimeout(() => {
      router.push('/')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-3xl md:text-4xl font-space font-light text-white mb-4">
          Pricing Page Temporarily Archived
        </h1>
        <p className="text-white/70 font-sans mb-6">
          This page has been temporarily archived. You will be redirected to the home page shortly.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-lg hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 transition-all font-space font-medium"
        >
          Go to Home
        </Link>
      </div>
    </div>
  )
}

