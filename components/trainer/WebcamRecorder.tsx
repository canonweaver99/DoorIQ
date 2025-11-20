'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff, Mic, MicOff, Video } from 'lucide-react'

interface WebcamRecorderProps {
  sessionActive: boolean
  duration?: number
  onStreamReady?: (stream: MediaStream) => void
  onStreamEnd?: () => void
}

export default function WebcamRecorder({ sessionActive, duration = 0, onStreamReady, onStreamEnd }: WebcamRecorderProps) {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [isMicActive, setIsMicActive] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (typeof window !== 'undefined' && window.innerWidth < 768)
      setIsMobile(isMobileDevice)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Request camera permission after a short delay to avoid conflicts with WebcamPIP
  useEffect(() => {
    // Delay initialization slightly to let WebcamPIP initialize first
    const timer = setTimeout(() => {
      startWebcam()
    }, 500)
    
    return () => clearTimeout(timer)
  }, [])

  // Ensure stream is attached to video element when it changes
  useEffect(() => {
    if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
      console.log('📹 Attaching stream to video element')
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play().catch(err => {
        console.error('❌ Video play error:', err)
      })
    }
  }, [isWebcamActive])

  // Monitor and lock zoom throughout the session
  useEffect(() => {
    if (!streamRef.current || !sessionActive) return
    
    const videoTrack = streamRef.current.getVideoTracks()[0]
    if (!videoTrack) return
    
    // Check and lock zoom every 2 seconds during active session
    const zoomCheckInterval = setInterval(async () => {
      try {
        const settings = videoTrack.getSettings()
        // @ts-ignore
        if (settings.zoom && settings.zoom !== 1.0) {
          console.warn('⚠️ Zoom detected at', settings.zoom, '- resetting to 1.0')
          await videoTrack.applyConstraints({
            // @ts-ignore
            advanced: [{ zoom: 1.0 }]
          })
        }
      } catch (error) {
        // Silently fail if zoom control not supported
      }
    }, 2000)
    
    return () => clearInterval(zoomCheckInterval)
  }, [sessionActive])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam()
    }
  }, [])

  const startWebcam = async () => {
    try {
      setIsRequestingPermission(true)
      setError(null)
      console.log('🎥 Requesting camera access...')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
          // Disable auto-zoom/auto-framing features
          pan: false,
          tilt: false,
          zoom: false,
          // @ts-ignore - Advanced constraint not in all type definitions
          advanced: [{ zoom: 1.0 }]
        },
        audio: true
      })

      console.log('✅ Camera access granted', {
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      })
      
      streamRef.current = stream
      
      // Set states first to trigger the useEffect
      setIsWebcamActive(true)
      setHasPermission(true)
      setIsRequestingPermission(false)
      setError(null)
      
      // Notify parent that stream is ready for dual recording
      if (onStreamReady) {
        onStreamReady(stream)
      }
      
      // Then attach stream to video element
      if (videoRef.current) {
        console.log('📹 Setting srcObject on video element')
        videoRef.current.srcObject = stream
        
        // Lock video settings to prevent zoom
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const capabilities = videoTrack.getCapabilities()
          console.log('📹 Video capabilities:', capabilities)
          
          // Apply constraints to lock zoom at 1.0 if supported
          try {
            await videoTrack.applyConstraints({
              // @ts-ignore - Advanced constraints
              advanced: [{ zoom: 1.0 }]
            })
            console.log('✅ Zoom locked at 1.0')
          } catch (constraintError) {
            console.log('ℹ️ Zoom lock not supported on this device')
          }
        }
        
        // Explicitly play the video to ensure it displays
        try {
          await videoRef.current.play()
          console.log('✅ Video playing')
        } catch (playError) {
          console.error('⚠️ Video play error (might auto-recover):', playError)
        }
      } else {
        console.warn('⚠️ Video ref is null, will retry in useEffect')
      }
    } catch (err: any) {
      console.error('❌ Error accessing webcam:', err)
      setIsRequestingPermission(false)
      
      // Provide more specific error messages
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera found. Please connect a camera and try again.')
      } else {
        setError('Unable to access camera. Please check permissions and try again.')
      }
      setIsWebcamActive(false)
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
    
    setIsWebcamActive(false)
    
    // Notify parent that stream ended
    if (onStreamEnd) {
      onStreamEnd()
    }
  }

  const toggleWebcam = () => {
    if (isWebcamActive) {
      stopWebcam()
    } else {
      startWebcam()
    }
  }

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks()
      audioTracks.forEach(track => {
        track.enabled = !track.enabled
      })
      setIsMicActive(!isMicActive)
    }
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Video Container - Full Size */}
      <div className="flex-1 relative bg-slate-900/30 flex items-center justify-center min-h-0 overflow-hidden">
        {isRequestingPermission ? (
          <div className="text-center text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-3"></div>
            <p className="text-sm">Requesting camera permission...</p>
            <p className="text-xs text-slate-500 mt-2">Please allow access in your browser</p>
          </div>
        ) : error ? (
          <div className="text-center text-slate-400 max-w-sm">
            <CameraOff className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm">{error}</p>
            <button
              onClick={startWebcam}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : !isWebcamActive ? (
          <div className="text-center text-slate-400">
            <CameraOff className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-sm mb-4">Camera is off</p>
            <button
              onClick={startWebcam}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors"
            >
              Turn On Camera
            </button>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center min-h-0 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full max-w-full max-h-full object-contain"
              style={{
                transform: isMobile ? 'scaleX(-1)' : 'scale(1)',
                transformOrigin: 'center center'
              }}
            />
            
            {/* Webcam UI Overlay */}
            <div className="pointer-events-none absolute inset-0">
              {/* Top status bar */}
              <div className="absolute top-0 left-0 right-0 px-3 py-2 flex items-center justify-between bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white/90 font-medium">
                    {sessionActive ? 'Recording' : 'Webcam'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/85 px-1.5 py-0.5 rounded bg-white/10">HD</span>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-auto">
                <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-2">
                  <button
                    onClick={toggleMic}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isMicActive 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-red-600 hover:bg-red-500'
                    }`}
                    title={isMicActive ? 'Mute microphone' : 'Unmute microphone'}
                  >
                    {isMicActive ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4 text-white" />}
                  </button>
                  <button
                    onClick={toggleWebcam}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isWebcamActive 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-red-600 hover:bg-red-500'
                    }`}
                    title="Turn off camera"
                  >
                    {isWebcamActive ? <Video className="w-4 h-4 text-white" /> : <CameraOff className="w-4 h-4 text-white" />}
                  </button>
                  {sessionActive && (
                    <span className="text-[10px] text-white/80 ml-1 font-medium">LIVE</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

