export class AudioProcessor {
  /**
   * Convert a Blob to base64 string
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to Blob
   */
  static base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Create an audio context and analyze audio levels
   */
  static createAudioAnalyzer(stream: MediaStream): {
    analyser: AnalyserNode;
    getLevel: () => number;
    cleanup: () => void;
  } {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const getLevel = () => {
      analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      return average / 255; // Normalize to 0-1
    };
    
    const cleanup = () => {
      source.disconnect();
      audioContext.close();
    };
    
    return { analyser, getLevel, cleanup };
  }

  /**
   * Convert audio file to a different format using Web Audio API
   */
  static async convertAudioFormat(
    audioBlob: Blob,
    targetFormat: 'webm' | 'wav' = 'wav'
  ): Promise<Blob> {
    const audioContext = new AudioContext();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    if (targetFormat === 'wav') {
      return this.audioBufferToWav(audioBuffer);
    }
    
    // For webm, return as-is or implement conversion
    return audioBlob;
  }

  /**
   * Convert AudioBuffer to WAV format
   */
  private static audioBufferToWav(audioBuffer: AudioBuffer): Blob {
    const numberOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numberOfChannels * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Convert audio data
    const channelData = [];
    for (let channel = 0; channel < numberOfChannels; channel++) {
      channelData.push(audioBuffer.getChannelData(channel));
    }
    
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }

  /**
   * Simple voice activity detection
   */
  static createVoiceActivityDetector(
    stream: MediaStream,
    onSpeechStart?: () => void,
    onSpeechEnd?: () => void
  ) {
    const { getLevel, cleanup } = this.createAudioAnalyzer(stream);
    const threshold = 0.1; // Adjust based on testing
    let isSpeaking = false;
    let silenceTimer: NodeJS.Timeout | null = null;
    
    const checkInterval = setInterval(() => {
      const level = getLevel();
      
      if (level > threshold && !isSpeaking) {
        isSpeaking = true;
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
        onSpeechStart?.();
      } else if (level <= threshold && isSpeaking) {
        if (!silenceTimer) {
          silenceTimer = setTimeout(() => {
            isSpeaking = false;
            onSpeechEnd?.();
          }, 1500); // 1.5 seconds of silence before considering speech ended
        }
      }
    }, 100);
    
    return {
      stop: () => {
        clearInterval(checkInterval);
        if (silenceTimer) clearTimeout(silenceTimer);
        cleanup();
      }
    };
  }
}

