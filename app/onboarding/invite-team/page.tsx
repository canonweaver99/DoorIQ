'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Mail, CheckCircle2, Loader2, ArrowRight, Users, User, X, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'

interface SeatData {
  id: string
  name: string
  email: string
  role: 'rep' | 'manager'
}

export default function InviteTeamPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [seats, setSeats] = useState<SeatData[]>([])
  const [inviting, setInviting] = useState(false)
  const [inviteSent, setInviteSent] = useState(false)
  const [invitedSeats, setInvitedSeats] = useState<SeatData[]>([])
  const [seatInfo, setSeatInfo] = useState<{ limit: number; used: number; available: number } | null>(null)
  const [loadingSeats, setLoadingSeats] = useState(true)
  const [addingSeats, setAddingSeats] = useState(false)
  const [showAddSeatsModal, setShowAddSeatsModal] = useState(false)
  const [seatsToAdd, setSeatsToAdd] = useState(5)

  // Fetch seat information
  useEffect(() => {
    const fetchSeatInfo = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (!userData?.organization_id) return

        const { data: org } = await supabase
          .from('organizations')
          .select('seat_limit, seats_used')
          .eq('id', userData.organization_id)
          .single()

        if (org) {
          const available = (org.seat_limit || 0) - (org.seats_used || 0)
          setSeatInfo({
            limit: org.seat_limit || 0,
            used: org.seats_used || 0,
            available,
          })
          
          // Initialize with one empty seat card
          if (available > 0 && seats.length === 0) {
            setSeats([{
              id: `seat-${Date.now()}`,
              name: '',
              email: '',
              role: 'rep',
            }])
          }
        }
      } catch (error) {
        console.error('Error fetching seat info:', error)
      } finally {
        setLoadingSeats(false)
      }
    }

    fetchSeatInfo()
  }, [])

  const addSeat = () => {
    if (seatInfo && seats.length >= seatInfo.available) {
      showToast({ type: 'error', title: 'No more seats available' })
      return
    }
    setSeats([...seats, {
      id: `seat-${Date.now()}-${Math.random()}`,
      name: '',
      email: '',
      role: 'rep',
    }])
  }

  const removeSeat = (id: string) => {
    setSeats(seats.filter(s => s.id !== id))
  }

  const updateSeat = (id: string, field: keyof SeatData, value: string) => {
    setSeats(seats.map(seat => 
      seat.id === id ? { ...seat, [field]: value } : seat
    ))
  }

  const getFilledSeats = () => {
    return seats.filter(s => s.name.trim() && s.email.trim() && s.email.includes('@'))
  }

  const handleInvite = async () => {
    const filledSeats = getFilledSeats()
    
    if (filledSeats.length === 0) {
      showToast({ type: 'error', title: 'Please fill out at least one seat' })
      return
    }

    setInviting(true)
    try {
      const response = await fetch('/api/settings/team/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seats: filledSeats }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invites')
      }

      if (data.results.successful.length > 0) {
        setInvitedSeats(data.results.successful.map((s: { email: string; name: string }) => 
          filledSeats.find(fs => fs.email === s.email) || { id: '', name: s.name, email: s.email, role: 'rep' }
        ))
        setInviteSent(true)
        
        if (data.results.failed.length > 0) {
          showToast({ 
            type: 'warning', 
            title: `${data.results.successful.length} invitation${data.results.successful.length !== 1 ? 's' : ''} sent`, 
            message: `${data.results.failed.length} failed: ${data.results.failed.map((f: any) => f.email).join(', ')}` 
          })
        } else {
          showToast({ 
            type: 'success', 
            title: `${data.results.successful.length} invitation${data.results.successful.length !== 1 ? 's' : ''} sent successfully` 
          })
        }
      } else {
        showToast({ 
          type: 'error', 
          title: 'Failed to send invitations', 
          message: data.results.failed.map((f: any) => `${f.email}: ${f.error}`).join('; ') 
        })
      }
    } catch (err: any) {
      console.error('Error sending invites:', err)
      showToast({ type: 'error', title: 'Failed to send invitations', message: err.message })
    } finally {
      setInviting(false)
    }
  }

  const handleContinue = async () => {
    // Mark invite_team step as complete even when skipping
    try {
      await fetch('/api/onboarding/complete-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'invite_team' }),
      })
    } catch (error) {
      console.error('Error marking invite_team step complete:', error)
    }
    
    router.push('/settings/organization?walkthrough=true&tab=overview')
  }

  if (loadingSeats) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    )
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
      <div className="relative z-10 min-h-[calc(100vh-200px)] flex flex-col items-center p-4 sm:p-6 pt-20 sm:pt-24 md:pt-32">
        {/* Back button */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm">Back</span>
          </button>
        </div>
        <AnimatePresence mode="wait">
          {!inviteSent ? (
            <motion.div
              key="invite-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-5xl w-full"
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
                className="text-4xl sm:text-5xl md:text-6xl font-black mb-4 tracking-tight text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Build your team
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-zinc-400 mb-4 max-w-lg mx-auto text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Fill out each seat with your teammate's information. They'll receive an email to claim their account.
              </motion.p>

              {/* Seat Information */}
              {seatInfo && (
                <motion.div
                  className="mb-8 max-w-md mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Users className="w-5 h-5 text-emerald-400" />
                        <div>
                          <p className="text-sm text-zinc-400">Seats</p>
                          <p className="text-lg font-semibold text-white">
                            {seatInfo.used} / {seatInfo.limit} used
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-zinc-400">Available</p>
                        <p className={`text-lg font-semibold ${seatInfo.available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {seatInfo.available}
                        </p>
                      </div>
                    </div>
                    {seatInfo.available === 0 && (
                      <Button
                        onClick={() => setShowAddSeatsModal(true)}
                        className="w-full mt-3 bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Buy More Seats
                      </Button>
                    )}
                    {seatInfo.available > 0 && seatInfo.available < 5 && (
                      <Button
                        onClick={() => setShowAddSeatsModal(true)}
                        variant="outline"
                        className="w-full mt-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add More Seats
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Seat Cards */}
              <div className="space-y-4 mb-6">
                {seats.map((seat, index) => (
                  <motion.div
                    key={seat.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                          <User className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white">
                          Seat {index + 1}
                        </h3>
                      </div>
                      {seats.length > 1 && (
                        <button
                          onClick={() => removeSeat(seat.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Name */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Name
                        </label>
                        <Input
                          type="text"
                          value={seat.name}
                          onChange={(e) => updateSeat(seat.id, 'name', e.target.value)}
                          placeholder="John Doe"
                          className="bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                          disabled={inviting}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Email
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <Input
                            type="email"
                            value={seat.email}
                            onChange={(e) => updateSeat(seat.id, 'email', e.target.value)}
                            placeholder="john@example.com"
                            className="pl-10 bg-zinc-950 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-emerald-500 focus:ring-emerald-500/20"
                            disabled={inviting}
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-2">
                          Role
                        </label>
                        <select
                          value={seat.role}
                          onChange={(e) => updateSeat(seat.id, 'role', e.target.value as 'rep' | 'manager')}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-lg text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          disabled={inviting}
                        >
                          <option value="rep">Rep</option>
                          <option value="manager">Manager</option>
                        </select>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add Seat Button */}
              {seatInfo && seats.length < seatInfo.available && (
                <motion.div
                  className="mb-6 flex justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Button
                    onClick={addSeat}
                    variant="outline"
                    className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    disabled={inviting}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Another Seat
                  </Button>
                </motion.div>
              )}

              {/* Submit Button */}
              <div className="flex flex-col items-center gap-4">
                <Button
                  onClick={handleInvite}
                  disabled={inviting || getFilledSeats().length === 0 || (seatInfo?.available === 0)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-10 py-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Sending invitations...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Send {getFilledSeats().length > 0 ? `${getFilledSeats().length} ` : ''}Invitation{getFilledSeats().length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>

                {/* Skip option */}
                <button
                  onClick={handleContinue}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                >
                  Skip for now
                </button>
              </div>
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
                Invitations sent!
              </motion.h1>
              
              <motion.p 
                className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-lg mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {invitedSeats.length === 1 ? (
                  <>
                    We've sent an invitation to <span className="text-emerald-400 font-semibold">{invitedSeats[0].name}</span> ({invitedSeats[0].email}). 
                    They'll receive an email with instructions to claim their account.
                  </>
                ) : (
                  <>
                    We've sent invitations to <span className="text-emerald-400 font-semibold">{invitedSeats.length} teammates</span>. 
                    They'll receive emails with instructions to claim their accounts.
                  </>
                )}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Seats Modal */}
      {showAddSeatsModal && seatInfo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Add More Seats</h3>
              <button
                onClick={() => setShowAddSeatsModal(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Number of seats to add
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={seatsToAdd}
                    onChange={(e) => setSeatsToAdd(parseInt(e.target.value, 10))}
                    className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-2xl font-bold text-white w-12 text-right">{seatsToAdd}</span>
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  New total: {seatInfo.limit + seatsToAdd} seats
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowAddSeatsModal(false)}
                  variant="outline"
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    setAddingSeats(true)
                    try {
                      const response = await fetch('/api/billing/add-seats', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ seatsToAdd }),
                      })

                      const data = await response.json()

                      if (!response.ok) {
                        if (data.requiresUpgrade) {
                          showToast({ 
                            type: 'error', 
                            title: 'Plan upgrade required', 
                            message: data.error 
                          })
                          router.push('/')
                          return
                        }
                        throw new Error(data.error || 'Failed to add seats')
                      }

                      // If checkout URL is returned, redirect to Stripe checkout
                      if (data.url) {
                        window.location.href = data.url
                        return
                      }

                      // If no URL, seats were added directly (trial period)
                      showToast({ 
                        type: 'success', 
                        title: `Added ${seatsToAdd} seat${seatsToAdd !== 1 ? 's' : ''}`, 
                        message: 'No charge during trial period' 
                      })
                      
                      // Refresh seat info
                      const supabase = createClient()
                      const { data: { user } } = await supabase.auth.getUser()
                      if (user) {
                        const { data: userData } = await supabase
                          .from('users')
                          .select('organization_id')
                          .eq('id', user.id)
                          .single()

                        if (userData?.organization_id) {
                          const { data: org } = await supabase
                            .from('organizations')
                            .select('seat_limit, seats_used')
                            .eq('id', userData.organization_id)
                            .single()

                          if (org) {
                            setSeatInfo({
                              limit: org.seat_limit || 0,
                              used: org.seats_used || 0,
                              available: (org.seat_limit || 0) - (org.seats_used || 0),
                            })
                          }
                        }
                      }

                      setShowAddSeatsModal(false)
                    } catch (err: any) {
                      console.error('Error adding seats:', err)
                      showToast({ type: 'error', title: 'Failed to add seats', message: err.message })
                    } finally {
                      setAddingSeats(false)
                    }
                  }}
                  disabled={addingSeats}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-medium"
                >
                  {addingSeats ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add Seats
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
