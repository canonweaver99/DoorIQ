import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalNav from "@/components/layout/GlobalNav";

export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DoorIQ - Practice Your Sales Pitch",
  description: "Master door-to-door sales with realistic AI voice interactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100`}>
        {/* Global navigation with Home + leave-confirmation */}
        <GlobalNav />
        {/* Spacer to avoid content under fixed nav (approx 44px) */}
        <div style={{ height: 44 }} />
        {children}
      </body>
    </html>
  );
}
