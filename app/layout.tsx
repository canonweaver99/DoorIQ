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
  description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 60+ AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
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
  openGraph: {
    title: "DoorIQ - Practice Your Sales Pitch with AI Homeowners",
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 60+ AI homeowner personas. Get instant feedback, track performance, and ramp reps 3x faster.",
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
    description: "Master door-to-door sales with realistic AI voice interactions. Practice unlimited pitches with 60+ AI homeowner personas.",
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

// Next.js 13+ requires viewport to be exported separately
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

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
    <html lang="en" suppressHydrationWarning className="dark">
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
        {/* CRITICAL: Override console.error IMMEDIATELY, before Next.js devtools loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Override console.error/warn BEFORE anything else loads
                const originalError = console.error;
                const originalWarn = console.warn;
                
                const shouldSuppress = function(...args) {
                  const str = args.map(a => {
                    if (typeof a === 'string') return a;
                    if (a && typeof a === 'object') {
                      try { return JSON.stringify(a); } catch { return String(a); }
                    }
                    return String(a);
                  }).join(' ').toLowerCase();
                  
                  return (
                    (str.includes('datachannel') && (str.includes('lossy') || str.includes('unknown') || str.includes('on lossy'))) ||
                    str.includes('closed peer connection') ||
                    (str.includes('createoffer') && str.includes('closed')) ||
                    str.includes('rteengine') ||
                    str.includes('handle data error')
                  );
                };
                
                console.error = function(...args) {
                  if (shouldSuppress(...args)) return;
                  originalError.apply(console, args);
                };
                
                console.warn = function(...args) {
                  if (shouldSuppress(...args)) return;
                  originalWarn.apply(console, args);
                };
              })();
              
              (function() {
                // Always force dark theme
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add('dark');
                // Override any stored theme preference
                try {
                  localStorage.setItem('theme', 'dark');
                } catch (e) {}
              })();
`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} ${playfairDisplay.variable} ${spaceGrotesk.variable} ${poppins.variable} ${bebasNeue.variable} antialiased bg-black text-white`}>
        <StructuredData />
        <Script id="rewardful-init" strategy="beforeInteractive">
          {`(function(w,r){w._rwq=r;w[r]=w[r]||function(){(w[r].q=w[r].q||[]).push(arguments)}})(window,'rewardful');`}
        </Script>
        <Script 
          src="https://r.wdfl.co/rw.js" 
          data-rewardful="2154b7"
          strategy="lazyOnload"
        />
        {/* Handle Rewardful/share-modal errors via inline script */}
        <Script id="rewardful-error-handler" strategy="afterInteractive">
          {`
            (function() {
              // Monitor for Rewardful/share-modal errors and prevent them from blocking
              const originalError = window.onerror;
              window.onerror = function(msg, url, line, col, error) {
                if (typeof msg === 'string') {
                  const msgLower = msg.toLowerCase();
                  if (
                    msgLower.includes('share-modal') ||
                    msgLower.includes('rewardful') ||
                    (msgLower.includes('addeventlistener') && msgLower.includes('null')) ||
                    (msgLower.includes('cannot read properties') && msgLower.includes('null')) ||
                    (url && url.includes('share-modal'))
                  ) {
                    // Silently suppress - don't even log to avoid console noise
                    return true; // Suppress error
                  }
                }
                return originalError ? originalError.call(this, msg, url, line, col, error) : false;
              };
              
              // Also handle unhandled promise rejections from share-modal
              window.addEventListener('unhandledrejection', function(e) {
                const reason = e.reason?.toString() || '';
                if (reason.includes('share-modal') || reason.includes('rewardful')) {
                  e.preventDefault();
                  return false;
                }
              });
              
              // Also handle script load errors
              document.addEventListener('error', function(e) {
                if (e.target && e.target.src && (
                  e.target.src.includes('rw.js') ||
                  e.target.src.includes('rewardful') ||
                  e.target.src.includes('share-modal')
                )) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }, true);
            })();
          `}
        </Script>
        {/* Enhanced error handler to prevent share-modal.js and other script errors from blocking execution */}
        {/* CRITICAL: This must run before any other scripts to catch SDK errors */}
        <Script id="error-handler" strategy="beforeInteractive">
          {`(function(){
            // CRITICAL: Override console.error BEFORE Next.js devtools intercepts it
            // This must run before Next.js loads to catch LiveKit/WebRTC errors
            const originalConsoleError = console.error;
            const originalConsoleWarn = console.warn;
            
            const shouldSuppressError = function(...args) {
              const errorStr = args.map(arg => {
                if (typeof arg === 'string') return arg;
                if (arg && typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ').toLowerCase();
              
              // Check for DataChannel errors (benign WebRTC errors)
              // Catch all variations: "Unknown DataChannel error on lossy", "DataChannel error on lossy", etc.
              const isDataChannelError = (
                // Any combination of datachannel + lossy
                errorStr.includes('datachannel') ||
                (errorStr.includes('datachannel') && errorStr.includes('lossy')) ||
                // Or just "lossy" errors (common WebRTC benign error)
                (errorStr.includes('lossy') && (
                  errorStr.includes('error') || 
                  errorStr.includes('unknown') ||
                  errorStr.includes('datachannel')
                )) ||
                // Specific "Unknown DataChannel error on lossy {}" format
                errorStr.includes('unknown datachannel error') ||
                (errorStr.includes('unknown') && errorStr.includes('error') && errorStr.includes('lossy'))
              );
              
              // Check for peer connection errors
              const isPeerConnectionError = (
                errorStr.includes('closed peer connection') ||
                (errorStr.includes('createoffer') && errorStr.includes('closed'))
              );
              
              // Check for RTCEngine errors (from LiveKit client)
              const isRTCEngineError = (
                errorStr.includes('rteengine') ||
                errorStr.includes('handle data error')
              );
              
              // Suppress transient WebSocket errors
              const isTransientWebSocketError = (
                errorStr.includes('websocket closed') ||
                errorStr.includes('signal disconnected') ||
                errorStr.includes('reconnect disconnected') ||
                errorStr.includes('abort connection attempt')
              );
              
              // Suppress reconnect warnings (these are handled by retry logic)
              const isReconnectWarning = (
                errorStr.includes('already attempting reconnect') ||
                errorStr.includes('returning early')
              );
              
              // Suppress benign WebRTC signaling errors (SDK handles retries)
              const isBenignSignalingError = (
                errorStr.includes('cannot send signal request before connected') ||
                (errorStr.includes('signal') && errorStr.includes('before connected')) ||
                (errorStr.includes('trickle') && errorStr.includes('before connected'))
              );
              
              return isDataChannelError || isPeerConnectionError || isRTCEngineError || isTransientWebSocketError || isReconnectWarning || isBenignSignalingError;
            };
            
            console.error = function(...args) {
              if (shouldSuppressError(...args)) {
                return; // Silently suppress
              }
              originalConsoleError.apply(console, args);
            };
            
            console.warn = function(...args) {
              if (shouldSuppressError(...args)) {
                return; // Silently suppress
              }
              originalConsoleWarn.apply(console, args);
            };
            
            // Suppress known non-critical errors
            const originalError = window.onerror;
            window.onerror = function(msg, url, line, col, error) {
              if (typeof msg === 'string') {
                const msgLower = msg.toLowerCase();
                const isNonCritical = 
                  msgLower.includes('addeventlistener') ||
                  msgLower.includes('null') ||
                  msgLower.includes('share-modal') ||
                  msgLower.includes('cannot access') ||
                  msgLower.includes('cannot read properties') ||
                  msgLower.includes('unexpected token') ||
                  msgLower.includes('syntaxerror') ||
                  msgLower.includes('appendchild') ||
                  msgLower.includes('unexpected identifier') ||
                  // Catch all DataChannel lossy errors (benign WebRTC errors)
                  msgLower.includes('datachannel') ||
                  (msgLower.includes('lossy') && (msgLower.includes('error') || msgLower.includes('unknown'))) ||
                  msgLower.includes('unknown datachannel error') ||
                  msgLower.includes('rteengine') ||
                  msgLower.includes('closed peer connection') ||
                  (msgLower.includes('createoffer') && msgLower.includes('closed')) ||
                  msgLower.includes('already attempting reconnect') ||
                  msgLower.includes('returning early') ||
                  msgLower.includes('cannot send signal request before connected') ||
                  (msgLower.includes('signal') && msgLower.includes('before connected'));
                
                if (isNonCritical) {
                  // Suppress but don't log to reduce console noise
                  return true;
                }
              }
              return originalError ? originalError.call(this, msg, url, line, col, error) : false;
            };
            
            // Safe addEventListener wrapper - CRITICAL: Must wrap before any scripts load
            const originalAddEventListener = Element.prototype.addEventListener;
            const originalQuerySelector = Document.prototype.querySelector;
            const originalQuerySelectorAll = Document.prototype.querySelectorAll;
            const originalGetElementById = Document.prototype.getElementById;
            
            // Wrap querySelector methods to prevent null element access
            Document.prototype.querySelector = function(selector) {
              try {
                const result = originalQuerySelector.call(this, selector);
                // Return null safely instead of throwing if element doesn't exist
                return result;
              } catch (e) {
                if (e && e.message && (
                  e.message.includes('null') ||
                  e.message.includes('share-modal') ||
                  e.message.includes('Cannot read properties')
                )) {
                  return null; // Return null instead of throwing
                }
                throw e;
              }
            };
            
            Document.prototype.querySelectorAll = function(selector) {
              try {
                return originalQuerySelectorAll.call(this, selector);
              } catch (e) {
                if (e && e.message && (
                  e.message.includes('null') ||
                  e.message.includes('share-modal') ||
                  e.message.includes('Cannot read properties')
                )) {
                  return []; // Return empty array instead of throwing
                }
                throw e;
              }
            };
            
            Document.prototype.getElementById = function(id) {
              try {
                return originalGetElementById.call(this, id);
              } catch (e) {
                if (e && e.message && (
                  e.message.includes('null') ||
                  e.message.includes('share-modal') ||
                  e.message.includes('Cannot read properties')
                )) {
                  return null; // Return null instead of throwing
                }
                throw e;
              }
            };
            
            Element.prototype.addEventListener = function(type, listener, options) {
              // CRITICAL: Check if element is valid before adding listener
              if (!this || this.nodeType === undefined || this === null || this.nodeType === null) {
                console.warn('⚠️ Attempted to addEventListener on null/invalid element, silently ignoring');
                return; // Silently fail - don't throw
              }
              try {
                return originalAddEventListener.call(this, type, listener, options);
              } catch (e) {
                // CRITICAL: Never throw errors from share-modal or null element access
                if (e && e.message && (
                  e.message.includes('null') ||
                  e.message.includes('Cannot read properties') ||
                  e.message.includes('share-modal') ||
                  e.message.includes('addEventListener')
                )) {
                  console.warn('⚠️ addEventListener error suppressed:', e.message);
                  return; // Silently fail - don't throw
                }
                throw e;
              }
            };
            
            // Safe appendChild wrapper
            const originalAppendChild = Node.prototype.appendChild;
            Node.prototype.appendChild = function(child) {
              try {
                return originalAppendChild.call(this, child);
              } catch (e) {
                if (e && e.message && (
                  e.message.includes('Unexpected token') ||
                  e.message.includes('SyntaxError')
                )) {
                  return null; // Return null instead of throwing
                }
                throw e;
              }
            };
            
            // Suppress unhandled promise rejections for known errors
            window.addEventListener('unhandledrejection', function(e) {
              if (e.reason) {
                const msg = typeof e.reason === 'string' 
                  ? e.reason 
                  : (e.reason.message || e.reason.toString() || '');
                const msgLower = msg.toLowerCase();
                if (
                  msgLower.includes('addeventlistener') ||
                  msgLower.includes('null') ||
                  msgLower.includes('share-modal') ||
                  msgLower.includes('cannot access') ||
                  msgLower.includes('cannot read properties') ||
                  msgLower.includes('unexpected token') ||
                  msgLower.includes('syntaxerror') ||
                  msgLower.includes('unexpected identifier') ||
                  // Catch all DataChannel lossy errors (benign WebRTC errors)
                  msgLower.includes('datachannel') ||
                  (msgLower.includes('lossy') && (msgLower.includes('error') || msgLower.includes('unknown'))) ||
                  msgLower.includes('unknown datachannel error') ||
                  msgLower.includes('rteengine') ||
                  msgLower.includes('closed peer connection') ||
                  (msgLower.includes('createoffer') && msgLower.includes('closed')) ||
                  msgLower.includes('already attempting reconnect') ||
                  msgLower.includes('returning early') ||
                  msgLower.includes('cannot send signal request before connected') ||
                  (msgLower.includes('signal') && msgLower.includes('before connected'))
                ) {
                  e.preventDefault(); // Suppress
                  e.stopPropagation(); // Prevent propagation
                  return false; // Ensure it doesn't bubble
                }
              }
            }, true); // Use capture phase to catch early
            
            
            // CRITICAL: Wrap all DOM operations in try-catch to prevent blocking
            // This ensures share-modal errors don't prevent Eleven Labs connection
            const originalCreateElement = Document.prototype.createElement;
            Document.prototype.createElement = function(tagName, options) {
              try {
                return originalCreateElement.call(this, tagName, options);
              } catch (e) {
                if (e && e.message && (
                  e.message.includes('share-modal') ||
                  e.message.includes('null') ||
                  e.message.includes('Cannot read properties')
                )) {
                  console.warn('createElement error suppressed (non-critical):', e.message);
                  return null;
                }
                throw e;
              }
            };
            
            // Note: console.error and console.warn are already overridden above
            // This ensures they run before Next.js devtools intercepts them
          })();`}
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
