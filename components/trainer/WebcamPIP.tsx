'use client'

import { useEffect, useRef, useState } from 'react'
import { CameraOff, Loader2, VideoOff, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react'
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

  // Check if camera exists before requesting
  const checkCameraAvailability = async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(device => device.kind === 'videoinput')
      return videoDevices.length > 0
    } catch (err) {
      console.error('Error checking camera availability:', err)
      return false
    }
  }

  const getDetailedHelpText = (errorType: VideoError['type']): string => {
    switch (errorType) {
      case 'permission':
        return 'Click the camera icon in your browser\'s address bar and allow camera access, then click "Try Again".'
      case 'not_found':
        return 'Please connect a camera to your device and refresh the page.'
      case 'not_readable':
        return 'Another application is using your camera. Close other apps (Zoom, Teams, etc.) and try again.'
      case 'overconstrained':
        return 'Your camera doesn\'t meet the required specifications. Try using a different camera.'
      default:
        return 'Please check your camera connection and browser permissions.'
    }
  }

  const troubleshootCamera = () => {
    const helpText = `
Camera Troubleshooting Guide:

1. Check Browser Permissions:
   - Look for a camera icon in your browser's address bar
   - Click it and select "Allow" for camera access

2. Check Other Applications:
   - Close any video conferencing apps (Zoom, Teams, Skype)
   - Close any other browser tabs using the camera

3. Check Camera Hardware:
   - Ensure your camera is connected and powered on
   - Try unplugging and reconnecting USB cameras
   - Restart your device if issues persist

4. Browser Settings:
   - Chrome: Settings > Privacy and security > Site settings > Camera
   - Firefox: Preferences > Privacy & Security > Permissions > Camera
   - Safari: Preferences > Websites > Camera

5. Try a Different Browser:
   - Some browsers handle camera permissions differently
    `
    alert(helpText)
  }

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

    try {
      setError(null)
      setIsRetrying(false)

      // Check if camera exists first
      const hasCamera = await checkCameraAvailability()
      if (!hasCamera) {
        setConnectionState(VideoConnectionState.NO_CAMERA)
        setError({
          type: 'not_found',
          message: 'No camera devices found',
          userMessage: 'No camera detected',
          canRetry: true
        })
        return
      }

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

      // Request camera with constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
          aspectRatio: { ideal: 16/9 }
        },
        audio: false // No audio needed for PIP
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
            video.removeEventListener('error', handleError)
            resolve()
          }

          const handleError = () => {
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('error', handleError)
            reject(new Error('Video failed to load'))
          }

          video.addEventListener('canplay', handleCanPlay)
          video.addEventListener('error', handleError)
          
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

  const continueWithoutCamera = () => {
    setConnectionState(VideoConnectionState.NO_CAMERA)
    setError({
      type: 'not_found',
      message: 'Continuing without camera',
      userMessage: 'Session will continue without video',
      canRetry: true
    })
  }

  useEffect(() => {
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
        <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl p-8 min-h-[120px]">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-300 text-sm font-medium">Connecting to your camera...</p>
          <p className="text-xs text-gray-500 mt-2">This usually takes 2-3 seconds</p>
        </div>
      </div>
    )
  }

  // Error states
  if (error && connectionState !== VideoConnectionState.CONNECTED) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
        <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl p-6 min-h-[120px]">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <p className="text-lg font-semibold text-white mb-2 text-center">{error.userMessage}</p>
          <p className="text-sm text-gray-400 text-center mb-6 max-w-md leading-relaxed">
            {getDetailedHelpText(error.type)}
          </p>
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {error.canRetry && retryCount < maxRetries && (
              <Button 
                onClick={retryConnection} 
                disabled={isRetrying}
                className="w-full"
                variant="default"
              >
                <RefreshCw className={cn("w-4 h-4 mr-2", isRetrying && "animate-spin")} />
                {isRetrying ? 'Retrying...' : `Try Again ${retryCount > 0 ? `(${retryCount}/${maxRetries})` : ''}`}
              </Button>
            )}
            {connectionState === VideoConnectionState.NO_CAMERA && (
              <Button 
                onClick={continueWithoutCamera} 
                variant="outline"
                className="w-full"
              >
                Continue Audio Only
              </Button>
            )}
            <Button 
              onClick={troubleshootCamera} 
              variant="outline"
              className="w-full"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Troubleshooting Guide
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No camera state
  if (connectionState === VideoConnectionState.NO_CAMERA && !error) {
    return (
      <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
        <div className="flex flex-col items-center justify-center h-full bg-slate-900/50 rounded-xl p-6 min-h-[120px]">
          <VideoOff className="w-16 h-16 text-gray-500 mb-4" />
          <p className="text-gray-300 text-sm font-medium mb-2">No camera detected</p>
          <p className="text-xs text-gray-500 mb-4 text-center">You can continue without video</p>
          <Button onClick={continueWithoutCamera} variant="outline" className="w-full max-w-xs">
            Continue Audio Only
          </Button>
        </div>
      </div>
    )
  }

  // Connected state
  return (
    <div className={cn("relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900", className)}>
      {/* Connection Status Indicator */}
      {connectionState === VideoConnectionState.CONNECTED && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      )}

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
