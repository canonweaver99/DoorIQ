'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function EmailConfirmedPage() {
  const router = useRouter()

  useEffect(() => {
    const checkSessionAndRedirect = async () => {
      const supabase = createClient()
      
      // Wait longer for session to be established
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if session exists
      const { data: { session } } = await supabase.auth.getSession()
      
      console.log('✅ Email confirmed! Session:', !!session)
      
      if (session) {
        console.log('🔄 Redirecting to home page...')
        // Force a full page reload to ensure session is picked up everywhere
        window.location.href = '/'
      } else {
        console.error('❌ No session found after confirmation')
        router.push('/auth/login?message=Please sign in with your new account')
      }
    }

    checkSessionAndRedirect()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-purple-500 mb-4"></div>
        <h1 className="text-2xl font-bold text-white mb-2">Email Confirmed!</h1>
        <p className="text-slate-400">Setting up your account...</p>
      </div>
    </div>
  )
}

