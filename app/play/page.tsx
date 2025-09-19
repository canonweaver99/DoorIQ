'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Send, 
  RotateCcw, 
  TrendingUp, 
  MessageSquare, 
  Target,
  Clock,
  User,
  Briefcase,
  Brain,
  Activity
} from 'lucide-react';

interface Message {
  id: string;
  role: 'rep' | 'prospect';
  text: string;
  timestamp: Date;
  state?: string;
}

interface LiveMetrics {
  discovery: number;
  value: number;
  objection: number;
  cta: number;
  suggestions: string[];
}

interface Persona {
  company: string;
  vertical: string;
  role: string;
  pain: string[];
  budget?: string;
  urgency: string;
}

export default function PlayPage() {
  const [attemptId, setAttemptId] = useState<string>('');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [currentState, setCurrentState] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    discovery: 0, value: 0, objection: 0, cta: 0, suggestions: []
  });
  const [evaluation, setEvaluation] = useState<any>(null);
  const [selectedPersonaType, setSelectedPersonaType] = useState<string>('random');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Start new simulation
  const startSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sim/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: 'demo-user',
          personaType: selectedPersonaType 
        })
      });

      if (!response.ok) throw new Error('Failed to start simulation');

      const data = await response.json();
      setAttemptId(data.attemptId);
      setPersona(data.persona);
      setCurrentState(data.state);
      setIsSessionActive(true);
      setMessages([]);
      setLiveMetrics({ discovery: 0, value: 0, objection: 0, cta: 0, suggestions: [] });
      setEvaluation(null);
      setIsTerminal(false);
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Failed to start simulation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send message to simulation
  const sendMessage = async (text: string) => {
    if (!text.trim() || !attemptId || isTerminal) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'rep',
      text: text.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/sim/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          repUtterance: text.trim()
        })
      });

      if (!response.ok) throw new Error('Failed to process step');

      const data = await response.json();
      
      const prospectMessage: Message = {
        id: crypto.randomUUID(),
        role: 'prospect',
        text: data.prospectReply,
        timestamp: new Date(),
        state: data.state
      };

      setMessages(prev => [...prev, prospectMessage]);
      setCurrentState(data.state);
      setLiveMetrics(data.liveMetrics || liveMetrics);

      // Check if terminal
      if (data.terminal || data.state === 'TERMINAL') {
        setIsTerminal(true);
        await endSimulation();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // End simulation and get evaluation
  const endSimulation = async () => {
    if (!attemptId) return;

    try {
      const response = await fetch('/api/sim/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId })
      });

      if (!response.ok) throw new Error('Failed to end simulation');

      const data = await response.json();
      setEvaluation(data);
      setIsSessionActive(false);
    } catch (error) {
      console.error('Error ending simulation:', error);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob);
        
        try {
          const response = await fetch('/api/practice/transcribe', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const { text } = await response.json();
            if (text.trim()) {
              await sendMessage(text);
            }
          }
        } catch (error) {
          console.error('Transcription failed:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const resetSimulation = () => {
    setAttemptId('');
    setPersona(null);
    setCurrentState('');
    setMessages([]);
    setInputText('');
    setIsSessionActive(false);
    setIsTerminal(false);
    setLiveMetrics({ discovery: 0, value: 0, objection: 0, cta: 0, suggestions: [] });
    setEvaluation(null);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Simulation</h1>
          <p className="text-gray-600">Practice your sales skills with AI-powered prospects</p>
        </div>

        {!isSessionActive && !evaluation ? (
          /* Start Screen */
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Ready to Practice?</h2>
              <p className="text-gray-600 mb-6">
                You'll be speaking with a homeowner about pest control services. 
                Your goal is to schedule an inspection or start a service plan.
              </p>
              
              {/* Persona Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Customer Type:
                </label>
                <select
                  value={selectedPersonaType}
                  onChange={(e) => setSelectedPersonaType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="random">Random Homeowner</option>
                  <option value="skeptical">Skeptical Homeowner</option>
                  <option value="interested">Interested Customer</option>
                  <option value="budget_conscious">Budget-Conscious</option>
                  <option value="safety_focused">Safety-Focused Parent</option>
                </select>
              </div>
              <button
                onClick={startSimulation}
                disabled={isLoading}
                className="primary-button text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {isLoading ? 'Starting...' : 'Start Simulation'}
              </button>
            </div>
          </div>
        ) : evaluation ? (
          /* Results Screen */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Simulation Complete</h2>
              
              {/* Score */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {evaluation.eval.score}%
                </div>
                <div className="text-lg font-medium text-gray-600 capitalize">
                  Result: {evaluation.eval.result}
                </div>
              </div>

              {/* Rubric Breakdown */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                {Object.entries(evaluation.eval.rubric_breakdown).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{value}/25</div>
                    <div className="text-sm text-gray-600 capitalize">{key}</div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-3">Strengths</h3>
                  <ul className="space-y-2">
                    {evaluation.eval.feedback_bullets.map((bullet: string, i: number) => (
                      <li key={i} className="text-gray-700 flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-orange-600 mb-3">Missed Opportunities</h3>
                  <ul className="space-y-2">
                    {evaluation.eval.missed_opportunities.map((opportunity: string, i: number) => (
                      <li key={i} className="text-gray-700 flex items-start gap-2">
                        <span className="text-orange-500 mt-1">!</span>
                        {opportunity}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{evaluation.metrics.totalTurns}</div>
                  <div className="text-sm text-gray-600">Total Exchanges</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{evaluation.metrics.duration}s</div>
                  <div className="text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{evaluation.metrics.avgTurnLength}</div>
                  <div className="text-sm text-gray-600">Avg Length</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{evaluation.attempt.turnCount}</div>
                  <div className="text-sm text-gray-600">Your Turns</div>
                </div>
              </div>

              <button
                onClick={resetSimulation}
                className="w-full primary-button text-white py-3 rounded-lg font-semibold"
              >
                Start New Simulation
              </button>
            </div>
          </motion.div>
        ) : (
          /* Active Simulation */
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Chat Area */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{persona?.company}</h3>
                      <p className="text-sm text-gray-600">{persona?.role} • {currentState}</p>
                    </div>
                  </div>
                  <button
                    onClick={resetSimulation}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === 'rep' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.role === 'rep' ? 'order-2' : 'order-1'}`}>
                          <div className={`rounded-2xl px-4 py-3 ${
                            message.role === 'rep' 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {message.timestamp.toLocaleTimeString()}
                            {message.state && ` • ${message.state}`}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'rep' ? 'order-1 mr-2 bg-blue-600' : 'order-2 ml-2 bg-gray-300'
                        }`}>
                          {message.role === 'rep' ? (
                            <Briefcase className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                {!isTerminal && (
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex gap-3">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-lg ${
                          isRecording 
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                      >
                        {isRecording ? (
                          <MicOff className="w-5 h-5 text-white" />
                        ) : (
                          <Mic className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      <button
                        type="submit"
                        disabled={!inputText.trim() || isLoading}
                        className="primary-button text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Hidden Persona Info - Only for debugging, not shown to sales rep */}

              {/* Live Metrics */}
              {isSessionActive && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-600" />
                    Live Performance
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(liveMetrics).filter(([key]) => key !== 'suggestions').map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600 capitalize">{key}</span>
                          <span className="text-sm font-medium">{value}/25</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              value > 20 ? 'bg-green-500' : 
                              value > 10 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(value / 25) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {liveMetrics.suggestions.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Live Tips:</h4>
                      <ul className="text-xs text-blue-800 space-y-1">
                        {liveMetrics.suggestions.map((suggestion, i) => (
                          <li key={i}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Session Info */}
              {isSessionActive && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Session Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>State:</span>
                      <span className="font-medium capitalize">{currentState}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Exchanges:</span>
                      <span className="font-medium">{Math.floor(messages.length / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Goal:</span>
                      <span className="font-medium">Schedule Service</span>
                    </div>
                  </div>
                  
                  {!isTerminal && (
                    <button
                      onClick={endSimulation}
                      className="w-full mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg text-sm font-medium"
                    >
                      End Session
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
