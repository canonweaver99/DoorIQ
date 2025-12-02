'use client'

import { useEffect, useRef, useCallback } from 'react'

interface TranscriptEntry {
  speaker: 'user' | 'homeowner'
  text: string
  timestamp: Date
}

interface UseConversationEndDetectionOptions {
  onConversationEnd: () => void
  transcript: TranscriptEntry[]
  sessionStartTime: number | null
  sessionActive: boolean
  enabled?: boolean
}

const GOODBYE_PHRASES = [
  'have a good day',
  'thanks for stopping by',
  'goodbye',
  'not interested',
  'i need to go',
  'closing the door',
  'talk to you later',
  'have a nice day',
  'see you later',
  'take care',
  'bye',
  'thanks anyway',
  'maybe another time',
  'not today',
  'i\'m not interested',
  'i have to go',
  'gotta go',
  'need to go',
]

const MAX_SESSION_DURATION = 10 * 60 * 1000 // 10 minutes
const INACTIVITY_TIMEOUT = 30 * 1000 // 30 seconds

export function useConversationEndDetection({
  onConversationEnd,
  transcript,
  sessionStartTime,
  sessionActive,
  enabled = true,
}: UseConversationEndDetectionOptions) {
  const hasTriggeredRef = useRef(false)
  const phraseDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityTimeRef = useRef<number>(Date.now())

  // Reset trigger when session becomes inactive or starts
  useEffect(() => {
    if (!sessionActive) {
      hasTriggeredRef.current = false
    } else {
      hasTriggeredRef.current = false
      lastActivityTimeRef.current = Date.now()
    }
  }, [sessionActive])

  // Prevent multiple triggers
  const triggerEnd = useCallback(() => {
    if (hasTriggeredRef.current || !sessionActive || !enabled) {
      return
    }
    
    hasTriggeredRef.current = true
    console.log('🚪 Conversation end detected - triggering callback')
    
    // Clear all timeouts
    if (phraseDetectionTimeoutRef.current) {
      clearTimeout(phraseDetectionTimeoutRef.current)
      phraseDetectionTimeoutRef.current = null
    }
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
      inactivityTimeoutRef.current = null
    }
    if (maxDurationTimeoutRef.current) {
      clearTimeout(maxDurationTimeoutRef.current)
      maxDurationTimeoutRef.current = null
    }
    
    onConversationEnd()
  }, [onConversationEnd, sessionActive, enabled])

  // Monitor ElevenLabs events
  useEffect(() => {
    if (!enabled || !sessionActive || typeof window === 'undefined') {
      return
    }

    const handleStatusChange = (e: CustomEvent) => {
      const status = e?.detail
      console.log('📊 [End Detection] Status changed:', status)
      
      if (status === 'disconnected') {
        console.log('🔌 [End Detection] Disconnected status detected')
        triggerEnd()
      }
    }

    const handleMessage = (e: CustomEvent) => {
      const message = e?.detail
      console.log('📨 [End Detection] Message received:', message?.type)
      
      // Check for conversation_end message type
      if (message?.type === 'conversation_end' || message?.conversation_end) {
        console.log('🔚 [End Detection] Conversation end message detected')
        triggerEnd()
      }
      
      // Update last activity time
      lastActivityTimeRef.current = Date.now()
    }

    window.addEventListener('agent:status', handleStatusChange as EventListener)
    window.addEventListener('agent:message', handleMessage as EventListener)
    window.addEventListener('connection:status', handleStatusChange as EventListener)

    return () => {
      window.removeEventListener('agent:status', handleStatusChange as EventListener)
      window.removeEventListener('agent:message', handleMessage as EventListener)
      window.removeEventListener('connection:status', handleStatusChange as EventListener)
    }
  }, [enabled, sessionActive, triggerEnd])

  // Monitor transcript for USER goodbye phrases (not agent)
  useEffect(() => {
    if (!enabled || !sessionActive || transcript.length === 0) {
      return
    }

    // Check the last few transcript entries for USER goodbye phrases
    // We want to detect when the USER says goodbye, not the agent
    const recentEntries = transcript.slice(-5) // Check last 5 entries
    
    // Find the last USER message that contains a goodbye phrase
    let lastUserGoodbyeEntry: TranscriptEntry | null = null
    let lastUserGoodbyeIndex = -1
    
    for (let i = recentEntries.length - 1; i >= 0; i--) {
      const entry = recentEntries[i]
      // Only check USER messages (not homeowner/agent)
      if (entry.speaker === 'user') {
        const text = entry.text.toLowerCase()
        
        for (const phrase of GOODBYE_PHRASES) {
          if (text.includes(phrase)) {
            lastUserGoodbyeEntry = entry
            lastUserGoodbyeIndex = i
            break
          }
        }
        if (lastUserGoodbyeEntry) break
      }
    }
    
    // Only trigger if:
    // 1. We found a user goodbye phrase
    // 2. It's the LAST user message in the transcript (no user messages after it)
    // 3. This ensures we don't trigger when the agent says goodbye or when user says goodbye mid-conversation
    if (lastUserGoodbyeEntry && lastUserGoodbyeIndex >= 0) {
      // Find the index of this goodbye entry in the full transcript
      const lastUserGoodbyeFullIndex = transcript.findIndex(
        entry => entry === lastUserGoodbyeEntry
      )
      
      // Find the index of the last user message in the full transcript
      let lastUserMessageIndex = -1
      for (let i = transcript.length - 1; i >= 0; i--) {
        if (transcript[i].speaker === 'user') {
          lastUserMessageIndex = i
          break
        }
      }
      
      // Only trigger if this goodbye is the last user message in the transcript
      const isLastUserMessage = lastUserGoodbyeFullIndex >= 0 && lastUserGoodbyeFullIndex === lastUserMessageIndex
      
      if (isLastUserMessage) {
        console.log(`🚪 [End Detection] User goodbye phrase detected: "${lastUserGoodbyeEntry.text}"`)
        console.log('🚪 [End Detection] This is the last user message - triggering end sequence')
        
        // Clear any existing timeout
        if (phraseDetectionTimeoutRef.current) {
          clearTimeout(phraseDetectionTimeoutRef.current)
        }
        
        // Wait 2 seconds after detection to ensure it's the final goodbye, then trigger
        phraseDetectionTimeoutRef.current = setTimeout(() => {
          console.log('🚪 [End Detection] Triggering end after user goodbye detection delay')
          triggerEnd()
        }, 2000)
      } else {
        console.log('🚪 [End Detection] User goodbye detected but not the last user message - ignoring')
      }
    }
  }, [transcript, enabled, sessionActive, triggerEnd])

  // Backup timer: Max session duration (15 minutes)
  useEffect(() => {
    if (!enabled || !sessionActive || !sessionStartTime) {
      return
    }

    const elapsed = Date.now() - sessionStartTime
    const remaining = MAX_SESSION_DURATION - elapsed

    if (remaining <= 0) {
      console.log('⏰ [End Detection] Max duration reached')
      triggerEnd()
      return
    }

    maxDurationTimeoutRef.current = setTimeout(() => {
      console.log('⏰ [End Detection] Max duration timeout triggered')
      triggerEnd()
    }, remaining)

    return () => {
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current)
      }
    }
  }, [enabled, sessionActive, sessionStartTime, triggerEnd])

  // Backup timer: Inactivity detection (30 seconds)
  useEffect(() => {
    if (!enabled || !sessionActive) {
      return
    }

    // Reset inactivity timer when transcript updates (activity detected)
    if (transcript.length > 0) {
      lastActivityTimeRef.current = Date.now()
    }

    const checkInactivity = () => {
      const timeSinceActivity = Date.now() - lastActivityTimeRef.current
      
      if (timeSinceActivity >= INACTIVITY_TIMEOUT && transcript.length > 0) {
        console.log('⏰ [End Detection] Inactivity timeout triggered')
        triggerEnd()
      } else {
        // Check again in 5 seconds
        inactivityTimeoutRef.current = setTimeout(checkInactivity, 5000)
      }
    }

    // Start checking after initial delay
    inactivityTimeoutRef.current = setTimeout(checkInactivity, INACTIVITY_TIMEOUT)

    return () => {
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
    }
  }, [enabled, sessionActive, transcript.length, triggerEnd])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (phraseDetectionTimeoutRef.current) {
        clearTimeout(phraseDetectionTimeoutRef.current)
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current)
      }
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current)
      }
    }
  }, [])
}

