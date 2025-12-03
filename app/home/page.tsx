'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { Calendar, Clock } from 'lucide-react'
import { format } from 'date-fns'
import HomepageContent from '@/app/dashboard/components/HomepageContent'

// Animated Background Component (matching dashboard)
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-pink-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -70, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/15 via-blue-500/15 to-transparent rounded-full blur-[100px]"
      />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
      
      {/* Animated grid pattern */}
      <motion.div
        animate={{
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [userName, setUserName] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // TEMPORARILY DISABLED FOR TESTING - Allow viewing without auth
      // if (!user) {
      //   router.push('/auth/login')
      //   return
      // }
      
      if (!user) {
        // Don't set a name if no user - let it show 'there'
        setUserName('')
        setLoading(false)
        return
      }
      
      // Get user name
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single()
      
      if (userData?.full_name) {
        const firstName = userData.full_name.split(' ')[0] || userData.email?.split('@')[0] || ''
        if (firstName) {
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
        } else {
          setUserName('')
        }
      } else if (userData?.email) {
        const emailName = userData.email.split('@')[0] || ''
        if (emailName) {
          setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase())
        } else {
          setUserName('')
        }
      } else {
        // Try to get name from auth user metadata as fallback
        const authName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || ''
        if (authName) {
          const firstName = authName.split(' ')[0]
          setUserName(firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase())
        } else {
          setUserName('')
        }
      }
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching user data:', error)
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy')
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) {
      return { emoji: '☀️', text: 'Good morning' }
    } else if (hour < 17) {
      return { emoji: '👋', text: 'Back for more' }
    } else {
      return { emoji: '🌙', text: 'Evening grind' }
    }
  }

  const getDisplayName = () => {
    // Always show the name if we have it, even if it's 'Guest' or 'User'
    // Only fall back to 'there' if userName is truly empty
    if (!userName || userName.trim() === '') {
      return 'there'
    }
    return userName
  }

  const timeOfDay = getTimeOfDayGreeting()

  if (loading) {
    return (
      <main className="bg-black min-h-screen text-white relative flex items-center justify-center">
        <AnimatedBackground />
        <div className="text-white/80 text-lg font-sans">Loading...</div>
      </main>
    )
  }

  return (
    <main className="bg-black min-h-screen text-white relative">
      <AnimatedBackground />
      
      <div className="relative z-10 pt-24 pb-16 px-6 sm:px-8 lg:px-12">
        <div className="max-w-[1800px] mx-auto">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 sm:mb-10 lg:mb-12"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex-1">
                <h1 className="font-space text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light tracking-tight mb-3">
                  {timeOfDay.emoji} {timeOfDay.text},{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    {getDisplayName()}
                  </span>
                </h1>
                <p className="text-white/80 text-base sm:text-lg md:text-xl font-normal mb-4">
                  Ready to level up your pitch?
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white/70 text-sm md:text-base font-sans">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="break-words">{formatDate(currentTime)}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTime(currentTime)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Homepage Content */}
          <HomepageContent />
        </div>
      </div>
    </main>
  )
}
