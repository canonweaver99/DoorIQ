'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Target, CheckCircle, Shield, DollarSign, Calendar, Mic, MicOff, Volume2, Play, Pause, RotateCcw, Home } from 'lucide-react';
import { getRandomPersona, HomeownerPersona } from '@/lib/personas';

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

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const resetSimulation = () => {
    setCurrentScreen('home');
    setCurrentPersona(null);
    setAttemptId('');
    setMessages([]);
    setEvaluation(null);
    setDoorClicked(false);
    setObjectives(objectives.map(obj => ({ ...obj, completed: false })));
    setIsPlayingRecording(false);
    setCurrentPlaybackIndex(-1);
    setConversationAnalysis(null);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleDoorClick = () => {
    setDoorClicked(true);
    const persona = getRandomPersona();
    setCurrentPersona(persona);
    
    setTimeout(() => {
      setCurrentScreen('briefing');
    }, 800);
  };

  const playTextToSpeech = async (text: string, voiceId?: string) => {
    try {
      setIsCustomerSpeaking(true);
      
      const response = await fetch('/api/elevenlabs/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: voiceId || 'EXAVITQu4vr4xnSDxMaL'
        })
      });

      if (!response.ok) throw new Error('Failed to generate voice');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.addEventListener('ended', () => {
        setIsCustomerSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      });

      await audio.play();
    } catch (error) {
      console.error('Error playing text to speech:', error);
      setIsCustomerSpeaking(false);
    }
  };

  const formatTime = (date: Date): string => {
    const minutes = Math.floor((date.getTime() - messages[0]?.timestamp.getTime() || 0) / 60000);
    const seconds = Math.floor(((date.getTime() - messages[0]?.timestamp.getTime() || 0) % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      if (!streamRef.current) return;
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processUserAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start voice activity detection
      startVoiceActivityDetection();
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const startVoiceActivityDetection = () => {
    if (!streamRef.current) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(streamRef.current);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    let silenceStart = Date.now();
    const SILENCE_THRESHOLD = 30;
    const SILENCE_DURATION = 1500; // 1.5 seconds of silence

    javascriptNode.onaudioprocess = () => {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      const average = array.reduce((a, b) => a + b) / array.length;

      if (average < SILENCE_THRESHOLD) {
        if (Date.now() - silenceStart > SILENCE_DURATION) {
          stopRecording();
          javascriptNode.disconnect();
          microphone.disconnect();
          analyser.disconnect();
        }
      } else {
        silenceStart = Date.now();
      }
    };
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processUserAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Transcribe audio using OpenAI Whisper
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const transcribeResponse = await fetch('/api/elevenlabs/transcribe', {
        method: 'POST',
        body: formData
      });
      
      if (!transcribeResponse.ok) throw new Error('Transcription failed');
      
      const { text } = await transcribeResponse.json();
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'rep',
        text,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Get AI response
      const stepResponse = await fetch('/api/sim/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          repUtterance: text
        })
      });
      
      if (!stepResponse.ok) throw new Error('Failed to get response');
      
      const stepData = await stepResponse.json();
      
      // Update objectives based on progress
      // Optionally update objectives based on live metrics or custom logic
      
      // Add AI response
      if (stepData.prospectReply) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'prospect',
          text: stepData.prospectReply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Play audio response
        await playTextToSpeech(stepData.prospectReply, currentPersona?.voiceId);
      }
      
      // Check if conversation ended
      if (stepData.terminal) {
        setTimeout(() => endConversation(), 2000);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const endConversation = async () => {
    try {
      // Get evaluation
      const response = await fetch('/api/sim/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId })
      });
      
      const data = await response.json();
      
      if (data.eval) {
        setEvaluation(data);
        
        // Generate conversation analysis
        const analysis = generateConversationAnalysis(messages);
        setConversationAnalysis(analysis);
        
        setCurrentScreen('feedback');
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
      setCurrentScreen('feedback');
    }
  };

  const playConversationRecording = async (index: number) => {
    const message = messages[index];
    if (!message.audioUrl) return;
    
    setIsPlayingRecording(true);
    setCurrentPlaybackIndex(index);
    
    const audio = new Audio(message.audioUrl);
    audio.addEventListener('ended', () => {
      setIsPlayingRecording(false);
      setCurrentPlaybackIndex(-1);
    });
    
    await audio.play();
  };

  const generateConversationAnalysis = (messages: Message[]): ConversationAnalysis => {
    const timestamps: ConversationAnalysis['timestamps'] = [];
    
    // Analyze each user message
    messages.forEach((msg, index) => {
      if (msg.role === 'rep') {
        const time = formatTime(msg.timestamp);
        
        // Check for missed opportunities
        if (!msg.text.toLowerCase().includes('family') && index < 3) {
          timestamps.push({
            time,
            suggestion: "Could have asked about family/pets for safety concerns",
            category: 'missed_opportunity'
          });
        }
        
        if (msg.text.length < 50 && index > 0) {
          timestamps.push({
            time,
            suggestion: "Response was too brief - elaborate on value proposition",
            category: 'improvement'
          });
        }
        
        // Check for good practices
        if (msg.text.toLowerCase().includes('safe') || msg.text.toLowerCase().includes('epa')) {
          timestamps.push({
            time,
            suggestion: "Good job addressing safety concerns",
            category: 'good'
          });
        }
      }
    });
    
    return { timestamps };
  };

  useEffect(() => {
    return () => {
      resetSimulation();
    };
  }, []);

  const startConversation = async () => {
    try {
      setIsProcessing(true);
      setCurrentScreen('conversation');
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Start simulation with selected persona
      const response = await fetch('/api/sim/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          personaType: currentPersona?.id || 'random',
          personaData: currentPersona 
        })
      });
      
      if (!response.ok) throw new Error('Failed to start simulation');
      
      const data = await response.json();
      setAttemptId(data.attemptId);
      
      // Add greeting message
      if (data.reply) {
        const greetingMessage: Message = {
          id: Date.now().toString(),
          role: 'prospect',
          text: data.reply,
          timestamp: new Date(),
          audioUrl: data.audioUrl
        };
        setMessages([greetingMessage]);
        
        // Play greeting audio using ElevenLabs
        if (data.reply) {
          await playTextToSpeech(data.reply, currentPersona?.voiceId);
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Failed to start conversation. Please check your microphone permissions.');
      resetSimulation();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {currentScreen === 'home' && (
        /* Home Screen - Door Focus */
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </div>
                <h1 className="text-5xl font-bold text-white">DoorIQ</h1>
              </div>
              <p className="text-xl text-gray-300 mb-2">Master Your Sales Pitch</p>
              <p className="text-gray-400">Click the door to knock and start your pitch</p>
            </motion.div>

            {/* 3D Door */}
            <motion.div
              className="flex justify-center mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="relative cursor-pointer"
                onClick={handleDoorClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ perspective: '1000px' }}
              >
                <motion.div
                  className="w-80 h-96 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg shadow-2xl relative"
                  animate={{ rotateY: doorClicked ? -25 : 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* Door Panels */}
                  <div className="absolute inset-6 bg-amber-700/50 rounded grid grid-rows-2 gap-3 p-4">
                    <div className="bg-amber-600/30 rounded shadow-inner"></div>
                    <div className="bg-amber-600/30 rounded shadow-inner"></div>
                  </div>
                  
                  {/* Door Handle */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg"></div>
                  </div>
                  
                  {/* Door Frame */}
                  <div className="absolute inset-0 border-4 border-amber-900 rounded-lg"></div>
                  
                  {!doorClicked && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <p className="text-white font-medium">Click to knock</p>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      )}

      {currentScreen === 'briefing' && (
        /* Mission Briefing Screen */
        <div className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h1 className="text-4xl font-bold text-white mb-2">Mission Briefing</h1>
              <p className="text-gray-400">Prepare for your sales interaction</p>
            </motion.div>

            <div className="max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-6"
              >
                <h2 className="text-2xl font-bold text-white mb-2">Your Customer</h2>
                <div className="space-y-3 text-gray-300">
                  <p><span className="text-white font-semibold">Name:</span> {currentPersona?.name}</p>
                  <p><span className="text-white font-semibold">Profile:</span> {currentPersona?.personality}</p>
                  <p><span className="text-white font-semibold">Temperature:</span> <span className={`capitalize ${
                    currentPersona?.temperature === 'cold' ? 'text-blue-400' :
                    currentPersona?.temperature === 'skeptical' ? 'text-orange-400' :
                    currentPersona?.temperature === 'neutral' ? 'text-gray-400' :
                    currentPersona?.temperature === 'interested' ? 'text-yellow-400' :
                    'text-green-400'
                  }`}>{currentPersona?.temperature}</span></p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-6">Your Objectives</h2>
                <div className="space-y-4">
                  {objectives.map((objective, index) => (
                    <motion.div
                      key={objective.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className={`p-2 rounded-lg ${
                        objective.color === 'indigo' ? 'bg-indigo-500/20 text-indigo-400' :
                        objective.color === 'green' ? 'bg-green-500/20 text-green-400' :
                        objective.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {objective.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{objective.name}</h3>
                        <p className="text-sm text-gray-400">
                          {objective.id === '1' && 'Understand their needs, budget, and decision-making process'}
                          {objective.id === '2' && 'Clearly explain how your product/service solves their problem'}
                          {objective.id === '3' && 'Address concerns and overcome objections professionally'}
                          {objective.id === '4' && 'Secure a clear next step or close the sale'}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  onClick={startConversation}
                  className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors"
                >
                  Start Conversation
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'conversation' && (
        /* Active Conversation Screen */
        <div className="min-h-screen p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Live Conversation</h1>
              <p className="text-gray-400">Speaking with {currentPersona?.name}</p>
            </div>

            {/* Chat Interface */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-[500px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === 'rep' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.role === 'rep' ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.role === 'rep' 
                            ? 'bg-green-600/20 text-green-100' 
                            : 'bg-blue-600/20 text-blue-100'
                        }`}>
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-2">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isCustomerSpeaking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-blue-400"
                  >
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span className="text-sm">{currentPersona?.name} is speaking...</span>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-gray-400"
                  >
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    <span className="text-sm">Processing...</span>
                  </motion.div>
                )}
              </div>

              {/* Voice Controls */}
              <div className="p-6 border-t border-white/20">
                <div className="flex justify-center gap-4">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isCustomerSpeaking || isProcessing}
                    className={`relative group ${
                      isRecording 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    } text-white p-6 rounded-full shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                    
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping"></span>
                    )}
                  </button>

                  <button
                    onClick={endConversation}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    End Conversation
                  </button>
                </div>
                
                <p className="text-center text-gray-400 mt-4 text-sm">
                  {isRecording ? 'Recording... Stop talking to auto-submit' : 
                   isCustomerSpeaking ? `${currentPersona?.name} is speaking...` :
                   isProcessing ? 'Processing...' :
                   'Click microphone to respond'}
                </p>
              </div>
            </div>

            {/* Objectives Progress */}
            <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Objectives Progress</h3>
              <div className="grid grid-cols-4 gap-3">
                {objectives.map((obj) => (
                  <div
                    key={obj.id}
                    className={`text-center p-3 rounded-lg ${
                      obj.completed ? 'bg-green-500/20' : 'bg-white/5'
                    }`}
                  >
                    <div className={`${
                      obj.completed ? 'text-green-400' : 'text-gray-500'
                    }`}>
                      {obj.icon}
                    </div>
                    <p className={`text-xs mt-1 ${
                      obj.completed ? 'text-green-300' : 'text-gray-500'
                    }`}>
                      {obj.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'feedback' && (
        /* Feedback Screen with Audio Playback */
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
                  <div className="text-3xl font-bold text-green-400">
                    {messages.length > 0 ? formatTime(messages[messages.length - 1].timestamp) : '0:00'}
                  </div>
                  <div className="text-sm text-gray-400">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {messages.filter(m => m.role === 'rep').length}
                  </div>
                  <div className="text-sm text-gray-400">Your Responses</div>
                </div>
              </div>

              {/* Score and Grade */}
              <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-6 mb-8">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">
                    {evaluation?.eval?.score || 85}%
                  </div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-8 h-8 ${
                        i < Math.floor((evaluation?.eval?.score || 85) / 20) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-600'
                      }`} viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <div className="text-lg font-medium text-gray-300">
                    Speaking with: {currentPersona?.name}
                  </div>
                </div>
              </div>

              {/* Conversation Playback */}
              {messages.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Conversation Recording</h3>
                  <div className="bg-black/20 rounded-xl p-4 max-h-64 overflow-y-auto">
                    {messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 p-3 rounded-lg mb-2 ${
                          currentPlaybackIndex === index ? 'bg-white/10' : 'hover:bg-white/5'
                        } cursor-pointer`}
                        onClick={() => playConversationRecording(index)}
                      >
                        <button className="flex-shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20">
                          {isPlayingRecording && currentPlaybackIndex === index ? (
                            <Pause className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-medium ${
                              msg.role === 'rep' ? 'text-green-400' : 'text-blue-400'
                            }`}>
                              {msg.role === 'rep' ? 'You' : currentPersona?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timestamped Feedback */}
              {conversationAnalysis && conversationAnalysis.timestamps.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Timestamped Analysis</h3>
                  <div className="space-y-2">
                    {conversationAnalysis.timestamps.map((item, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-3 p-3 rounded-lg ${
                          item.category === 'good' ? 'bg-green-500/10 border border-green-500/20' :
                          item.category === 'improvement' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                          'bg-red-500/10 border border-red-500/20'
                        }`}
                      >
                        <span className="text-xs font-medium text-gray-400">{item.time}</span>
                        <p className={`text-sm ${
                          item.category === 'good' ? 'text-green-300' :
                          item.category === 'improvement' ? 'text-yellow-300' :
                          'text-red-300'
                        }`}>
                          {item.suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {(evaluation?.eval?.feedback_bullets || [
                      'Good opening and rapport building',
                      'Asked relevant qualifying questions',
                      'Presented value proposition clearly'
                    ]).map((bullet: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Areas to Improve
                  </h3>
                  <ul className="space-y-2">
                    {(evaluation?.eval?.missed_opportunities || [
                      'Could have asked more about family/safety concerns',
                      'Missed opportunity to mention neighbor references',
                      'Should have offered specific scheduling options'
                    ]).map((opportunity: string, i: number) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-orange-400 mt-0.5">!</span>
                        <span>{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    // Retry with same persona
                    setCurrentScreen('conversation');
                    setMessages([]);
                    setObjectives(objectives.map(obj => ({ ...obj, completed: false })));
                    startConversation();
                  }}
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
                  New Door
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}