// Audio playback utilities for one-shots and loops
// Handles playing audio assets through the bus system

import { getAudioBuffer } from './assets';
import type { AudioBuses } from './mixer';

export interface PlaybackOptions {
  fadeIn?: number;      // Fade in duration (seconds)
  fadeOut?: number;     // Fade out duration (seconds)  
  volume?: number;      // Volume multiplier (0-1)
  startTime?: number;   // When to start playing (audioContext.currentTime)
  loop?: boolean;       // Whether to loop the audio
}

export interface PlaybackControl {
  stop: () => void;
  setVolume: (volume: number) => void;
  isPlaying: boolean;
  duration: number;
}

/**
 * Play a one-shot audio asset through specified bus
 */
export async function playOneShot(
  assetKey: string,
  bus: GainNode,
  options: PlaybackOptions = {}
): Promise<PlaybackControl | null> {
  const buffer = getAudioBuffer(assetKey);
  if (!buffer) {
    console.warn(`Audio asset not found: ${assetKey}`);
    return null;
  }

  const audioContext = bus.context as AudioContext;
  const {
    fadeIn = 0.01,
    fadeOut = 0.03,
    volume = 1.0,
    startTime = audioContext.currentTime,
    loop = false
  } = options;

  // Create audio graph: source -> gain -> bus
  const source = audioContext.createBufferSource();
  const gainNode = audioContext.createGain();
  
  source.buffer = buffer;
  source.loop = loop;
  source.connect(gainNode);
  gainNode.connect(bus);

  // Set up fade envelope
  const endTime = startTime + buffer.duration;
  gainNode.gain.setValueAtTime(0.0001, startTime);
  
  if (fadeIn > 0) {
    gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeIn);
  } else {
    gainNode.gain.setValueAtTime(volume, startTime);
  }

  if (fadeOut > 0 && !loop) {
    gainNode.gain.linearRampToValueAtTime(volume, endTime - fadeOut);
    gainNode.gain.linearRampToValueAtTime(0.0001, endTime);
  }

  // Start playback
  source.start(startTime);
  if (!loop) {
    source.stop(endTime);
  }

  let isPlaying = true;
  
  // Clean up when finished
  source.addEventListener('ended', () => {
    isPlaying = false;
    try {
      source.disconnect();
      gainNode.disconnect();
    } catch (e) {
      // Already disconnected
    }
  });

  return {
    stop: () => {
      if (isPlaying) {
        source.stop();
        isPlaying = false;
      }
    },
    setVolume: (newVolume: number) => {
      const now = audioContext.currentTime;
      gainNode.gain.setTargetAtTime(newVolume * volume, now, 0.01);
    },
    isPlaying,
    duration: buffer.duration
  };
}

/**
 * Play a looping ambient sound
 */
export async function playLoop(
  assetKey: string,
  bus: GainNode,
  options: Omit<PlaybackOptions, 'loop'> = {}
): Promise<PlaybackControl | null> {
  return playOneShot(assetKey, bus, { ...options, loop: true });
}

/**
 * Play a sequence of sounds with gaps
 */
export async function playSequence(
  assetKeys: string[],
  bus: GainNode,
  gapMs: number = 200,
  options: PlaybackOptions = {}
): Promise<PlaybackControl[]> {
  const controls: PlaybackControl[] = [];
  const audioContext = bus.context as AudioContext;
  let currentTime = options.startTime || audioContext.currentTime;

  for (const assetKey of assetKeys) {
    const buffer = getAudioBuffer(assetKey);
    if (!buffer) continue;

    const control = await playOneShot(assetKey, bus, {
      ...options,
      startTime: currentTime
    });

    if (control) {
      controls.push(control);
      currentTime += buffer.duration + (gapMs / 1000);
    }
  }

  return controls;
}

/**
 * Crossfade between two audio sources
 */
export async function crossfade(
  fromKey: string,
  toKey: string,
  bus: GainNode,
  crossfadeMs: number = 1000
): Promise<PlaybackControl | null> {
  const fromBuffer = getAudioBuffer(fromKey);
  const toBuffer = getAudioBuffer(toKey);
  
  if (!fromBuffer || !toBuffer) {
    console.warn('Crossfade: Missing audio buffers');
    return null;
  }

  const audioContext = bus.context as AudioContext;
  const now = audioContext.currentTime;
  const crossfadeSeconds = crossfadeMs / 1000;

  // Start the new audio
  const toControl = await playOneShot(toKey, bus, {
    volume: 0,
    startTime: now
  });

  if (!toControl) return null;

  // Fade in the new audio
  setTimeout(() => {
    toControl.setVolume(1);
  }, 10);

  return toControl;
}

/**
 * Stop all active audio on a specific bus
 */
export function stopAllOnBus(bus: GainNode): void {
  // This is a utility - in practice you'd need to track active sources
  // For now, we'll just fade the bus to silence temporarily
  const audioContext = bus.context as AudioContext;
  const originalGain = bus.gain.value;
  
  bus.gain.setTargetAtTime(0, audioContext.currentTime, 0.1);
  
  setTimeout(() => {
    bus.gain.setTargetAtTime(originalGain, audioContext.currentTime, 0.1);
  }, 200);
}
