'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

interface Notification {
  id: string
  message: string
  senderName: string
  senderId: string
  timestamp: string
}

interface NotificationContextType {
  notifications: Notification[]
  clearNotification: (id: string) => void
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  clearNotification: () => {},
})

export const useNotifications = () => useContext(NotificationContext)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setupNotifications()
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [])

  const setupNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    setCurrentUser(userData)

    // Subscribe to incoming messages
    const channel = supabase.channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`,
      }, async (payload: any) => {
        const message = payload.new
        
        // Don't show notification if we're already in messages
        if (pathname.includes('/messages')) return

        // Get sender info
        const { data: sender } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', message.sender_id)
          .single()

        const notification: Notification = {
          id: message.id,
          message: message.message || message.message_text,
          senderName: sender?.full_name || 'Unknown',
          senderId: message.sender_id,
          timestamp: message.created_at,
        }

        setNotifications(prev => [...prev, notification])

        // Auto-remove after 5 seconds
        setTimeout(() => {
          clearNotification(notification.id)
        }, 5000)
      })
      .subscribe()

    channelRef.current = channel
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to messages
    if (currentUser?.role === 'manager' || currentUser?.role === 'admin') {
      router.push('/manager?tab=messages')
    } else {
      router.push('/messages')
    }
    clearNotification(notification.id)
  }

  return (
    <NotificationContext.Provider value={{ notifications, clearNotification }}>
      {children}
      
      {/* Notification Banners */}
      <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className="max-w-sm w-full bg-[#1e1e30] border border-purple-500/50 rounded-xl shadow-lg shadow-purple-500/20 overflow-hidden pointer-events-auto"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{notification.senderName}</p>
                    <p className="text-sm text-slate-300 truncate">{notification.message}</p>
                  </div>
                  <button
                    onClick={() => clearNotification(notification.id)}
                    className="flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => handleNotificationClick(notification)}
                    className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-xs font-medium text-white transition-all"
                  >
                    View Message
                  </button>
                  <button
                    onClick={() => clearNotification(notification.id)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-white transition-all"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}
