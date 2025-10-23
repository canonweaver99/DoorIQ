'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Mic, Volume2, Sparkles } from 'lucide-react'

type TranscriptEntry = {
  speaker: 'austin' | 'salesrep'
  text: string
  time: string
  isAIInsight?: boolean
}

export function LiveSessionPreview() {
  const [currentSpeaker, setCurrentSpeaker] = useState<'austin' | 'salesrep'>('salesrep')
  const [visibleMessages, setVisibleMessages] = useState<number>(3)
  const transcriptRef = useRef<HTMLDivElement>(null)
  
  // Simulate conversation flow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSpeaker(prev => prev === 'austin' ? 'salesrep' : 'austin')
    }, 3500)
    
    return () => clearInterval(interval)
  }, [])

  // Simulate messages appearing
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages(prev => {
        if (prev >= transcript.length) return 3
        return prev + 1
      })
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [visibleMessages])

  const transcript: TranscriptEntry[] = [
    { speaker: 'salesrep', text: "Hi! I'm Jake from Solar Solutions. I noticed you have a south-facing roof - perfect for solar panels!", time: '0:12' },
    { speaker: 'austin', text: "Oh, I'm not really interested. Solar is too expensive.", time: '0:18' },
    { speaker: 'salesrep', text: "AI Insight: Price objection detected - emphasize ROI and financing options", time: '0:20', isAIInsight: true },
    { speaker: 'salesrep', text: "I understand your concern. What if I told you that you could save 40% on your electric bill with zero upfront cost?", time: '0:25' },
    { speaker: 'austin', text: "Zero upfront? How does that work exactly?", time: '0:32' },
    { speaker: 'salesrep', text: "Great question! We offer a solar lease program where we install everything for free, and you just pay a lower monthly rate than your current electric bill.", time: '0:38' },
  ]

  return (
    <div className="relative w-full h-full flex flex-col bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden" style={{ minHeight: 'calc(100vh - 160px)', maxHeight: 'calc(100vh - 160px)', transform: 'scale(1.05)', transformOrigin: 'center' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 flex-shrink-0 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-white">Live Session - Solar Solutions Pitch</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Duration: 2:45</span>
        </div>
      </div>

      {/* Main Content - 3-Way Split Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section: 50/50 Split - Austin Left, Sales Rep Right */}
        <div className="grid grid-cols-2 gap-0 border-b border-purple-500/20" style={{ minHeight: '300px' }}>
          {/* Left: Agent (Austin) */}
          <div className="flex flex-col items-center justify-center p-6 border-r border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-transparent">
            <div className="relative mb-6">
              {/* Breathing animated rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 bg-gradient-to-br from-blue-500 via-purple-500 to-transparent"
                  animate={{
                    rotate: 360,
                    scale: currentSpeaker === 'austin' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: currentSpeaker === 'austin' ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {},
                  }}
                  style={{ opacity: 0.6 }}
                >
                  <div className="absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.12),transparent_70%)]" />
                </motion.div>
              ))}
              
              {/* Avatar with Rotating Gradient Background */}
              <div className={`relative w-40 h-40 rounded-full transition-all duration-500 ${
                currentSpeaker === 'austin' ? 'scale-105' : 'scale-100'
              }`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 blur-xl opacity-50" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-purple-500/50">
                  {/* Rotating gradient overlay */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute inset-[-12%] rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-transparent opacity-60 mix-blend-screen animate-spin-slow" />
                    <div className="absolute inset-[-8%] rounded-full bg-gradient-to-tr from-purple-500 via-blue-500 to-transparent opacity-35 mix-blend-screen animate-spin-reverse" />
                  </div>
                  {/* Agent profile image */}
                  <Image
                    src="/agents/austin.png"
                    alt="Austin - The Skeptic"
                    fill
                    className="object-cover relative z-10"
                  />
                </div>
              </div>
              
              {/* Speaking indicator */}
              {currentSpeaker === 'austin' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                >
                  <Volume2 className="w-6 h-6 text-white animate-pulse" />
                </motion.div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Austin</h3>
            <p className="text-sm text-purple-400 mb-3">The Skeptic</p>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              currentSpeaker === 'austin'
                ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-lg shadow-green-500/20' 
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}>
              <Volume2 className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {currentSpeaker === 'austin' ? 'Speaking' : 'Listening'}
              </span>
            </div>
          </div>

          {/* Right: Sales Rep (Jake M.) */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-950/20 to-transparent relative">
            <div className="relative mb-6">
              {/* Breathing animated rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 bg-gradient-to-br from-green-500 via-teal-500 to-transparent"
                  animate={{
                    rotate: -360,
                    scale: currentSpeaker === 'salesrep' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    scale: currentSpeaker === 'salesrep' ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {},
                  }}
                  style={{ opacity: 0.6 }}
                >
                  <div className="absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.12),transparent_70%)]" />
                </motion.div>
              ))}
              
              {/* Sales Rep Avatar with Rotating Gradient Background */}
              <div className={`relative w-40 h-40 rounded-full transition-all duration-500 ${
                currentSpeaker === 'salesrep' ? 'scale-105' : 'scale-100'
              }`}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-green-500 to-teal-500 blur-xl opacity-50" />
                <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-green-500/50">
                  {/* Rotating gradient overlay */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute inset-[-12%] rounded-full bg-gradient-to-br from-green-500 via-teal-500 to-transparent opacity-60 mix-blend-screen animate-spin-slow" />
                    <div className="absolute inset-[-8%] rounded-full bg-gradient-to-tr from-teal-500 via-green-500 to-transparent opacity-35 mix-blend-screen animate-spin-reverse" />
                  </div>
                  {/* Sales Rep Avatar - using a placeholder headshot */}
                  <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                    {/* Placeholder avatar - professional salesman silhouette */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-600/20 to-teal-600/20">
                      <svg className="w-24 h-24 text-green-300/60" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Speaking indicator */}
              {currentSpeaker === 'salesrep' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center shadow-lg"
                >
                  <Volume2 className="w-6 h-6 text-white animate-pulse" />
                </motion.div>
              )}
              
              {/* Recording indicator */}
              <div className="absolute -top-2 -right-2 flex items-center gap-1.5 bg-red-500 px-2.5 py-1.5 rounded-full shadow-lg">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-xs text-white font-bold">REC</span>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Jake M.</h3>
            <p className="text-sm text-green-400 mb-3">Sales Rep</p>
            
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
              currentSpeaker === 'salesrep'
                ? 'bg-green-500/20 text-green-400 border border-green-500/40 shadow-lg shadow-green-500/20' 
                : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
            }`}>
              <Mic className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {currentSpeaker === 'salesrep' ? 'Speaking' : 'Listening'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Section: Live Transcript (Full Width) - Fixed Height */}
        <div className="bg-black/30 flex flex-col relative" style={{ height: '300px', minHeight: '300px', maxHeight: '300px' }}>
          <div className="px-4 py-2 border-b border-purple-500/10 flex-shrink-0">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Transcript</h4>
          </div>
          
          {/* Fade gradient overlays */}
          <div className="absolute top-10 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
          
          <div 
            ref={transcriptRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2 custom-scrollbar"
            style={{
              scrollBehavior: 'smooth',
              height: 'calc(300px - 42px)' // Subtract header height
            }}
          >
            {transcript.slice(0, visibleMessages).map((entry, index) => {
              if (entry.isAIInsight) {
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start gap-2 p-2.5 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/40"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-yellow-400">AI Insight</span>
                        <span className="text-[10px] text-slate-500">{entry.time}</span>
                      </div>
                      <p className="text-xs text-yellow-200/90 leading-relaxed">{entry.text}</p>
        </div>
                  </motion.div>
                )
              }
              
              return (
                <motion.div
                key={index}
                  initial={{ opacity: 0, x: entry.speaker === 'salesrep' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${entry.speaker === 'salesrep' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-2.5 rounded-lg ${
                    entry.speaker === 'salesrep'
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-purple-500/20 border border-purple-500/30'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${
                        entry.speaker === 'salesrep' ? 'text-green-400' : 'text-purple-400'
                    }`}>
                        {entry.speaker === 'salesrep' ? 'Sales Rep' : 'Austin'}
                    </span>
                    <span className="text-[10px] text-slate-500">{entry.time}</span>
                  </div>
                  <p className="text-xs text-white/90 leading-relaxed">{entry.text}</p>
                </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="flex items-center justify-center gap-6 px-4 py-3 border-t border-purple-500/20 bg-black/30 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Rapport:</span>
          <span className="text-yellow-400 font-bold">93%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Discovery:</span>
          <span className="text-blue-400 font-bold">89%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Obj. Handling:</span>
          <span className="text-green-400 font-bold">85%</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Closing:</span>
          <span className="text-purple-400 font-bold">68%</span>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 12s linear infinite;
        }
      `}</style>
    </div>
  )
}
