'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

export default function InviteTeamPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [email, setEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState('')

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      showToast({ type: 'error', title: 'Please enter a valid email address' })
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/settings/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }

      // Mark invite_team step as complete
      await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'invite_team' }),
      })

      setInvitedEmail(email.trim())
      setEmail('')
      setInviteSent(true)
      showToast({ type: 'success', title: `Invitation sent to ${email.trim()}` })
    } catch (err: any) {
      console.error('Error sending invite:', err)
      showToast({ type: 'error', title: 'Failed to send invitation', message: err.message })
    } finally {
      setInviting(false)
    }
  }

  const handleContinue = () => {
    router.push('/settings/organization?walkthrough=true&tab=overview')
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative -mx-4 sm:-mx-6 lg:-mx-8 -mt-4">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4 sm:p-6">
        <AnimatePresence mode="wait">
          {!inviteSent ? (
            <motion.div
              key="invite-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl w-full text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mb-8 flex justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                  <UserPlus className="w-12 h-12 text-emerald-400" />
                </div>
              </motion.div>

              {/* Headline */}
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Build your team
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-lg mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Invite your teammates to practice together and track performance as a team.
              </motion.p>

              {/* Invite Form */}
              <motion.div
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 max-w-md mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2 text-left">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="teammate@example.com"
                        className="pl-10 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                        onKeyPress={(e) => e.key === 'Enter' && !inviting && handleInvite()}
                        disabled={inviting}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleInvite}
                    disabled={inviting || !email.trim()}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg py-6"
                  >
                    {inviting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Sending invite...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 mr-2" />
                        Send invitation
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>

              {/* Skip option */}
              <motion.button
                onClick={handleContinue}
                className="mt-6 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Skip for now
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl w-full text-center"
            >
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                className="mb-8 flex justify-center"
              >
                <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/30">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                </div>
              </motion.div>

              {/* Success Message */}
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Invitation sent!
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-lg mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                We've sent an invitation to <span className="text-emerald-400 font-semibold">{invitedEmail}</span>. 
                They'll receive an email with instructions to join your team.
              </motion.p>

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  onClick={handleContinue}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-10 py-6 inline-flex items-center gap-3"
                >
                  Continue to team management
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>

              {/* Invite another option */}
              <motion.button
                onClick={() => {
                  setInviteSent(false)
                  setInvitedEmail('')
                }}
                className="mt-6 text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Invite another teammate
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

