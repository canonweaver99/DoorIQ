import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [],
    unoptimized: false,
    formats: ['image/avif', 'image/webp'], // Prefer modern formats
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  // Enable compression
  compress: true,
  // Note: swcMinify is enabled by default in Next.js 15, no need to specify
  // Note: optimizeCss requires critters package - removed to avoid build errors
};

export default nextConfig;
