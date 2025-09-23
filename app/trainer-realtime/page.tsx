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

export default function TrainerRealtime() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; timestamp: string }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [grading, setGrading] = useState<Grading | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    // Fetch agent data on load
    async function loadAgent() {
      try {
        const agentRes = await fetch('/api/agent');
        const agentData = await agentRes.json();
        setAgent(agentData);
      } catch (e) {
        console.error('Failed to load agent:', e);
      }
    }
    loadAgent();
  }, []);

  async function start() {
    setError(null);
    try {
      // Create DB session
      const sessionRes = await fetch('/api/session', { 
        method: 'POST', 
        headers: { 'content-type': 'application/json' }, 
        body: JSON.stringify({}) 
      });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.sessionId);

      // Get realtime token
      const tokenRes = await fetch('/api/realtime/token');
      const tokenData = await tokenRes.json();
      if (!tokenData?.token) { 
        setError('No realtime token'); 
        return; 
      }

      // Import and setup OpenAI Realtime
      const { RealtimeAgent, RealtimeSession } = await import('@openai/agents/realtime');
      
      const agent = new RealtimeAgent({
        name: 'Amanda',
        instructions: `You are Amanda Rodriguez, a realistic suburban homeowner used to train door-to-door pest control sales reps. 

34 years old, marketing director, married to David with kids Sofia (6) and Lucas (3), and a Goldendoodle named Bailey.

You're polite but time-constrained. You value child & pet safety, clear pricing, and professional service.

Keep replies short and natural (1-3 sentences). You're considering pest control but need convincing on safety, pricing, and scheduling.

Ask direct questions like "Is this safe for kids and pets?" and "What's this going to cost?"

If they address safety clearly and offer a specific time window, you become more interested.`,
      });
      
      const session = new RealtimeSession(agent);
      sessionRef.current = session;

      // Log messages to database
      (session as any).on('message', async (m: any) => {
        if (m?.content) {
          const message = {
            role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
            text: String(m.content),
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, message]);
          
          // Save to database
          try {
            await fetch('/api/turns/add', { 
              method: 'POST', 
              headers: { 'content-type': 'application/json' }, 
              body: JSON.stringify({ 
                sessionId: sessionData.sessionId, 
                speaker: m.role === 'assistant' ? 'homeowner' : 'rep', 
                text: String(m.content), 
                ts: new Date().toISOString() 
              }) 
            });
          } catch (e) {
            console.error('Failed to save turn:', e);
          }
        }
      });

      // Connect mic and speaker
      await session.connect({ apiKey: tokenData.token });
      setConnected(true);
      setIsListening(true);
      
    } catch (e: any) {
      setError(e?.message || 'start-failed');
    }
  }

  async function stop() {
    try { 
      await sessionRef.current?.disconnect(); 
      setIsListening(false);
    } catch {}
    setConnected(false);
  }

  async function endAndGrade() {
    try {
      if (sessionId) {
        const res = await fetch('/api/session/end', { 
          method: 'POST', 
          headers: { 'content-type': 'application/json' }, 
          body: JSON.stringify({ sessionId }) 
        });
        const data = await res.json();
        setGrading(data.grading);
        setSessionEnded(true);
      }
      await stop();
    } catch (e: any) {
      setError(e?.message || 'grade-failed');
    }
  }

  function resetSession() {
    window.location.reload();
  }

  if (sessionEnded && grading) {
    // Beautiful Feedback Screen
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
          {sessionId && <p className="text-xs text-gray-500 mt-2">Session: {sessionId.slice(0, 8)}...</p>}
        </div>

        {/* Amanda's Avatar */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Pulsing ring effect */}
            <div className={`absolute inset-0 rounded-full blur-2xl ${
              connected && isListening ? 'animate-pulse bg-green-500/30' : 
              connected ? 'bg-purple-500/20' :
              'bg-gray-500/10'
            }`}></div>
            
            {/* Main avatar circle */}
            <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-2xl">
              {agent?.avatar_url ? (
                <img 
                  src={agent.avatar_url} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-6xl font-bold text-white">
                    {agent?.avatar_initials || 'AR'}
                  </span>
                </div>
              )}
              
              {/* Status overlays */}
              {connected && isListening && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
              
              {!connected && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">Ready to connect</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Agent info */}
            <div className="text-center mt-6">
              <h3 className="text-2xl font-semibold text-white">{agent?.name || 'Amanda Rodriguez'}</h3>
              <p className="text-purple-300 text-sm mt-1">Suburban Mom • Marketing Director</p>
              <p className="text-gray-400 text-xs mt-2 max-w-md mx-auto">{agent?.persona_description}</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
            connected ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
            'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            {connected ? '🎤 Live conversation active' : '⚪ Ready to connect'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-4">
          {!connected ? (
            <button 
              onClick={start} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition-colors shadow-lg"
            >
              🚀 Start Conversation
            </button>
          ) : (
            <>
              <button 
                onClick={stop} 
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors"
              >
                ⏸️ Stop
              </button>
              <button 
                onClick={endAndGrade} 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-xl font-semibold transition-colors shadow-lg"
              >
                📊 End & Grade
              </button>
            </>
          )}
        </div>

        {/* Live Conversation */}
        {messages.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              💬 Live Conversation
              <span className="text-sm text-gray-400">({messages.length} messages)</span>
            </h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-purple-600 text-white'
                  }`}>
                    <div className="text-xs opacity-75 mb-1">
                      {msg.role === 'user' ? 'You (Sales Rep)' : 'Amanda (Homeowner)'}
                    </div>
                    <div className="text-sm">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-center text-gray-400 text-sm max-w-2xl mx-auto">
          {!connected ? (
            <p>Click &quot;Start Conversation&quot; to begin practicing with Amanda. Your microphone and speakers will be activated for a natural conversation experience.</p>
          ) : (
            <p>🎤 <strong>Microphone is live!</strong> Speak naturally to Amanda. She&apos;ll respond with voice. When you&apos;re done, click &quot;End & Grade&quot; to see your performance.</p>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}
      </div>
    </div>
  );
}