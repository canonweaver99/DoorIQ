'use client'

import { testimonialsData } from '@/components/ui/testimonials-columns-1'
import { Star } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Reviews with full text and star ratings (static fallback)
const extendedTestimonials = [
  {
    ...testimonialsData[0],
    stars: 5,
    fullText: "The AI agents sound so real. I love using this software. It's become part of my daily routine."
  },
  {
    ...testimonialsData[1],
    stars: 5,
    fullText: "This is amazing. Sometimes I forget I'm even practicing. The conversations flow so naturally."
  },
  {
    ...testimonialsData[2],
    stars: 5,
    fullText: "The AI sounds just like real people. Really impressed. It's become my favorite way to practice."
  },
  {
    ...testimonialsData[3],
    stars: 5,
    fullText: "Mind blown by how real these agents sound. Love it. Every conversation feels completely authentic."
  },
  {
    ...testimonialsData[4],
    stars: 5,
    fullText: "Can't believe how realistic this is. Conversations feel natural. Makes practicing actually fun."
  },
  {
    ...testimonialsData[5],
    stars: 5,
    fullText: "The agents sound so real it's crazy. Really enjoying this. I look forward to every session."
  },
  {
    ...testimonialsData[6],
    stars: 5,
    fullText: "DoorIQ is awesome. The AI responds just like real people. Keeps me coming back for more."
  },
  {
    ...testimonialsData[7],
    stars: 5,
    fullText: "Love how real the conversations feel. This is legit. Exceeded all my expectations honestly."
  },
  {
    ...testimonialsData[8],
    stars: 5,
    fullText: "The agents sound exactly like real homeowners. So good. Every conversation feels genuine."
  },
  {
    ...testimonialsData[9],
    stars: 5,
    fullText: "Really impressed. It's like talking to actual people. The software makes practicing feel real."
  },
]

interface Testimonial {
  id?: string
  name: string
  location: string
  rating: number
  review: string
  fullText: string
  stars: number
  image?: string
  profile_image_url?: string
}

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
  const [acceptedTestimonials, setAcceptedTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch accepted testimonials from database
  useEffect(() => {
    const fetchAcceptedTestimonials = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('status', 'accepted')
          .order('accepted_at', { ascending: false })

        if (error) {
          console.error('Error fetching testimonials:', error)
          return
        }

        if (data) {
          const formatted = data.map((t: any) => ({
            id: t.id,
            name: t.name,
            location: t.location,
            rating: t.rating,
            review: t.review,
            fullText: t.review,
            stars: t.rating,
            image: t.profile_image_url || '',
            profile_image_url: t.profile_image_url
          }))
          setAcceptedTestimonials(formatted)
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAcceptedTestimonials()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const supabase = createClient()
      
      // Get current user if logged in
      const { data: { user } } = await supabase.auth.getUser()
      
      // Save review to database
      const { error } = await supabase
        .from('testimonials')
        .insert({
          name: formData.name,
          location: formData.location,
          rating: formData.rating,
          review: formData.review,
          status: 'pending',
          user_id: user?.id || null
        })

      if (error) {
        console.error('Error submitting review:', error)
        alert('Failed to submit review. Please try again.')
        return
      }

      setSubmitted(true)
      setFormData({ name: '', location: '', rating: 5, review: '' })
      
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
          {/* Show accepted reviews from database first, then static testimonials */}
          {loading ? (
            <div className="col-span-2 text-center text-slate-400 py-8">
              Loading testimonials...
            </div>
          ) : (
            <>
              {acceptedTestimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="group p-4 rounded-xl border border-primary/30 bg-white hover:border-primary/50 transition-all duration-300"
                >
                  {/* Stars */}
                  <div className="flex gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < testimonial.stars
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-none text-gray-400'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Testimonial Text */}
                  <p className="text-black font-medium text-sm leading-relaxed mb-4">
                    &ldquo;{testimonial.fullText}&rdquo;
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    {testimonial.profile_image_url && testimonial.profile_image_url.trim() !== "" && !testimonial.profile_image_url.includes("unsplash.com") && (
                      <img
                        src={testimonial.profile_image_url}
                        alt={testimonial.name}
                        className="w-9 h-9 rounded-full ring-2 ring-gray-200"
                      />
                    )}
                    <div>
                      <p className="font-bold text-black text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-600 font-medium">{testimonial.location}</p>
                    </div>
                  </div>
                </div>
              ))}
              {extendedTestimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group p-4 rounded-xl border border-primary/30 bg-white hover:border-primary/50 transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < testimonial.stars
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-none text-gray-400'
                    }`}
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-black font-medium text-sm leading-relaxed mb-4">
                &ldquo;{testimonial.fullText}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                {testimonial.image && testimonial.image.trim() !== "" && !testimonial.image.includes("unsplash.com") && (
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-9 h-9 rounded-full ring-2 ring-gray-200"
                  />
                )}
                <div>
                  <p className="font-bold text-black text-sm">{testimonial.name}</p>
                  <p className="text-xs text-gray-600 font-medium">{testimonial.role}</p>
                </div>
              </div>
            </div>
              ))}
            </>
          )}
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
                Your review has been submitted and is pending approval. We appreciate your feedback!
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
            href="/pricing"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105"
          >
            Start Now
          </a>
        </div>
      </div>
    </div>
  )
}

