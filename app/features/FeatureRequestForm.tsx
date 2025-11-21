'use client'

import { useState } from 'react'
import { GlowCard } from '@/components/ui/spotlight-card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Send, Loader2 } from 'lucide-react'

export default function FeatureRequestForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    featureDescription: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/features/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit feature request')
      }

      setSubmitted(true)
      setFormData({ name: '', email: '', featureDescription: '' })
      
      setTimeout(() => {
        setSubmitted(false)
      }, 5000)
    } catch (error) {
      console.error('Error submitting feature request:', error)
      alert('Failed to submit feature request. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <GlowCard
      glowColor="purple"
      customSize
      className="p-8 sm:p-10 bg-card/60 dark:bg-black/60"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-space font-bold text-foreground mb-4">
          Have a Feature Idea?
        </h2>
        <p className="text-base sm:text-lg text-foreground/80 font-sans">
          We're always looking to improve DoorIQ. Share your feature requests and we'll consider them for future updates.
        </p>
      </div>

      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2 font-space">
            Thank You!
          </h3>
          <p className="text-foreground/80 font-sans">
            Your feature request has been submitted. We'll review it and get back to you soon.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2 font-space">
              Your Name
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border/40 dark:border-white/20 bg-background dark:bg-black text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2 font-space">
              Your Email
            </label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border/40 dark:border-white/20 bg-background dark:bg-black text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-sans"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label htmlFor="featureDescription" className="block text-sm font-medium text-foreground mb-2 font-space">
              Feature Description
            </label>
            <textarea
              id="featureDescription"
              required
              rows={6}
              value={formData.featureDescription}
              onChange={(e) => setFormData({ ...formData, featureDescription: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-border/40 dark:border-white/20 bg-background dark:bg-black text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none font-sans"
              placeholder="Tell us about the feature you'd like to see..."
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Feature Request
              </>
            )}
          </Button>
        </form>
      )}
    </GlowCard>
  )
}

