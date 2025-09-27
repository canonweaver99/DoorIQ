// Smart SFX scheduler with Poisson-like timing
// Schedules ambient sound effects at natural intervals based on context

import { playOneShot, type PlaybackControl } from './playback';
import type { AudioBuses } from './mixer';
import { EnhancedVAD } from './vad';

export interface SchedulerOptions {
  // Timing configuration
  baseIntervalMs: [number, number];    // Min/max base interval between attempts
  cooldownMs: number;                  // Minimum time between successful plays
  
  // Conditions for playing
  vadThreshold: number;                // RMS threshold for "quiet enough"
  quietDurationMs: number;             // How long it should be quiet before playing
  
  // Contextual adjustments
  conversationPhases: ConversationPhase[];
  
  // Asset management  
  assetKeys: string[];                 // Available SFX assets to choose from
  assetWeights?: number[];             // Probability weights for each asset
  
  // Control
  enabled: boolean;
  pollIntervalMs: number;              // How often to check conditions
}

export interface ConversationPhase {
  name: string;
  startTimeMs: number;                 // When this phase begins
  intervalMultiplier: number;          // Multiply base interval (higher = less frequent)
  maxPlaysPerMinute?: number;          // Hard limit on plays per minute
}

interface SchedulerState {
  lastPlayTime: number;
  lastAttemptTime: number;
  nextAttemptTime: number;
  conversationStartTime: number;
  playsInLastMinute: number[];
  currentPhase: ConversationPhase | null;
  consecutiveQuietMs: number;
}

export class SmartSfxScheduler {
  private buses: AudioBuses;
  private vad: EnhancedVAD;
  private options: SchedulerOptions;
  private state: SchedulerState;
  private timer: number | null = null;
  private isActive = false;

  constructor(buses: AudioBuses, options: SchedulerOptions) {
    this.buses = buses;
    this.options = options;
    
    this.vad = new EnhancedVAD({
      threshold: options.vadThreshold,
      sustainedFrames: 1,
      silenceFrames: 3
    });

    this.state = {
      lastPlayTime: 0,
      lastAttemptTime: 0,
      nextAttemptTime: 0,
      conversationStartTime: Date.now(),
      playsInLastMinute: [],
      currentPhase: null,
      consecutiveQuietMs: 0
    };

    this.updateNextAttemptTime();
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isActive || !this.options.enabled) return;
    
    this.isActive = true;
    this.state.conversationStartTime = Date.now();
    this.tick();
    
    console.log('⏰ SFX scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    console.log('⏰ SFX scheduler stopped');
  }

  /**
   * Main scheduling tick
   */
  private tick = (): void => {
    if (!this.isActive) return;

    const now = Date.now();
    this.updateCurrentPhase(now);
    this.updateQuietTracking();
    this.cleanupPlayHistory(now);

    // Check if it's time to attempt playing
    if (now >= this.state.nextAttemptTime) {
      this.attemptPlay(now);
      this.updateNextAttemptTime();
    }

    // Schedule next tick
    this.timer = window.setTimeout(this.tick, this.options.pollIntervalMs);
  };

  /**
   * Attempt to play an SFX if conditions are met
   */
  private attemptPlay(now: number): void {
    this.state.lastAttemptTime = now;

    // Check all conditions
    if (!this.checkAllConditions(now)) {
      return;
    }

    // Select and play asset
    const assetKey = this.selectAsset();
    if (!assetKey) return;

    playOneShot(assetKey, this.buses.sfxBus, {
      volume: this.getContextualVolume(),
      fadeIn: 0.1,
      fadeOut: 0.2
    }).then(control => {
      if (control) {
        this.state.lastPlayTime = now;
        this.state.playsInLastMinute.push(now);
        this.state.consecutiveQuietMs = 0; // Reset quiet tracking
        
        console.log(`🎵 Played SFX: ${assetKey} (phase: ${this.state.currentPhase?.name || 'default'})`);
      }
    });
  }

  /**
   * Check all conditions for playing SFX
   */
  private checkAllConditions(now: number): boolean {
    // Basic cooldown
    const cooldownElapsed = now - this.state.lastPlayTime >= this.options.cooldownMs;
    if (!cooldownElapsed) return false;

    // Voice activity check
    const isQuietEnough = !this.vad.isSpeaking() && this.vad.getCurrentLevel() < this.options.vadThreshold;
    if (!isQuietEnough) return false;

    // Sustained quiet period
    const quietLongEnough = this.state.consecutiveQuietMs >= this.options.quietDurationMs;
    if (!quietLongEnough) return false;

    // Phase-specific rate limiting
    if (this.state.currentPhase?.maxPlaysPerMinute) {
      const recentPlays = this.state.playsInLastMinute.length;
      if (recentPlays >= this.state.currentPhase.maxPlaysPerMinute) {
        return false;
      }
    }

    return true;
  }

  /**
   * Update conversation phase based on elapsed time
   */
  private updateCurrentPhase(now: number): void {
    const elapsedMs = now - this.state.conversationStartTime;
    
    // Find the most recent applicable phase
    let currentPhase: ConversationPhase | null = null;
    for (const phase of this.options.conversationPhases) {
      if (elapsedMs >= phase.startTimeMs) {
        currentPhase = phase;
      }
    }
    
    if (currentPhase !== this.state.currentPhase) {
      this.state.currentPhase = currentPhase;
      console.log(`📍 Conversation phase: ${currentPhase?.name || 'default'}`);
    }
  }

  /**
   * Track how long it's been quiet
   */
  private updateQuietTracking(): void {
    const rms = this.buses.getRMS();
    const isSpeaking = this.vad.processSample(rms);
    
    if (isSpeaking) {
      this.state.consecutiveQuietMs = 0;
    } else {
      this.state.consecutiveQuietMs += this.options.pollIntervalMs;
    }
  }

  /**
   * Remove plays older than 1 minute from tracking
   */
  private cleanupPlayHistory(now: number): void {
    const oneMinuteAgo = now - 60000;
    this.state.playsInLastMinute = this.state.playsInLastMinute.filter(
      time => time > oneMinuteAgo
    );
  }

  /**
   * Calculate next attempt time using Poisson-like distribution
   */
  private updateNextAttemptTime(): void {
    const [minInterval, maxInterval] = this.options.baseIntervalMs;
    
    // Apply phase multiplier
    const phaseMultiplier = this.state.currentPhase?.intervalMultiplier || 1.0;
    const adjustedMin = minInterval * phaseMultiplier;
    const adjustedMax = maxInterval * phaseMultiplier;
    
    // Generate Poisson-like interval (exponential distribution)
    const lambda = 1 / ((adjustedMin + adjustedMax) / 2);
    const exponentialInterval = -Math.log(Math.random()) / lambda;
    
    // Clamp to reasonable bounds
    const boundedInterval = Math.max(adjustedMin, Math.min(adjustedMax, exponentialInterval * 1000));
    
    this.state.nextAttemptTime = Date.now() + boundedInterval;
  }

  /**
   * Select an asset to play based on weights
   */
  private selectAsset(): string | null {
    if (this.options.assetKeys.length === 0) return null;

    const weights = this.options.assetWeights || 
      new Array(this.options.assetKeys.length).fill(1);

    // Weighted random selection
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < this.options.assetKeys.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return this.options.assetKeys[i];
      }
    }

    return this.options.assetKeys[0]; // Fallback
  }

  /**
   * Get volume based on current context
   */
  private getContextualVolume(): number {
    // Could adjust based on conversation phase, time of day, etc.
    return 0.8;
  }

  /**
   * Update scheduler configuration
   */
  updateOptions(newOptions: Partial<SchedulerOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    this.vad.updateOptions({
      threshold: this.options.vadThreshold
    });
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    isActive: boolean;
    currentPhase: string | null;
    nextAttemptIn: number;
    consecutiveQuiet: number;
    playsInLastMinute: number;
    vadInfo: ReturnType<EnhancedVAD['getDebugInfo']>;
  } {
    const now = Date.now();
    return {
      isActive: this.isActive,
      currentPhase: this.state.currentPhase?.name || null,
      nextAttemptIn: Math.max(0, this.state.nextAttemptTime - now),
      consecutiveQuiet: this.state.consecutiveQuietMs,
      playsInLastMinute: this.state.playsInLastMinute.length,
      vadInfo: this.vad.getDebugInfo()
    };
  }
}

/**
 * Create scheduler with sensible defaults for door-to-door scenarios
 */
export function createDoorToDoorScheduler(buses: AudioBuses, assetKeys: string[]): SmartSfxScheduler {
  return new SmartSfxScheduler(buses, {
    baseIntervalMs: [15000, 45000],      // 15-45 second base intervals
    cooldownMs: 8000,                    // 8 second minimum between plays
    vadThreshold: 0.025,                 // Fairly sensitive
    quietDurationMs: 2000,               // 2 seconds of quiet needed
    assetKeys,
    enabled: true,
    pollIntervalMs: 200,                 // Check every 200ms
    conversationPhases: [
      {
        name: 'opening',
        startTimeMs: 0,
        intervalMultiplier: 2.0,         // Less frequent at start
        maxPlaysPerMinute: 2
      },
      {
        name: 'established', 
        startTimeMs: 30000,              // After 30 seconds
        intervalMultiplier: 1.0,         // Normal frequency
        maxPlaysPerMinute: 3
      },
      {
        name: 'closing',
        startTimeMs: 120000,             // After 2 minutes
        intervalMultiplier: 1.5,         // Slightly less frequent
        maxPlaysPerMinute: 2
      }
    ]
  });
}
