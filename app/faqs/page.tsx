import { FaqSection } from '@/components/ui/faq-section'

const items = [
  {
    question: 'What is DoorIQ?',
    answer: 'DoorIQ lets sales reps practice live conversations with AI homeowners and get instant feedback.'
  },
  {
    question: 'How do I start a practice session?',
    answer: 'Go to the Trainer, pick a persona, and click Start Training. You can use a headset mic for best quality.'
  },
  {
    question: 'Can managers review results?',
    answer: 'Yes. Managers can review transcripts, scores, and coach on key moments to improve close rates.'
  },
  {
    question: 'Do you offer team pricing?',
    answer: "Yes. See the Pricing page or contact us and we'll tailor a plan to your team size."
  },
  {
    question: 'How realistic are the AI homeowners?',
    answer: 'Our AI homeowners use advanced natural language processing to respond realistically to your pitch. They can handle objections, ask questions, and even show different personality types - from skeptical to interested. Many reps report that practicing with our AI feels just like real door-to-door conversations.'
  },
  {
    question: 'Can I upload and analyze my real sales calls?',
    answer: 'Yes! With the Individual and Team plans, you can upload recordings of your actual sales calls. Our AI will analyze them, provide detailed feedback, and help you identify areas for improvement. This feature is perfect for reviewing real-world performance alongside your practice sessions.'
  },
  {
    question: 'What kind of analytics do I get?',
    answer: 'You get comprehensive analytics including scores for rapport, discovery, objection handling, and closing. We also track metrics like speaking pace, filler words, question ratio, and more. Managers get team-wide dashboards showing performance trends, leaderboards, and individual rep progress over time.'
  },
  {
    question: 'Is there a mobile app?',
    answer: 'DoorIQ works great on mobile browsers! While we don\'t have a dedicated mobile app yet, our platform is fully responsive and optimized for smartphones and tablets. You can practice sessions, review analytics, and access all features from any device with an internet connection.'
  },
  {
    question: 'How does the free trial work?',
    answer: 'The free plan gives you 5 practice call credits per month to try out DoorIQ. You get access to 3 AI training agents and full analytics for your sessions. No credit card required to start. If you want unlimited practice and access to all features, you can upgrade to Individual or Team plans anytime.'
  },
]

export default function FaqsPage() {
  return (
    <div className="min-h-[60vh]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold">FAQs</h1>
        <p className="mt-2 text-slate-300">Common questions about setup, training, and analytics.</p>
      </div>
      <FaqSection title="Frequently Asked Questions" items={items} />
    </div>
  )
}


