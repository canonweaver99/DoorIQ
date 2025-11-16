import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                process.env.NEXT_PUBLIC_APP_URL || 
                'https://dooriq.ai'

export const pricingMetadata: Metadata = {
  title: "Pricing - DoorIQ",
  description: "Affordable pricing plans for door-to-door sales training. Start with our Starter plan or scale with Team and Enterprise options. All plans include unlimited AI practice sessions and performance analytics.",
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: "Pricing - DoorIQ",
    description: "Affordable pricing plans for door-to-door sales training. Start with our Starter plan or scale with Team and Enterprise options.",
    url: `${siteUrl}/pricing`,
    images: [
      {
        url: '/FullLogo.png',
        width: 1200,
        height: 630,
        alt: 'DoorIQ Pricing Plans',
      },
    ],
  },
}

