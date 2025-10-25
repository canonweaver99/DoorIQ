'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, CameraOff, Mic, MicOff } from 'lucide-react'

interface WebcamRecorderProps {
  sessionActive: boolean
  duration?: number
}

export default function WebcamRecorder({ sessionActive, duration = 0 }: WebcamRecorderProps) {
  const [isWebcamActive, setIsWebcamActive] = useState(false)
  const [isMicActive, setIsMicActive] = useState(true)
  const [hasPermission, setHasPermission] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Request camera permission immediately on component mount
  useEffect(() => {
    startWebcam()
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
          facingMode: 'user'
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
      
      // Then attach stream to video element
      if (videoRef.current) {
        console.log('📹 Setting srcObject on video element')
        videoRef.current.srcObject = stream
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
    <div className="h-full flex flex-col bg-slate-800/40 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header with Timer */}
      <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <h3 className="text-slate-300 text-sm font-semibold uppercase tracking-wide">
          Your Camera
        </h3>
        <div className="text-sm text-slate-400 font-mono">
          {sessionActive ? formatDuration(duration) : '0:00'}
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-slate-900/50 flex items-center justify-center p-4">
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
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover rounded-xl shadow-2xl"
            />
            
            {/* Recording indicator */}
            {sessionActive && isWebcamActive && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-white text-xs font-medium">Recording</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      {isWebcamActive && (
        <div className="px-4 py-4 border-t border-slate-700/50 flex items-center justify-center gap-3">
          <button
            onClick={toggleMic}
            className={`p-3 rounded-full transition-all ${
              isMicActive
                ? 'bg-slate-700 hover:bg-slate-600 text-white'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
            title={isMicActive ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleWebcam}
            className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white transition-all"
            title="Turn off camera"
          >
            <CameraOff className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}

