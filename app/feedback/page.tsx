'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Star, RotateCcw, Home } from 'lucide-react';

interface FeedbackData {
  overallScore: number;
  duration: string;
  transcript: Array<{speaker: string, text: string}>;
  scores: {
    rapport: number;
    introduction: number;
    listening: number;
    salesTechnique: number;
    closing: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
    specificTips: string[];
  };
}

function FeedbackInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get conversation data from URL params or localStorage
    const duration = searchParams?.get('duration') || '0:00';
    const transcriptData = searchParams?.get('transcript');
    
    let transcript = [];
    if (transcriptData) {
      try {
        transcript = JSON.parse(decodeURIComponent(transcriptData));
      } catch {
        transcript = [];
      }
    }

    // Generate AI-powered feedback based on the conversation
    generateFeedback(transcript, duration);
  }, [searchParams]);

  const generateFeedback = (transcript: any[], duration: string) => {
    // Simulate AI analysis - in a real app this would call an AI service
    setTimeout(() => {
      // Analyze conversation quality
      const hasRapport = transcript.some(turn => 
        turn.speaker === 'rep' && (
          turn.text.toLowerCase().includes('how are you') ||
          turn.text.toLowerCase().includes('nice weather') ||
          turn.text.toLowerCase().includes('how long') ||
          turn.text.toLowerCase().includes('tell me about')
        )
      );

      const hasIntroduction = transcript.some(turn =>
        turn.speaker === 'rep' && (
          turn.text.toLowerCase().includes('my name') ||
          turn.text.toLowerCase().includes('i\'m from') ||
          turn.text.toLowerCase().includes('company') ||
          turn.text.toLowerCase().includes('pest control')
        )
      );

      const hasListening = transcript.filter(turn => turn.speaker === 'homeowner').length > 2;
      
      const hasSalesTalk = transcript.some(turn =>
        turn.speaker === 'rep' && (
          turn.text.toLowerCase().includes('service') ||
          turn.text.toLowerCase().includes('treatment') ||
          turn.text.toLowerCase().includes('price') ||
          turn.text.toLowerCase().includes('schedule')
        )
      );

      // Calculate scores
      const scores = {
        rapport: hasRapport ? 85 + Math.floor(Math.random() * 15) : 40 + Math.floor(Math.random() * 30),
        introduction: hasIntroduction ? 80 + Math.floor(Math.random() * 20) : 30 + Math.floor(Math.random() * 40),
        listening: hasListening ? 75 + Math.floor(Math.random() * 25) : 45 + Math.floor(Math.random() * 35),
        salesTechnique: hasSalesTalk ? 70 + Math.floor(Math.random() * 30) : 35 + Math.floor(Math.random() * 35),
        closing: Math.floor(Math.random() * 40) + 50
      };

      const overallScore = Math.round((scores.rapport + scores.introduction + scores.listening + scores.salesTechnique + scores.closing) / 5);

      const strengths = [];
      const improvements = [];
      const specificTips = [];

      if (scores.rapport >= 70) {
        strengths.push("Excellent rapport building - you made Amanda feel comfortable");
      } else {
        improvements.push("Work on building rapport before introducing business topics");
        specificTips.push("Try asking 'How are you doing today?' or commenting on the weather first");
      }

      if (scores.introduction >= 70) {
        strengths.push("Clear introduction of yourself and your company");
      } else {
        improvements.push("Introduce yourself and your company early in the conversation");
        specificTips.push("Say something like 'Hi! I'm [Name] from [Company]. We provide pest control services in the area.'");
      }

      if (scores.listening >= 70) {
        strengths.push("Good active listening - you let Amanda respond naturally");
      } else {
        improvements.push("Listen more and ask follow-up questions");
        specificTips.push("When Amanda mentions something, ask 'Can you tell me more about that?' or 'How long has that been going on?'");
      }

      setFeedbackData({
        overallScore,
        duration,
        transcript,
        scores,
        feedback: {
          strengths: strengths.length ? strengths : ["You completed the conversation - that's a great start!"],
          improvements: improvements.length ? improvements : ["Keep practicing to build confidence"],
          specificTips: specificTips.length ? specificTips : ["Focus on building genuine connections with potential customers"]
        }
      });
      setLoading(false);
    }, 1500);
  };

  const ScoreCard = ({ title, score, description }: { title: string; score: number; description: string }) => (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
        <div className="flex items-center gap-1">
          <Star className={`w-4 h-4 ${score >= 80 ? 'text-yellow-400 fill-current' : score >= 60 ? 'text-yellow-400' : 'text-gray-400'}`} />
          <span className={`text-lg font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
            {score}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium">Analyzing your conversation...</p>
          <p className="text-sm text-gray-400 mt-2">Generating personalized feedback</p>
        </div>
      </div>
    );
  }

  if (!feedbackData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Unable to generate feedback</p>
          <button 
            onClick={() => router.push('/door')}
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Conversation Analysis</h1>
          <p className="text-gray-400">Here's how you did with Amanda Rodriguez</p>
        </div>

        {/* Overall Score */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className={`text-6xl font-bold ${
              feedbackData.overallScore >= 80 ? 'text-green-400' : 
              feedbackData.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {feedbackData.overallScore}
            </div>
            <div className="text-2xl text-gray-400 ml-2">/100</div>
          </div>
          <p className="text-lg font-medium mb-2">
            {feedbackData.overallScore >= 80 ? 'Excellent Performance!' : 
             feedbackData.overallScore >= 60 ? 'Good Job!' : 'Keep Practicing!'}
          </p>
          <p className="text-sm text-gray-400">
            Conversation Duration: {feedbackData.duration}
          </p>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <ScoreCard 
            title="Rapport Building" 
            score={feedbackData.scores.rapport}
            description="Building connection and trust"
          />
          <ScoreCard 
            title="Introduction" 
            score={feedbackData.scores.introduction}
            description="Presenting yourself professionally"
          />
          <ScoreCard 
            title="Active Listening" 
            score={feedbackData.scores.listening}
            description="Responding to customer needs"
          />
          <ScoreCard 
            title="Sales Technique" 
            score={feedbackData.scores.salesTechnique}
            description="Product presentation skills"
          />
          <ScoreCard 
            title="Conversation Flow" 
            score={feedbackData.scores.closing}
            description="Natural conversation management"
          />
        </div>

        {/* Feedback Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="bg-green-500/10 rounded-lg p-6 border border-green-500/20">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5" />
              What You Did Well
            </h3>
            <ul className="space-y-2">
              {feedbackData.feedback.strengths.map((strength, index) => (
                <li key={index} className="text-sm text-green-100 flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-yellow-500/10 rounded-lg p-6 border border-yellow-500/20">
            <h3 className="text-lg font-semibold text-yellow-400 mb-4">Areas for Improvement</h3>
            <ul className="space-y-2">
              {feedbackData.feedback.improvements.map((improvement, index) => (
                <li key={index} className="text-sm text-yellow-100 flex items-start gap-2">
                  <span className="text-yellow-400 mt-1">→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Specific Tips */}
        <div className="bg-purple-500/10 rounded-lg p-6 border border-purple-500/20 mb-8">
          <h3 className="text-lg font-semibold text-purple-400 mb-4">Next Time, Try This:</h3>
          <ul className="space-y-2">
            {feedbackData.feedback.specificTips.map((tip, index) => (
              <li key={index} className="text-sm text-purple-100 flex items-start gap-2">
                <span className="text-purple-400 mt-1">💡</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.push('/door')}
            className="flex items-center gap-2 px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold transition"
          >
            <RotateCcw className="w-5 h-5" />
            Practice Again
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold transition"
          >
            <Home className="w-5 h-5" />
            Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Feedback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0b1020] via-[#0c0f17] to-[#0b1020] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    }>
      <FeedbackInner />
    </Suspense>
  );
}
