"use client";

import { Play, Pause } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  demoMode?: boolean;
  demoInterval?: number;
  className?: string;
  audioUrl?: string; // Optional audio URL to play
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  demoMode = false,
  demoInterval = 3000,
  className,
  audioUrl
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [isDemo, setIsDemo] = useState(demoMode);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>(audioUrl);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Update currentAudioUrl when audioUrl prop changes
  useEffect(() => {
    if (audioUrl) {
      setCurrentAudioUrl(audioUrl);
    }
  }, [audioUrl]);

  // Initialize audio element
  useEffect(() => {
    if (!currentAudioUrl) return;

    let audio: HTMLAudioElement | null = null;
    let cleanupFn: (() => void) | null = null;

    // Pre-flight check: verify URL returns audio before creating Audio element
    const validateAndLoadAudio = async () => {
      setIsLoading(true);
      setAudioError(null);

      try {
        // Fetch URL to check if it returns audio or an error
        const response = await fetch(currentAudioUrl, { method: 'GET' });
        const contentType = response.headers.get('content-type') || '';

        // If response is JSON or not OK, it's likely an error
        if (contentType.includes('application/json') || !response.ok) {
          try {
            const errorData = await response.json();
            const errorMsg = errorData.error || errorData.details || 'Audio service unavailable';
            setAudioError(errorMsg);
            setIsLoading(false);
            console.error('Audio API error:', errorMsg, errorData);
            return;
          } catch {
            // If JSON parsing fails, use status text
            setAudioError(response.statusText || 'Failed to load audio');
            setIsLoading(false);
            return;
          }
        }

        // If not audio content type and not ok, it's an error
        if (!response.ok) {
          setAudioError('Failed to load audio');
          setIsLoading(false);
          return;
        }

        // Create audio element
        audio = new Audio(currentAudioUrl);
        audioRef.current = audio;

        const handleTimeUpdate = () => {
          if (audio && audio.currentTime && !isNaN(audio.currentTime)) {
            setTime(Math.floor(audio.currentTime));
          }
        };

        const handlePlay = () => {
          setIsPlaying(true);
          setSubmitted(true);
          setIsLoading(false);
          onStart?.();
        };

        const handlePause = () => {
          setIsPlaying(false);
          setSubmitted(false);
        };

        const handleEnded = () => {
          setIsPlaying(false);
          setSubmitted(false);
          setTime(0);
          setIsLoading(false);
          if (audio) {
            audio.pause();
            audio.currentTime = 0;
          }
          onStop?.(audio?.duration || 0);
        };

        const handleLoadedMetadata = async () => {
          setIsLoading(false);
          if (shouldAutoPlay && audio) {
            setShouldAutoPlay(false);
            try {
              await audio.play();
            } catch (error) {
              console.error('Error auto-playing audio:', error);
              setAudioError('Failed to play audio');
            }
          }
        };

        const handleError = () => {
          setIsLoading(false);
          setIsPlaying(false);
          setSubmitted(false);
          
          if (audio && audio.error) {
            let errorMessage = 'Failed to load audio';
            switch (audio.error.code) {
              case MediaError.MEDIA_ERR_ABORTED:
                errorMessage = 'Audio loading aborted';
                break;
              case MediaError.MEDIA_ERR_NETWORK:
                errorMessage = 'Network error';
                break;
              case MediaError.MEDIA_ERR_DECODE:
                errorMessage = 'Audio format not supported';
                break;
              case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                errorMessage = 'Audio source not supported';
                break;
            }
            setAudioError(errorMessage);
            console.error('Audio error:', audio.error);
          } else {
            setAudioError('Failed to load audio');
          }
        };

        const handleLoadStart = () => {
          setIsLoading(true);
          setAudioError(null);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('play', handlePlay);
        audio.addEventListener('pause', handlePause);
        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('error', handleError);
        audio.addEventListener('loadstart', handleLoadStart);

        cleanupFn = () => {
          if (audio) {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('play', handlePlay);
            audio.removeEventListener('pause', handlePause);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('loadstart', handleLoadStart);
            audio.pause();
            audio.src = '';
          }
        };
      } catch (error: any) {
        console.error('Error loading audio:', error);
        setAudioError(error?.message || 'Failed to load audio');
        setIsLoading(false);
      }
    };

    validateAndLoadAudio();

    return () => {
      if (cleanupFn) cleanupFn();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [currentAudioUrl, onStart, onStop, shouldAutoPlay]);

  useEffect(() => {
    if (!currentAudioUrl) {
      // Fallback to timer-based mode if no audio URL
      let intervalId: NodeJS.Timeout;

      if (submitted) {
        onStart?.();
        intervalId = setInterval(() => {
          setTime((t) => t + 1);
        }, 1000);
      } else {
        onStop?.(time);
        setTime(0);
      }

      return () => clearInterval(intervalId);
    }
  }, [submitted, time, onStart, onStop, currentAudioUrl]);

  useEffect(() => {
    if (!isDemo || currentAudioUrl) return; // Don't run demo mode if audio is playing

    let timeoutId: NodeJS.Timeout;
    const runAnimation = () => {
      setSubmitted(true);
      timeoutId = setTimeout(() => {
        setSubmitted(false);
        timeoutId = setTimeout(runAnimation, 1000);
      }, demoInterval);
    };

    const initialTimeout = setTimeout(runAnimation, 100);
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(initialTimeout);
    };
  }, [isDemo, demoInterval, currentAudioUrl]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = async () => {
    if (currentAudioUrl) {
      // Audio playback mode
      if (isPlaying && audioRef.current) {
        // If playing, pause it
        audioRef.current.pause();
        setIsPlaying(false);
        setSubmitted(false);
      } else {
        // Check if audio has ended or we need a new clip
        const needsNewAudio = !audioRef.current || 
                              (audioRef.current && audioRef.current.ended) ||
                              (!isPlaying && !isLoading && audioRef.current?.currentTime === 0);
        
        if (needsNewAudio) {
          // Increment index to get next agent/voice
          const nextIndex = currentAudioIndex + 1;
          setCurrentAudioIndex(nextIndex);
          
          // Generate new audio URL with index parameter
          const baseUrl = currentAudioUrl.split('?')[0];
          const newAudioUrl = `${baseUrl}?index=${nextIndex}`;
          
          // Set flag to auto-play when new audio loads
          setShouldAutoPlay(true);
          setIsLoading(true);
          setCurrentAudioUrl(newAudioUrl);
          
          // The useEffect will handle creating the new audio element and auto-playing
          return;
        }
        
        // Resume or start current audio
        if (audioRef.current) {
          setIsLoading(true);
          setAudioError(null);
          try {
            await audioRef.current.play();
          } catch (error) {
            console.error('Error playing audio:', error);
            setIsLoading(false);
            setAudioError('Failed to play audio');
          }
        }
      }
    } else {
      // Timer-based mode (no audio URL)
      if (isDemo) {
        setIsDemo(false);
        setSubmitted(false);
      } else {
        setSubmitted((prev) => !prev);
      }
    }
  };

  return (
    <div className={cn("w-full py-2 -mt-8", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className={cn(
            "group w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center transition-colors",
            submitted || isPlaying
              ? "bg-black/80"
              : "bg-black/90 hover:bg-black/95"
          )}
          type="button"
          onClick={handleClick}
        >
          {isLoading ? (
            <div
              className="w-8 h-8 md:w-10 md:h-10 rounded-sm animate-spin bg-white cursor-pointer pointer-events-auto"
              style={{ animationDuration: "3s" }}
            />
          ) : submitted || isPlaying ? (
            currentAudioUrl ? (
              <Pause className="w-8 h-8 md:w-10 md:h-10 text-white" />
            ) : (
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-sm animate-spin bg-white cursor-pointer pointer-events-auto"
                style={{ animationDuration: "3s" }}
              />
            )
          ) : (
            <Play className="w-8 h-8 md:w-10 md:h-10 text-white" />
          )}
        </button>

        <span
          className={cn(
            "font-mono text-sm md:text-base transition-opacity duration-300 text-white"
          )}
        >
          {formatTime(time)}
        </span>

        <div className="h-4 md:h-5 w-64 md:w-80 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                (submitted || isPlaying)
                  ? "bg-white/70 animate-pulse"
                  : "bg-white/30 h-1.5"
              )}
              style={
                (submitted || isPlaying) && isClient
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="h-5 text-sm md:text-base text-white">
          {audioError ? (
            <span className="text-red-400 text-xs">Audio unavailable</span>
          ) : submitted || isPlaying ? (
            ""
          ) : isLoading ? (
            "Loading audio..."
          ) : (
            "Click to hear a snippet from our AI trainers"
          )}
        </p>
      </div>
    </div>
  );
}

