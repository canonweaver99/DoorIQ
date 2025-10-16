'use client'

import { testimonialsData } from '@/components/ui/testimonials-columns-1'
import { Star } from 'lucide-react'
import Image from 'next/image'

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

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonialsData.map((testimonial, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/20 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-white font-medium text-base leading-relaxed mb-6 flex-1">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full ring-2 ring-white/20"
                />
                <div>
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-400 font-medium">{testimonial.role}</p>
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

