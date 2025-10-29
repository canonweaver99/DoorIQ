import { useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Hook for recording dual camera feeds (agent + user) composited side-by-side
 * Like Loom's video recordings
 */
export function useDualCameraRecording(sessionId: string | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const userVideoRef = useRef<HTMLVideoElement | null>(null)
  const agentVideoRef = useRef<HTMLImageElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startRecording = useCallback(async (
    userStream: MediaStream,
    agentImageSrc: string
  ) => {
    try {
      setError(null)
      console.log('🎬 Starting dual camera recording...')

      // Create canvas for compositing
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas not supported')

      // Set canvas size (1280x720 for HD)
      canvas.width = 1280
      canvas.height = 720
      canvasRef.current = canvas

      // Create video element for user stream
      const userVideo = document.createElement('video')
      userVideo.srcObject = userStream
      userVideo.muted = true
      userVideo.playsInline = true
      await userVideo.play()
      userVideoRef.current = userVideo

      // Create image element for agent
      const agentImage = new Image()
      agentImage.crossOrigin = 'anonymous'
      agentImage.src = agentImageSrc
      await new Promise((resolve, reject) => {
        agentImage.onload = resolve
        agentImage.onerror = reject
      })
      agentVideoRef.current = agentImage

      console.log('✅ Media elements ready, starting canvas compositing...')

      // Composite function - draws both feeds side by side
      const compositeFrame = () => {
        if (!canvas || !ctx || !userVideo || !agentImage) return

        // Clear canvas
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Calculate dimensions for side-by-side layout
        const halfWidth = canvas.width / 2
        const fullHeight = canvas.height

        // Draw agent image on left half
        ctx.drawImage(agentImage, 0, 0, halfWidth, fullHeight)

        // Draw user video on right half (mirrored)
        ctx.save()
        ctx.scale(-1, 1) // Mirror horizontally
        ctx.drawImage(userVideo, -canvas.width, 0, halfWidth, fullHeight)
        ctx.restore()

        // Add labels
        ctx.font = 'bold 24px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 4
        
        // Agent label
        ctx.fillText('AI Agent', 20, 40)
        
        // User label
        ctx.fillText('You', halfWidth + 20, 40)
        
        ctx.shadowBlur = 0

        // Continue animation
        if (animationFrameRef.current !== null) {
          animationFrameRef.current = requestAnimationFrame(compositeFrame)
        }
      }

      // Start compositing loop
      animationFrameRef.current = requestAnimationFrame(compositeFrame)

      // Capture canvas stream
      const canvasStream = canvas.captureStream(30) // 30 FPS
      streamRef.current = canvasStream

      // Start recording
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
          console.log('📊 Video chunk received:', event.data.size, 'bytes')
        }
      }

      mediaRecorder.onstop = async () => {
        console.log('🛑 Recording stopped, processing...')
        const blob = new Blob(chunksRef.current, { type: mimeType })
        console.log('📦 Video blob created:', blob.size, 'bytes')
        setVideoBlob(blob)

        // Upload to Supabase
        if (sessionId && blob.size > 0) {
          console.log('📤 Uploading composite video...')
          await uploadVideoToSupabase(blob, sessionId)
        }

        // Cleanup
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      console.log('✅ Dual camera recording started')

    } catch (err: any) {
      console.error('❌ Error starting dual camera recording:', err)
      setError(err.message || 'Failed to start recording')
      throw err
    }
  }, [sessionId])

  const stopRecording = useCallback(() => {
    console.log('🛑 Stopping dual camera recording...')
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }

    // Cleanup animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    // Cleanup media elements
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = null
      userVideoRef.current = null
    }

    console.log('✅ Dual camera recording stopped')
  }, [])

  const uploadVideoToSupabase = async (blob: Blob, sessionId: string) => {
    try {
      console.log('📤 Uploading composite video - size:', blob.size)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('❌ No user for upload')
        return null
      }

      const timestamp = new Date().toISOString()
      const filename = `sessions/${user.id}/${sessionId}/video_${timestamp}.webm`

      console.log('📁 Uploading to:', filename)

      const { data, error } = await supabase.storage
        .from('session-videos')
        .upload(filename, blob, {
          contentType: 'video/webm',
          upsert: false
        })

      if (error) {
        console.error('❌ Upload error:', error)
        return null
      }

      console.log('✅ Uploaded:', data.path)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('session-videos')
        .getPublicUrl(filename)

      console.log('🔗 Public URL:', publicUrl)

      // Update session
      const { error: updateError } = await supabase
        .from('live_sessions')
        .update({
          video_url: publicUrl,
          has_video: true
        })
        .eq('id', sessionId)

      if (updateError) {
        console.error('❌ Failed to update session:', updateError)
      } else {
        console.log('✅ Session updated with video URL')
      }

      return publicUrl
    } catch (err) {
      console.error('❌ Error uploading video:', err)
      return null
    }
  }

  return {
    isRecording,
    videoBlob,
    startRecording,
    stopRecording,
    error
  }
}

