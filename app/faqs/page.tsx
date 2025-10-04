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


