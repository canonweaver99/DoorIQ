'use client';
import { useEffect, useRef, useState } from 'react';

interface AgentData {
  name: string;
  avatar_url: string | null;
  avatar_initials: string;
  persona_description: string;
}

interface Grading {
  total: number;
  breakdown: {
    safety: number;
    value: number;
    timing: number;
    pricing: number;
  };
  strengths: string[];
  improvements: string[];
  grade: string;
}

export default function Trainer() {
  const [sessionId, setSessionId] = useState<string>('');
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [turns, setTurns] = useState<Array<{speaker:string,text:string}>>([]);
  
  // Voice states
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  // Session states
  const [sessionEnded, setSessionEnded] = useState(false);
  const [grading, setGrading] = useState<Grading | null>(null);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: start listening when safe
  const safeStartListening = async () => {
    if (!isPlaying && !isProcessing && !isRecording && !sessionEnded) {
      await startRecording();
    }
  };

  useEffect(() => {
    // Initialize session and agent data
    async function initialize() {
      // Create session
      const sessionRes = await fetch('/api/session', { method: 'POST' });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.sessionId);

      // Fetch agent data
      const agentRes = await fetch('/api/agent');
      const agentData = await agentRes.json();
      setAgent(agentData);

      // Initialize speech recognition for live transcription
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setCurrentTranscript(transcript);
          
          // Reset silence timer
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
          
          // Set new silence timer (2 seconds of silence = stop recording)
          silenceTimerRef.current = setTimeout(() => {
            if (isRecording) {
              stopRecording();
            }
          }, 2000);
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };
      }
    }
    
    initialize().then(() => {
      // Request mic immediately for open-mic experience
      safeStartListening();
    });
  }, []);

  async function startRecording() {
    if (isPlaying || isProcessing || isRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setCurrentTranscript('');
      
      // Start live transcription
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
    } catch (error) {
      console.error('Recording error:', error);
      alert('Microphone access denied. Please enable microphone permissions and try again.');
    }
  }

  async function stopRecording() {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    setIsRecording(false);
    mediaRecorderRef.current.stop();
    
    // Stop live transcription
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Clear silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  async function processAudio(audioBlob: Blob) {
    if (!sessionId) return;
    
    setIsProcessing(true);
    
    try {
      // Convert to WAV for better Whisper compatibility
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      // Transcribe with Whisper
      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const transcribeData = await transcribeRes.json();
      const userText = transcribeData.text?.trim() || currentTranscript.trim();
      
      if (!userText) {
        setIsProcessing(false);
        return;
      }
      
      // Add user message to UI
      setTurns(prev => [...prev, { speaker: 'rep', text: userText }]);
      setCurrentTranscript('');
      
      // Get Amanda's response
      const replyRes = await fetch('/api/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, userText })
      });
      
      const replyData = await replyRes.json();
      const replyText = replyData.replyText || 'I see.';
      
      // Add Amanda's response to UI
      setTurns(prev => [...prev, { speaker: 'homeowner', text: replyText }]);
      
      // Speak Amanda's response
      await speakText(replyText);
      
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
      // Resume listening after processing
      safeStartListening();
    }
  }

  async function speakText(text: string) {
    // Pause listening while Amanda speaks
    if (isRecording) {
      try { await stopRecording(); } catch {}
    }
    setIsPlaying(true);
    
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          
          return new Promise<void>((resolve) => {
            if (audioRef.current) {
              audioRef.current.onended = () => {
                URL.revokeObjectURL(audioUrl);
                setIsPlaying(false);
                // Resume listening shortly after Amanda finishes
                setTimeout(() => { safeStartListening(); }, 250);
                resolve();
              };
              audioRef.current.play();
            }
          });
        }
      }
    } catch (error) {
      console.error('Speech error:', error);
      setIsPlaying(false);
    }
  }

  async function endSession() {
    if (!sessionId || sessionEnded) return;
    
    setIsProcessing(true);
    
    try {
      // Stop any ongoing capture
      if (isRecording) {
        await stopRecording();
      }
      const res = await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await res.json();
      setGrading(data.grading);
      setSessionEnded(true);
      
    } catch (error) {
      console.error('End session error:', error);
    } finally {
      setIsProcessing(false);
    }
  }

  function resetSession() {
    // Reload the page to start fresh
    window.location.reload();
  }

  if (sessionEnded && grading) {
    // Feedback Screen
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">Session Complete! 🎉</h1>
            <p className="text-gray-400">Here&apos;s how you performed with Amanda</p>
          </div>

          {/* Overall Grade */}
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-8 text-center border border-purple-500/30">
            <div className="text-6xl font-bold text-white mb-4">{grading.grade}</div>
            <div className="text-2xl text-purple-200 mb-2">{grading.total}/20 Points</div>
            <div className="text-gray-400">{Math.round((grading.total / 20) * 100)}% Score</div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(grading.breakdown).map(([category, score]) => (
              <div key={category} className="bg-white/10 backdrop-blur-lg rounded-lg p-4 text-center border border-white/20">
                <div className="text-2xl font-bold text-purple-400 mb-2">{score}/5</div>
                <div className="text-sm text-gray-300 capitalize">{category}</div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                ✅ Strengths
              </h3>
              <ul className="space-y-2">
                {grading.strengths.map((strength, i) => (
                  <li key={i} className="text-green-100 text-sm flex items-start gap-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-amber-400 mb-4 flex items-center">
                🎯 Areas to Improve
              </h3>
              <ul className="space-y-2">
                {grading.improvements.map((improvement, i) => (
                  <li key={i} className="text-amber-100 text-sm flex items-start gap-2">
                    <span className="text-amber-400 mt-1">•</span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center gap-4">
            <button
              onClick={resetSession}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              Practice Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Trainer Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">DoorIQ Voice Trainer</h1>
          <p className="text-gray-400">Have a real conversation with {agent?.name || 'Amanda Rodriguez'}</p>
          {sessionId && <p className="text-xs text-gray-500 mt-2">Session: {sessionId}</p>}
        </div>

        {/* Amanda's Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulsing ring effect */}
            <div className={`absolute inset-0 rounded-full ${
              isPlaying ? 'animate-pulse bg-purple-500/30' : 
              isRecording ? 'animate-pulse bg-green-500/30' :
              'bg-purple-500/10'
            } blur-xl`}></div>
            
            {/* Main avatar circle */}
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-2xl">
              {agent?.avatar_url ? (
                <img 
                  src={agent.avatar_url} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {agent?.avatar_initials || 'AR'}
                  </span>
                </div>
              )}
              
              {/* Status overlays */}
              {isPlaying && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
              
              {isRecording && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
                </div>
              )}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Agent info */}
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold text-white">{agent?.name || 'Amanda Rodriguez'}</h3>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">{agent?.persona_description}</p>
            </div>
          </div>
        </div>

        {/* Live Transcription */}
        {currentTranscript && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
            <p className="text-blue-200 text-sm">You&apos;re saying: &quot;{currentTranscript}&quot;</p>
          </div>
        )}

        {/* Conversation History */}
        {turns.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold mb-4">Conversation</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {turns.map((turn, i) => (
                <div key={i} className={`flex ${turn.speaker === 'rep' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    turn.speaker === 'rep' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-purple-600 text-white'
                  }`}>
                    <div className="text-xs opacity-75 mb-1">
                      {turn.speaker === 'rep' ? 'You' : 'Amanda'}
                    </div>
                    <div className="text-sm">{turn.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center">
          {turns.length > 0 && (
            <button
              onClick={endSession}
              disabled={isProcessing || isPlaying}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-8 py-4 rounded-xl font-semibold transition-colors"
            >
              End & Grade
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm">
          {turns.length === 0 ? (
            <p>Microphone is live. Introduce yourself to Amanda!<br/>
            Try: &quot;Hi Amanda, I&apos;m from SafeGuard Pest Control...&quot;</p>
          ) : (
            <p>We&apos;re always listening. Pause for ~2s to let Amanda reply, or end the session to get your grade.</p>
          )}
        </div>

        <audio ref={audioRef} />
      </div>
    </div>
  );
}