'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, User, Briefcase, Activity, Volume2, RotateCcw } from 'lucide-react';

export default function PracticePage() {
  const [attemptId, setAttemptId] = useState<string>('');
  const [currentState, setCurrentState] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({ discovery: 0, value: 0, objection: 0, cta: 0, suggestions: [] });
  const [evaluation, setEvaluation] = useState<any>(null);
  const [selectedPersonaType, setSelectedPersonaType] = useState<string>('random');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">DoorIQ Voice Training</h1>
          <p className="text-gray-400">Practice door-to-door pest control sales with AI homeowners</p>
        </div>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">Coming Soon</h2>
            <p className="text-gray-300 mb-6">Voice training system is being updated...</p>
          </div>
        </div>
      </div>
    </div>
  );
}