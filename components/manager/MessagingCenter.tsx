'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { Send, Paperclip, Mic, Smile, Search, Users, Clock, CheckCheck } from 'lucide-react'

const conversations = [
  { id: 1, name: 'Marcus Johnson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', lastMessage: 'Thanks for the feedback!', time: '2m', unread: 0, online: true },
  { id: 2, name: 'Sarah Chen', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop', lastMessage: 'When is the next training?', time: '15m', unread: 2, online: true },
  { id: 3, name: 'Team Alpha (All)', avatar: '', lastMessage: 'Great work this week everyone!', time: '1h', unread: 0, online: false, isGroup: true },
  { id: 4, name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop', lastMessage: 'Could you review my last session?', time: '2h', unread: 1, online: false },
]

const messages = [
  { id: 1, sender: 'Marcus Johnson', text: 'Hi! I wanted to ask about the new objection handling techniques', time: '10:30 AM', isOwn: false },
  { id: 2, sender: 'You', text: 'Sure! The new approach focuses on acknowledge-validate-respond. Have you reviewed the playbook?', time: '10:32 AM', isOwn: true },
  { id: 3, sender: 'Marcus Johnson', text: 'Yes, I practiced it in my last session and scored 92%!', time: '10:35 AM', isOwn: false },
  { id: 4, sender: 'You', text: 'That\'s excellent! Keep using that assumptive language you\'ve been working on.', time: '10:37 AM', isOwn: true },
  { id: 5, sender: 'Marcus Johnson', text: 'Thanks for the feedback!', time: '10:38 AM', isOwn: false },
]

export default function MessagingCenter() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0])
  const [messageText, setMessageText] = useState('')

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
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map((conv, index) => (
            <motion.button
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-4 border-b border-white/5 hover:bg-white/5 transition-all text-left ${
                selectedConversation.id === conv.id ? 'bg-white/10' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                {conv.isGroup ? (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                ) : (
                  <div className="relative">
                    <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-xl object-cover" />
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1e1e30] rounded-full"></div>
                    )}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-white truncate">{conv.name}</p>
                    <span className="text-xs text-slate-400">{conv.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Broadcast Button */}
        <div className="p-4 border-t border-white/10">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-sm font-semibold text-white transition-all shadow-lg shadow-purple-600/30">
            <Users className="w-4 h-4" />
            Broadcast to All
          </button>
        </div>
      </div>

      {/* Active Conversation */}
      <div className="col-span-12 md:col-span-8 bg-[#1e1e30] border border-white/10 rounded-2xl overflow-hidden flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {selectedConversation.isGroup ? (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="relative">
                  <img src={selectedConversation.avatar} alt={selectedConversation.name} className="w-10 h-10 rounded-xl object-cover" />
                  {selectedConversation.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-[#1e1e30] rounded-full"></div>
                  )}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-white">{selectedConversation.name}</p>
                <p className="text-xs text-slate-400">{selectedConversation.online ? 'Online' : 'Offline'}</p>
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
              className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                {!message.isOwn && (
                  <span className="text-xs text-slate-400 px-2">{message.sender}</span>
                )}
                <div className={`px-4 py-3 rounded-2xl ${
                  message.isOwn
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
                    : 'bg-white/10 text-white border border-white/10'
                }`}>
                  <p className="text-sm">{message.text}</p>
                </div>
                <div className="flex items-center gap-2 px-2">
                  <span className="text-xs text-slate-400">{message.time}</span>
                  {message.isOwn && (
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
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
            />
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Mic className="w-5 h-5 text-slate-400" />
            </button>
            <button className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all">
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

