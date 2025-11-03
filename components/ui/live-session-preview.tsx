'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Volume2, Mic, Video, Settings, Maximize2 } from 'lucide-react'

type TranscriptEntry = {
  speaker: 'austin' | 'salesrep'
  text: string
  time: string
}

export function LiveSessionPreview() {
  const [currentSpeaker, setCurrentSpeaker] = useState<'austin' | 'salesrep'>('salesrep')
  const [visibleMessages, setVisibleMessages] = useState<number>(0)
  const [currentTime, setCurrentTime] = useState<number>(3)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const [repImageSrc, setRepImageSrc] = useState<string>('/billy.png')
  const handleRepImageError = () => {
    setRepImageSrc(prev => (prev === '/billy.png' ? '/dipshit.png' : '/sales-rep-hero.png'))
  }
  
  // Simulate conversation flow - sync with transcript
  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleMessages(prev => {
        // When we reach the end, restart from the beginning
        if (prev >= fullTranscript.length) {
          setCurrentTime(3)
          setCurrentSpeaker('salesrep')
          return 1
        }
        
        // Set current speaker for the next message
        if (prev < fullTranscript.length) {
          setCurrentSpeaker(fullTranscript[prev].speaker)
        }
        
        return prev + 1
      })
    }, 3000) // Show new message every 3 seconds
    
    return () => clearInterval(interval)
  }, [])

  // Timer that counts up
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black/40 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden max-h-[calc(100vh-140px)] xl:max-h-[500px] 2xl:max-h-[450px]" style={{ minHeight: 'calc(100vh - 140px)', transform: 'scale(1.02)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-purple-500/20 flex-shrink-0 bg-black/20">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-white">Live Session - Solar Solutions Pitch</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Duration: {formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Main Content - 3-Way Split Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Section: 50/50 Split - Austin Left, Sales Rep Right */}
        <div className="grid grid-cols-2 gap-0 xl:min-h-[220px] 2xl:min-h-[240px]" style={{ minHeight: '240px' }}>
          {/* Left: Agent (Austin) */}
          <div className="flex flex-col items-center justify-end p-0 border-r border-purple-500/20 bg-gradient-to-br from-purple-950/20 to-transparent relative">
            {/* Austin Image - Fill entire rectangle */}
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                <Image
                  src="/AUSTIN FINAL.png"
                  alt="Austin"
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  className="object-cover"
                  style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
                />

                {/* Speaking indicator removed for Austin per request */}
              </div>
            </div>
          </div>

          {/* Right: Sales Rep (Jake M.) */}
          <div className="flex flex-col items-center justify-end p-0 bg-gradient-to-br from-green-950/20 to-transparent relative">
            {/* Sales Rep Webcam POV - Fill entire rectangle */}
            <div className="absolute inset-0">
              <div className="relative w-full h-full">
                <Image
                  src={repImageSrc}
                  alt="Sales Rep"
                  fill
                  sizes="(min-width: 1024px) 480px, 100vw"
                  onError={handleRepImageError}
                  className="object-cover"
                  style={{ objectFit: 'cover', objectPosition: 'center 65%' }}
                />

                {/* Webcam UI Overlay */}
                <div className="pointer-events-none">
                  {/* Top status bar */}
                  <div className="absolute top-0 left-0 right-0 px-2.5 py-1.5 flex items-center justify-between bg-black/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[11px] text-white/90 font-medium">Webcam • Billy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-white/85 px-1 py-0.5 rounded bg-white/10">HD</span>
                      <Settings className="w-3.5 h-3.5 text-white/90" />
                    </div>
                  </div>

                  {/* Bottom controls */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                    <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1.5">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                        <Video className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="hidden md:inline text-[10px] text-white/80 ml-1">LIVE</span>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Divider line - sits right below the text labels */}
        <div className="border-b border-purple-500/20 mt-0" />

        {/* Bottom Section: Transcript (Full Width) - Reduced height on large monitors */}
        <div className="flex flex-col relative h-[280px] xl:h-[140px] 2xl:h-[120px] mt-6 xl:mt-3 2xl:mt-2">
          
          {/* Bottom fade gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
          
          <div 
            ref={transcriptRef}
            className="flex-1 overflow-y-auto px-4 pb-12 space-y-1.5 custom-scrollbar"
            style={{
              scrollBehavior: 'smooth'
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
                  <div className={`max-w-[75%]`}>
                    <div
                      className={`rounded-xl px-4 py-3 backdrop-blur-sm ${
                        isRep
                          ? 'bg-purple-600/50 border-2 border-purple-400/50'
                          : 'bg-slate-700/80 border-2 border-slate-500/50'
                      }`}
                    >
                      {/* Message Text */}
                      <p className={`text-sm leading-[1.5] font-semibold ${
                        isRep ? 'text-white' : 'text-white'
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
