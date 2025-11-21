'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"

const faqs = [
  {
    question: "Can I try DoorIQ before committing?",
    answer: "Yes! We offer a 14-day free trial. Try DoorIQ risk-free and see the results for yourself."
  },
  {
    question: "How quickly can my team start practicing?",
    answer: "Your team can start practicing within minutes of signup. No lengthy onboarding or setup required."
  },
  {
    question: "How is this different from roleplay?",
    answer: "Real AI conversations, not awkward coworker practice. Our AI adapts to each rep's responses in real-time, providing authentic scenarios that mirror actual customer interactions."
  },
  {
    question: "Can I track individual rep progress?",
    answer: "Yes, detailed analytics for each rep. You'll see session completion rates, improvement trends, areas of strength, and specific skills that need development."
  },
  {
    question: "What if I need to add or remove reps?",
    answer: "You can adjust your team size anytime. We'll prorate your billing based on the changes."
  },
  {
    question: "How secure is my team's training data?",
    answer: "We take data security seriously. All voice recordings are encrypted in transit and at rest. Audio data is processed securely through our AI partners and automatically deleted after 90 days. We comply with GDPR, CCPA, and other privacy regulations."
  },
  {
    question: "Can DoorIQ integrate with our existing CRM or sales tools?",
    answer: "Currently, DoorIQ operates as a standalone platform focused on training. We're actively working on integrations with popular CRMs and sales tools. Contact us if you'd like to be notified when integrations become available."
  },
  {
    question: "How accurate is the AI feedback and scoring?",
    answer: "Our AI uses advanced natural language processing and speech analysis to evaluate sales conversations. The scoring is based on industry best practices and can identify areas like objection handling, rapport building, and closing techniques. However, AI feedback should complement, not replace, human coaching."
  },
  {
    question: "What happens if I cancel my subscription?",
    answer: "You can cancel anytime from your account settings. Your account will remain active until the end of your current billing period. After cancellation, you'll retain access to your training history and analytics, but new sessions won't be available. You can reactivate your subscription at any time."
  },
  {
    question: "Do you offer customer support if my team needs help?",
    answer: "Yes! We offer email support for all users and priority support for enterprise customers. You can reach us at contact@dooriq.ai or through the Help section in your account. We typically respond within 24 hours during business days."
  }
]

export default function FaqsPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h4 className="text-3xl md:text-4xl font-black text-white mb-6 text-center tracking-tight font-space" style={{ letterSpacing: '-0.01em' }}>
            Frequently Asked Questions
          </h4>
          <div className="space-y-3 max-w-3xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-lg border border-white/20 bg-black overflow-hidden">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                >
                  <h5 className="text-white font-bold text-lg pr-4 font-space">{faq.question}</h5>
                  <ChevronRight 
                    className={`w-5 h-5 text-white flex-shrink-0 transition-transform ${openFAQ === index ? 'rotate-90' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {openFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-base md:text-lg text-white px-5 pb-5 pt-0 font-sans">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}


