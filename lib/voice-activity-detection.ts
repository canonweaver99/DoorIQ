export class VoiceActivityDetector {
  private audioContext: AudioContext;
  private analyser: AnalyserNode;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private isListening = false;
  private speechStartCallback?: () => void;
  private speechEndCallback?: () => void;
  private silenceTimeout: NodeJS.Timeout | null = null;
  private isSpeaking = false;
  
  // Configurable parameters
  private readonly THRESHOLD = 0.02; // Voice activity threshold
  private readonly SILENCE_DURATION = 1500; // ms of silence before considering speech ended
  private readonly SMOOTHING_TIME_CONSTANT = 0.95;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = this.SMOOTHING_TIME_CONSTANT;
  }

  async start(
    stream: MediaStream,
    onSpeechStart?: () => void,
    onSpeechEnd?: () => void
  ): Promise<void> {
    this.speechStartCallback = onSpeechStart;
    this.speechEndCallback = onSpeechEnd;
    
    this.microphone = this.audioContext.createMediaStreamSource(stream);
    this.microphone.connect(this.analyser);
    
    this.isListening = true;
    this.detectVoiceActivity();
  }

  stop(): void {
    this.isListening = false;
    if (this.microphone) {
      this.microphone.disconnect();
      this.microphone = null;
    }
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  private detectVoiceActivity(): void {
    if (!this.isListening) return;

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength / 255; // Normalize to 0-1

    // Detect speech state changes
    if (average > this.THRESHOLD && !this.isSpeaking) {
      // Speech started
      this.isSpeaking = true;
      if (this.silenceTimeout) {
        clearTimeout(this.silenceTimeout);
        this.silenceTimeout = null;
      }
      this.speechStartCallback?.();
    } else if (average <= this.THRESHOLD && this.isSpeaking) {
      // Potential speech end - wait for silence duration
      if (!this.silenceTimeout) {
        this.silenceTimeout = setTimeout(() => {
          this.isSpeaking = false;
          this.speechEndCallback?.();
          this.silenceTimeout = null;
        }, this.SILENCE_DURATION);
      }
    }

    // Continue detection
    requestAnimationFrame(() => this.detectVoiceActivity());
  }

  getAudioLevel(): number {
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    return sum / bufferLength / 255;
  }
}

// Audio recorder with chunking for streaming
export class StreamingAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private onDataCallback?: (chunk: Blob) => void;

  async start(
    stream: MediaStream,
    onDataAvailable?: (chunk: Blob) => void,
    timeslice: number = 250 // Send chunks every 250ms
  ): Promise<void> {
    this.onDataCallback = onDataAvailable;
    
    const options = {
      mimeType: 'audio/webm;codecs=opus',
    };
    
    this.mediaRecorder = new MediaRecorder(stream, options);
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.chunks.push(event.data);
        this.onDataCallback?.(event.data);
      }
    };
    
    this.mediaRecorder.start(timeslice);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.chunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  pause(): void {
    this.mediaRecorder?.pause();
  }

  resume(): void {
    this.mediaRecorder?.resume();
  }
}

// Smooth audio playback queue for seamless conversation
export class AudioPlaybackQueue {
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private audioContext: AudioContext;
  private onPlaybackEnd?: () => void;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  async addToQueue(audioData: ArrayBuffer, onEnd?: () => void): Promise<void> {
    this.onPlaybackEnd = onEnd;
    
    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData);
      this.queue.push(audioBuffer);
      
      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      console.error('Error decoding audio:', error);
    }
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onPlaybackEnd?.();
      return;
    }

    this.isPlaying = true;
    const audioBuffer = this.queue.shift()!;
    
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);
    
    source.onended = () => {
      this.playNext();
    };
    
    source.start();
  }

  clear(): void {
    this.queue = [];
    this.isPlaying = false;
  }
}

