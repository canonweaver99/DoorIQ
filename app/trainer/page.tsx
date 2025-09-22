'use client';
import { useEffect, useRef, useState } from 'react';

interface AgentData {
  name: string;
  avatar_url: string | null;
  avatar_initials: string;
  persona_description: string;
}

export default function Trainer() {
  const [sessionId, setSessionId] = useState<string>('');
  const [input, setInput] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const [turns, setTurns] = useState<Array<{speaker:string,text:string}>>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [agent, setAgent] = useState<AgentData | null>(null);

  useEffect(() => {
    // Start a session and fetch agent data
    async function initialize() {
      // Create session
      const sessionRes = await fetch('/api/session', { method: 'POST' });
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.sessionId);

      // Fetch agent data
      const agentRes = await fetch('/api/agent');
      const agentData = await agentRes.json();
      setAgent(agentData);
    }
    initialize();
  }, []);

  async function speak(text: string) {
    setIsPlaying(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ text })
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Speech error:', error);
    } finally {
      setIsPlaying(false);
    }
  }

  async function send() {
    const userText = input.trim();
    if (!userText || !sessionId) return;
    setTurns(t => [...t, { speaker: 'rep', text: userText }]);
    setInput('');

    try {
      const r = await fetch('/api/reply', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ sessionId, userText })
      });
      const data = await r.json();
      const reply = data.replyText || '(no reply)';
      setTurns(t => [...t, { speaker: 'homeowner', text: reply }]);

      // Play reply via TTS proxy
      await speak(reply);
    } catch (error) {
      console.error('Reply error:', error);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">DoorIQ Sales Trainer</h1>
          <p className="text-gray-400">Practice with {agent?.name || 'Amanda Rodriguez'} - Suburban Mom</p>
          {sessionId && <p className="text-xs text-gray-500 mt-2">Session: {sessionId}</p>}
        </div>

        {/* Floating Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* Pulsing ring effect */}
            <div className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-pulse bg-purple-500/30' : 'bg-purple-500/10'} blur-xl`}></div>
            
            {/* Main avatar circle */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/30 shadow-2xl">
              {agent?.avatar_url ? (
                <img 
                  src={agent.avatar_url} 
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {agent?.avatar_initials || 'AR'}
                  </span>
                </div>
              )}
              
              {/* Speaking indicator */}
              {isPlaying && (
                <div className="absolute inset-0 bg-purple-500/20 flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Agent name and description */}
            <div className="text-center mt-4">
              <h3 className="text-lg font-semibold text-white">{agent?.name || 'Amanda Rodriguez'}</h3>
              <p className="text-sm text-gray-400 max-w-xs">{agent?.persona_description}</p>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          <div className="h-96 overflow-auto space-y-4 mb-4">
            {turns.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                <p>Start the conversation! Try knocking on Amanda&apos;s door...</p>
                <p className="text-sm mt-2">Example: &quot;Hi there! I&apos;m from SafeGuard Pest Control...&quot;</p>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={`flex ${t.speaker === 'rep' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  t.speaker === 'rep' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-purple-600 text-white'
                }`}>
                  <div className="text-xs opacity-75 mb-1">
                    {t.speaker === 'rep' ? 'You (Sales Rep)' : 'Amanda (Homeowner)'}
                  </div>
                  <div>{t.text}</div>
                </div>
              </div>
            ))}
            {isPlaying && (
              <div className="flex justify-start">
                <div className="bg-purple-600/50 text-white px-4 py-2 rounded-lg">
                  <div className="text-xs opacity-75 mb-1">Amanda is speaking...</div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-3">
            <input
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response... (Press Enter to send)"
              disabled={isPlaying}
            />
            <button 
              onClick={send} 
              disabled={!input.trim() || isPlaying || !sessionId}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              Send
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="text-2xl font-bold text-blue-400">{turns.filter(t => t.speaker === 'rep').length}</div>
            <div className="text-sm text-gray-400">Your Messages</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="text-2xl font-bold text-purple-400">{turns.filter(t => t.speaker === 'homeowner').length}</div>
            <div className="text-sm text-gray-400">Amanda&apos;s Responses</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 border border-white/20">
            <div className="text-2xl font-bold text-green-400">{Math.ceil(turns.length / 2)}</div>
            <div className="text-sm text-gray-400">Conversation Turns</div>
          </div>
        </div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </div>
    </div>
  );
}
