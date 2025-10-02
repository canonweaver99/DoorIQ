'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { Star, RotateCcw, Home, BarChart3 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface FeedbackData {
  overallScore: number;
  duration: string;
  transcript: Array<{ speaker: string; text: string; timestamp?: string | Date }>;
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

  const loadSessionData = useCallback(async (sessionId: string, duration: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('live_sessions')
        .select('id, full_transcript, duration_seconds, analytics, overall_score, rapport_score, introduction_score, listening_score, objection_handling_score, close_effectiveness_score, safety_score')
        .eq('id', sessionId)
        .single();

      if (error) throw error;

      // Use saved scores or generate basic feedback
      const transcript = Array.isArray((data as any)?.full_transcript) ? (data as any).full_transcript : [];
      generateFeedback(data, duration, transcript);
    } catch (error) {
      console.error('Error loading session:', error);
      generateBasicFeedback(duration);
    }
  }, []);

  useEffect(() => {
    const duration = searchParams?.get('duration') || '0:00';
    const sessionId = searchParams?.get('session');

    if (sessionId) {
      loadSessionData(sessionId, duration);
    } else {
      generateBasicFeedback(duration);
    }
  }, [searchParams, loadSessionData]);

  const generateFeedback = (sessionData: any, duration: string, transcript: Array<{ speaker: string; text: string; timestamp?: string | Date }>) => {
    const scores = {
      rapport: sessionData.rapport_score || 75,
      introduction: sessionData.introduction_score || 80,
      listening: sessionData.listening_score || 75,
      salesTechnique: sessionData.objection_handling_score || 70,
      closing: sessionData.close_effectiveness_score || 75
    };

    const overallScore = sessionData.overall_score || Math.round(
      Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.values(scores).length
    );

    // Use AI feedback if available, otherwise use default
    const aiFeedback = sessionData.analytics?.feedback;
    const feedback = aiFeedback ? {
      strengths: aiFeedback.strengths || [
        "Maintained professional demeanor throughout",
        "Successfully engaged with the homeowner",
        "Demonstrated product knowledge"
      ],
      improvements: aiFeedback.improvements || [
        "Focus on building stronger rapport early",
        "Ask more discovery questions",
        "Practice objection handling techniques"
      ],
      specificTips: aiFeedback.specificTips || [
        "Start with a friendly greeting and compliment",
        "Ask about their current pest concerns",
        "Address safety for pets and children upfront"
      ]
    } : {
      strengths: [
        "Maintained professional demeanor throughout",
        "Successfully engaged with the homeowner",
        "Demonstrated product knowledge"
      ],
      improvements: [
        "Focus on building stronger rapport early",
        "Ask more discovery questions",
        "Practice objection handling techniques"
      ],
      specificTips: [
        "Start with a friendly greeting and compliment",
        "Ask about their current pest concerns",
        "Address safety for pets and children upfront"
      ]
    };

    setFeedbackData({
      overallScore,
      duration,
      transcript,
      scores,
      feedback
    });
    setLoading(false);
  };

  const generateBasicFeedback = (duration: string) => {
    setFeedbackData({
      overallScore: 75,
      duration,
      transcript: [],
      scores: {
        rapport: 70,
        introduction: 80,
        listening: 75,
        salesTechnique: 70,
        closing: 75
      },
      feedback: {
        strengths: [
          "Completed the training session",
          "Practiced with Austin",
          "Engaged in conversation"
        ],
        improvements: [
          "Continue practicing to improve scores",
          "Focus on key sales techniques",
          "Work on building rapport"
        ],
        specificTips: [
          "Practice your opening more",
          "Listen actively to customer needs",
          "Close with confidence"
        ]
      }
    });
    setLoading(false);
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
          <p className="text-lg font-medium">Analyzing your session...</p>
          <p className="text-sm text-gray-400 mt-2">Generating feedback</p>
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
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Session Analysis</h1>
          <p className="text-gray-400">Here&#39;s how you did with Austin Rodriguez</p>
        </div>

        {/* Full Transcript - Center Stage */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 mb-8">
          <h2 className="text-lg font-semibold text-gray-200 mb-4 text-center">Full Transcript</h2>
          {feedbackData.transcript && feedbackData.transcript.length > 0 ? (
            <div className="max-w-2xl mx-auto space-y-2 max-h-[50vh] overflow-y-auto p-2">
              {feedbackData.transcript.map((t, idx) => {
                const speaker = (t.speaker === 'user' || t.speaker === 'rep') ? 'user' : 'austin';
                const isUser = speaker === 'user';
                const text = t.text;
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] px-3 py-2 rounded-lg shadow-sm text-sm ${
                      isUser ? 'bg-blue-500 text-white' : 'bg-white text-gray-900 border border-gray-200'
                    }`}>
                      {text}
                      <div className={`text-[10px] mt-1 ${isUser ? 'text-blue-100' : 'text-gray-500'}`}>
                        {t.timestamp ? new Date(t.timestamp as any).toLocaleTimeString() : ''}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center text-gray-400">No transcript captured for this session.</div>
          )}
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
            Session Duration: {feedbackData.duration}
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
            score={Math.round((feedbackData.scores.rapport + feedbackData.scores.listening) / 2)}
            description="Natural conversation management"
          />
          <ScoreCard 
            title="Close Effectiveness" 
            score={feedbackData.scores.closing}
            description="Converting interest to commitment"
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