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

    // Ensure video element is cleared
    if (videoRef.current) {
      videoRef.current.srcObject = null
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
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      // Clear timeout on success
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      streamRef.current = stream
      
      // Video element should always be available now (always rendered)
      if (videoRef.current) {
        // Set the stream
        videoRef.current.srcObject = stream
        
        // Wait for video to be ready and play
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current
          if (!video) {
            reject(new Error('Video element not available'))
            return
          }

          let resolved = false

          const handleCanPlay = () => {
            if (resolved) return
            resolved = true
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('loadedmetadata', handleCanPlay)
            video.removeEventListener('error', handleVideoError)
            
            // Try to play the video
            video.play().then(() => {
              setConnectionState(VideoConnectionState.CONNECTED)
              setError(null)
              setRetryCount(0)
              console.log('✅ Camera connected successfully')
              resolve()
            }).catch((playErr) => {
              console.warn('⚠️ Video play failed, but stream is attached:', playErr)
              // Still resolve if stream is attached, even if play fails
              setConnectionState(VideoConnectionState.CONNECTED)
              setError(null)
              setRetryCount(0)
              resolve()
            })
          }

          const handleVideoError = (e: any) => {
            if (resolved) return
            resolved = true
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('loadedmetadata', handleCanPlay)
            video.removeEventListener('error', handleVideoError)
            reject(new Error('Video failed to load: ' + (e?.message || 'Unknown error')))
          }

          // Listen for multiple events to ensure we catch when video is ready
          video.addEventListener('canplay', handleCanPlay, { once: true })
          video.addEventListener('loadedmetadata', handleCanPlay, { once: true })
          video.addEventListener('error', handleVideoError, { once: true })
          
          // Try to play immediately
          video.play().catch(() => {
            // Ignore initial play error, wait for canplay
          })

          // Fallback timeout
          setTimeout(() => {
            if (!resolved) {
              resolved = true
              video.removeEventListener('canplay', handleCanPlay)
              video.removeEventListener('loadedmetadata', handleCanPlay)
              video.removeEventListener('error', handleVideoError)
              // If stream is attached, consider it successful
              if (video.srcObject === stream) {
                setConnectionState(VideoConnectionState.CONNECTED)
                setError(null)
                setRetryCount(0)
                console.log('✅ Camera connected (timeout fallback)')
                resolve()
              } else {
                reject(new Error('Video stream not attached'))
              }
            }
          }, 5000)
        })
      } else {
        throw new Error('Video element not available')
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
    // Start webcam after a brief delay to ensure component is mounted
    // Video element is always rendered now, so ref should be available
    const initTimer = setTimeout(() => {
      if (videoRef.current) {
        console.log('✅ Starting webcam initialization')
        startWebcam()
      } else {
        console.error('❌ Video element ref not available')
        setError({
          type: 'unknown',
          message: 'Video element not available',
          userMessage: 'Camera initialization failed - please refresh the page',
          canRetry: true
        })
        setConnectionState(VideoConnectionState.FAILED)
      }
    }, 100)

    return () => {
      clearTimeout(initTimer)
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

  // Always render video element so ref is always available
  const showVideo = connectionState === VideoConnectionState.CONNECTED
  const showLoading = connectionState === VideoConnectionState.CONNECTING || connectionState === VideoConnectionState.REQUESTING_PERMISSION
  const showError = error && connectionState !== VideoConnectionState.CONNECTED
  const showNoCamera = connectionState === VideoConnectionState.NO_CAMERA && !error

  return (
    <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900 w-full h-full", className)}>
      {/* Video element - always rendered so ref is available */}
      <video
        ref={videoRef}
        className={cn(
          "w-full h-full object-cover",
          !showVideo && "hidden"
        )}
        autoPlay
        playsInline
        muted
        style={{ 
          minWidth: '100%',
          minHeight: '100%',
          transform: showVideo ? 'scaleX(-1)' : 'none' // Mirror the video for natural selfie view when connected
        }}
      />
      
      {/* Loading overlay */}
      {showLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl p-6 min-h-[120px] z-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
          <p className="text-gray-300 text-xs font-medium">Connecting camera...</p>
        </div>
      )}

      {/* Error overlay */}
      {showError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl p-4 min-h-[120px] z-20">
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
      )}

      {/* No camera overlay */}
      {showNoCamera && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 rounded-xl p-4 min-h-[120px] z-20">
          <VideoOff className="w-8 h-8 text-gray-500 mb-2" />
          <p className="text-xs text-gray-400 text-center">No camera</p>
        </div>
      )}

      {/* Camera active indicator */}
      {showVideo && streamRef.current && streamRef.current.getVideoTracks().length > 0 && (
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse z-10" title="Camera active" />
      )}
    </div>
  )
}
