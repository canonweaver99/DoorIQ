import Link from 'next/link'
import { 
  ChevronRight, Mic, Activity, Target, Trophy, Users, BarChart3 
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-6">
              DoorIQ Training
            </h1>
            <p className="text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Master door-to-door pest control sales with AI-powered practice sessions
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/auth/signup"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all"
              >
                Get Started Free
                <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg shadow-lg hover:bg-gray-50 border border-gray-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-200 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Top Sales Teams Choose DoorIQ
            </h2>
            <p className="text-xl text-gray-600">
              Practice with Amanda, our AI-powered skeptical homeowner
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Mic className="w-8 h-8" />}
              title="Real Voice Conversations"
              description="Practice with natural voice interactions powered by ElevenLabs AI"
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8" />}
              title="Live Performance Metrics"
              description="Track sentiment, objections, and key moments in real-time"
            />
            <FeatureCard
              icon={<Target className="w-8 h-8" />}
              title="Personalized Feedback"
              description="Get AI-analyzed insights to improve your pitch"
            />
            <FeatureCard
              icon={<Trophy className="w-8 h-8" />}
              title="Gamified Learning"
              description="Earn badges, climb leaderboards, and track streaks"
            />
            <FeatureCard
              icon={<Users className="w-8 h-8" />}
              title="Team Analytics"
              description="Managers can track team performance and progress"
            />
            <FeatureCard
              icon={<BarChart3 className="w-8 h-8" />}
              title="Progress Tracking"
              description="See your improvement over time with detailed analytics"
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Close More Deals?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of sales reps improving their pitch every day
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg shadow-lg hover:bg-gray-50 transform hover:scale-105 transition-all"
          >
            Start Training Now
            <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}