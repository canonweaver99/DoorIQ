// Audio bus system for ambient audio effects
// Manages separate channels for voice, sound effects, and ambient background

let audioContextInstance: AudioContext | null = null;

export async function getAudioContext(): Promise<AudioContext> {
  if (!audioContextInstance) {
    audioContextInstance = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Handle browser autoplay restrictions
    if (audioContextInstance.state === 'suspended') {
      await audioContextInstance.resume();
    }
  }
  return audioContextInstance;
}

export interface AudioBuses {
  audioContext: AudioContext;
  masterBus: GainNode;
  voiceBus: GainNode;
  sfxBus: GainNode;
  ambBus: GainNode;
  analyser: AnalyserNode;
  getRMS: () => number;
  cleanup: () => void;
}

export async function createAudioBuses(): Promise<AudioBuses> {
  const audioContext = await getAudioContext();
  
  // Create master output
  const masterBus = audioContext.createGain();
  masterBus.gain.value = 1.0;
  masterBus.connect(audioContext.destination);

  // Create individual buses with appropriate levels
  const voiceBus = audioContext.createGain();
  voiceBus.gain.value = 1.0; // Full volume for speech clarity
  voiceBus.connect(masterBus);

  const sfxBus = audioContext.createGain();
  sfxBus.gain.value = 0.4; // Moderate volume for effects
  sfxBus.connect(masterBus);

  const ambBus = audioContext.createGain();
  ambBus.gain.value = 0.15; // Very low for ambient background
  ambBus.connect(masterBus);

  // Enhanced VAD setup on voice bus
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048; // Higher resolution for better detection
  analyser.smoothingTimeConstant = 0.8; // Smooth out rapid changes
  voiceBus.connect(analyser);

  // RMS calculation with smoothing
  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  let rmsHistory: number[] = [];
  const historySize = 5;

  const getRMS = (): number => {
    analyser.getByteTimeDomainData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    
    const rms = Math.sqrt(sum / dataArray.length);
    
    // Maintain smoothing history
    rmsHistory.push(rms);
    if (rmsHistory.length > historySize) {
      rmsHistory.shift();
    }
    
    // Return smoothed average
    return rmsHistory.reduce((a, b) => a + b, 0) / rmsHistory.length;
  };

  const cleanup = () => {
    try {
      voiceBus.disconnect();
      sfxBus.disconnect();
      ambBus.disconnect();
      masterBus.disconnect();
      analyser.disconnect();
    } catch (e) {
      console.warn('Error during audio bus cleanup:', e);
    }
  };

  return {
    audioContext,
    masterBus,
    voiceBus,
    sfxBus,
    ambBus,
    analyser,
    getRMS,
    cleanup
  };
}

// Utility function to check if voice is actively speaking
export function isVoiceActive(getRMS: () => number, threshold: number = 0.035): boolean {
  return getRMS() > threshold;
}

// Smooth volume transitions to prevent audio pops
export function smoothVolumeTransition(
  gainNode: GainNode, 
  targetVolume: number, 
  durationMs: number = 50
): void {
  const audioContext = gainNode.context as AudioContext;
  const now = audioContext.currentTime;
  
  gainNode.gain.setTargetAtTime(targetVolume, now, durationMs / 1000);
}
