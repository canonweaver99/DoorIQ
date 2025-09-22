'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, StopCircle, RotateCcw, Home, Mic, MicOff } from 'lucide-react';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function PracticePage() {
  const [currentScreen, setCurrentScreen] = useState<'door' | 'conversation' | 'feedback'>('door');
  const [isPaused, setIsPaused] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);
  
  // Conversation state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentAgent, setCurrentAgent] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [liveTranscription, setLiveTranscription] = useState('');
  
  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
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
        setLiveTranscription(transcript);
      };
    }
  }, []);

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

  const handleDoorClick = async () => {
    playDoorKnockSound();
    
    try {
      // Start conversation with Amanda (default agent)
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          agentId: 'amanda_001',
          userId: 'demo-user' // Replace with actual user ID from auth
        })
      });
      
      const data = await response.json();
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
        setCurrentAgent(data.agent);
        setConversationHistory([{
          role: 'assistant',
          content: data.greeting,
          timestamp: new Date().toISOString()
        }]);
        
        setTimeout(() => {
          setCurrentScreen('conversation');
          setConversationStarted(true);
          
          // Speak the greeting
          speakText(data.greeting, data.agent.voice_id);
        }, 800);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const speakText = async (text: string, voiceId?: string) => {
    try {
      // Stop any currently playing audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      
      const response = await fetch('/api/elevenlabs/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;
        
        return new Promise<void>((resolve) => {
          audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudioRef.current = null;
            resolve();
          };
          audio.play();
        });
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await processUserAudio(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start live transcription
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
    } catch (error) {
      console.error('Recording error:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop live transcription
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop all tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  const processUserAudio = async (audioBlob: Blob) => {
    if (!sessionId) return;
    
    setIsProcessing(true);
    
    try {
      // Use live transcription if available, otherwise transcribe audio
      let userMessage = liveTranscription.trim();
      
      if (!userMessage) {
        // Fallback to OpenAI Whisper transcription
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', 'whisper-1');
        
        const transcribeResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
          },
          body: formData
        });
        
        const transcription = await transcribeResponse.json();
        userMessage = transcription.text;
      }
      
      if (userMessage.trim()) {
        // Add user message to history
        const newUserMessage: ConversationMessage = {
          role: 'user',
          content: userMessage,
          timestamp: new Date().toISOString()
        };
        
        setConversationHistory(prev => [...prev, newUserMessage]);
        setLiveTranscription('');
        
        // Get agent response
        const responseData = await fetch('/api/conversation/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, userMessage })
        });
        
        const response = await responseData.json();
        
        if (response.response) {
          const agentMessage: ConversationMessage = {
            role: 'assistant',
            content: response.response,
            timestamp: new Date().toISOString()
          };
          
          setConversationHistory(prev => [...prev, agentMessage]);
          
          // Speak the response
          await speakText(response.response, response.voiceId);
          
          // Check if conversation is complete
          if (response.isComplete) {
            setTimeout(() => {
              endConversation();
            }, 2000);
          }
        }
      }
    } catch (error) {
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const pauseConversation = () => {
    if (currentAudioRef.current) {
      if (isPaused) {
        currentAudioRef.current.play();
      } else {
        currentAudioRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  };

  const endConversation = async () => {
    try {
      // Stop any ongoing recording or audio
      if (isRecording) {
        stopRecording();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      
      if (sessionId && conversationHistory.length > 0) {
        // Grade the conversation
        const transcript = conversationHistory.map(msg => ({
          speaker: msg.role === 'user' ? 'rep' : 'customer',
          text: msg.content,
          ts: msg.timestamp
        }));
        
        try {
          const gradeResponse = await fetch('/api/webhooks/grade', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_EVAL_API_KEY || 'test-key'}`
            },
            body: JSON.stringify({
              session_id: sessionId,
              agent_id: currentAgent?.name || 'amanda_001',
              transcript,
              rubric_id: 'amanda_v1'
            })
          });
          
          if (gradeResponse.ok) {
            const gradeData = await gradeResponse.json();
            const grade = gradeData.grading || gradeData.deterministic;
            
            setGradeResult({
              total: grade.total || 16,
              maxScore: 20,
              grade: getLetterGrade(grade.total || 16),
              percentage: Math.round(((grade.total || 16) / 20) * 100),
              axes: grade.axes || {
                safety: 4,
                scope: 3,
                time: 4,
                price: 5
              },
              feedback: grade.notes || [
                "Good conversation flow",
                "Clear communication",
                "Professional approach"
              ],
              improvements: [
                "Ask more discovery questions",
                "Provide more specific details",
                "Build stronger rapport"
              ]
            });
          } else {
            throw new Error('Grading failed');
          }
        } catch (gradeError) {
          // Fallback mock grade
          setGradeResult({
            total: 16,
            maxScore: 20,
            grade: "B+",
            percentage: 80,
            axes: { safety: 4, scope: 3, time: 4, price: 5 },
            feedback: ["Good conversation overall"],
            improvements: ["Continue practicing"]
          });
        }
      }
      
      setCurrentScreen('feedback');
    } catch (error) {
      console.error('Error ending conversation:', error);
      setCurrentScreen('feedback');
    }
  };
  
  const getLetterGrade = (score: number): string => {
    if (score >= 18) return 'A+';
    if (score >= 16) return 'A';
    if (score >= 14) return 'B+';
    if (score >= 12) return 'B';
    if (score >= 10) return 'C+';
    if (score >= 8) return 'C';
    return 'D';
  };

  const resetToHome = () => {
    setCurrentScreen('door');
    setConversationStarted(false);
    setIsPaused(false);
    setGradeResult(null);
    setSessionId(null);
    setCurrentAgent(null);
    setConversationHistory([]);
    setLiveTranscription('');
    setIsRecording(false);
    setIsProcessing(false);
  };

  const tryAgain = () => {
    setSessionId(null);
    setCurrentAgent(null);
    setConversationHistory([]);
    setLiveTranscription('');
    setIsRecording(false);
    setIsProcessing(false);
    setGradeResult(null);
    setIsPaused(false);
    handleDoorClick(); // Start a new conversation
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      
      {/* 1. DOOR SCREEN */}
      {currentScreen === 'door' && (
        <div className="min-h-screen flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <h1 className="text-6xl font-bold text-white mb-4">DoorIQ</h1>
            <p className="text-xl text-gray-400 mb-12">Click the door to start practicing</p>
            
            {/* Suburban Door */}
            <motion.div
              className="relative cursor-pointer mx-auto"
              onClick={handleDoorClick}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ perspective: '1000px' }}
            >
              <div className="w-64 h-80 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-3 shadow-2xl">
                <div className="h-full bg-gradient-to-br from-amber-800 to-amber-900 rounded relative">
                  {/* Door Panels */}
                  <div className="grid grid-rows-2 gap-2 p-4 h-full">
                    <div className="bg-amber-700 bg-opacity-50 rounded shadow-inner"></div>
                    <div className="bg-amber-700 bg-opacity-50 rounded shadow-inner"></div>
                  </div>
                  
                  {/* Door Handle */}
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg"></div>
                  </div>
                  
                  {/* Click Hint */}
                  <div className="absolute inset-x-0 bottom-4 text-center">
                    <p className="text-white text-sm bg-black bg-opacity-30 px-3 py-1 rounded inline-block">
                      🚪 Click to knock
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      )}

      {/* 2. CONVERSATION SCREEN - Floating Amanda Avatar */}
      {currentScreen === 'conversation' && (
        <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20" />
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl" />
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10"
          >
            {/* Floating Amanda Avatar - ChatGPT Style */}
            <div className="flex flex-col items-center">
              {/* Pulsing Ring Effect */}
              <div className="relative">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-2xl opacity-50"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.3, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Main Avatar */}
                <motion.div
                  className="relative w-40 h-40 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl flex items-center justify-center"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Inner Circle */}
                  <div className="absolute inset-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                  
                  {/* Avatar Content */}
                  <span className="relative text-5xl font-bold text-white z-10">
                    {currentAgent?.avatar_initials || 'AR'}
                  </span>
                  
                  {/* Speaking Indicator */}
                  {conversationStarted && !isPaused && (
                    <motion.div
                      className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center"
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                    >
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </motion.div>
                  )}
                  
                  {/* Recording Status */}
                  {isRecording && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute -bottom-4 -right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center"
                    >
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </motion.div>
                  )}
                  
                  {/* Processing Indicator */}
                  {isProcessing && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute -top-4 -left-4 w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                    />
                  )}
                </motion.div>
              </div>
              
              {/* Name Label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center"
              >
                <h2 className="text-2xl font-bold text-white mb-1">
                  {currentAgent?.name || 'Amanda Rodriguez'}
                </h2>
                <p className="text-purple-300 text-sm">Homeowner • Suburban Mom</p>
                <p className="text-gray-400 text-xs mt-2">
                  Turn {Math.ceil(conversationHistory.length / 2)} • {conversationHistory.filter(m => m.role === 'user').length} responses
                </p>
              </motion.div>
              
              {/* Live Transcription */}
              {liveTranscription && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30 max-w-md"
                >
                  <p className="text-sm text-blue-200">You're saying: "{liveTranscription}"</p>
                </motion.div>
              )}
            </div>
            
            {/* Floating Controls */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4"
            >
              {/* Record Button */}
              <motion.button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-8 py-4 rounded-full font-medium transition-all backdrop-blur-md ${
                  isRecording 
                    ? 'bg-red-600/80 hover:bg-red-700/80 text-white' 
                    : 'bg-green-600/80 hover:bg-green-700/80 text-white'
                } disabled:opacity-50`}
                whileHover={{ scale: isProcessing ? 1 : 1.05 }}
                whileTap={{ scale: isProcessing ? 1 : 0.95 }}
              >
                {isRecording ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    {isProcessing ? 'Processing...' : 'Start Recording'}
                  </>
                )}
              </motion.button>
              
              {/* Pause Button */}
              <motion.button
                onClick={pauseConversation}
                className="flex items-center gap-2 px-6 py-4 rounded-full font-medium transition-all backdrop-blur-md bg-white/10 hover:bg-white/20 text-white border border-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </motion.button>

              {/* End Button */}
              <motion.button
                onClick={endConversation}
                className="flex items-center gap-2 bg-red-600/80 hover:bg-red-700/80 backdrop-blur-md text-white px-6 py-4 rounded-full font-medium transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <StopCircle className="w-5 h-5" />
              </motion.button>
            </motion.div>
            
            {/* Status */}
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2">
              <p className="text-center text-gray-400 text-sm bg-black/20 backdrop-blur-md px-4 py-2 rounded-full">
                {isPaused ? '⏸️ Conversation paused' : 
                 isRecording ? '🎤 Recording your response...' :
                 isProcessing ? '⚙️ Processing...' :
                 '💬 Ready for your response'}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. FEEDBACK SCREEN */}
      {currentScreen === 'feedback' && (
        <div className="min-h-screen flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl w-full"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Sales Performance Review</h2>
              
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-6 mb-8 text-center">
                <div className="text-6xl font-bold text-white mb-2">
                  {gradeResult?.percentage || 80}%
                </div>
                <div className="text-2xl font-bold text-purple-200 mb-2">
                  Grade: {gradeResult?.grade || "B+"}
                </div>
                <div className="text-gray-400">
                  {gradeResult?.total || 16}/{gradeResult?.maxScore || 20} points
                </div>
              </div>

              {/* Scoring Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { name: 'Safety', score: gradeResult?.axes?.safety || 4, max: 5, color: 'green' },
                  { name: 'Scope', score: gradeResult?.axes?.scope || 3, max: 5, color: 'blue' },
                  { name: 'Time', score: gradeResult?.axes?.time || 4, max: 5, color: 'purple' },
                  { name: 'Price', score: gradeResult?.axes?.price || 5, max: 5, color: 'indigo' }
                ].map((axis) => (
                  <div key={axis.name} className="bg-black/20 rounded-xl p-4 text-center">
                    <div className={`text-2xl font-bold text-${axis.color}-400 mb-1`}>
                      {axis.score}/{axis.max}
                    </div>
                    <div className="text-sm text-gray-400">{axis.name}</div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Strengths */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-green-400 mb-4">✅ Strengths</h3>
                  <ul className="space-y-2 text-sm text-green-100">
                    {(gradeResult?.feedback || [
                      "Good conversation flow",
                      "Clear communication",
                      "Professional approach"
                    ]).map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4">🎯 Areas to Improve</h3>
                  <ul className="space-y-2 text-sm text-amber-100">
                    {(gradeResult?.improvements || [
                      "Ask more discovery questions",
                      "Provide more specific details", 
                      "Build stronger rapport"
                    ]).map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center gap-4">
                <motion.button
                  onClick={tryAgain}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-5 h-5" />
                  Try Again with Amanda
                </motion.button>
                
                <motion.button
                  onClick={resetToHome}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-8 py-4 rounded-xl font-semibold transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Home className="w-5 h-5" />
                  Back to Door
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}