'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Play, StopCircle, RotateCcw, Home } from 'lucide-react';
import dynamic from "next/dynamic";

const ElevenLabsConvai = dynamic(() => import("@/app/components/ElevenLabsConvai"), {
  ssr: false,
});

// Amanda Rodriguez - The only homeowner for MVP
const AMANDA = {
  name: "Amanda Rodriguez",
  age: 34,
  occupation: "Marketing Director at tech startup",
  family: "Married to David; kids Sofia (6) and Lucas (3); Goldendoodle Bailey",
  home: "4BR/2.5BA (built 2005)",
  personality: "Polite but time-constrained, values child & pet safety, wants clear communication",
  temperature: "Neutral → warms with clarity",
  painPoints: ["Late technicians", "Vague pricing", "Hidden fees", "Chemical jargon"],
  interests: ["Child safety", "Pet safety", "Predictable pricing", "On-time service"]
};

export default function PracticePage() {
  const [currentScreen, setCurrentScreen] = useState<'door' | 'conversation' | 'feedback'>('door');
  const [isPaused, setIsPaused] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [gradeResult, setGradeResult] = useState<any>(null);

  // ElevenLabs agent ID
  const ELEVEN_AGENT_ID = process.env.NEXT_PUBLIC_ELEVEN_AGENT_ID || 'agent_7001k5jqfjmtejvs77jvhjf254tz';

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
    setTimeout(() => {
      setCurrentScreen('conversation');
      setConversationStarted(true);
    }, 800);
  };

  const pauseConversation = () => {
    setIsPaused(!isPaused);
    // TODO: Pause/resume ElevenLabs agent
  };

  const endConversation = async () => {
    try {
      // TODO: Get transcript from ElevenLabs agent
      // TODO: Send to grading API
      // For now, show mock results
      const mockGrade = {
        total: 16,
        maxScore: 20,
        grade: "B+",
        percentage: 80,
        axes: {
          safety: 4,
          scope: 3,
          time: 4,
          price: 5
        },
        feedback: [
          "Excellent safety explanation with EPA details",
          "Could have been more specific about service scope",
          "Great time window offer with text alerts",
          "Clear pricing with no hidden fees mentioned"
        ],
        improvements: [
          "Ask more discovery questions about current pest issues",
          "Mention specific pests covered in service",
          "Reference local neighbors or reviews for social proof"
        ]
      };
      
      setGradeResult(mockGrade);
      setCurrentScreen('feedback');
    } catch (error) {
      console.error('Error ending conversation:', error);
      setCurrentScreen('feedback');
    }
  };

  const resetToHome = () => {
    setCurrentScreen('door');
    setConversationStarted(false);
    setIsPaused(false);
    setGradeResult(null);
  };

  const tryAgain = () => {
    setCurrentScreen('conversation');
    setConversationStarted(true);
    setIsPaused(false);
    setGradeResult(null);
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

      {/* 2. CONVERSATION SCREEN - Amanda Centered */}
      {currentScreen === 'conversation' && (
        <div className="min-h-screen flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl w-full"
          >
            {/* Amanda's Profile Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 text-center mb-8">
              
              {/* Header */}
              <h1 className="text-2xl font-bold text-white mb-6">Live Conversation</h1>
              
              {/* Amanda Avatar & Info */}
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 mb-6 border border-purple-500/30">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">AR</span>
                </div>
                
                {/* Basic Info */}
                <h2 className="text-xl font-bold text-white mb-1">{AMANDA.name}</h2>
                <p className="text-purple-200 mb-3">{AMANDA.occupation}</p>
                
                {/* Key Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-left">
                    <p className="text-gray-400">Age</p>
                    <p className="text-white font-medium">{AMANDA.age}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400">Family</p>
                    <p className="text-white font-medium">Married + 2 kids</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400">Home</p>
                    <p className="text-white font-medium">{AMANDA.home}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-gray-400">Temperature</p>
                    <p className="text-white font-medium">{AMANDA.temperature}</p>
                  </div>
                </div>
                
                {/* Personality */}
                <div className="mt-4 p-3 bg-black/20 rounded-lg">
                  <p className="text-xs text-gray-300 italic">&quot;{AMANDA.personality}&quot;</p>
                </div>
              </div>

              {/* ElevenLabs Agent Widget */}
              <div className="mb-6 bg-black/20 rounded-xl p-4">
                <ElevenLabsConvai 
                  agentId={ELEVEN_AGENT_ID} 
                  mode="embedded"
                  theme="dark"
                />
              </div>

              {/* Simple Controls */}
              <div className="flex justify-center gap-4">
                <motion.button
                  onClick={pauseConversation}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    isPaused 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  )}
                </motion.button>

                <motion.button
                  onClick={endConversation}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <StopCircle className="w-4 h-4" />
                  End & Grade
                </motion.button>
              </div>

              {/* Status */}
              <div className="mt-4">
                <p className="text-center text-gray-400 text-sm">
                  {isPaused ? '⏸️ Conversation paused' : '🎤 Speaking with Amanda...'}
                </p>
              </div>
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
                      "Excellent safety explanation with EPA details",
                      "Clear pricing with no hidden fees mentioned",
                      "Great time window offer with text alerts"
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
                      "Ask more discovery questions about current pest issues",
                      "Mention specific pests covered in service",
                      "Reference local neighbors or reviews for social proof"
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
