'use client'

import { useEffect, useRef, useState } from 'react'
import { CameraOff, Loader2, Wifi, WifiOff } from 'lucide-react'

interface WebcamPIPProps {
  className?: string
}

export function WebcamPIP({ className = '' }: WebcamPIPProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorType, setErrorType] = useState<'permission' | 'notfound' | 'timeout' | 'stream' | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')
  const streamRef = useRef<MediaStream | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startWebcam()

    return () => {
      stopWebcam()
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
      }
    }
  }, [])

  // Monitor stream health
  useEffect(() => {
    if (!streamRef.current) return

    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (!videoTrack) return

    const handleEnded = () => {
      console.warn('📹 Video track ended unexpectedly')
      setConnectionStatus('disconnected')
      setIsActive(false)
      attemptReconnect()
    }

    const handleMute = () => {
      console.warn('📹 Video track muted')
    }

    const handleUnmute = () => {
      console.log('📹 Video track unmuted')
    }

    videoTrack.addEventListener('ended', handleEnded)
    videoTrack.addEventListener('mute', handleMute)
    videoTrack.addEventListener('unmute', handleUnmute)

    return () => {
      videoTrack.removeEventListener('ended', handleEnded)
      videoTrack.removeEventListener('mute', handleMute)
      videoTrack.removeEventListener('unmute', handleUnmute)
    }
  }, [isActive])

  const attemptReconnect = () => {
    if (reconnectTimeoutRef.current) return // Already attempting reconnect

    console.log('📹 Attempting to reconnect camera...')
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null
      startWebcam()
    }, 2000)
  }

  const startWebcam = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setErrorType(null)
      setConnectionStatus('connecting')

      // Set connection timeout (10 seconds)
      connectionTimeoutRef.current = setTimeout(() => {
        if (!isActive) {
          console.error('📹 Connection timeout')
          setErrorType('timeout')
          setError('Camera connection timed out. Please check your camera and try again.')
          setConnectionStatus('error')
          setIsLoading(false)
        }
      }, 10000)

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

        setIsActive(true)
        setConnectionStatus('connected')
        setError(null)
        setErrorType(null)
        setIsLoading(false)
        console.log('✅ Camera connected successfully')
      }
    } catch (err: any) {
      console.error('❌ Error accessing webcam for PIP:', err)
      
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current)
        connectionTimeoutRef.current = null
      }

      setIsLoading(false)
      setIsActive(false)
      setConnectionStatus('error')

      // Determine error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorType('permission')
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorType('notfound')
        setError('No camera found. Please connect a camera and refresh the page.')
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setErrorType('stream')
        setError('Camera is being used by another application. Please close other apps and try again.')
      } else {
        setErrorType('stream')
        setError('Unable to access camera. Please check your camera connection and try again.')
      }
    }
  }

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setIsActive(false)
    setConnectionStatus('disconnected')
  }

  const getErrorIcon = () => {
    switch (errorType) {
      case 'permission':
        return <CameraOff className="w-8 h-8 text-rose-500" />
      case 'notfound':
        return <CameraOff className="w-8 h-8 text-amber-500" />
      case 'timeout':
        return <WifiOff className="w-8 h-8 text-yellow-500" />
      default:
        return <CameraOff className="w-8 h-8 text-slate-600" />
    }
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900 ${className}`}>
      {/* Connection Status Indicator */}
      {connectionStatus === 'connected' && (
        <div className="absolute top-1 right-1 z-10 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/30">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <Wifi className="w-3 h-3 text-green-400" />
        </div>
      )}

      {isLoading ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mb-2" />
          <p className="text-xs text-slate-400">Connecting camera...</p>
        </div>
      ) : error || !isActive ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-4">
          {getErrorIcon()}
          <p className="text-xs text-slate-300 mt-2 text-center leading-relaxed">{error || 'Camera unavailable'}</p>
          {errorType && (
            <button
              onClick={startWebcam}
              className="mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
          style={{ aspectRatio: '16/9' }}
        />
      )}
    </div>
  )
}

