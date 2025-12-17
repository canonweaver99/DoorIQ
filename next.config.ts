import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Exclude unnecessary files from build
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    remotePatterns: [],
    unoptimized: true, // Required for static export (output: 'export')
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
  
  // Server external packages (moved from experimental in Next.js 15)
  serverExternalPackages: ['@supabase/supabase-js'],
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
    // Enable partial prerendering for better performance
    ppr: false, // Can enable when stable
  },
  // Compiler optimizations
  compiler: {
    // Remove console.log in production (reduces bundle size)
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // Output configuration
  // Note: API routes cannot be statically exported
  // For Capacitor, deploy frontend as static and API routes separately
  output: 'standalone', // Use standalone for API route support
};

export default nextConfig;
