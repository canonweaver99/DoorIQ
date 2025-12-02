'use client'

import { useEffect, useRef, useState } from 'react'

interface DoorClosingVideoProps {
  agentId: string
  agentName: string | null
  onComplete: () => void
  getAgentVideoPaths: (agentName: string | null | undefined) => { loop: string; closing: string; opening?: string } | null
}

export default function DoorClosingVideo({
  agentId,
  agentName,
  onComplete,
  getAgentVideoPaths,
}: DoorClosingVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoError, setVideoError] = useState(false)
  const [fadeOutStarted, setFadeOutStarted] = useState(false)

  // Get the closing video path
  const videoPaths = getAgentVideoPaths(agentName)
  const closingVideoPath = videoPaths?.closing || '/austin-door-close.mp4' // Fallback to Austin's video

  console.log('🎬 DoorClosingVideo component mounted:', {
    agentId,
    agentName,
    videoPaths,
    closingVideoPath
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) {
      console.warn('⚠️ DoorClosingVideo: video ref is null')
      return
    }

    console.log('🎬 DoorClosingVideo: Setting up video for:', agentName, 'Path:', closingVideoPath)

    // Set video source
    video.src = closingVideoPath
    video.load()

    // Handle video ended
    const handleEnded = () => {
      console.log('🎬 Door closing video ended for:', agentName)
      // Wait 500ms then call onComplete
      setTimeout(() => {
        onComplete()
      }, 500)
    }

    // Handle video errors
    const handleError = (e: Event) => {
      console.error('❌ Door closing video error for:', agentName, e)
      const videoError = video.error
      if (videoError) {
        console.error('Video error details:', {
          code: videoError.code,
          message: videoError.message
        })
      }
      setVideoError(true)
      
      // Fade to black for 2 seconds then complete
      setFadeOutStarted(true)
      setTimeout(() => {
        onComplete()
      }, 2000)
    }

    // Handle video loaded and ready to play
    const handleCanPlay = () => {
      console.log('✅ Door closing video can play for:', agentName)
      // Try to play the video once it's ready
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('✅ Door closing video started playing for:', agentName)
          })
          .catch((err) => {
            console.error('❌ Failed to play door closing video for:', agentName, err)
            // Try unmuting and playing again (browser autoplay policy)
            video.muted = true
            const mutedPlayPromise = video.play()
            if (mutedPlayPromise !== undefined) {
              mutedPlayPromise
                .then(() => {
                  console.log('✅ Door closing video started playing (muted) for:', agentName)
                  video.muted = false // Unmute after starting
                })
                .catch((mutedErr) => {
                  console.error('❌ Failed to play even when muted for:', agentName, mutedErr)
                  setVideoError(true)
                  setFadeOutStarted(true)
                  setTimeout(() => {
                    onComplete()
                  }, 2000)
                })
            }
          })
      }
    }

    // Handle video loaded metadata
    const handleLoadedMetadata = () => {
      console.log('📹 Door closing video metadata loaded for:', agentName, 'Duration:', video.duration)
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)

    // Also try to play immediately (in case canplay already fired)
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Door closing video started playing immediately for:', agentName)
        })
        .catch((err) => {
          console.log('⏳ Door closing video not ready yet, waiting for canplay event for:', agentName)
          // Will be handled by handleCanPlay
        })
    }

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [closingVideoPath, onComplete, agentName])

  return (
    <div
      className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[2000ms] ${
        fadeOutStarted ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {!videoError ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted={false}
        />
      ) : (
        <div className="w-full h-full bg-black flex items-center justify-center">
          <div className="text-white/50 text-sm">Loading...</div>
        </div>
      )}
    </div>
  )
}

