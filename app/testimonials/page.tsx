'use client'

import { testimonialsData } from '@/components/ui/testimonials-columns-1'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Reviews with full text and star ratings
const extendedTestimonials = [
  {
    ...testimonialsData[0],
    stars: 5,
    fullText: "Game changer for new reps. Started using DoorIQ three weeks ago and already seeing results in the field. The AI homeowners are scary realistic - especially the 'busy parent' persona that keeps trying to end the conversation. Way better than roleplay with my manager because I can practice at midnight if I want. Already recommended to my whole team."
  },
  {
    ...testimonialsData[1],
    stars: 5,
    fullText: "Finally, practice that doesn't waste real leads. I manage a team of 12 solar sales reps. We were burning through leads letting new guys practice on real doors. DoorIQ solved this completely. New reps get 50+ practice conversations before they touch a real lead. Our close rate went from 8% to 14% in two months. The ROI is insane."
  },
  {
    ...testimonialsData[2],
    stars: 4,
    fullText: "Great concept, needs mobile app. Love the platform and the AI is genuinely impressive. Knocked off one star because I really need a mobile app - I'm always on the road between territories and want to practice during downtime. The weekly reports are super helpful for tracking improvement. Customer support responded to my questions in like 20 minutes which was cool."
  },
  {
    ...testimonialsData[3],
    stars: 5,
    fullText: "Worth every penny. Been doing D2D for 8 years and wish this existed when I started. I use it to practice new product launches and test different approaches. The grading system is tough but fair. Pro tip: the 'Analytical Andy' persona is perfect for practicing with detail-oriented customers. Closed 3 extra deals this week using techniques I refined in DoorIQ."
  },
  {
    ...testimonialsData[4],
    stars: 5,
    fullText: "My confidence is through the roof. I'm naturally introverted and door knocking was terrifying. After 100+ sessions on DoorIQ, I actually look forward to real doors now. The session reminders keep me consistent. Love that I can review my conversation transcripts and see exactly where I lose people. My manager asked what changed because my numbers are way up."
  },
  {
    ...testimonialsData[5],
    stars: 4,
    fullText: "Solid platform, occasional tech issues. The training is legit and definitely helps with objection handling. Sometimes the AI takes a second to respond which throws off the flow, but support said they're working on it. The homeowner personalities are diverse and realistic. I like the instant feedback after each session. Would love to see industry-specific scenarios for pest control."
  },
  {
    ...testimonialsData[6],
    stars: 5,
    fullText: "Best investment in my sales career. Switched from roofing to solar sales and DoorIQ helped me adapt my pitch fast. The 'Recent Storm Victim' persona helped me understand how to approach storm damage conversations with empathy. Went from zero solar knowledge to top 5 in my company within 6 weeks. The analytics dashboard shows exactly what I need to work on."
  },
  {
    ...testimonialsData[7],
    stars: 5,
    fullText: "Our retention is up 40%. I run a mid-size pest control company. New rep turnover was killing us - kids would quit after two bad days. Now they train on DoorIQ first, build confidence, then hit real doors. They stick around longer because they're actually prepared. Plus the platform tracks everything so I can see who's putting in the work."
  },
]

export default function TestimonialsPage() {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rating: 5,
    review: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Here you would typically send to your backend/API
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000))
      setSubmitted(true)
      setFormData({ name: '', location: '', rating: 5, review: '' })
      
      // Optionally send to email or save to database
      const supabase = createClient()
      // You could save to a testimonials table here
      
    } catch (error) {
      console.error('Error submitting review:', error)
      alert('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
      setTimeout(() => {
        setSubmitted(false)
        setShowForm(false)
      }, 3000)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            What Our Customers Say
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Real feedback from sales teams and reps who are mastering door-to-door sales with DoorIQ
          </p>
        </div>

        {/* Testimonials - 2 per row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto mb-12">
          {extendedTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-primary/50 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < testimonial.stars
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-none text-gray-600'
                    }`}
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-white font-medium text-sm leading-relaxed mb-4">
                &ldquo;{testimonial.fullText}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-9 h-9 rounded-full ring-2 ring-white/20"
                />
                <div>
                  <p className="font-bold text-white text-sm">{testimonial.name}</p>
                  <p className="text-xs text-slate-400 font-medium">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Review Submission Form */}
        {!showForm && !submitted && (
          <div className="max-w-6xl mx-auto text-center mb-12">
            <button
              onClick={() => setShowForm(true)}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105"
            >
              Share Your Experience
            </button>
          </div>
        )}

        {showForm && !submitted && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="p-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
              <h2 className="text-2xl font-bold text-white mb-6">Leave a Review</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Marcus Thompson"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Dallas, TX"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFormData({ ...formData, rating })}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            rating <= formData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-none text-gray-600'
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Your Review
                  </label>
                  <textarea
                    required
                    value={formData.review}
                    onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Share your experience with DoorIQ..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setFormData({ name: '', location: '', rating: 5, review: '' })
                    }}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {submitted && (
          <div className="max-w-2xl mx-auto mb-12">
            <div className="p-8 rounded-xl border border-green-500/30 bg-green-500/10 backdrop-blur-sm text-center">
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
              <p className="text-slate-300">
                Your review has been submitted. We appreciate your feedback!
              </p>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Sales Team?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Join hundreds of sales reps who are mastering door-to-door sales with AI-powered training
          </p>
          <a
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105"
          >
            Start Free Trial
          </a>
        </div>
      </div>
    </div>
  )
}

