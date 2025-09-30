// React hook for managing the complete ambient audio system
// Provides a simple interface to add ambient sound effects to conversations

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createAudioBuses,
  preloadMultipleAssets,
  playLoop,
  playOneShot,
  AudioDucker,
  SmartSfxScheduler,
  createDoorToDoorScheduler,
  createElevenLabsIntegration,
  type AudioBuses,
  type ElevenLabsIntegration,
  type PlaybackControl
} from '@/lib/ambient-audio';

export interface AmbientAudioConfig {
  // Asset URLs - these should be hosted in your public folder
  assets: {
    ambience?: Record<string, string>;  // Background loops
    sfx?: Record<string, string>;       // One-shot effects
  };
  
  // Audio levels
  levels: {
    ambience: number;     // 0-1, usually quite low (0.1-0.2)
    sfx: number;          // 0-1, moderate (0.3-0.5)
    voice: number;        // 0-1, usually full (1.0)
  };
  
  // SFX scheduling
  scheduling: {
    enabled: boolean;
    assetKeys: string[];  // Which SFX assets to randomly play
    baseInterval: [number, number]; // Min/max seconds between attempts
  };
  
  // Integration settings
  integration: {
    enableElevenLabs: boolean;
    autoConnect: boolean;
  };
}

export interface AmbientAudioState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  buses: AudioBuses | null;
  activeAmbience: string | null;
  schedulerActive: boolean;
  duckingActive: boolean;
  integrationConnected: boolean;
}

export interface AmbientAudioControls {
  // System control
  initialize: () => Promise<void>;
  cleanup: () => void;
  
  // Ambience control
  startAmbience: (key: string) => Promise<void>;
  stopAmbience: () => void;
  
  // Scheduler control
  startScheduler: () => void;
  stopScheduler: () => void;
  
  // Manual SFX
  playSfx: (key: string, volume?: number) => Promise<void>;
  
  // Integration control
  connectIntegration: () => Promise<void>;
  disconnectIntegration: () => void;
  
  // Volume control
  setAmbienceVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
  
  // Debug
  getDebugInfo: () => any;
}

export function useAmbientAudio(config: AmbientAudioConfig): [AmbientAudioState, AmbientAudioControls] {
  const [state, setState] = useState<AmbientAudioState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    buses: null,
    activeAmbience: null,
    schedulerActive: false,
    duckingActive: false,
    integrationConnected: false
  });

  // Refs for persistent objects
  const busesRef = useRef<AudioBuses | null>(null);
  const duckerRef = useRef<AudioDucker | null>(null);
  const schedulerRef = useRef<SmartSfxScheduler | null>(null);
  const integrationRef = useRef<ElevenLabsIntegration | null>(null);
  const ambienceControlRef = useRef<PlaybackControl | null>(null);
  const initializingRef = useRef(false);

  // Initialize the audio system
  const initialize = useCallback(async () => {
    if (initializingRef.current || state.isInitialized) return;
    
    initializingRef.current = true;
    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      console.log('🎵 Initializing ambient audio system...');

      // Create audio buses
      const buses = await createAudioBuses();
      busesRef.current = buses;

      // Set initial bus volumes
      buses.voiceBus.gain.value = config.levels.voice;
      buses.sfxBus.gain.value = config.levels.sfx;
      buses.ambBus.gain.value = config.levels.ambience;

      // Preload all assets
      const allAssets = {
        ...config.assets.ambience,
        ...config.assets.sfx
      };
      
      if (Object.keys(allAssets).length > 0) {
        await preloadMultipleAssets(allAssets);
      }

      // Create ducking system
      const ducker = new AudioDucker(buses, {
        duckVolume: 0.3,
        attackTime: 100,
        releaseTime: 400
      });
      duckerRef.current = ducker;

      // Create SFX scheduler if enabled
      if (config.scheduling.enabled && config.scheduling.assetKeys.length > 0) {
        const scheduler = createDoorToDoorScheduler(buses, config.scheduling.assetKeys);
        scheduler.updateOptions({
          baseIntervalMs: [
            config.scheduling.baseInterval[0] * 1000,
            config.scheduling.baseInterval[1] * 1000
          ]
        });
        schedulerRef.current = scheduler;
      }

      // Create ElevenLabs integration
      if (config.integration.enableElevenLabs) {
        const integration = createElevenLabsIntegration(buses);
        integrationRef.current = integration;
        
        if (config.integration.autoConnect) {
          await integration.connect();
          setState(s => ({ ...s, integrationConnected: integration.isConnected }));
        }
      }

      setState(s => ({ 
        ...s, 
        isInitialized: true, 
        isLoading: false,
        buses,
        error: null
      }));

      console.log('✅ Ambient audio system initialized');

    } catch (error) {
      console.error('❌ Failed to initialize ambient audio:', error);
      setState(s => ({ 
        ...s, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
    } finally {
      initializingRef.current = false;
    }
  }, [config, state.isInitialized]);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up ambient audio system...');

    // Stop ambience
    if (ambienceControlRef.current) {
      ambienceControlRef.current.stop();
      ambienceControlRef.current = null;
    }

    // Stop and cleanup systems
    schedulerRef.current?.stop();
    duckerRef.current?.stop();
    integrationRef.current?.disconnect();
    busesRef.current?.cleanup();

    // Clear refs
    schedulerRef.current = null;
    duckerRef.current = null;
    integrationRef.current = null;
    busesRef.current = null;

    setState({
      isInitialized: false,
      isLoading: false,
      error: null,
      buses: null,
      activeAmbience: null,
      schedulerActive: false,
      duckingActive: false,
      integrationConnected: false
    });
  }, []);

  // Ambience controls
  const startAmbience = useCallback(async (key: string) => {
    const buses = busesRef.current;
    if (!buses || !state.isInitialized) return;

    // Stop current ambience
    if (ambienceControlRef.current) {
      ambienceControlRef.current.stop();
    }

    // Start new ambience
    const control = await playLoop(key, buses.ambBus);
    if (control) {
      ambienceControlRef.current = control;
      setState(s => ({ ...s, activeAmbience: key }));
      console.log(`🎵 Started ambience: ${key}`);
    }
  }, [state.isInitialized]);

  const stopAmbience = useCallback(() => {
    if (ambienceControlRef.current) {
      ambienceControlRef.current.stop();
      ambienceControlRef.current = null;
      setState(s => ({ ...s, activeAmbience: null }));
      console.log('🔇 Stopped ambience');
    }
  }, []);

  // Scheduler controls
  const startScheduler = useCallback(() => {
    if (schedulerRef.current && !state.schedulerActive) {
      schedulerRef.current.start();
      duckerRef.current?.start(); // Start ducking with scheduler
      setState(s => ({ ...s, schedulerActive: true, duckingActive: true }));
    }
  }, [state.schedulerActive]);

  const stopScheduler = useCallback(() => {
    if (schedulerRef.current && state.schedulerActive) {
      schedulerRef.current.stop();
      duckerRef.current?.stop();
      setState(s => ({ ...s, schedulerActive: false, duckingActive: false }));
    }
  }, [state.schedulerActive]);

  // Manual SFX
  const playSfx = useCallback(async (key: string, volume: number = 1.0) => {
    const buses = busesRef.current;
    if (!buses || !state.isInitialized) return;

    const control = await playOneShot(key, buses.sfxBus, { volume });
    if (control) {
      console.log(`🎵 Played SFX: ${key}`);
    }
  }, [state.isInitialized]);

  // Integration controls
  const connectIntegration = useCallback(async () => {
    if (integrationRef.current && !state.integrationConnected) {
      await integrationRef.current.connect();
      setState(s => ({ ...s, integrationConnected: integrationRef.current?.isConnected || false }));
    }
  }, [state.integrationConnected]);

  const disconnectIntegration = useCallback(() => {
    if (integrationRef.current && state.integrationConnected) {
      integrationRef.current.disconnect();
      setState(s => ({ ...s, integrationConnected: false }));
    }
  }, [state.integrationConnected]);

  // Volume controls
  const setAmbienceVolume = useCallback((volume: number) => {
    if (busesRef.current) {
      busesRef.current.ambBus.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const setSfxVolume = useCallback((volume: number) => {
    if (busesRef.current) {
      busesRef.current.sfxBus.gain.value = Math.max(0, Math.min(1, volume));
    }
  }, []);

  // Debug info
  const getDebugInfo = useCallback(() => {
    return {
      state,
      scheduler: schedulerRef.current?.getDebugInfo(),
      ducker: duckerRef.current?.getDebugInfo(),
      integration: {
        connected: integrationRef.current?.isConnected || false
      }
    };
  }, [state]);

  // Auto-initialize on mount if buses are available
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading && !initializingRef.current) {
      initialize();
    }
  }, [initialize, state.isInitialized, state.isLoading]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const controls: AmbientAudioControls = {
    initialize,
    cleanup,
    startAmbience,
    stopAmbience,
    startScheduler,
    stopScheduler,
    playSfx,
    connectIntegration,
    disconnectIntegration,
    setAmbienceVolume,
    setSfxVolume,
    getDebugInfo
  };

  return [state, controls];
}

// Preset configurations for common scenarios
export const presetConfigs = {
  doorToDoor: (ambienceUrl: string, sfxUrls: string[]): AmbientAudioConfig => ({
    assets: {
      ambience: { suburban: ambienceUrl },
      sfx: sfxUrls.reduce((acc, url, i) => ({ ...acc, [`sfx_${i}`]: url }), {})
    },
    levels: {
      ambience: 0.15,
      sfx: 0.4,
      voice: 1.0
    },
    scheduling: {
      enabled: true,
      assetKeys: sfxUrls.map((_, i) => `sfx_${i}`),
      baseInterval: [15, 45] // 15-45 seconds
    },
    integration: {
      enableElevenLabs: true,
      autoConnect: true
    }
  })
};
