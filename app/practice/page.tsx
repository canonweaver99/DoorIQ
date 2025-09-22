'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Target, CheckCircle, Shield, DollarSign, Calendar, Mic, MicOff, Volume2, Play, Pause, RotateCcw, Home } from 'lucide-react';
import { getRandomPersona, HomeownerPersona } from '@/lib/personas';
import dynamic from "next/dynamic";

const ElevenLabsConvai = dynamic(() => import("@/app/components/ElevenLabsConvai"), {
  ssr: false,
});

interface Objective {
  id: string;
  name: string;
  color: string;
  icon: React.ReactElement;
  completed: boolean;
}

interface Message {
  id: string;
  role: 'rep' | 'prospect';
  text: string;
  timestamp: Date;
  audioUrl?: string;
}

interface ConversationAnalysis {
  timestamps: {
    time: string;
    suggestion: string;
    category: 'missed_opportunity' | 'improvement' | 'good';
  }[];
}

export default function PracticePage() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'briefing' | 'conversation' | 'feedback'>('home');
  const [currentPersona, setCurrentPersona] = useState<HomeownerPersona | null>(null);
  const [attemptId, setAttemptId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [doorClicked, setDoorClicked] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: '1', name: 'Qualify the Customer', color: 'indigo', icon: <Target className="w-5 h-5" />, completed: false },
    { id: '2', name: 'Present Solution', color: 'green', icon: <Shield className="w-5 h-5" />, completed: false },
    { id: '3', name: 'Handle Objections', color: 'amber', icon: <DollarSign className="w-5 h-5" />, completed: false },
    { id: '4', name: 'Get Commitment', color: 'blue', icon: <Calendar className="w-5 h-5" />, completed: false }
  ]);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [currentPlaybackIndex, setCurrentPlaybackIndex] = useState(-1);
  const [conversationAnalysis, setConversationAnalysis] = useState<ConversationAnalysis | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [isPaused, setIsPaused] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // ElevenLabs Convai agent integration
  const ELEVEN_AGENT_ID = process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID || 'agent_7001k5jqfjmtejvs77jvhjf254tz';

  const resetSimulation = () => {
    setCurrentScreen('home');
    setCurrentPersona(null);
    setAttemptId('');
    setMessages([]);
    setEvaluation(null);
    setTurnCount(0);
    setDoorClicked(false);
    setLiveTranscription('');
    setIsPaused(false);
    setObjectives(objectives.map(obj => ({ ...obj, completed: false })));
    setIsPlayingRecording(false);
    setCurrentPlaybackIndex(-1);
    setConversationAnalysis(null);
    
    // Clean up streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const playDoorKnockSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const createKnock = (startTime: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(100, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, startTime + 0.1);
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.1);
      };
      
      const now = audioContext.currentTime;
      createKnock(now);
      createKnock(now + 0.15);
      createKnock(now + 0.3);
      
    } catch (error) {
      console.log('Could not play door knock sound:', error);
    }
  };

  const handleDoorClick = () => {
    playDoorKnockSound();
    setDoorClicked(true);
    const persona = getRandomPersona();
    setCurrentPersona(persona);
    
    setTimeout(() => {
      setCurrentScreen('briefing');
    }, 800);
  };

  const startConversation = async () => {
    setCurrentScreen('conversation');
  };

  const pauseConversation = () => {
    setIsPaused(!isPaused);
  };

  const endConversation = async () => {
    try {
      // Generate basic feedback
      const analysis = {
        timestamps: [
          { time: '0:30', suggestion: 'Good opening rapport building', category: 'good' as const },
          { time: '1:15', suggestion: 'Could have asked more discovery questions', category: 'improvement' as const },
          { time: '2:45', suggestion: 'Missed opportunity to address safety concerns', category: 'missed_opportunity' as const }
        ]
      };
      setConversationAnalysis(analysis);
      
      setCurrentScreen('feedback');
    } catch (error) {
      console.error('Error ending conversation:', error);
      setCurrentScreen('feedback');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {currentScreen === 'home' && (
        /* Home Screen */
        <div className="min-h-screen flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold text-white mb-4">DoorIQ</h1>
            <p className="text-xl text-gray-400 mb-12">Click the door to start practicing</p>
            
            <motion.div
              className="relative cursor-pointer"
              onClick={handleDoorClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ perspective: '1000px' }}
            >
              <motion.div
                className="door-panel relative"
                animate={{ rotateY: doorClicked ? -15 : 0 }}
                transition={{ duration: 0.6 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="w-64 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-3 shadow-2xl">
                  <div className="h-full bg-gradient-to-br from-amber-800 to-amber-900 rounded relative">
                    <div className="grid grid-rows-2 gap-2 p-4 h-full">
                      <div className="bg-amber-700 bg-opacity-50 rounded shadow-inner"></div>
                      <div className="bg-amber-700 bg-opacity-50 rounded shadow-inner"></div>
                    </div>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg"></div>
                    </div>
                    {!doorClicked && (
                      <div className="absolute inset-x-0 bottom-4 text-center">
                        <p className="text-white text-sm bg-black bg-opacity-30 px-3 py-1 rounded inline-block">
                          <Mic className="w-4 h-4 inline mr-1" /> Click to knock
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {currentScreen === 'briefing' && currentPersona && (
        /* Mission Briefing Screen */
        <div className="min-h-screen flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-6">Mission Briefing</h2>
              
              <div className="bg-black/20 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Target Customer</h3>
                <div className="text-left space-y-3">
                  <p className="text-gray-300"><span className="text-white font-medium">Name:</span> {currentPersona.name}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Age:</span> {currentPersona.age}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Occupation:</span> {currentPersona.occupation}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Personality:</span> {currentPersona.personality}</p>
                  <p className="text-gray-300"><span className="text-white font-medium">Temperature:</span> {currentPersona.temperature}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-8">
                {objectives.map((obj) => (
                  <div key={obj.id} className="text-center p-3 bg-white/5 rounded-lg">
                    <div className="text-gray-400 mb-1">{obj.icon}</div>
                    <p className="text-xs text-gray-300">{obj.name}</p>
                  </div>
                ))}
              </div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={startConversation}
                className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Start Conversation
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {currentScreen === 'conversation' && currentPersona && (
        /* Simplified Conversation Screen - Only Amanda Profile */
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="max-w-4xl w-full">
            {/* Centered Amanda Profile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 text-center"
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Live Conversation</h1>
                <p className="text-gray-400">Speaking with {currentPersona.name}</p>
              </div>

              {/* Amanda's Profile - Centered and Large */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-8 mb-8 border border-blue-500/30">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">
                    {currentPersona.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">{currentPersona.name}</h2>
                <p className="text-lg text-blue-200 mb-4">{currentPersona.occupation}</p>
                
                <div className="grid grid-cols-2 gap-4 text-left max-w-md mx-auto">
                  <div>
                    <p className="text-sm text-gray-400">Age</p>
                    <p className="text-white font-medium">{currentPersona.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Family</p>
                    <p className="text-white font-medium">{currentPersona.backgroundInfo.familySize} people</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Temperature</p>
                    <p className="text-white font-medium capitalize">{currentPersona.temperature}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Years in Home</p>
                    <p className="text-white font-medium">{currentPersona.backgroundInfo.yearsInHome} years</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-black/20 rounded-lg">
                  <p className="text-sm text-gray-300 italic">&quot;{currentPersona.personality}&quot;</p>
                </div>
              </div>

              {/* ElevenLabs Agent Widget */}
              <div className="mb-8">
                <ElevenLabsConvai 
                  agentId={ELEVEN_AGENT_ID} 
                  mode="embedded"
                  theme="dark"
                />
              </div>

              {/* Simple Controls */}
              <div className="flex justify-center gap-6">
                <motion.button
                  onClick={pauseConversation}
                  className={`flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all ${
                    isPaused 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-5 h-5" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-5 h-5" />
                      Pause
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={endConversation}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CheckCircle className="w-5 h-5" />
                  End & Get Feedback
                </motion.button>
              </div>

              {/* Status */}
              <div className="mt-6">
                <p className="text-center text-gray-400 text-sm">
                  {isPaused ? 'Conversation paused' : 'Conversation active'}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {currentScreen === 'feedback' && (
        /* Feedback Screen */
        <div className="min-h-screen p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-5xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Performance Review</h2>
              
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-400">
                    {objectives.filter(obj => obj.completed).length}/{objectives.length}
                  </div>
                  <div className="text-sm text-gray-400">Objectives Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">5:32</div>
                  <div className="text-sm text-gray-400">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">8</div>
                  <div className="text-sm text-gray-400">Your Responses</div>
                </div>
              </div>

              {/* Score and Grade */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 mb-8">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">85%</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-8 h-8 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-600'
                      }`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <div className="text-2xl font-bold text-white">Grade: B+</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={startConversation}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <RotateCcw className="w-5 h-5" />
                  Retry Same Customer
                </button>
                <button
                  onClick={resetSimulation}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  <Home className="w-5 h-5" />
                  New Customer
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
