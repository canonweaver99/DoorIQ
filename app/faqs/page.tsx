import { FaqSection } from '@/components/ui/faq-section'

const items = [
  {
    question: 'What is DoorIQ?',
    answer: 'DoorIQ is an AI-powered training platform for door-to-door sales reps. Practice real conversations with lifelike AI homeowners who respond naturally, handle objections, and provide realistic training scenarios. Get instant feedback on your performance with detailed scoring and analytics.'
  },
  {
    question: 'How do I start a practice session?',
    answer: 'Navigate to the Trainer page, select an AI homeowner persona that matches the challenge you want to practice, and click "Start Training". Make sure to allow camera and microphone access when prompted. Each session uses one credit from your monthly allowance.'
  },
  {
    question: 'How many practice sessions do I get?',
    answer: 'Free users receive 5 credits per month, which can be used for 5 practice sessions. Paid subscribers get 50 credits per month. Each practice session with an AI homeowner uses one credit. Credits reset monthly on your billing date.'
  },
  {
    question: 'Which AI homeowners can I practice with?',
    answer: 'Free users have access to 3 basic AI agents: Average Austin (skeptical but fair), No Problem Nancy (easy-going), and Already Got It Alan (loyal to current provider). Paid subscribers get access to all 12+ AI training agents, including challenging personas like Not Interested Nick, Too Expensive Tim, and Tag Team Tanya & Tom.'
  },
  {
    question: 'What kind of feedback do I get after a session?',
    answer: 'After each practice session, you receive comprehensive analytics including scores for rapport building, discovery questions, objection handling, and closing techniques. We track speaking pace, filler words, question-to-statement ratio, and provide detailed transcripts with key moments highlighted. Managers can review team-wide performance trends and leaderboards.'
  },
  {
    question: 'Can managers track team performance?',
    answer: 'Yes! Managers have access to a dedicated dashboard showing team-wide analytics, individual rep progress, performance trends over time, and leaderboards. You can review transcripts, scores, and coach on specific moments to help reps improve their close rates.'
  },
  {
    question: 'Is there a free trial for paid plans?',
    answer: 'Yes! When you sign up for a paid subscription, you get a 7-day free trial with full access to all features - all 12+ AI agents, 50 credits, advanced analytics, and team management tools. No credit card is charged during the trial period.'
  },
  {
    question: 'Can I use DoorIQ on my phone?',
    answer: 'Yes! DoorIQ is fully responsive and works great on mobile browsers. While we don\'t have a dedicated mobile app yet, you can practice sessions, review analytics, access transcripts, and use all features from any smartphone or tablet with an internet connection.'
  },
  {
    question: 'How realistic are the AI conversations?',
    answer: 'Our AI homeowners use advanced natural language processing and voice synthesis to create incredibly realistic conversations. They respond naturally to your pitch, handle objections dynamically, ask follow-up questions, and exhibit distinct personality types - from skeptical to interested to dismissive. Many reps report that practicing with our AI feels just like real door-to-door conversations.'
  },
  {
    question: 'Can DoorIQ integrate with our CRM or other sales tools?',
    answer: 'Currently, DoorIQ operates as a standalone platform and does not integrate with external CRM systems or other sales tools. All practice sessions, analytics, transcripts, and performance data are stored securely within DoorIQ\'s platform. You can manually export reports and session data when needed for your records or to share with your team.'
  },
]

export default function FaqsPage() {
  return (
    <div className="min-h-[60vh]">
      <FaqSection title="Frequently Asked Questions" items={items} />
    </div>
  )
}


