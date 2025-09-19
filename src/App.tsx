import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, User, Briefcase, Activity, Volume2, RotateCcw } from 'lucide-react';

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

function App() {
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
  const [selectedPersonaType, setSelectedPersonaType] = useState<string>('random');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Mock API calls for now - replace with actual backend
  const startSimulation = async () => {
    setIsProcessing(true);
    try {
      // Mock simulation start
      setAttemptId(crypto.randomUUID());
      setCurrentState('OPENING');
      setIsSessionActive(true);
      setMessages([]);
      setLiveMetrics({ discovery: 0, value: 0, objection: 0, cta: 0, suggestions: [] });
      setEvaluation(null);
      setIsTerminal(false);

      // Generate initial customer greeting
      setTimeout(() => {
        generateCustomerGreeting();
      }, 1000);
    } catch (error) {
      console.error('Error starting simulation:', error);
      alert('Failed to start simulation. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateCustomerGreeting = async () => {
    setIsCustomerSpeaking(true);
    
    const greetings = [
      "Yes? What do you want?",
      "Oh, hello there. What can I do for you?",
      "I'm not interested in whatever you're selling.",
      "Make it quick, I'm busy.",
      "We don't need pest control, thanks."
    ];
    
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    const customerMessage: Message = {
      id: crypto.randomUUID(),
      role: 'prospect',
      text: greeting,
      timestamp: new Date()
    };

    setMessages([customerMessage]);
    setCurrentState('DISCOVERY');

    // Simulate customer speaking
    setTimeout(() => setIsCustomerSpeaking(false), 2000);
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

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudioResponse(audioBlob);
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

  // Process audio response
  const processAudioResponse = async (_audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Mock transcription
      const mockTranscriptions = [
        "Hi, I'm with EcoShield Pest Control. We're offering free inspections in your neighborhood.",
        "I noticed you might have some pest concerns. We specialize in family-safe treatments.",
        "We offer quarterly service that prevents 95% of common household pests.",
        "Our treatments are EPA-approved and safe around children and pets.",
        "Would you be interested in scheduling a free inspection?"
      ];
      
      const text = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      
      if (!text.trim()) {
        setIsProcessing(false);
        return;
      }

      // Add user message
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'rep',
        text: text.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Mock customer response
      setTimeout(() => {
        const responses = [
          "We don't really have a pest problem right now.",
          "How much does this cost?",
          "What chemicals do you use? Is it safe for kids?",
          "We're happy with our current pest control.",
          "I need to talk to my spouse first.",
          "When would you do the inspection?"
        ];
        
        const response = responses[Math.floor(Math.random() * responses.length)];
        
        const customerMessage: Message = {
          id: crypto.randomUUID(),
          role: 'prospect',
          text: response,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, customerMessage]);
        setCurrentState('VALUE');
        
        // Update metrics
        setLiveMetrics(prev => ({
          discovery: Math.min(25, prev.discovery + 5),
          value: Math.min(25, prev.value + 3),
          objection: Math.min(25, prev.objection + 4),
          cta: Math.min(25, prev.cta + 2),
          suggestions: ['Ask about specific pest concerns', 'Mention safety features', 'Offer flexible scheduling']
        }));

        // Simulate customer speaking
        setIsCustomerSpeaking(true);
        setTimeout(() => setIsCustomerSpeaking(false), 2000);
      }, 1500);
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const endSimulation = async () => {
    setEvaluation({
      eval: {
        score: Math.floor(Math.random() * 30) + 70,
        result: 'advanced',
        feedback_bullets: [
          'Good rapport building with homeowner',
          'Addressed safety concerns effectively',
          'Clear value proposition presented'
        ],
        missed_opportunities: [
          'Could have asked more discovery questions',
          'Missed opportunity to mention neighbor references'
        ]
      }
    });
    setIsSessionActive(false);
  };

  const resetSimulation = () => {
    setAttemptId('');
    setCurrentState('');
    setMessages([]);
    setIsSessionActive(false);
    setIsTerminal(false);
    setIsCustomerSpeaking(false);
    setIsProcessing(false);
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">DoorIQ Voice Training</h1>
          <p className="text-gray-400">Practice door-to-door pest control sales with AI homeowners</p>
        </div>

        {!isSessionActive && !evaluation ? (
          /* Start Screen */
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-4">Ready to Practice?</h2>
              <p className="text-gray-300 mb-6">
                You'll knock on a door and speak with a homeowner about pest control services. 
                Use your voice to have a natural conversation.
              </p>
              
              {/* Persona Selector */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Choose Homeowner Type:
                </label>
                <select
                  value={selectedPersonaType}
                  onChange={(e) => setSelectedPersonaType(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
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
                disabled={isProcessing}
                className="primary-button text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Starting...' : 'Start Voice Training'}
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
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-6">Training Complete!</h2>
              
              {/* Score */}
              <div className="text-center mb-8">
                <div className="text-5xl font-bold text-white mb-2">
                  {evaluation.eval?.score || 0}%
                </div>
                <div className="text-lg font-medium text-gray-300 capitalize">
                  Result: {evaluation.eval?.result || 'completed'}
                </div>
              </div>

              {/* Feedback */}
              {evaluation.eval && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-3">Strengths</h3>
                    <ul className="space-y-2">
                      {(evaluation.eval.feedback_bullets || []).map((bullet: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start gap-2">
                          <span className="text-green-400 mt-1">✓</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-orange-400 mb-3">Missed Opportunities</h3>
                    <ul className="space-y-2">
                      {(evaluation.eval.missed_opportunities || []).map((opportunity: string, i: number) => (
                        <li key={i} className="text-gray-300 flex items-start gap-2">
                          <span className="text-orange-400 mt-1">!</span>
                          {opportunity}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <button
                onClick={resetSimulation}
                className="w-full primary-button text-white py-3 rounded-lg font-semibold"
              >
                Start New Training Session
              </button>
            </div>
          </motion.div>
        ) : (
          /* Active Voice Training */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Chat Area */}
            <div className="lg:col-span-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-[600px] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-white/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Homeowner</h3>
                      <p className="text-sm text-gray-400">State: {currentState}</p>
                    </div>
                  </div>
                  <button
                    onClick={resetSimulation}
                    className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
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
                              ? 'bg-green-600/20 text-green-100' 
                              : 'bg-blue-600/20 text-blue-100'
                          }`}>
                            <p className="text-sm">{message.text}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 px-2">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'rep' ? 'order-1 mr-2 bg-green-600' : 'order-2 ml-2 bg-blue-600'
                        }`}>
                          {message.role === 'rep' ? (
                            <Briefcase className="w-4 h-4 text-white" />
                          ) : (
                            <User className="w-4 h-4 text-white" />
                          )}
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
                      <span className="text-sm">Homeowner is speaking...</span>
                    </motion.div>
                  )}

                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 text-gray-400"
                    >
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                      <span className="text-sm">Processing your response...</span>
                    </motion.div>
                  )}
                </div>

                {/* Voice Controls */}
                {!isTerminal && (
                  <div className="p-4 border-t border-white/20">
                    <div className="flex justify-center">
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
                    </div>
                    
                    <p className="text-center text-gray-400 mt-4 text-sm">
                      {isRecording ? 'Recording... Click to stop' : 
                       isCustomerSpeaking ? 'Homeowner is speaking...' :
                       isProcessing ? 'Processing...' :
                       'Click to respond with your voice'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Live Metrics Sidebar - NO PROSPECT INFO SHOWN */}
            <div className="space-y-6">
              {/* Performance Metrics */}
              {isSessionActive && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-green-400" />
                    Live Performance
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(liveMetrics).filter(([key]) => key !== 'suggestions').map(([key, value]) => (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-400 capitalize">{key}</span>
                          <span className="text-sm font-medium text-white">{value}/25</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
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
                    <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">Live Tips:</h4>
                      <ul className="text-xs text-blue-200 space-y-1">
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
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                  <h3 className="font-semibold text-white mb-4">Session Info</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">State:</span>
                      <span className="font-medium text-white capitalize">{currentState}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exchanges:</span>
                      <span className="font-medium text-white">{Math.floor(messages.length / 2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Goal:</span>
                      <span className="font-medium text-white">Schedule Service</span>
                    </div>
                  </div>
                  
                  {!isTerminal && messages.length > 4 && (
                    <button
                      onClick={endSimulation}
                      className="w-full mt-4 bg-gray-600/50 hover:bg-gray-600/70 text-white py-2 rounded-lg text-sm font-medium border border-gray-500"
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

export default App;