'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, X, Send, Loader2 } from 'lucide-react'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { createClient } from '@/lib/supabase/client'

interface VoiceRecorderProps {
  onSend: (voiceUrl: string) => Promise<void>
  disabled?: boolean
}

export function VoiceRecorder({ onSend, disabled }: VoiceRecorderProps) {
  const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording, error } = useVoiceRecorder()
  const [isUploading, setIsUploading] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const supabase = createClient()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStartRecording = async () => {
    setShowRecorder(true)
    await startRecording()
  }

  const handleStopAndSend = async () => {
    const blob = await stopRecording()
    if (!blob) return

    setIsUploading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.webm`
      const { data, error: uploadError } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, blob)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName)

      // Send the voice message
      await onSend(publicUrl)
      setShowRecorder(false)
    } catch (err) {
      console.error('Failed to upload voice message:', err)
      alert('Failed to send voice message. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    cancelRecording()
    setShowRecorder(false)
  }

  return (
    <>
      {/* Mic button */}
      <button
        onClick={handleStartRecording}
        disabled={disabled || isUploading}
        className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Record voice message"
      >
        <Mic className="w-5 h-5" />
      </button>

      {/* Recording interface */}
      <AnimatePresence>
        {showRecorder && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-[#1e1e30] border border-white/10 rounded-2xl p-4 shadow-xl"
          >
            {error ? (
              <div className="text-red-400 text-sm">{error}</div>
            ) : (
              <div className="flex items-center gap-4">
                {isRecording && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-3 h-3 bg-red-500 rounded-full"
                  />
                )}
                
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">
                    {isRecording ? 'Recording...' : 'Voice Message'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(recordingTime)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isRecording ? (
                    <>
                      <button
                        onClick={handleCancel}
                        className="p-2 text-slate-400 hover:text-white transition-colors"
                        title="Cancel"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <button
                        onClick={handleStopAndSend}
                        className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white transition-all"
                        title="Send"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    </>
                  ) : isUploading ? (
                    <div className="p-2">
                      <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
                    </div>
                  ) : (
                    <button
                      onClick={handleStopAndSend}
                      className="p-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white transition-all"
                      title="Send"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
