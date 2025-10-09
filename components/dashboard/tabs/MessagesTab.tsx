'use client'

import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Paperclip, Mic, Smile, Search, CheckCheck, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { messageEvents } from '@/lib/events/messageEvents'

interface Message {
  id: string
  text: string
  sender_id: string
  sender_name: string
  sender_role: 'rep' | 'manager'
  created_at: string
  read: boolean
}

interface Manager {
  id: string
  name: string
  avatar?: string
  online?: boolean
}

export default function MessagesTab() {
  const [messages, setMessages] = useState<Message[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    fetchUserAndManagers()
  }, [])

  // Load conversation when manager changes
  useEffect(() => {
    if (!currentUser || !selectedManager) return
    loadConversation(selectedManager.id)
    subscribeToRealtime(selectedManager.id)
    // Mark unread as read with a small delay to ensure they're loaded
    setTimeout(() => {
      markUnreadAsRead(selectedManager.id)
    }, 100)
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, selectedManager?.id])

  const fetchUserAndManagers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser(userData)
        // Update last seen
        await supabase.rpc('update_user_last_seen')

        // Fetch managers (basic approach by role)
        const { data: mgrs } = await supabase
          .from('users')
          .select('id, full_name, role, last_seen_at')
          .in('role', ['manager', 'admin'])
          .order('full_name', { ascending: true })

        const now = Date.now()
        const mapped: Manager[] = (mgrs || []).map((m: any) => ({
          id: m.id,
          name: m.full_name || 'Manager',
          online: m.last_seen_at ? (now - new Date(m.last_seen_at).getTime() < 5 * 60 * 1000) : false,
        }))
        setManagers(mapped)
        if (mapped.length > 0) setSelectedManager(mapped[0])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async (managerId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_conversation_history', {
        user1_id: currentUser.id,
        user2_id: managerId,
      })
      if (error) throw error
      const mapped: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        text: m.message_text,
        sender_id: m.sender_id,
        sender_name: m.sender_name,
        sender_role: (m.sender_role === 'manager' ? 'manager' : 'rep'),
        created_at: m.created_at,
        read: m.is_read,
      }))
      setMessages(mapped)
    } catch (e) {
      console.error('Failed to load conversation', e)
    }
  }

  const subscribeToRealtime = (managerId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    const channel = supabase.channel(`messages:${currentUser.id}:${managerId}`)
      // Incoming from manager -> rep
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${managerId}`,
      }, (payload: any) => {
        const row = payload.new
        if (row.recipient_id !== currentUser.id) return
        
        // Add the message
        setMessages(prev => [...prev, {
          id: row.id,
          text: row.message || row.message_text,
          sender_id: row.sender_id,
          sender_name: selectedManager?.name || 'Manager',
          sender_role: 'manager',
          created_at: row.created_at,
          read: !!row.is_read,
        }])
        
        // If this conversation is selected, mark as read immediately
        if (selectedManager?.id === managerId) {
          markUnreadAsRead(managerId)
        } else {
          // Otherwise, increment unread count for that manager
          setManagers(prev => prev.map(mgr => 
            mgr.id === managerId 
              ? { ...mgr, unreadCount: (mgr.unreadCount || 0) + 1 } 
              : mgr
          ))
        }
      })
      // Outgoing from rep -> manager (optimistic already, but keep in sync)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${currentUser.id}`,
      }, (payload: any) => {
        const row = payload.new
        if (row.recipient_id !== managerId) return
        setMessages(prev => {
          const exists = prev.some(m => m.id === row.id)
          if (exists) return prev
          return [...prev, {
            id: row.id,
            text: row.message || row.message_text,
            sender_id: row.sender_id,
            sender_name: currentUser.full_name || 'You',
            sender_role: 'rep',
            created_at: row.created_at,
            read: !!row.is_read,
          }]
        })
      })
      .subscribe()
    channelRef.current = channel
  }

  const markUnreadAsRead = async (managerId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .match({ sender_id: managerId, recipient_id: currentUser.id, is_read: false })
      
      if (!error) {
        // Update the unread count in the managers list
        setManagers(prev => prev.map(mgr => 
          mgr.id === managerId ? { ...mgr, unreadCount: 0 } : mgr
        ))
        // Emit event to update header badge
        messageEvents.emitMessagesRead()
      }
    } catch (e) {
      console.error('Failed to mark messages as read', e)
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedManager || !currentUser) return

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'You',
      sender_role: 'rep',
      created_at: new Date().toISOString(),
      read: true,
    }

    setMessages(prev => [...prev, optimistic])
    const textToSend = messageText
    setMessageText('')

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          recipient_id: selectedManager.id,
          message: textToSend,
        })
        .select('id, created_at, is_read')
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // Replace optimistic with actual if needed
      setMessages(prev => prev.map(m => m.id === optimistic.id ? {
        ...m,
        id: data.id,
        created_at: data.created_at,
        read: !!data.is_read,
      } : m))
    } catch (e: any) {
      console.error('Failed to send message:', e)
      console.error('Error details:', {
        message: e.message,
        details: e.details,
        hint: e.hint,
        code: e.code
      })
      // Show error to user
      alert(`Failed to send message: ${e.message || 'Unknown error'}`)
      // Revert optimistic
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setMessageText(textToSend)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-320px)]"
    >
      {/* Manager List */}
      <div className="lg:col-span-4 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">Your Managers</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search managers..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {managers.map((manager) => (
            <motion.button
              key={manager.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4 }}
              onClick={() => setSelectedManager(manager)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-white/5 transition-all ${
                selectedManager?.id === manager.id ? 'bg-white/10 border-l-2 border-purple-500' : ''
              }`}
            >
              <div className="relative">
                {manager.avatar ? (
                  <img src={manager.avatar} alt={manager.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {manager.name.charAt(0)}
                  </div>
                )}
                {manager.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1e1e30] rounded-full"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">{manager.name}</p>
                <p className="text-xs text-slate-400">{manager.online ? 'Online' : 'Offline'}</p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Quick Tips */}
        <div className="p-4 border-t border-white/10 bg-purple-500/10">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-purple-300 font-medium">Pro Tip</p>
              <p className="text-xs text-slate-400">Regular check-ins with your manager lead to 23% better performance!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="lg:col-span-8 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {selectedManager ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {selectedManager.avatar ? (
                      <img src={selectedManager.avatar} alt={selectedManager.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {selectedManager.name.charAt(0)}
                      </div>
                    )}
                    {selectedManager.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1e1e30] rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedManager.name}</p>
                    <p className="text-xs text-slate-400">Manager • {selectedManager.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] ${message.sender_id === currentUser?.id ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    {message.sender_id !== currentUser?.id && (
                      <span className="text-xs text-slate-400 px-2">{message.sender_name}</span>
                    )}
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.sender_id === currentUser?.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                        : 'bg-white/10 text-white border border-white/10'
                    }`}>
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs text-slate-400">{formatTime(message.created_at)}</span>
                      {message.sender_id === currentUser?.id && message.read && (
                        <CheckCheck className="w-3 h-3 text-purple-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Paperclip className="w-5 h-5 text-slate-400" />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Smile className="w-5 h-5 text-slate-400" />
                </button>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                  <Mic className="w-5 h-5 text-slate-400" />
                </button>
                <button
                  onClick={sendMessage}
                  className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Select a manager to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
