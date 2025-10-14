import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSessionRecording(sessionId: string | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      console.log('🎙️ useSessionRecording.startRecording called for sessionId:', sessionId)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      console.log('✅ Got media stream for recording')
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log('📊 Audio chunk received, size:', event.data.size)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped, processing audio...')
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        console.log('📦 Audio blob created, size:', blob.size, 'bytes')
        setAudioBlob(blob)
        
        // Upload to Supabase Storage if we have a session ID
        if (sessionId) {
          console.log('📤 Uploading audio for session:', sessionId)
          const url = await uploadAudioToSupabase(blob, sessionId)
          console.log('✅ Audio upload complete, URL:', url ? 'saved' : 'failed')
        } else {
          console.warn('⚠️ No sessionId, skipping audio upload')
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      console.log('✅ Audio recording started successfully')
    } catch (error) {
      console.error('❌ Error starting recording:', error)
    }
  }, [sessionId])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }, [isRecording])

  const uploadAudioToSupabase = async (blob: Blob, sessionId: string) => {
    try {
      console.log('📤 uploadAudioToSupabase called - blob size:', blob.size)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ No user found for audio upload')
        return null
      }
      
      console.log('👤 User ID:', user.id)

      // Create a unique filename
      const timestamp = new Date().toISOString()
      const filename = `sessions/${user.id}/${sessionId}/${timestamp}.webm`
      console.log('📁 Uploading to:', filename)

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .upload(filename, blob, {
          contentType: 'audio/webm',
          upsert: false
        })

      if (error) {
        console.error('❌ Storage upload error:', error)
        return null
      }
      
      console.log('✅ File uploaded to storage:', data.path)

      // Get a public URL (bucket is public)
      const { data: { publicUrl } } = supabase.storage
        .from('audio-recordings')
        .getPublicUrl(filename)
      
      console.log('🔗 Public URL generated:', publicUrl)

      // Update the session with the audio URL and metadata
      const { error: updateError } = await supabase
        .from('live_sessions')
        .update({ 
          audio_url: publicUrl,
          audio_duration: Math.floor(blob.size / 16000), // Rough estimate
          audio_file_size: blob.size
        })
        .eq('id', sessionId)
      
      if (updateError) {
        console.error('❌ Session update error:', updateError)
        return null
      }
      
      console.log('✅ Session updated with audio URL')
      return publicUrl
    } catch (error) {
      console.error('❌ Error uploading audio to Supabase:', error)
      return null
    }
  }

  return {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording
  }
}
