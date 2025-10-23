'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Volume2 } from 'lucide-react'

type TranscriptEntry = {
  speaker: 'austin' | 'salesrep'
  text: string
  time: string
}

export function LiveSessionPreview() {
  const [currentSpeaker, setCurrentSpeaker] = useState<'austin' | 'salesrep'>('salesrep')
  const [visibleMessages, setVisibleMessages] = useState<number>(3)
  const transcriptRef = useRef<HTMLDivElement>(null)
  
  // Simulate conversation flow - sync with transcript
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages(prev => {
        const nextIndex = prev >= fullTranscript.length ? 0 : prev
        if (nextIndex < fullTranscript.length) {
          setCurrentSpeaker(fullTranscript[nextIndex].speaker)
        }
        return nextIndex >= fullTranscript.length ? 1 : prev + 1
      })
    }, 3000) // Show new message every 3 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [visibleMessages])

  const fullTranscript: TranscriptEntry[] = [
    { speaker: 'salesrep', text: "Hey there! How's it going today?", time: '0:03' },
    { speaker: 'austin', text: "Pretty good, just got back from my kid's baseball game. What can I do for ya?", time: '0:06' },
    { speaker: 'salesrep', text: "Oh nice, baseball! How'd they do?", time: '0:11' },
    { speaker: 'austin', text: "Won 7 to 4! My boy hit a double in the third, I was goin' nuts.", time: '0:14' },
    { speaker: 'salesrep', text: "That's awesome! There's nothing like watching your kids play. I'm Jake, by the way.", time: '0:19' },
    { speaker: 'austin', text: "Name's Austin. Good to meet ya.", time: '0:25' },
    { speaker: 'salesrep', text: "You too, man. So hey, I'm actually out here today talking to homeowners about their energy bills. Have you noticed yours going up lately?", time: '0:28' },
    { speaker: 'austin', text: "I mean, yeah, it's Texas in the summer. They're always high.", time: '0:36' },
    { speaker: 'salesrep', text: "Right? It's brutal. That's actually why I'm here. We've been helping folks in the neighborhood cut their bills by 20 to 30 percent with solar. Have you ever looked into it?", time: '0:40' },
    { speaker: 'austin', text: "Solar, huh? I've thought about it, but I figured it was expensive.", time: '0:50' },
    { speaker: 'salesrep', text: "I totally get that. Most people think the same thing. But here's the thing, you're not paying anything upfront. We basically just swap what you're paying the electric company and redirect it to owning your own power instead.", time: '0:55' },
    { speaker: 'austin', text: "So no money down?", time: '1:05' },
    { speaker: 'salesrep', text: "Zero. And honestly, most folks end up paying less per month than they're paying right now. You got a few minutes? I can show you real quick what it'd look like for your house specifically.", time: '1:08' },
    { speaker: 'austin', text: "I guess I got a few minutes. What do you need to know?", time: '1:18' },
    { speaker: 'salesrep', text: "Just a quick look at your last electric bill if you got it handy. That'll tell me everything I need to know.", time: '1:21' },
    { speaker: 'austin', text: "Alright, let me grab it. Come on in for a sec, it's hot as hell out here.", time: '1:28' },
    { speaker: 'salesrep', text: "Appreciate that, man. Yeah, it's a scorcher today.", time: '1:34' },
    { speaker: 'austin', text: "So how long you been doing this solar thing?", time: '1:38' },
    { speaker: 'salesrep', text: "About three years now. Started because my own bill was killing me, figured if it worked for me, I should help other people save too.", time: '1:42' },
    { speaker: 'austin', text: "Makes sense. Alright, here's last month's bill.", time: '1:51' },
  ]

  return (
    <div className="relative w-full h-full flex flex-col bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden" style={{ minHeight: 'calc(100vh - 160px)', maxHeight: 'calc(100vh - 160px)' }}>
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
        <div className="grid grid-cols-2 gap-0 border-b border-purple-500/20" style={{ minHeight: '240px' }}>
          {/* Left: Agent (Austin) */}
          <div className="flex flex-col items-center justify-center p-6 border-r border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-transparent">
            <div className="relative mb-6">
              {/* Animated rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 bg-gradient-to-br from-blue-500 via-purple-500 to-transparent"
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
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
            <p className="text-sm text-purple-400">The Skeptic</p>
          </div>

          {/* Right: Sales Rep (Jake M.) */}
          <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-950/20 to-transparent relative">
            <div className="relative mb-6">
              {/* Animated rings */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border-2 bg-gradient-to-br from-green-500 via-teal-500 to-transparent"
                  animate={{
                    rotate: -360,
                  }}
                  transition={{
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
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
                  {/* Sales Rep Avatar */}
                  <Image
                    src="/sales-rep-hero.png"
                    alt="Jake M. - Sales Rep"
                    fill
                    className="object-cover relative z-10"
                  />
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
            </div>
            
            <h3 className="text-xl font-bold text-white mb-1">Jake M.</h3>
            <p className="text-sm text-green-400">Sales Rep</p>
          </div>
        </div>

        {/* Bottom Section: Transcript (Full Width) - Fixed Height (label removed) */}
        <div className="bg-black/30 flex flex-col relative" style={{ height: '360px', minHeight: '360px', maxHeight: '360px' }}>
          
          {/* Bottom fade gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
          
          <div 
            ref={transcriptRef}
            className="flex-1 overflow-y-auto px-4 py-4 pb-12 space-y-1.5 custom-scrollbar"
            style={{
              scrollBehavior: 'smooth',
              height: '360px'
            }}
          >
            {fullTranscript.slice(0, visibleMessages).map((entry, index) => {
              const isRep = entry.speaker === 'salesrep'
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${isRep ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%]`}>
                    <div
                      className={`rounded-xl px-3 py-2 backdrop-blur-sm ${
                        isRep
                          ? 'bg-purple-500/10 border border-purple-500/20'
                          : 'bg-slate-800/50 border border-slate-700/30'
                      }`}
                    >
                      {/* Message Text */}
                      <p className={`text-xs leading-[1.4] font-semibold ${
                        isRep ? 'text-white' : 'text-slate-200'
                      }`}>
                        {entry.text}
                      </p>
                    </div>
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
