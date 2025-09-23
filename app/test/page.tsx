'use client';
import { useState } from 'react';

export default function TestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    setLoading(true);
    try {
      console.log('Testing token endpoint...');
      const response = await fetch('/api/rt/token', { cache: 'no-store' });
      console.log('Token response status:', response.status);
      
      const data = await response.json();
      console.log('Token response data:', data);
      
      if (response.ok && data.value) {
        setResult(`✅ Token Success!\nClient secret: ${data.value}\nModel: ${data.session?.model || 'unknown'}\nVoice: ${data.session?.audio?.output?.voice || 'unknown'}\nExpires: ${new Date(data.expires_at * 1000).toLocaleString()}`);
      } else {
        setResult(`❌ Token Failed!\nStatus: ${response.status}\nError: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error: any) {
      console.error('Token test error:', error);
      setResult(`❌ Network Error!\n${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">OpenAI Realtime Token Test</h1>
      
      <button
        onClick={testToken}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-6 py-3 rounded-lg font-semibold mb-6"
      >
        {loading ? 'Testing...' : 'Test Token Endpoint'}
      </button>
      
      {result && (
        <div className="bg-gray-900 p-4 rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{result}</pre>
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-400">
        <p>This will test:</p>
        <ul className="list-disc list-inside mt-2">
          <li>OPENAI_API_KEY environment variable</li>
          <li>OpenAI Realtime client_secrets endpoint</li>
          <li>Token structure and client_secret.value</li>
        </ul>
      </div>
    </div>
  );
}
