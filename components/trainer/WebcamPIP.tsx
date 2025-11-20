'use client'

import { useEffect, useRef, useState } from 'react'
import { CameraOff } from 'lucide-react'

interface WebcamPIPProps {
  className?: string
}

export function WebcamPIP({ className = '' }: WebcamPIPProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    startWebcam()

    return () => {
      stopWebcam()
    }
  }, [])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false // No audio needed for PIP
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsActive(true)
        setError(null)
      }
    } catch (err: any) {
      console.error('Error accessing webcam for PIP:', err)
      setError('Camera unavailable')
      setIsActive(false)
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
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border-2 border-white/20 bg-slate-900 ${className}`}>
      {error || !isActive ? (
        <div className="w-full h-full flex items-center justify-center bg-slate-800">
          <CameraOff className="w-6 h-6 text-slate-600" />
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />
      )}
    </div>
  )
}

