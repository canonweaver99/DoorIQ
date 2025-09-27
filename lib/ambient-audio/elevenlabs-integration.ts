// ElevenLabs audio integration
// Routes ElevenLabs agent audio through our voice bus for VAD and ducking

import type { AudioBuses } from './mixer';

export interface ElevenLabsIntegration {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

/**
 * Integration approach: Hook into ElevenLabs WebRTC stream
 * This intercepts the agent's audio output and routes it through our voiceBus
 */
export class ElevenLabsWebRTCAudioHook implements ElevenLabsIntegration {
  private buses: AudioBuses;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private mediaStream: MediaStream | null = null;
  private connected = false;
  private originalPeerConnectionCtor: typeof RTCPeerConnection | null = null;
  private peerConnections = new Set<RTCPeerConnection>();

  constructor(buses: AudioBuses) {
    this.buses = buses;
    // Guard for SSR/non-browser environments
    if (typeof window !== 'undefined' && 'RTCPeerConnection' in window) {
      this.originalPeerConnectionCtor = window.RTCPeerConnection;
    }
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // Hook into RTCPeerConnection creation to intercept ElevenLabs streams
    this.interceptWebRTC();
    this.connected = true;

    console.log('🎙️ ElevenLabs WebRTC audio hook connected');
  }

  disconnect(): void {
    if (!this.connected) return;

    // Restore original RTCPeerConnection
    if (typeof window !== 'undefined' && this.originalPeerConnectionCtor) {
      window.RTCPeerConnection = this.originalPeerConnectionCtor;
    }

    // Cleanup existing connections
    this.cleanupAudioNodes();
    this.peerConnections.clear();

    this.connected = false;
    console.log('🎙️ ElevenLabs WebRTC audio hook disconnected');
  }

  get isConnected(): boolean {
    return this.connected;
  }

  private interceptWebRTC(): void {
    const self = this;

    // Create a proxy for RTCPeerConnection
    if (typeof window === 'undefined' || !('RTCPeerConnection' in window)) return;

    window.RTCPeerConnection = class extends RTCPeerConnection {
      constructor(configuration?: RTCConfiguration) {
        super(configuration);
        
        // Track this connection
        self.peerConnections.add(this);

        // Hook into ontrack events to catch audio streams
        const originalOnTrack = this.ontrack;
        this.ontrack = (event: RTCTrackEvent) => {
          console.log('🎵 WebRTC track received:', event.track.kind);
          
          // If this is an audio track, route it through our bus
          if (event.track.kind === 'audio' && event.streams.length > 0) {
            self.routeAudioThroughBus(event.streams[0]);
          }

          // Call original handler if it exists
          if (originalOnTrack) {
            originalOnTrack.call(this, event);
          }
        };

        // Also hook addEventListener for 'track' events
        const originalAddEventListener = this.addEventListener;
        this.addEventListener = function(
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions
        ): void {
          if (type === 'track') {
            const wrappedListener: EventListener = (event: Event) => {
              const rtcEvent = event as unknown as RTCTrackEvent;
              if (
                rtcEvent &&
                (rtcEvent as any).track &&
                (rtcEvent as any).streams &&
                rtcEvent.track.kind === 'audio' &&
                rtcEvent.streams.length > 0
              ) {
                self.routeAudioThroughBus(rtcEvent.streams[0]);
              }
              if (typeof listener === 'function') {
                (listener as EventListener)(event);
              } else if ((listener as EventListenerObject).handleEvent) {
                (listener as EventListenerObject).handleEvent(event);
              }
            };
            originalAddEventListener.call(this, type, wrappedListener as EventListener, options);
          } else {
            originalAddEventListener.call(this, type, listener, options);
          }
        };
      }
    } as any;

    // Copy static methods and set prototype so static helpers like generateCertificate remain available
    if (this.originalPeerConnectionCtor) {
      Object.setPrototypeOf(window.RTCPeerConnection, this.originalPeerConnectionCtor);
      Object.assign(window.RTCPeerConnection, this.originalPeerConnectionCtor);
    }
  }

  private routeAudioThroughBus(stream: MediaStream): void {
    try {
      this.cleanupAudioNodes(); // Clean up any existing routing

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) return;

      console.log('🎵 Routing ElevenLabs audio through voiceBus');

      // Create a new MediaStream with just audio
      this.mediaStream = new MediaStream(audioTracks);
      
      // Create source node and connect to our voice bus
      this.sourceNode = this.buses.audioContext.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.buses.voiceBus);

      console.log('✅ ElevenLabs audio successfully routed through voiceBus');

    } catch (error) {
      console.error('❌ Failed to route ElevenLabs audio:', error);
    }
  }

  private cleanupAudioNodes(): void {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      this.mediaStream = null;
    } catch (error) {
      console.warn('Error cleaning up audio nodes:', error);
    }
  }
}

/**
 * Alternative approach: Use ElevenLabs WebSocket API for more control
 * This gives us direct access to audio data but requires more implementation
 */
export class ElevenLabsWebSocketIntegration implements ElevenLabsIntegration {
  private buses: AudioBuses;
  private websocket: WebSocket | null = null;
  private connected = false;
  
  constructor(buses: AudioBuses) {
    this.buses = buses;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // This would need the WebSocket URL from your existing API
    // Implementation would be similar to your archived WebSocket code
    console.log('🌐 WebSocket integration would be implemented here');
    
    // For now, we'll focus on the WebRTC approach
    throw new Error('WebSocket integration not yet implemented - use WebRTC approach');
  }

  disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.connected = false;
  }

  get isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Simple approach: Try to hook into existing audio elements
 * This is a fallback if WebRTC interception doesn't work
 */
export class ElevenLabsAudioElementHook implements ElevenLabsIntegration {
  private buses: AudioBuses;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private observer: MutationObserver | null = null;
  private connected = false;

  constructor(buses: AudioBuses) {
    this.buses = buses;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    // Look for audio elements that might be created by ElevenLabs
    this.findAndHookAudioElements();
    this.observeForNewAudioElements();
    
    this.connected = true;
    console.log('🎵 Audio element hook connected');
  }

  disconnect(): void {
    if (!this.connected) return;

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.cleanupAudioNodes();
    this.connected = false;
    console.log('🎵 Audio element hook disconnected');
  }

  get isConnected(): boolean {
    return this.connected;
  }

  private findAndHookAudioElements(): void {
    const audioElements = document.querySelectorAll('audio');
    for (const audio of audioElements) {
      this.hookAudioElement(audio);
    }
  }

  private observeForNewAudioElements(): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.tagName === 'AUDIO') {
              this.hookAudioElement(element as HTMLAudioElement);
            }
            // Also check descendants
            const audioElements = element.querySelectorAll('audio');
            for (const audio of audioElements) {
              this.hookAudioElement(audio);
            }
          }
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private hookAudioElement(audio: HTMLAudioElement): void {
    // Skip if already hooked or not relevant
    if (audio.dataset.ambientHooked === 'true') return;

    try {
      this.cleanupAudioNodes(); // Only hook one at a time

      this.audioElement = audio;
      this.sourceNode = this.buses.audioContext.createMediaElementSource(audio);
      this.sourceNode.connect(this.buses.voiceBus);

      // Also connect back to destination so ElevenLabs still plays normally
      this.sourceNode.connect(this.buses.audioContext.destination);

      audio.dataset.ambientHooked = 'true';
      console.log('✅ Hooked audio element to voiceBus');

    } catch (error) {
      console.warn('Failed to hook audio element:', error);
    }
  }

  private cleanupAudioNodes(): void {
    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.audioElement) {
        this.audioElement.dataset.ambientHooked = 'false';
        this.audioElement = null;
      }
    } catch (error) {
      console.warn('Error cleaning up audio nodes:', error);
    }
  }
}

/**
 * Create the most appropriate integration based on the environment
 */
export function createElevenLabsIntegration(buses: AudioBuses): ElevenLabsIntegration {
  // For now, start with WebRTC approach as it's most likely to work
  // We can fallback to other approaches if needed
  return new ElevenLabsWebRTCAudioHook(buses);
}
