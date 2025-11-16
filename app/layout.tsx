import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import Header from "@/components/navigation/Header";
import { Footer } from "@/components/ui/footer-section";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/components/ui/toast";

// Resolve a canonical base URL for metadata to remove Next.js warnings in dev
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  vercelUrl ||
  'http://localhost:3001'

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false, // Not critical, can load later
});

export const metadata: Metadata = {
  title: {
    default: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
    template: "%s | DoorIQ"
  },
  description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 11+ AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
  keywords: [
    "door to door sales training",
    "sales pitch practice",
    "AI sales training",
    "door-to-door sales software",
    "sales rep training",
    "objection handling practice",
    "sales coaching software",
    "AI voice training",
    "sales practice platform",
    "door knocking practice"
  ],
  authors: [{ name: "DoorIQ" }],
  creator: "DoorIQ",
  publisher: "DoorIQ",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      // Prioritize larger sizes for Google Search (Google prefers 96x96+)
      { url: '/favicon-144x144.png', sizes: '144x144', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  },
  openGraph: {
    title: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 11+ AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
    url: siteUrl,
    siteName: "DoorIQ",
    images: [
      {
        url: '/FullLogo.png',
        width: 1200,
        height: 630,
        alt: 'DoorIQ - AI-Powered Sales Training Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 11+ AI homeowner personas.",
    images: ['/FullLogo.png'],
    creator: '@dooriq',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google3af786ec95fcddec',
  },
  other: {
    // Resource hints for performance
    'dns-prefetch': 'https://r.wdfl.co',
    'preconnect': 'https://r.wdfl.co',
  },
};

// Removed force-dynamic to allow static optimization where possible
// Use 'force-dynamic' only on pages that truly need it

// Structured Data (JSON-LD) for SEO
function StructuredData() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                  process.env.NEXT_PUBLIC_APP_URL || 
                  'https://dooriq.ai'

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DoorIQ",
    "url": siteUrl,
    "logo": `${siteUrl}/FullLogo.png`,
    "description": "AI-powered sales training platform for door-to-door sales teams",
    "sameAs": [
      // Add social media links when available
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Sales",
      "url": `${siteUrl}/contact-sales`
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "DoorIQ",
    "url": siteUrl,
    "description": "Master door-to-door sales with realistic AI voice interactions",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${siteUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "DoorIQ",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "100+"
    }
  }

  return (
    <>
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="website-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <Script
        id="software-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />
    </>
  )
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100` }>
        <StructuredData />
        <Script id="rewardful-init" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>
        <Script 
          src="https://r.wdfl.co/rw.js" 
          data-rewardful="2154b7"
          strategy="lazyOnload"
        />
        <ToastProvider>
          <NotificationProvider>
            <Suspense fallback={null}>
              <Header />
            </Suspense>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <div className="px-4 sm:px-6 lg:px-8 pb-10">
                <Footer />
              </div>
            </div>
          </NotificationProvider>
        </ToastProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
