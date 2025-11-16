import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                process.env.NEXT_PUBLIC_APP_URL || 
                'https://dooriq.ai'

export const aboutMetadata: Metadata = {
  title: "About Us - DoorIQ",
  description: "Learn about DoorIQ - the AI-powered sales training platform helping door-to-door sales teams practice pitches, handle objections, and improve performance with realistic AI homeowner personas.",
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: "About Us - DoorIQ",
    description: "Learn about DoorIQ - the AI-powered sales training platform helping door-to-door sales teams practice pitches and improve performance.",
    url: `${siteUrl}/about`,
    images: [
      {
        url: '/FullLogo.png',
        width: 1200,
        height: 630,
        alt: 'About DoorIQ',
      },
    ],
  },
}

