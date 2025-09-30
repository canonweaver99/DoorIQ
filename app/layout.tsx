import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/navigation/Header";

export const dynamic = 'force-dynamic'

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${geistMono.variable} antialiased bg-slate-900 text-slate-100` }>
        <Header />
        {/* Spacer to avoid content under fixed nav (approx 64px for new header) */}
        <div style={{ height: 64 }} />
        {children}
      </body>
    </html>
  );
}
