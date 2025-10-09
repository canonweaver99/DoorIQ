'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Send, Paperclip, Mic, Smile, Search, CheckCheck, MessageSquare, Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

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
  lastSeen?: string
  role?: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null)
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    fetchUserAndManagers()
  }, [])

  useEffect(() => {
    if (!currentUser || !selectedManager) return
    loadConversation(selectedManager.id)
    subscribeToRealtime(selectedManager.id)
    markUnreadAsRead(selectedManager.id)
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
        await supabase.rpc('update_user_last_seen')

        // Load managers from users table (role-based)
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
          role: m.role,
          lastSeen: m.last_seen_at ? 'Online' : 'Offline',
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
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${managerId}`,
      }, (payload: any) => {
        const row = payload.new
        if (row.recipient_id !== currentUser.id) return
        setMessages(prev => [...prev, {
          id: row.id,
          text: row.message || row.message_text,
          sender_id: row.sender_id,
          sender_name: selectedManager?.name || 'Manager',
          sender_role: 'manager',
          created_at: row.created_at,
          read: !!row.is_read,
        }])
        markUnreadAsRead(managerId)
      })
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
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .match({ sender_id: managerId, recipient_id: currentUser.id, is_read: false })
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
      // Revert optimistic update
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

  const filteredManagers = managers.filter(manager => 
    manager.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#0f0f1e] to-[#1a1a2e]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#1e1e30]/50 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-white" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Messages</h1>
                <p className="text-sm text-slate-400">Chat with your managers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)]">
          {/* Manager List */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Managers</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search managers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <AnimatePresence>
                {filteredManagers.map((manager, index) => (
                  <motion.button
                    key={manager.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
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
                      <p className="text-xs text-slate-400">{manager.role}</p>
                      <p className="text-xs text-slate-500">{manager.lastSeen}</p>
                    </div>
                    {messages.filter(m => m.sender_id === manager.id && !m.read).length > 0 && (
                      <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                        {messages.filter(m => m.sender_id === manager.id && !m.read).length}
                      </span>
                    )}
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Chat Area */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-8 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
          >
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
                        <p className="text-xs text-slate-400">{selectedManager.role} • {selectedManager.lastSeen}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Phone className="w-5 h-5 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <Video className="w-5 h-5 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
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
                  </AnimatePresence>
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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={sendMessage}
                      className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all shadow-lg shadow-purple-600/30"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </motion.button>
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
          </motion.div>
        </div>
      </div>
    </div>
  )
}


