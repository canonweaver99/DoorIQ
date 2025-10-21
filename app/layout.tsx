import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
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
  display: 'swap'
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DoorIQ - Practice Your Sales Pitch",
  description: "Master door-to-door sales with realistic AI voice interactions.",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: "DoorIQ - Practice Your Sales Pitch",
    description: "Master door-to-door sales with realistic AI voice interactions.",
    images: [
      {
        url: '/dooriq-og-image.svg',
        width: 1200,
        height: 630,
        alt: 'DoorIQ Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "DoorIQ - Practice Your Sales Pitch",
    description: "Master door-to-door sales with realistic AI voice interactions.",
    images: ['/dooriq-og-image.svg'],
  },
};

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100` }>
        <ToastProvider>
          <NotificationProvider>
            <Suspense fallback={<div style={{ height: 64 }} />}>
              <Header />
            </Suspense>
            {/* Spacer to avoid content under fixed nav (approx 64px for new header) */}
            <div style={{ height: 64 }} />
            <div className="min-h-[calc(100svh-64px)] flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <div className="px-4 sm:px-6 lg:px-8 pb-10">
                <Footer />
              </div>
            </div>
          </NotificationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
