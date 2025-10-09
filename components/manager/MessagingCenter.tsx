'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Mic, Smile, Search, Users, CheckCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  text: string
  sender_id: string
  sender_name: string
  sender_role: 'rep' | 'manager'
  created_at: string
  read: boolean
}

interface Conversation {
  id: string
  name: string
  avatar?: string
  online?: boolean
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  role?: string
}

export default function MessagingCenter() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isBroadcasting, setIsBroadcasting] = useState(false)
  const [broadcastMessage, setBroadcastMessage] = useState('')
  const [showBroadcastModal, setShowBroadcastModal] = useState(false)
  const supabase = createClient()
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    fetchUserAndConversations()
  }, [])

  useEffect(() => {
    if (!currentUser || !selectedConversation) return
    loadMessages(selectedConversation.id)
    subscribeToRealtime(selectedConversation.id)
    markMessagesAsRead(selectedConversation.id)
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, selectedConversation?.id])

  const fetchUserAndConversations = async () => {
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

        // Fetch latest conversations
        const { data: convData, error } = await supabase.rpc('get_latest_conversations', {
          user_id: user.id
        })

        if (error) throw error

        const mapped: Conversation[] = (convData || []).map((c: any) => ({
          id: c.contact_id,
          name: c.contact_name || 'User',
          online: c.is_online,
          lastMessage: c.last_message,
          lastMessageTime: c.last_message_time,
          unreadCount: c.unread_count || 0,
          role: c.contact_role
        }))

        setConversations(mapped)
        if (mapped.length > 0) setSelectedConversation(mapped[0])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (repId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_conversation_history', {
        user1_id: currentUser.id,
        user2_id: repId,
      })
      if (error) throw error
      
      const mapped: Message[] = (data || []).map((m: any) => ({
        id: m.id,
        text: m.message_text,
        sender_id: m.sender_id,
        sender_name: m.sender_name,
        sender_role: m.sender_role,
        created_at: m.created_at,
        read: m.is_read,
      }))
      setMessages(mapped)
    } catch (e) {
      console.error('Failed to load messages:', e)
    }
  }

  const subscribeToRealtime = (repId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    const channel = supabase.channel(`messages:${currentUser.id}:${repId}`)
      // Incoming from rep
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${repId}`,
      }, (payload: any) => {
        const row = payload.new
        if (row.recipient_id !== currentUser.id) return
        
        // Add the message
        setMessages(prev => [...prev, {
          id: row.id,
          text: row.message || row.message_text,
          sender_id: row.sender_id,
          sender_name: selectedConversation?.name || 'Rep',
          sender_role: 'rep',
          created_at: row.created_at,
          read: !!row.is_read,
        }])
        
        // If this conversation is selected, mark as read immediately
        if (selectedConversation?.id === repId) {
          markMessagesAsRead(repId)
        } else {
          // Otherwise, increment unread count for that conversation
          setConversations(prev => prev.map(conv => 
            conv.id === repId 
              ? { ...conv, unreadCount: (conv.unreadCount || 0) + 1 } 
              : conv
          ))
        }
      })
      // Outgoing from manager
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${currentUser.id}`,
      }, (payload: any) => {
        const row = payload.new
        if (row.recipient_id !== repId) return
        setMessages(prev => {
          const exists = prev.some(m => m.id === row.id)
          if (exists) return prev
          return [...prev, {
            id: row.id,
            text: row.message || row.message_text,
            sender_id: row.sender_id,
            sender_name: currentUser.full_name || 'You',
            sender_role: 'manager',
            created_at: row.created_at,
            read: !!row.is_read,
          }]
        })
      })
      .subscribe()
    
    channelRef.current = channel
  }

  const markMessagesAsRead = async (repId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .match({ sender_id: repId, recipient_id: currentUser.id, is_read: false })
      
      if (!error) {
        // Update the unread count in the conversations list
        setConversations(prev => prev.map(conv => 
          conv.id === repId ? { ...conv, unreadCount: 0 } : conv
        ))
      }
    } catch (e) {
      console.error('Failed to mark messages as read:', e)
    }
  }

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || !currentUser) return

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      text: messageText,
      sender_id: currentUser.id,
      sender_name: currentUser.full_name || 'You',
      sender_role: 'manager',
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
          recipient_id: selectedConversation.id,
          message: textToSend,
        })
        .select('id, created_at, is_read')
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      setMessages(prev => prev.map(m => m.id === optimistic.id ? {
        ...m,
        id: data.id,
        created_at: data.created_at,
        read: !!data.is_read,
      } : m))
    } catch (e: any) {
      console.error('Failed to send message:', e)
      alert(`Failed to send message: ${e.message || 'Unknown error'}`)
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
    if (diffMins < 60) return `${diffMins}m`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
    return date.toLocaleDateString()
  }

  const filteredConversations = conversations.filter(conv => 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || isBroadcasting) return

    setIsBroadcasting(true)
    
    try {
      // Fetch all reps
      const { data: reps, error: repsError } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('role', 'rep')

      if (repsError) throw repsError

      // Send message to each rep
      const messagePromises = reps.map(rep => 
        supabase.from('messages').insert({
          sender_id: currentUser.id,
          recipient_id: rep.id,
          message: broadcastMessage,
        })
      )

      await Promise.all(messagePromises)
      
      setBroadcastMessage('')
      setShowBroadcastModal(false)
      alert(`Broadcast sent to ${reps.length} reps!`)
      
      // Refresh conversations
      await fetchUserAndConversations()
    } catch (error) {
      console.error('Broadcast failed:', error)
      alert('Failed to send broadcast. Please try again.')
    } finally {
      setIsBroadcasting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-280px)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-280px)] grid grid-cols-12 gap-6">
      {/* Conversations List */}
      <div className="col-span-12 md:col-span-4 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence>
            {filteredConversations.map((conv, index) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full p-4 border-b border-white/5 hover:bg-white/5 transition-all text-left ${
                  selectedConversation?.id === conv.id ? 'bg-white/10' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {conv.avatar ? (
                      <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-xl object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {conv.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1e1e30] rounded-full"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-white truncate">{conv.name}</p>
                      <span className="text-xs text-slate-400">{conv.lastMessageTime ? formatTime(conv.lastMessageTime) : ''}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 truncate">{conv.lastMessage || 'No messages yet'}</p>
                      {conv.unreadCount > 0 && (
                        <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* Broadcast Button */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => setShowBroadcastModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30"
          >
            <Users className="w-4 h-4" />
            Broadcast to All
          </button>
        </div>
      </div>

      {/* Active Conversation */}
      <div className="col-span-12 md:col-span-8 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {selectedConversation.avatar ? (
                      <img src={selectedConversation.avatar} alt={selectedConversation.name} className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                        {selectedConversation.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1e1e30] rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{selectedConversation.name}</p>
                    <p className="text-xs text-slate-400">Rep • {selectedConversation.online ? 'Online' : 'Offline'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Select a rep to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcastModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-50"
              onClick={() => setShowBroadcastModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#1e1e30] border border-white/10 rounded-2xl p-6 z-50"
            >
              <h3 className="text-xl font-semibold text-white mb-4">Broadcast Message</h3>
              <p className="text-sm text-slate-400 mb-4">This message will be sent to all reps in your team.</p>
              
              <textarea
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type your broadcast message..."
                className="w-full h-32 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/40"
              />
              
              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBroadcast}
                  disabled={!broadcastMessage.trim() || isBroadcasting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all"
                >
                  {isBroadcasting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

