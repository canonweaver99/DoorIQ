// Enhanced Voice Activity Detection
// Provides smooth, reliable detection of speech activity

export interface VADOptions {
  threshold: number;          // RMS threshold for considering speech active
  sustainedFrames: number;    // Frames that must exceed threshold for "speaking"
  silenceFrames: number;      // Frames below threshold for "not speaking"
  historySize: number;        // Size of RMS history buffer
}

export class EnhancedVAD {
  private rmsHistory: number[] = [];
  private speakingFrameCount = 0;
  private silenceFrameCount = 0;
  private currentlySpeaking = false;
  private options: VADOptions;

  constructor(options: Partial<VADOptions> = {}) {
    this.options = {
      threshold: 0.035,
      sustainedFrames: 3,
      silenceFrames: 5,
      historySize: 10,
      ...options
    };
  }

  /**
   * Process current RMS value and return whether speech is detected
   */
  processSample(rms: number): boolean {
    // Maintain RMS history for smoothing
    this.rmsHistory.push(rms);
    if (this.rmsHistory.length > this.options.historySize) {
      this.rmsHistory.shift();
    }

    // Get smoothed RMS
    const smoothedRMS = this.getSmoothedRMS();
    const aboveThreshold = smoothedRMS > this.options.threshold;

    if (aboveThreshold) {
      this.speakingFrameCount++;
      this.silenceFrameCount = 0;
    } else {
      this.speakingFrameCount = 0;
      this.silenceFrameCount++;
    }

    // State transitions with hysteresis
    if (!this.currentlySpeaking && this.speakingFrameCount >= this.options.sustainedFrames) {
      this.currentlySpeaking = true;
    } else if (this.currentlySpeaking && this.silenceFrameCount >= this.options.silenceFrames) {
      this.currentlySpeaking = false;
    }

    return this.currentlySpeaking;
  }

  /**
   * Get current speaking state without processing new sample
   */
  isSpeaking(): boolean {
    return this.currentlySpeaking;
  }

  /**
   * Get smoothed RMS value
   */
  private getSmoothedRMS(): number {
    if (this.rmsHistory.length === 0) return 0;
    return this.rmsHistory.reduce((sum, val) => sum + val, 0) / this.rmsHistory.length;
  }

  /**
   * Get current RMS level (0-1)
   */
  getCurrentLevel(): number {
    return this.getSmoothedRMS();
  }

  /**
   * Reset VAD state
   */
  reset(): void {
    this.rmsHistory = [];
    this.speakingFrameCount = 0;
    this.silenceFrameCount = 0;
    this.currentlySpeaking = false;
  }

  /**
   * Update configuration
   */
  updateOptions(newOptions: Partial<VADOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * Get debug information
   */
  getDebugInfo(): {
    currentLevel: number;
    speaking: boolean;
    speakingFrames: number;
    silenceFrames: number;
    threshold: number;
  } {
    return {
      currentLevel: this.getCurrentLevel(),
      speaking: this.currentlySpeaking,
      speakingFrames: this.speakingFrameCount,
      silenceFrames: this.silenceFrameCount,
      threshold: this.options.threshold
    };
  }
}

/**
 * Create a simple VAD function for basic use cases
 */
export function createSimpleVAD(threshold: number = 0.035) {
  const vad = new EnhancedVAD({ threshold });
  return (rms: number) => vad.processSample(rms);
}
