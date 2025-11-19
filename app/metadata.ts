import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                process.env.NEXT_PUBLIC_APP_URL || 
                'https://dooriq.ai'

// Home page metadata
export const homeMetadata: Metadata = {
  title: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
  description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 14 AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 14 AI homeowner personas.",
    url: siteUrl,
    images: [
      {
        url: '/FullLogo.png',
        width: 1200,
        height: 630,
        alt: 'DoorIQ - AI-Powered Sales Training Platform',
      },
    ],
  },
}

