'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Mail, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full shadow-lg">
            <Mail className="w-10 h-10 text-white" />
          </div>
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              <h1 className="text-3xl font-bold text-white">Check Your Email</h1>
            </div>
            
            <p className="text-slate-300 text-lg">
              We've sent a confirmation link to:
            </p>
            
            {email && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                <p className="text-purple-200 font-medium break-all">{email}</p>
              </div>
            )}
            
            <p className="text-slate-400 text-sm">
              Click the link in the email to verify your account and start training!
            </p>
            
            <div className="pt-4 space-y-3">
              <p className="text-xs text-slate-500">
                Didn't receive the email? Check your spam folder or wait a few minutes.
              </p>
              
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg"
              >
                Go to Login
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function EmailConfirmedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ConfirmedContent />
    </Suspense>
  )
}

