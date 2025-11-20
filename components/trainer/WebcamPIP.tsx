'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, VideoOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WebcamPIPProps {
  className?: string
}

enum VideoConnectionState {
  IDLE = 'idle',
  REQUESTING_PERMISSION = 'requesting_permission',
  PERMISSION_DENIED = 'permission_denied',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  FAILED = 'failed',
  NO_CAMERA = 'no_camera'
}

interface VideoError {
  type: 'permission' | 'not_found' | 'not_readable' | 'overconstrained' | 'unknown'
  message: string
  userMessage: string
  canRetry: boolean
}

export function WebcamPIP({ className = '' }: WebcamPIPProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [connectionState, setConnectionState] = useState<VideoConnectionState>(VideoConnectionState.IDLE)
  const [error, setError] = useState<VideoError | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const streamRef = useRef<MediaStream | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxRetries = 3


  const handleError = (err: any): VideoError => {
    let error: VideoError

    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      error = {
        type: 'permission',
        message: err.message,
        userMessage: 'Camera permission denied',
        canRetry: true
      }
      setConnectionState(VideoConnectionState.PERMISSION_DENIED)
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      error = {
        type: 'not_found',
        message: err.message,
        userMessage: 'No camera detected',
        canRetry: true
      }
      setConnectionState(VideoConnectionState.NO_CAMERA)
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      error = {
        type: 'not_readable',
        message: err.message,
        userMessage: 'Camera in use by another app',
        canRetry: true
      }
      setConnectionState(VideoConnectionState.FAILED)
    } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
      error = {
        type: 'overconstrained',
        message: err.message,
        userMessage: 'Camera doesn\'t meet requirements',
        canRetry: false
      }
      setConnectionState(VideoConnectionState.FAILED)
    } else {
      error = {
        type: 'unknown',
        message: err.message || 'Unknown error',
        userMessage: 'Unable to access camera',
        canRetry: retryCount < maxRetries
      }
      setConnectionState(VideoConnectionState.FAILED)
    }

    return error
  }

  const startWebcam = async () => {
    // Clear any existing timeouts
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current)
      connectionTimeoutRef.current = null
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }

    // Stop any existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    try {
      setError(null)
      setIsRetrying(false)

      setConnectionState(VideoConnectionState.REQUESTING_PERMISSION)

      // Set connection timeout (10 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectionState !== VideoConnectionState.CONNECTED) {
          console.error('📹 Connection timeout')
          setConnectionState(VideoConnectionState.FAILED)
          setError({
            type: 'unknown',
            message: 'Connection timeout',
            userMessage: 'Camera connection timed out',
            canRetry: retryCount < maxRetries
          })
        }
      }, 10000)

      setConnectionState(VideoConnectionState.CONNECTING)

      // Request camera with simpler constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user'
        },
        audio: false
      })

      // Clear timeout on success
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current
          if (!video) {
            reject(new Error('Video element not available'))
            return
          }

          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('error', handleVideoError)
            resolve()
          }

          const handleVideoError = () => {
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('error', handleVideoError)
            reject(new Error('Video failed to load'))
          }

          video.addEventListener('canplay', handleCanPlay)
          video.addEventListener('error', handleVideoError)
          
          video.play().catch(reject)
        })

        setConnectionState(VideoConnectionState.CONNECTED)
        setError(null)
        setRetryCount(0)
        console.log('✅ Camera connected successfully')
      }
    } catch (err: any) {
      console.error('❌ Error accessing webcam:', err)
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      const videoError = handleError(err)
      setError(videoError)
    }
  }

  const retryConnection = async () => {
    if (retryCount >= maxRetries) {
      setError(prev => prev ? { ...prev, canRetry: false } : null)
      return
    }

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    // Wait a bit before retrying
    retryTimeoutRef.current = setTimeout(() => {
      setIsRetrying(false)
      startWebcam()
    }, 1000)
  }


  useEffect(() => {
    // Start webcam on mount
    startWebcam()

    return () => {
      stopWebcam()
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Monitor stream health
  useEffect(() => {
    if (!streamRef.current || connectionState !== VideoConnectionState.CONNECTED) return

    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (!videoTrack) return

    const handleEnded = () => {
      console.warn('📹 Video track ended unexpectedly')
      setConnectionState(VideoConnectionState.FAILED)
      setError({
        type: 'unknown',
        message: 'Video track ended',
        userMessage: 'Camera disconnected',
        canRetry: retryCount < maxRetries
      })
    }

    videoTrack.addEventListener('ended', handleEnded)

    return () => {
      videoTrack.removeEventListener('ended', handleEnded)
    }
  }, [connectionState, retryCount])

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setConnectionState(VideoConnectionState.IDLE)
  }

  // Loading state
  if (connectionState === VideoConnectionState.CONNECTING || connectionState === VideoConnectionState.REQUESTING_PERMISSION) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
        <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl p-6 min-h-[120px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-gray-300 text-xs font-medium">Connecting camera...</p>
        </div>
      </div>
    )
  }

  // Error states - simplified
  if (error && connectionState !== VideoConnectionState.CONNECTED) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
        <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl p-4 min-h-[120px]">
          <VideoOff className="w-8 h-8 text-gray-500 mb-2" />
          <p className="text-xs text-gray-400 text-center mb-3">{error.userMessage}</p>
          {error.canRetry && retryCount < maxRetries && (
            <Button 
              onClick={retryConnection} 
              disabled={isRetrying}
              size="sm"
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={cn("w-3 h-3 mr-2", isRetrying && "animate-spin")} />
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  // No camera state
  if (connectionState === VideoConnectionState.NO_CAMERA && !error) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
        <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl p-4 min-h-[120px]">
          <VideoOff className="w-8 h-8 text-gray-500 mb-2" />
          <p className="text-xs text-gray-400 text-center">No camera</p>
        </div>
      </div>
    )
  }

  // Connected state
  return (
    <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
        style={{ aspectRatio: '16/9' }}
      />
    </div>
  )
}
