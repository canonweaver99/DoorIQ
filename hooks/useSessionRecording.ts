import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useSessionRecording(sessionId: string | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        
        // Upload to Supabase Storage if we have a session ID
        if (sessionId) {
          await uploadAudioToSupabase(blob, sessionId)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      // Create a unique filename
      const timestamp = new Date().toISOString()
      const filename = `sessions/${user.id}/${sessionId}/${timestamp}.webm`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('audio-recordings')
        .upload(filename, blob, {
          contentType: 'audio/webm',
          upsert: false
        })

      if (error) {
        console.error('Error uploading audio:', error)
        return null
      }

      // Get a signed URL (for private bucket access)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from('audio-recordings')
        .createSignedUrl(filename, 365 * 24 * 60 * 60) // 1 year

      if (urlError || !signedUrlData) {
        console.error('Error getting signed URL:', urlError)
        return null
      }

      // Update the session with the audio URL and metadata
      await supabase
        .from('live_sessions')
        .update({ 
          audio_url: signedUrlData.signedUrl,
          audio_duration: Math.floor(blob.size / 16000), // Rough estimate
          audio_file_size: blob.size,
          upload_type: 'live_recording'
        })
        .eq('id', sessionId)

      return signedUrlData.signedUrl
    } catch (error) {
      console.error('Error uploading audio to Supabase:', error)
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
