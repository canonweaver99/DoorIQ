'use client';

// Enhanced Austin conversation component with intelligent ambient audio
import { useConversation } from '@elevenlabs/react';
import { useCallback, useEffect, useState } from 'react';
import { useAmbientAudio } from '@/hooks/useAmbientAudio';

interface AustinWithAmbientAudioProps {
  autostart?: boolean;
  showAudioControls?: boolean;
}

export default function AustinWithAmbientAudio({ 
  autostart = false,
  showAudioControls = true 
}: AustinWithAmbientAudioProps) {
  const [conversationStarted, setConversationStarted] = useState(false);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('ElevenLabs connected');
      setConversationStarted(true);
    },
    onDisconnect: () => {
      console.log('ElevenLabs disconnected');  
      setConversationStarted(false);
    },
    onMessage: (message) => console.log('ElevenLabs message:', message),
    onError: (error) => console.error('ElevenLabs error:', error),
  });

  // Ambient audio system - only loads assets that exist
  const [ambientState, ambientControls] = useAmbientAudio({
    assets: {
      ambience: {
        suburban: '/sounds/kids-background.mp3'
      },
      sfx: {
        // Using existing sounds + placeholders for future additions
        doorKnock: '/sounds/knock.mp3',
        doorOpen: '/sounds/door_open.mp3',
        dogBark1: '/sounds/dog-bark-distant-1.mp3',
        doorClose: '/sounds/door_close.mp3',
        doorSlam: '/sounds/door_slam.mp3'
        // Future files when you add them:
        // dogBark2: '/sounds/dog-bark-distant-2.mp3',
        // lawnMower: '/sounds/lawn-mower-distant.mp3'
      }
    },
    levels: {
      ambience: 0.12,
      sfx: 0.35,
      voice: 1.0
    },
    scheduling: {
      enabled: true,
      assetKeys: ['dogBark1'],
      baseInterval: [25, 45]
    },
    integration: {
      enableElevenLabs: true,
      autoConnect: conversationStarted // Connect when conversation starts
    }
  });

  const startConversation = useCallback(async () => {
    try {
      ;(window as any).__doorIQ_conversationActive = true
      // Play door knock sound first
      if (ambientState.isInitialized) {
        await ambientControls.playSfx('doorKnock', 0.3);
        
        // Brief delay then door open sound
        setTimeout(async () => {
          await ambientControls.playSfx('doorOpen', 0.2);
        }, 800);
      }

      await navigator.mediaDevices.getUserMedia({ audio: true });
      await conversation.startSession({
        agentId: 'agent_7001k5jqfjmtejvs77jvhjf254tz',
        connectionType: 'websocket', // Can also use 'webrtc'
        signedUrl: undefined,
        conversationToken: undefined,
      } as any);

      // Prompt Austin to deliver a ~30s monologue with ambient context
      // Optionally trigger a dog bark SFX if available and ambience is running
      setTimeout(() => { try { ambientControls.playSfx('dogBark1', 0.35) } catch {} }, 1200);
      setTimeout(() => {
        try {
          const prompt = `Please speak for about 30 seconds in a friendly, natural tone about what you were doing last weekend. 
Mention a quick apology if there's a dog barking in the background, then smoothly continue your story without stopping. 
Keep it casual and conversational, with light details (e.g., errands, family time, small home projects), and avoid asking questions.`;

          const anyConv: any = conversation as any;
          if (typeof anyConv?.sendUserMessage === 'function') {
            anyConv.sendUserMessage({ text: prompt });
          } else if (typeof anyConv?.sendMessage === 'function') {
            anyConv.sendMessage(prompt);
          } else if (typeof anyConv?.say === 'function') {
            anyConv.say(prompt);
          } else if (typeof anyConv?.send === 'function') {
            anyConv.send(prompt);
          } else {
            console.warn('No known send method on conversation to deliver monologue prompt');
          }
        } catch (e) {
          console.error('Failed to send monologue prompt:', e);
        }
      }, 2000);
      
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  }, [conversation, ambientState.isInitialized, ambientControls]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    ;(window as any).__doorIQ_conversationActive = false
  }, [conversation]);

  // Auto-start if requested
  useEffect(() => {
    if (autostart && conversation.status !== 'connected') {
      startConversation();
    }
  }, [autostart, conversation.status, startConversation]);

  // Start ambient systems when conversation is active
  useEffect(() => {
    if (conversationStarted && ambientState.isInitialized) {
      ;(window as any).__doorIQ_conversationActive = true
      // Start ambience
      ambientControls.startAmbience('suburban');
      
      // Start scheduler for occasional background barks
      ambientControls.startScheduler();
      
      console.log('🎵 Ambient audio ready for Austin conversation');
    } else if (!conversationStarted && ambientState.isInitialized) {
      ;(window as any).__doorIQ_conversationActive = false
      // Stop ambient systems when conversation ends
      ambientControls.stopAmbience();
      ambientControls.stopScheduler();
    }
  }, [conversationStarted, ambientState.isInitialized, ambientControls]);

  return (
    <div className="space-y-4">
      {/* Main Austin Controls */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex gap-2">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
          >
            {conversation.status === 'connecting' ? 'Connecting...' : 'Start Conversation with Austin'}
          </button>
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="px-4 py-2 bg-red-500 text-white rounded-lg disabled:bg-gray-300 hover:bg-red-600 transition-colors"
          >
            End Conversation
          </button>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Status: <span className="font-medium">{conversation.status}</span>
          </p>
          <p className="text-sm text-gray-600">
            Austin is <span className="font-medium">
              {conversation.isSpeaking ? 'speaking' : 'listening'}
            </span>
          </p>
        </div>
      </div>

      {/* Ambient Audio Status */}
      {ambientState.isInitialized && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600">🎵</span>
            <span className="font-medium text-green-800">Ambient Audio System Active</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
            <div>ElevenLabs Integration: {ambientState.integrationConnected ? '✅' : '⏸️'}</div>
            <div>Voice Ducking: {ambientState.duckingActive ? '✅' : '⏸️'}</div>
            <div>Background: {ambientState.activeAmbience || 'None'}</div>
            <div>Random SFX: {ambientState.schedulerActive ? '✅' : '⏸️'}</div>
          </div>
          <p className="text-xs text-green-600 mt-2">
            💡 Add suburban-ambience.mp3 and dog-bark SFX files to /public/sounds/ to enable full ambient features
          </p>
        </div>
      )}

      {/* Audio System Loading/Error States */}
      {ambientState.isLoading && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-700">Loading ambient audio system...</span>
          </div>
        </div>
      )}

      {ambientState.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-red-700">⚠️ Audio error: {ambientState.error}</span>
            <button 
              onClick={ambientControls.initialize}
              className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Optional Audio Controls */}
      {showAudioControls && ambientState.isInitialized && (
        <details className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <summary className="font-medium cursor-pointer">Audio Controls</summary>
          <div className="mt-3 space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => ambientControls.playSfx('doorKnock')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Test Door Knock
              </button>
              <button
                onClick={() => ambientControls.playSfx('doorOpen')}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Test Door Open
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <label className="w-16 text-sm">SFX Vol:</label>
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
        </details>
      )}
    </div>
  );
}
