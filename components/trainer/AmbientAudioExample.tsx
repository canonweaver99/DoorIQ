'use client';

// Example component showing how to integrate ambient audio with Austin conversations
import { useEffect } from 'react';
import { useAmbientAudio, presetConfigs } from '@/hooks/useAmbientAudio';

export default function AmbientAudioExample() {
  // Configure ambient audio for door-to-door scenario
  const [ambientState, ambientControls] = useAmbientAudio({
    assets: {
      ambience: {
        suburban: '/sounds/suburban-ambience.mp3', // You'll need to add this file
      },
      sfx: {
        dogBark1: '/sounds/dog-bark-distant-1.mp3', // You'll need to add these files
        dogBark2: '/sounds/dog-bark-distant-2.mp3',
        dogBark3: '/sounds/dog-bark-distant-3.mp3',
        lawnMower: '/sounds/lawn-mower-distant.mp3',
        carPassing: '/sounds/car-passing.mp3'
      }
    },
    levels: {
      ambience: 0.12,  // Very subtle background
      sfx: 0.35,       // Moderate sound effects  
      voice: 1.0       // Full volume for Austin's voice
    },
    scheduling: {
      enabled: true,
      assetKeys: ['dogBark1', 'dogBark2', 'dogBark3', 'lawnMower', 'carPassing'],
      baseInterval: [18, 50] // 18-50 seconds between random effects
    },
    integration: {
      enableElevenLabs: true,
      autoConnect: true
    }
  });

  // Auto-start ambience when system is ready
  useEffect(() => {
    if (ambientState.isInitialized && !ambientState.activeAmbience) {
      ambientControls.startAmbience('suburban');
      ambientControls.startScheduler();
    }
  }, [ambientState.isInitialized, ambientState.activeAmbience, ambientControls]);

  // Connect to ElevenLabs when Austin conversation starts
  useEffect(() => {
    if (ambientState.isInitialized && !ambientState.integrationConnected) {
      ambientControls.connectIntegration();
    }
  }, [ambientState.isInitialized, ambientState.integrationConnected, ambientControls]);

  if (!ambientState.isInitialized) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-blue-700">
            {ambientState.isLoading ? 'Loading ambient audio...' : 'Initializing audio system...'}
          </span>
        </div>
      </div>
    );
  }

  if (ambientState.error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">
          ⚠️ Ambient audio error: {ambientState.error}
        </p>
        <button 
          onClick={ambientControls.initialize}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">🎵 Ambient Audio Active</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-green-600">Ambience:</span>
            <span className="ml-2 font-mono">
              {ambientState.activeAmbience || 'None'}
            </span>
          </div>
          <div>
            <span className="text-green-600">SFX Scheduler:</span>
            <span className="ml-2">
              {ambientState.schedulerActive ? '✅ Active' : '⏸️ Paused'}
            </span>
          </div>
          <div>
            <span className="text-green-600">Voice Ducking:</span>
            <span className="ml-2">
              {ambientState.duckingActive ? '✅ Active' : '⏸️ Disabled'}
            </span>
          </div>
          <div>
            <span className="text-green-600">ElevenLabs:</span>
            <span className="ml-2">
              {ambientState.integrationConnected ? '🔗 Connected' : '🔌 Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Manual Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Manual Controls</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => ambientControls.startAmbience('suburban')}
            disabled={ambientState.activeAmbience === 'suburban'}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            Start Ambience
          </button>
          <button
            onClick={ambientControls.stopAmbience}
            disabled={!ambientState.activeAmbience}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm disabled:bg-gray-300"
          >
            Stop Ambience
          </button>
          <button
            onClick={ambientState.schedulerActive ? ambientControls.stopScheduler : ambientControls.startScheduler}
            className="px-3 py-1 bg-purple-500 text-white rounded text-sm"
          >
            {ambientState.schedulerActive ? 'Stop' : 'Start'} Random SFX
          </button>
          <button
            onClick={() => ambientControls.playSfx('dogBark1')}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Test Dog Bark
          </button>
        </div>
      </div>

      {/* Volume Controls */}
      <div className="p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium mb-3">Volume Controls</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="w-20 text-sm">Ambience:</label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              defaultValue="0.12"
              onChange={(e) => ambientControls.setAmbienceVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-20 text-sm">SFX:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              defaultValue="0.35"
              onChange={(e) => ambientControls.setSfxVolume(parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <details className="p-4 bg-gray-50 rounded-lg">
        <summary className="font-medium cursor-pointer">Debug Information</summary>
        <pre className="mt-2 text-xs overflow-auto bg-white p-2 rounded">
          {JSON.stringify(ambientControls.getDebugInfo(), null, 2)}
        </pre>
      </details>
    </div>
  );
}
