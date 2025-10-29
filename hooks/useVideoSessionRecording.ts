import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseVideoSessionRecordingOptions {
  audio?: boolean
  video?: boolean
}

export function useVideoSessionRecording(sessionId: string | null, options: UseVideoSessionRecordingOptions = { audio: true, video: true }) {
  const [isRecording, setIsRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setRecordingError(null)
      console.log('🎬 Starting video recording for session:', sessionId)

      // Request both video and audio permissions
      const constraints: MediaStreamConstraints = {
        audio: options.audio !== false,
        video: options.video !== false ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        } : false
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      console.log('✅ Got media stream for recording')
      
      // Determine the best mime type
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') 
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm') 
        ? 'video/webm'
        : 'video/mp4'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps for good quality
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log('📊 Video chunk received, size:', event.data.size)
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped, processing video...')
        const blob = new Blob(chunksRef.current, { type: mimeType })
        console.log('📦 Video blob created, size:', blob.size, 'bytes')
        setVideoBlob(blob)
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop())
        
        // Upload to Supabase Storage if we have a session ID
        if (sessionId && blob.size > 0) {
          console.log('📤 Uploading video for session:', sessionId)
          const url = await uploadVideoToSupabase(blob, sessionId)
          console.log('✅ Video upload complete, URL:', url ? 'saved' : 'failed')
        } else {
          console.warn('⚠️ No sessionId or empty blob, skipping video upload')
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      console.log('✅ Video recording started successfully')
    } catch (error: any) {
      console.error('❌ Error starting recording:', error)
      setRecordingError(error.message || 'Failed to start recording')
      throw error
    }
  }, [sessionId, options])

  const stopRecording = useCallback(() => {
    console.log('🛑 video stopRecording called - mediaRecorder exists:', !!mediaRecorderRef.current)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('🛑 Stopping video MediaRecorder (state:', mediaRecorderRef.current.state, ')...')
      try {
        mediaRecorderRef.current.stop()
        setIsRecording(false)
        console.log('✅ Video MediaRecorder stopped, onstop handler will trigger upload')
      } catch (error) {
        console.error('❌ Error stopping video mediaRecorder:', error)
      }
    } else {
      console.log('ℹ️ Video MediaRecorder not active, skipping stop')
    }
  }, [])

  const uploadVideoToSupabase = async (blob: Blob, sessionId: string) => {
    try {
      console.log('📤 uploadVideoToSupabase called - blob size:', blob.size)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        console.error('❌ No user found for video upload')
        return null
      }
      
      console.log('👤 User ID:', user.id)

      // Create a unique filename
      const timestamp = new Date().toISOString()
      const filename = `sessions/${user.id}/${sessionId}/video_${timestamp}.webm`
      console.log('📁 Uploading to:', filename)

      // Upload to Supabase Storage (we'll create a new bucket for videos)
      const { data, error } = await supabase.storage
        .from('session-videos')
        .upload(filename, blob, {
          contentType: 'video/webm',
          upsert: false
        })

      if (error) {
        console.error('❌ Storage upload error:', error)
        return null
      }
      
      console.log('✅ File uploaded to storage:', data.path)

      // Get a public URL
      const { data: { publicUrl } } = supabase.storage
        .from('session-videos')
        .getPublicUrl(filename)
      
      console.log('🔗 Public URL generated:', publicUrl)

      // Update the session with the video URL
      const { error: updateError } = await supabase
        .from('live_sessions')
        .update({ 
          video_url: publicUrl,
          has_video: true 
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('❌ Failed to update session with video URL:', updateError)
      } else {
        console.log('✅ Session updated with video URL')
      }

      return publicUrl
    } catch (error) {
      console.error('❌ Error uploading video:', error)
      return null
    }
  }

  const getVideoStream = useCallback(() => {
    return streamRef.current
  }, [])

  return {
    isRecording,
    videoBlob,
    audioBlob,
    startRecording,
    stopRecording,
    getVideoStream,
    error: recordingError
  }
}
