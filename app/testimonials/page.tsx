'use client'

import { testimonialsData } from '@/components/ui/testimonials-columns-1'
import { Star } from 'lucide-react'
import Image from 'next/image'

// Extended testimonials with company names
const extendedTestimonials = [
  {
    ...testimonialsData[0],
    company: "SolarTech Solutions",
    expandedText: "DoorIQ gave our new hires the confidence they needed in half the time. We can't imagine onboarding without it now. The AI homeowners are incredibly realistic, and the instant feedback helps reps correct mistakes before they become habits. Our close rate has improved by 35% since implementing DoorIQ across our team."
  },
  {
    ...testimonialsData[1],
    company: "HomeSafe Security",
    expandedText: "Our entire org trains on DoorIQ. The AI homeowners feel surprisingly real and the feedback is actionable. We've seen a dramatic improvement in objection handling across all our reps. The analytics dashboard gives us clear insights into where each team member needs coaching, making our training sessions much more effective."
  },
  {
    ...testimonialsData[2],
    company: "PestGuard Services",
    expandedText: "The weekly leaderboards keep the team competitive and actually excited about practice reps. It's transformed our culture from dreading role-plays to actively seeking them out. Reps are now practicing 3-4 times per week on their own time, and we're seeing consistent improvement in their real-world performance metrics."
  },
  {
    ...testimonialsData[3],
    company: "RoofMasters Inc.",
    expandedText: "We saw deal velocity jump within the first month. DoorIQ turned coaching into a superpower for our managers. Instead of spending hours doing role-plays, managers can now review recorded sessions and provide targeted feedback. The time savings alone have been worth the investment, but the performance gains are what really sold us."
  },
  {
    ...testimonialsData[4],
    company: "CleanAir HVAC",
    expandedText: "Scheduling live call reviews used to take hours. Now reps self-correct after every simulated conversation. The AI identifies patterns we never would have caught manually. Our new hires are getting up to speed 50% faster, and veteran reps are using it to sharpen their skills and try new approaches risk-free."
  },
  {
    ...testimonialsData[5],
    company: "WindowPro Solutions",
    expandedText: "DoorIQ keeps our remote team sharp between sessions. It's the secret sauce behind our record summer. With team members spread across three states, consistent training was always a challenge. Now everyone has access to the same high-quality practice sessions, and our performance metrics have never been more aligned."
  },
]

export default function TestimonialsPage() {
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

        {/* Testimonials - 2 per row, 25% smaller */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
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
                    className="w-3 h-3 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-white font-medium text-sm leading-relaxed mb-4">
                &ldquo;{testimonial.expandedText}&rdquo;
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
                  <p className="text-xs text-purple-400 font-semibold mt-0.5">{testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

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

