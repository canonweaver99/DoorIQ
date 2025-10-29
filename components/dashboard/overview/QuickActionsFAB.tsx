'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Plus, PlayCircle, MessageCircle, FileText } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import LastFeedbackModal from './LastFeedbackModal'

export default function QuickActionsFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasSession, setHasSession] = useState(true)
  const [userId, setUserId] = useState<string>('')
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        checkHasSession(user.id)
        checkUnreadMessages(user.id)
        subscribeToMessages(user.id)
      }
    }

    getUser()
  }, [])

  const checkHasSession = async (userId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('live_sessions')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single()
    
    setHasSession(!error && !!data)
  }

  const checkUnreadMessages = async (userId: string) => {
    const supabase = createClient()
    const lastViewed = localStorage.getItem('lastMessagesView') || '2000-01-01'
    
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .gt('created_at', lastViewed)
    
    setUnreadCount(count || 0)
  }

  const subscribeToMessages = (userId: string) => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        () => {
          checkUnreadMessages(userId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleMessagesClick = () => {
    localStorage.setItem('lastMessagesView', new Date().toISOString())
    setUnreadCount(0)
    router.push('/messages')
  }

  const handleFeedbackClick = () => {
    if (hasSession) {
      setShowFeedbackModal(true)
      setIsOpen(false)
    }
  }

  const actions = [
    { 
      icon: PlayCircle, 
      label: 'Start Training', 
      onClick: () => router.push('/trainer'),
      bgColor: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      disabled: false,
    },
    { 
      icon: MessageCircle, 
      label: 'Message Manager', 
      onClick: handleMessagesClick,
      bgColor: 'bg-blue-500/10',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      disabled: false,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { 
      icon: FileText, 
      label: 'View Last Feedback', 
      onClick: handleFeedbackClick,
      bgColor: 'bg-teal-500/10',
      iconBg: 'bg-teal-500/20',
      iconColor: 'text-teal-400',
      disabled: !hasSession,
    },
  ]

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[1000]">
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="fixed inset-0 -z-10"
              />
              
              {/* Action Menu */}
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-[72px] right-0 space-y-3 mb-2"
              >
                {actions.map((action, index) => (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: 20, scale: 0.8 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.8 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`
                      flex items-center gap-3 
                      bg-[rgba(30,30,48,0.95)] backdrop-blur-xl
                      border border-purple-500/20 
                      rounded-[28px] 
                      px-5 py-3
                      hover:scale-105 hover:border-purple-500/40
                      transition-all duration-200 
                      shadow-lg
                      ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="relative">
                      <div className={`p-2 ${action.iconBg} rounded-full`}>
                        <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                      </div>
                      {action.badge && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{action.badge}</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-white whitespace-nowrap pr-2">
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main FAB Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 transition-shadow duration-300"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.div>
        </motion.button>
      </div>

      {/* Last Feedback Modal */}
      <LastFeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        userId={userId}
      />
    </>
  )
}

