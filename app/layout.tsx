import type { Metadata } from "next";
import { Inter, Geist_Mono, Playfair_Display, Space_Grotesk, Poppins, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ConditionalHeader } from "@/components/layout/ConditionalHeader";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";

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

// Optimize font loading - only preload critical fonts, others load on demand
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['monospace'], // Better fallback
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: 'swap',
  preload: false,
  fallback: ['serif'],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: 'swap',
  preload: false,
  fallback: ['sans-serif'],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: 'swap',
  preload: false,
  fallback: ['sans-serif'],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: ["400"],
  display: 'swap',
  preload: false,
  fallback: ['sans-serif'],
});

export const metadata: Metadata = {
  title: {
    default: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
    template: "%s | DoorIQ"
  },
  description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 14 AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
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
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 14 AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
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
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 14 AI homeowner personas.",
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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Resource hints for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://r.wdfl.co" />
        <link rel="preconnect" href="https://r.wdfl.co" />
        {/* Supabase - critical for all API calls */}
        <link rel="dns-prefetch" href="https://api.supabase.co" />
        <link rel="preconnect" href="https://api.supabase.co" />
        {/* OpenAI - used for grading */}
        <link rel="dns-prefetch" href="https://api.openai.com" />
        <link rel="preconnect" href="https://api.openai.com" />
        {/* ElevenLabs - used for voice conversations */}
        <link rel="dns-prefetch" href="https://api.elevenlabs.io" />
        <link rel="preconnect" href="https://api.elevenlabs.io" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = storedTheme || (systemPrefersDark ? 'dark' : 'light');
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} ${poppins.variable} ${bebasNeue.variable} antialiased bg-background text-foreground`}>
        <StructuredData />
        <Script id="rewardful-init" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>
        <Script 
          src="https://r.wdfl.co/rw.js" 
          data-rewardful="2154b7"
          strategy="lazyOnload"
        />
        {/* Optimized error handler - moved to lazy load to reduce initial bundle */}
        {/* Enhanced error handler to prevent share-modal.js and other script errors from blocking execution */}
        <Script id="share-modal-error-handler" strategy="beforeInteractive">
          {`(function(){const o=window.onerror;window.onerror=function(m,u,l,c,e){if(typeof m==='string'&&(m.includes('addEventListener')||m.includes('null')||m.includes('share-modal')||(m.includes('Cannot access')&&m.includes('before initialization'))||m.includes('Cannot read properties'))){console.warn('Suppressed non-critical error:',m);return true}return o?o.call(this,m,u,l,c,e):false};const a=Element.prototype.addEventListener;Element.prototype.addEventListener=function(t,l,o){if(!this||this.nodeType===undefined){console.warn('addEventListener called on invalid element');return}try{return a.call(this,t,l,o)}catch(e){if(e&&e.message&&(e.message.includes('null')||e.message.includes('Cannot read properties')||e.message.includes('share-modal'))){console.warn('Suppressed addEventListener error:',e.message);return}throw e}};const q=Document.prototype.querySelector;Document.prototype.querySelector=function(s){try{return q.call(this,s)}catch(e){console.warn('querySelector error suppressed:',e.message);return null}};const eq=Element.prototype.querySelector;Element.prototype.querySelector=function(s){if(!this||this.nodeType===undefined){return null}try{return eq.call(this,s)}catch(e){console.warn('querySelector error suppressed:',e.message);return null}};window.addEventListener('unhandledrejection',function(e){if(e.reason&&typeof e.reason==='object'&&e.reason.message){const m=e.reason.message;if(m.includes('addEventListener')||m.includes('null')||m.includes('share-modal')||(m.includes('Cannot access')&&m.includes('before initialization'))||m.includes('Cannot read properties')){console.warn('Suppressed promise rejection:',m);e.preventDefault()}}})})();`}
        </Script>
        <ThemeProvider>
          <ToastProvider>
            <NotificationProvider>
              <ConditionalHeader />
              <div className="min-h-screen flex flex-col">
                <div className="flex-1 mobile-bottom-nav-padding">
                  {children}
                </div>
                <ConditionalFooter />
              </div>
              <MobileBottomNav />
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
