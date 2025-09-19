import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, User, Briefcase, Activity, Volume2, RotateCcw, Target, Clock, MessageSquare, CheckCircle, Shield, DollarSign, Calendar } from 'lucide-react';

interface Message {
  id: string;
  role: 'rep' | 'prospect';
  text: string;
  timestamp: Date;
}

interface LiveMetrics {
  discovery: number;
  value: number;
  objection: number;
  cta: number;
  suggestions: string[];
}

interface Objective {
  id: string;
  name: string;
  color: string;
  icon: JSX.Element;
  completed: boolean;
}

function App() {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'practice' | 'feedback'>('home');
  const [, setAttemptId] = useState<string>('');
  const [currentState, setCurrentState] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isTerminal, setIsTerminal] = useState(false);
  const [isCustomerSpeaking, setIsCustomerSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics>({
    discovery: 0, value: 0, objection: 0, cta: 0, suggestions: []
  });
  const [evaluation, setEvaluation] = useState<any>(null);
  const [doorClicked, setDoorClicked] = useState(false);
  const [objectives, setObjectives] = useState<Objective[]>([
    { id: '1', name: 'Qualify the Customer', color: 'indigo', icon: <Target className="w-5 h-5" />, completed: false },
    { id: '2', name: 'Present Solution', color: 'green', icon: <Shield className="w-5 h-5" />, completed: false },
    { id: '3', name: 'Handle Objections', color: 'amber', icon: <DollarSign className="w-5 h-5" />, completed: false },
    { id: '4', name: 'Get Commitment', color: 'blue', icon: <Calendar className="w-5 h-5" />, completed: false }
  ]);
  const [showPerformanceButton, setShowPerformanceButton] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startSimulation = async () => {
    try {
      setIsProcessing(true);
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Start simulation - persona is randomly selected on backend
      const response = await fetch('/api/sim/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaType: 'random' }) // Always random
      });
      
      if (!response.ok) throw new Error('Failed to start simulation');
      
      const data = await response.json();
      setAttemptId(data.attemptId);
      setCurrentState(data.state);
      
      // Add initial message from prospect
      if (data.reply) {
        setMessages([{
          id: Date.now().toString(),
          role: 'prospect',
          text: data.reply,
          timestamp: new Date()
        }]);
        
        // Play audio if available
        if (data.audioUrl) {
          const audio = new Audio(data.audioUrl);
          setIsCustomerSpeaking(true);
          audio.addEventListener('ended', () => setIsCustomerSpeaking(false));
          await audio.play();
        }
      }
      
      setIsSessionActive(true);
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Failed to start simulation. Please check your microphone permissions.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioForProcessing(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please check your microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioForProcessing = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // First transcribe the audio
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const transcribeResponse = await fetch('/api/practice/transcribe', {
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
          attemptId: '',
          repText: text
        })
      });
      
      if (!stepResponse.ok) throw new Error('Failed to get response');
      
      const stepData = await stepResponse.json();
      
      // Update state
      setCurrentState(stepData.state);
      setIsTerminal(stepData.isTerminal);
      setLiveMetrics(stepData.liveMetrics || liveMetrics);
      
      // Add AI response
      if (stepData.reply) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'prospect',
          text: stepData.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Play audio
        if (stepData.audioUrl) {
          const audio = new Audio(stepData.audioUrl);
          setIsCustomerSpeaking(true);
          audio.addEventListener('ended', () => setIsCustomerSpeaking(false));
          await audio.play();
        }
      }
      
      // End if terminal
      if (stepData.isTerminal) {
        setTimeout(() => endSimulation(), 2000);
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const endSimulation = async () => {
    // Get evaluation
    fetch('/api/sim/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attemptId: '' })
    }).then(res => res.json()).then(data => {
      if (data.eval) {
        setEvaluation(data);
        setCurrentScreen('feedback');
      }
    });
    setIsSessionActive(false);
  };

  const resetSimulation = () => {
    setCurrentScreen('home');
    setAttemptId('');
    setCurrentState('');
    setMessages([]);
    setIsSessionActive(false);
    setIsTerminal(false);
    setIsCustomerSpeaking(false);
    setIsProcessing(false);
    setLiveMetrics({ discovery: 0, value: 0, objection: 0, cta: 0, suggestions: [] });
    setEvaluation(null);
    setDoorClicked(false);
    setObjectives(objectives.map(obj => ({ ...obj, completed: false })));
    setShowPerformanceButton(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const handleDoorClick = () => {
    setDoorClicked(true);
    setTimeout(() => {
      setCurrentScreen('practice');
      // Start auto-completing objectives
      const delays = [500, 1000, 1500, 2000];
      objectives.forEach((_, index) => {
        setTimeout(() => {
          setObjectives(prev => prev.map((obj, i) => 
            i === index ? { ...obj, completed: true } : obj
          ));
          
          // Show performance button after last objective
          if (index === objectives.length - 1) {
            setTimeout(() => {
              setShowPerformanceButton(true);
            }, 500);
          }
        }, delays[index]);
      });
    }, 1000);
  };

  const viewPerformance = () => {
    // Set mock evaluation data
    setEvaluation({
      eval: {
        score: 100,
        result: 'closed',
        rubric_breakdown: { discovery: 25, value: 25, objection: 25, cta: 25 },
        feedback_bullets: [
          'Perfect execution of all sales objectives',
          'Excellent qualifying questions to understand customer needs',
          'Compelling presentation that addressed specific pain points',
          'Skillfully handled objections with social proof',
          'Strong close with clear next steps and urgency'
        ],
        missed_opportunities: []
      }
    });
    setCurrentScreen('feedback');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

      {currentScreen === 'practice' && (
        /* Practice Mode Screen */
        <div className="min-h-screen p-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                  </svg>
                </div>
                <h1 className="text-4xl font-bold text-white">DoorIQ</h1>
              </div>
              <p className="text-gray-400">Master Your Sales Pitch</p>
            </motion.div>

            <div className="flex gap-8 items-center justify-center">
              {/* Door (Left Side) */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-shrink-0"
              >
                <div className="w-64 h-80 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg shadow-2xl relative">
                  <div className="absolute inset-4 bg-amber-700/50 rounded grid grid-rows-2 gap-2 p-3">
                    <div className="bg-amber-600/30 rounded shadow-inner"></div>
                    <div className="bg-amber-600/30 rounded shadow-inner"></div>
                  </div>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full shadow-lg"></div>
                  </div>
                  <div className="absolute inset-0 border-4 border-amber-900 rounded-lg"></div>
                </div>
              </motion.div>

              {/* Perfect Pitch Panel (Right Side) */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-white mb-2">Mission Briefing</h2>
                <p className="text-gray-300 mb-6">Dr. Jennifer Chen - A 42-year-old physician who needs every sales pitch backed by evidence</p>

                <div className="space-y-4">
                  {objectives.map((objective, index) => (
                    <motion.div
                      key={objective.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-lg border ${
                        objective.completed 
                          ? 'bg-white/10 border-white/20' 
                          : 'bg-white/5 border-white/10'
                      }`}
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
                      <AnimatePresence>
                        {objective.completed && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-green-400"
                          >
                            <CheckCircle className="w-6 h-6" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {!showPerformanceButton && objectives.every(obj => obj.completed) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-center"
                  >
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-400 border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-300">Analyzing performance...</p>
                  </motion.div>
                )}

                {showPerformanceButton && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <button
                      onClick={viewPerformance}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
                    >
                      View Performance Review
                    </button>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {currentScreen === 'feedback' && (
        /* Feedback Screen */
        <div className="min-h-screen p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-3xl font-bold text-white mb-8 text-center">Performance Review</h2>
              
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-400">4/4</div>
                  <div className="text-sm text-gray-400">Tasks Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">0:09</div>
                  <div className="text-sm text-gray-400">Total Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">0</div>
                  <div className="text-sm text-gray-400">Responses</div>
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-8 h-8 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-center text-gray-400 mb-8">All stars</p>

              {/* Grade Box */}
              <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">Sales Performance Rubric</h3>
                    <div className="text-6xl font-bold text-green-400">A+</div>
                    <p className="text-green-300">414 Objectives</p>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2 text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span>Qualify the Customer</span>
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span>Present Solution</span>
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span>Handle Objections</span>
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                    <div className="flex items-center gap-2 text-green-300">
                      <CheckCircle className="w-5 h-5" />
                      <span>Get Commitment</span>
                      <span className="text-xs text-gray-400">Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Sections */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {(evaluation?.eval?.feedback_bullets || [
                      'Perfect execution of all sales objectives',
                      'Excellent qualifying questions to understand customer needs',
                      'Compelling presentation that addressed specific pain points',
                      'Skillfully handled objections with social proof',
                      'Strong close with clear next steps and urgency'
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
                    <li className="text-gray-400 text-sm flex items-start gap-2">
                      <span className="text-gray-600 mt-0.5">•</span>
                      <span>Continue practicing to maintain this level of excellence</span>
                    </li>
                    <li className="text-gray-400 text-sm flex items-start gap-2">
                      <span className="text-gray-600 mt-0.5">•</span>
                      <span>Consider personalizing your approach even more for different customer types</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Performance Summary */}
              <div className="bg-white/5 rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-white mb-3">Excellent Performance!</h3>
                <p className="text-gray-300">Perfect execution - you completed all sales objectives. Ready for real customers!</p>
              </div>

              {/* Action Button */}
              <button
                onClick={resetSimulation}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition-colors"
              >
                Try Another Customer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

export default App;