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
    // Enable image optimization
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Enable compression
  compress: true,
  // Performance optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true,
  // Optimize production builds
  productionBrowserSourceMaps: false, // Disable source maps in production for smaller bundles
  // Note: swcMinify is enabled by default in Next.js 15, no need to specify
  // Note: optimizeCss requires critters package - removed to avoid build errors
  
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dialog'],
    // Enable partial prerendering for better performance
    ppr: false, // Can enable when stable
  },
  // Output configuration
  output: 'standalone', // Optimize for production deployments
};

export default nextConfig;
