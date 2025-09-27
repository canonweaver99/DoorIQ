// Audio ducking system
// Automatically lowers SFX volume when voice activity is detected

import type { AudioBuses } from './mixer';
import { EnhancedVAD } from './vad';

export interface DuckingOptions {
  duckVolume: number;     // Volume to duck to (0-1)
  normalVolume: number;   // Normal SFX volume (0-1) 
  attackTime: number;     // How fast to duck (ms)
  releaseTime: number;    // How fast to return to normal (ms)
  vadThreshold: number;   // VAD threshold for speech detection
  pollInterval: number;   // How often to check VAD (ms)
}

export class AudioDucker {
  private buses: AudioBuses;
  private vad: EnhancedVAD;
  private options: DuckingOptions;
  private animationFrame: number | null = null;
  private lastPollTime = 0;
  private isActive = false;

  constructor(buses: AudioBuses, options: Partial<DuckingOptions> = {}) {
    this.buses = buses;
    this.options = {
      duckVolume: 0.2,      // Duck to 20% volume (-14dB)
      normalVolume: 1.0,    // Full SFX volume
      attackTime: 80,       // Quick duck
      releaseTime: 300,     // Slower return
      vadThreshold: 0.035,  // Moderate threshold
      pollInterval: 50,     // 20fps polling
      ...options
    };

    this.vad = new EnhancedVAD({
      threshold: this.options.vadThreshold,
      sustainedFrames: 2,   // Quick reaction
      silenceFrames: 6      // Slower release
    });
  }

  /**
   * Start the ducking system
   */
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastPollTime = performance.now();
    this.poll();
    
    console.log('🔇 Audio ducking started');
  }

  /**
   * Stop the ducking system
   */
  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Return SFX to normal volume
    this.setSfxVolume(this.options.normalVolume);
    
    console.log('🔊 Audio ducking stopped');
  }

  /**
   * Main polling loop
   */
  private poll = (): void => {
    if (!this.isActive) return;

    const now = performance.now();
    const deltaTime = now - this.lastPollTime;

    // Only process at specified interval
    if (deltaTime >= this.options.pollInterval) {
      const rms = this.buses.getRMS();
      const isSpeaking = this.vad.processSample(rms);
      
      // Apply ducking based on speech detection
      const targetVolume = isSpeaking ? this.options.duckVolume : this.options.normalVolume;
      const transitionTime = isSpeaking ? this.options.attackTime : this.options.releaseTime;
      
      this.setSfxVolume(targetVolume, transitionTime);
      
      this.lastPollTime = now;
    }

    this.animationFrame = requestAnimationFrame(this.poll);
  };

  /**
   * Set SFX bus volume with smooth transition
   */
  private setSfxVolume(targetVolume: number, transitionMs: number = 50): void {
    const audioContext = this.buses.audioContext;
    const timeConstant = transitionMs / 1000 / 3; // Convert to AudioParam time constant
    
    this.buses.sfxBus.gain.setTargetAtTime(
      targetVolume, 
      audioContext.currentTime, 
      timeConstant
    );
  }

  /**
   * Update ducking configuration
   */
  updateOptions(newOptions: Partial<DuckingOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Update VAD threshold if changed
    this.vad.updateOptions({ 
      threshold: this.options.vadThreshold 
    });
  }

  /**
   * Get current ducking state for debugging
   */
  getDebugInfo(): {
    isActive: boolean;
    isSpeaking: boolean;
    currentLevel: number;
    sfxVolume: number;
    vadInfo: ReturnType<EnhancedVAD['getDebugInfo']>;
  } {
    return {
      isActive: this.isActive,
      isSpeaking: this.vad.isSpeaking(),
      currentLevel: this.vad.getCurrentLevel(),
      sfxVolume: this.buses.sfxBus.gain.value,
      vadInfo: this.vad.getDebugInfo()
    };
  }

  /**
   * Manually trigger ducking (useful for testing)
   */
  manualDuck(enable: boolean): void {
    const targetVolume = enable ? this.options.duckVolume : this.options.normalVolume;
    this.setSfxVolume(targetVolume, 100);
  }
}

/**
 * Create and start a simple ducking system
 */
export function startSimpleDucking(
  buses: AudioBuses, 
  options?: Partial<DuckingOptions>
): AudioDucker {
  const ducker = new AudioDucker(buses, options);
  ducker.start();
  return ducker;
}
