"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useAnimation } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Code split heavy components to reduce initial bundle size
import dynamic from 'next/dynamic';

const ContainerScroll = dynamic(() => import("@/components/ui/container-scroll-animation").then(mod => ({ default: mod.ContainerScroll })), {
  loading: () => <div className="h-[600px] bg-slate-900" />, // Prevent layout shift
  ssr: false, // These are animation-heavy, can skip SSR
});

const Timeline = dynamic(() => import("@/components/ui/timeline").then(mod => ({ default: mod.Timeline })), {
  loading: () => <div className="h-[400px] bg-slate-900" />,
  ssr: false,
});

const FeaturesSectionWithHoverEffects = dynamic(() => import("@/components/ui/feature-section-with-hover-effects").then(mod => ({ default: mod.FeaturesSectionWithHoverEffects })), {
  loading: () => <div className="h-[800px] bg-slate-900" />,
  ssr: false,
});

const TestimonialsColumn = dynamic(() => import("@/components/ui/testimonials-columns-1").then(mod => ({ default: mod.TestimonialsColumn })), {
  loading: () => <div className="h-[600px] bg-slate-900" />,
  ssr: false,
});

// Import testimonialsData separately (lightweight)
import { testimonialsData } from "@/components/ui/testimonials-columns-1";

const AnimatedText = dynamic(() => import("@/components/ui/animated-text").then(mod => ({ default: mod.AnimatedText })), {
  loading: () => <span className="inline-block" />, // Minimal placeholder
  ssr: false,
});

const AIVoiceInput = dynamic(() => import("@/components/ui/ai-voice-input").then(mod => ({ default: mod.AIVoiceInput })), {
  loading: () => <div className="h-[200px] bg-slate-900 rounded-lg" />,
  ssr: false,
});
import { MacbookPro } from "@/components/ui/macbook-pro";
import { IPhoneMockup } from "@/components/ui/iphone-mockup";
import { Mac } from "@/components/ui/mac";
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from "@/components/trainer/personas";
import { getAgentImageStyle } from "@/lib/agents/imageStyles";
import { createClient } from "@/lib/supabase/client";
import { COLOR_VARIANTS } from "@/components/ui/scrolling-agent-carousel";
import { cn } from "@/lib/utils";
import { useIsMobile, useReducedMotion } from "@/hooks/useIsMobile";
import {
  ArrowRight,
  DollarSign,
  TrendingDown,
  Users,
  Target,
  Zap,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
  Mail,
  Phone,
  MapPin,
  Play,
} from "lucide-react";
import { DemoSessionModal } from "@/components/landing/DemoSessionModal";

// Animated Counter Component
function AnimatedCounter({ end, suffix = "", prefix = "" }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTime: number;
      const duration = 2000;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isInView, end]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

// Navigation Component
function Navigation() {
  const isMobile = useIsMobile();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    // Throttle scroll handler for better performance
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          
          // Only update active section on desktop (less important on mobile)
          if (!isMobile) {
            const sections = ["hero", "problem", "solution", "features", "stats", "testimonials", "cta"];
            const scrollPosition = window.scrollY + 100;
            
            for (const section of sections) {
              const element = document.getElementById(section);
              if (element) {
                const { offsetTop, offsetHeight } = element;
                if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
                  setActiveSection(section);
                  break;
                }
              }
            }
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  const navItems = [
    { id: "features", label: "Features" },
    { id: "solution", label: "How It Works" },
    { id: "stats", label: "Results" },
    { id: "testimonials", label: "Testimonials" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/95 backdrop-blur-xl"
          : "bg-black/50 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-20 md:h-24">
          {/* Logo */}
          <Link href="/landing" className="group flex-shrink-0">
            <Image 
              src="/dooriqlogo.png" 
              alt="DoorIQ" 
              width={1280}
              height={214}
              className="h-6 sm:h-7 md:h-8 w-auto transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Navigation Tabs - Hidden on mobile */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`px-4 xl:px-5 py-2 xl:py-2.5 text-sm xl:text-base font-medium tracking-tight transition-all rounded-md ${
                  activeSection === item.id
                    ? "text-white bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/auth/login"
              className="px-5 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2.5 text-white font-medium rounded-md text-sm sm:text-sm md:text-base tracking-tight transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              Log In
            </Link>
            <Link
              href="/book-demo"
              className="group relative px-5 sm:px-4 md:px-6 py-2.5 sm:py-2 md:py-2.5 bg-white text-black font-bold rounded-md text-sm sm:text-sm tracking-tight transition-all hover:bg-white/95 hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
            >
              <span className="relative z-10 flex items-center gap-1 sm:gap-2">
                <span className="hidden sm:inline">Book a Demo</span>
                <span className="sm:hidden">Demo</span>
                <ChevronRight className="w-4 h-4 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const shouldAnimate = !isMobile && !prefersReducedMotion;
  const [showDemoModal, setShowDemoModal] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const fallback = fallbackRef.current;

    if (video && fallback) {
      const handleCanPlay = () => {
        fallback.style.display = 'none';
        // Ensure video plays
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay was prevented, but video is ready
            console.log('Video autoplay prevented, but video is ready');
          });
        }
      };

      const handleError = () => {
        fallback.style.display = 'flex';
      };

      const handleLoadedData = () => {
        fallback.style.display = 'none';
        // Try to play when data is loaded
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log('Video autoplay prevented');
          });
        }
      };

      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);

      // Try to play after a short delay to ensure element is ready
      const timeoutId = setTimeout(() => {
        if (video.readyState >= 2) {
          fallback.style.display = 'none';
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {
              console.log('Video autoplay prevented');
            });
          }
        }
      }, 500);

      // Check if video can play immediately
      if (video.readyState >= 2) {
        fallback.style.display = 'none';
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            console.log('Video autoplay prevented');
          });
        }
      }

      return () => {
        clearTimeout(timeoutId);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('error', handleError);
      };
    }
  }, []);

  return (
    <div id="hero" className="relative bg-black overflow-hidden pt-16 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-32 2xl:pt-36">
      {/* Animated grid pattern */}
      <motion.div
        animate={shouldAnimate ? {
          opacity: [0.02, 0.04, 0.02],
        } : { opacity: 0.03 }}
        transition={shouldAnimate ? {
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        } : {}}
        className="absolute inset-0"
        style={{ willChange: 'opacity' }}
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </motion.div>

      {/* Animated accent glows */}
      <motion.div
        animate={shouldAnimate ? {
          x: [0, 30, 0],
          y: [0, 20, 0],
          scale: [1, 1.1, 1],
        } : { x: 0, y: 0, scale: 1 }}
        transition={shouldAnimate ? {
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        } : {}}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[120px]"
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      />
      <motion.div
        animate={shouldAnimate ? {
          x: [0, -25, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        } : { x: 0, y: 0, scale: 1 }}
        transition={shouldAnimate ? {
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        } : {}}
        className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px]"
        style={{ transform: 'translateZ(0)', willChange: 'transform' }}
      />

      {/* Desktop Hero Section - Laptop (md to 2xl) */}
      <div className="hidden md:block 2xl:hidden">
        <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-5 md:pb-6 pt-16 sm:pt-16 md:pt-12 px-0 sm:px-4 w-full">
            {/* Badge */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.18, duration: 0.54 } : {}}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-white/10 bg-white/[0.02] backdrop-blur-sm"
            >
              <span className="text-white/80 text-xs sm:text-sm md:text-base font-medium tracking-wider uppercase font-space">
                Enterprise D2D Sales Training Platform
              </span>
            </motion.div>

            {/* Headline */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full max-w-full md:max-w-5xl pb-2 px-4 sm:px-0">
              <AnimatedText
                text="Unlimited AI Practice for"
                textClassName="font-space text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl tracking-tight text-white text-center font-light leading-[1.2] sm:leading-[1.3] w-full"
                underlineClassName="hidden"
                duration={0.036}
                delay={0.014}
              />
              <AnimatedText
                text="DOOR-TO-DOOR SALES"
                textClassName="font-space text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center font-light leading-[1.2] sm:leading-[1.3] w-full whitespace-nowrap"
                underlineGradient="from-indigo-600 via-purple-600 to-pink-600"
                underlineHeight="h-[2px] sm:h-[2px] md:h-[3px]"
                underlineOffset="-bottom-1 sm:-bottom-2 md:-bottom-3"
                animationType="fade"
                underlineFirst={true}
                startDelay={1.17}
              />
            </div>

            {/* Subheadline */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.45, duration: 0.54 } : {}}
              className="font-sans text-lg sm:text-lg md:text-lg lg:text-xl xl:text-2xl text-white/80 w-full max-w-full md:max-w-4xl text-center leading-relaxed font-light px-4"
            >
              Practice with hyper-realistic AI homeowners until you&apos;re unstoppable.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.54, duration: 0.54 } : {}}
              className="flex justify-center mt-2"
            >
              <Link
                href="/book-demo"
                className="group px-6 sm:px-8 py-2.5 sm:py-3 md:py-3.5 bg-white text-black font-bold rounded-md text-sm sm:text-base tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* See it in action label */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.585, duration: 0.54 } : {}}
              className="text-center mt-2 sm:mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
            >
              <span className="text-white/80 text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl font-medium tracking-wider uppercase font-space">
                See it in action
              </span>
              <motion.div
                animate={shouldAnimate ? { y: [0, 8, 0] } : { y: 0 }}
                transition={shouldAnimate ? { 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white/80" />
              </motion.div>
            </motion.div>
          </div>
        }
      >
        {/* Demo Video in Macbook Pro */}
        <div className="relative w-full flex items-center justify-center overflow-visible py-8 -mt-16 md:-mt-20">
          <MacbookPro
            width={650}
            height={400}
            videoSrc="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4"
            videoRef={videoRef as React.RefObject<HTMLVideoElement | null>}
            className="w-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
          {/* Fallback if video doesn't load */}
          <div 
            ref={fallbackRef}
            className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black flex items-center justify-center pointer-events-none"
            style={{ display: 'none' }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/30 font-sans text-sm">Dashboard Preview</p>
            </div>
          </div>
        </div>
      </ContainerScroll>
      </div>

      {/* Large Monitor Hero Section - 2xl and above */}
      <div className="hidden 2xl:block 2xl:pt-24">
        <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center gap-3 sm:gap-4 md:gap-6 pb-4 sm:pb-5 md:pb-6 pt-32 sm:pt-36 md:pt-40 lg:pt-44 xl:pt-48 px-0 sm:px-4 w-full">
            {/* Badge */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.18, duration: 0.54 } : {}}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-white/10 bg-white/[0.02] backdrop-blur-sm"
            >
              <span className="text-white/80 text-xs sm:text-sm md:text-base font-medium tracking-wider uppercase font-space">
                Enterprise D2D Sales Training Platform
              </span>
            </motion.div>

            {/* Headline */}
            <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full max-w-full md:max-w-5xl pb-2 px-4 sm:px-0">
              <AnimatedText
                text="Unlimited AI Practice for"
                textClassName="font-space text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl tracking-tight text-white text-center font-light leading-[1.2] sm:leading-[1.3] w-full"
                underlineClassName="hidden"
                duration={0.036}
                delay={0.014}
              />
              <AnimatedText
                text="DOOR-TO-DOOR SALES"
                textClassName="font-space text-5xl xs:text-6xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center font-light leading-[1.2] sm:leading-[1.3] w-full whitespace-nowrap"
                underlineGradient="from-indigo-600 via-purple-600 to-pink-600"
                underlineHeight="h-[2px] sm:h-[2px] md:h-[3px]"
                underlineOffset="-bottom-1 sm:-bottom-2 md:-bottom-3"
                animationType="fade"
                underlineFirst={true}
                startDelay={1.17}
              />
            </div>

            {/* Subheadline */}
            <motion.p
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.45, duration: 0.54 } : {}}
              className="font-sans text-lg sm:text-lg md:text-lg lg:text-xl xl:text-2xl text-white/80 w-full max-w-full md:max-w-4xl text-center leading-relaxed font-light px-4"
            >
              Practice with hyper-realistic AI homeowners until you&apos;re unstoppable.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.54, duration: 0.54 } : {}}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2"
            >
              <button
                onClick={() => setShowDemoModal(true)}
                className="group px-6 sm:px-8 py-2.5 sm:py-3 md:py-3.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-md text-sm sm:text-base tracking-tight hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                Try Instant Demo
              </button>
              <Link
                href="/book-demo"
                className="group px-6 sm:px-8 py-2.5 sm:py-3 md:py-3.5 bg-white text-black font-bold rounded-md text-sm sm:text-base tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                Book a Demo
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </motion.div>

            {/* See it in action label */}
            <motion.div
              initial={shouldAnimate ? { opacity: 0, y: 20 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
              transition={shouldAnimate ? { delay: 0.585, duration: 0.54 } : {}}
              className="text-center mt-2 sm:mt-6 md:mt-8 mb-4 md:mb-6 lg:mb-8 xl:mb-10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
            >
              <span className="text-white/80 text-lg sm:text-xl md:text-2xl lg:text-4xl xl:text-5xl font-medium tracking-wider uppercase font-space">
                See it in action
              </span>
              <motion.div
                animate={shouldAnimate ? { y: [0, 8, 0] } : { y: 0 }}
                transition={shouldAnimate ? { 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : {}}
              >
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 text-white/80" />
              </motion.div>
            </motion.div>
          </div>
        }
      >
        {/* Demo Video in Mac Monitor */}
        <div className="relative w-full flex items-center justify-center overflow-visible pb-8">
          <Mac
            width={2400}
            height={1800}
            videoSrc="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4"
            videoRef={videoRef as React.RefObject<HTMLVideoElement | null>}
            className="w-full"
            style={{ maxWidth: 'min(95vw, 2400px)', height: 'auto', width: 'auto' }}
          />
          {/* Fallback if video doesn't load */}
          <div 
            ref={fallbackRef}
            className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black flex items-center justify-center pointer-events-none"
            style={{ display: 'none' }}
          >
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-white/40" />
              </div>
              <p className="text-white/30 font-sans text-sm">Dashboard Preview</p>
            </div>
          </div>
        </div>
      </ContainerScroll>
      </div>
      
      {/* Mobile Only - iPhone Scroll Animation */}
      <div className="block md:hidden mt-8">
        <ContainerScroll
          titleComponent={
            <div className="flex flex-col items-center gap-3 sm:gap-4 pb-4 sm:pb-5 pt-4 sm:pt-8 px-4 w-full">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.54 }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded border border-white/10 bg-white/[0.02] backdrop-blur-sm"
              >
                <span className="text-white/80 text-xs sm:text-sm font-medium tracking-wider uppercase font-space">
                  Enterprise D2D Sales Training Platform
                </span>
              </motion.div>

              {/* Headline */}
              <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-full pb-2 px-4 sm:px-0">
                <AnimatedText
                  text="Unlimited AI Practice for"
                  textClassName="font-space text-4xl xs:text-5xl sm:text-6xl tracking-tight text-white text-center font-medium md:font-light leading-[1.2] sm:leading-[1.3] w-full"
                  underlineClassName="hidden"
                  duration={0.036}
                  delay={0.014}
                />
                <AnimatedText
                  text="DOOR-TO-DOOR SALES"
                  textClassName="font-space text-4xl xs:text-5xl sm:text-6xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-center font-medium md:font-light leading-[1.2] sm:leading-[1.3] w-full whitespace-nowrap"
                  underlineGradient="from-indigo-600 via-purple-600 to-pink-600"
                  underlineHeight="h-[2px] sm:h-[2px]"
                  underlineOffset="-bottom-1 sm:-bottom-2"
                  animationType="fade"
                  underlineFirst={true}
                  startDelay={1.17}
                />
              </div>

              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45, duration: 0.54 }}
                className="font-sans text-xl sm:text-2xl text-white/80 w-full max-w-full text-center leading-relaxed font-light px-4"
              >
                Practice with hyper-realistic AI homeowners until you&apos;re unstoppable.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.54, duration: 0.54 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-2"
              >
                <button
                  onClick={() => setShowDemoModal(true)}
                  className="group px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold rounded-md text-sm sm:text-base tracking-tight hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                  Try Instant Demo
                </button>
                <Link
                  href="/book-demo"
                  className="group px-6 sm:px-8 py-2.5 sm:py-3 bg-white text-black font-bold rounded-md text-sm sm:text-base tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Book a Demo
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </motion.div>

              {/* See it in action label */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="text-center mt-2 sm:mt-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3"
              >
                <span className="text-white/80 text-lg sm:text-xl font-medium tracking-wider uppercase font-space">
                  See it in action
                </span>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ 
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-white/80" />
                </motion.div>
              </motion.div>
            </div>
          }
        >
          {/* Demo Video in iPhone */}
          <div className="relative w-full flex items-center justify-center overflow-visible py-8 -mt-16 md:-mt-20">
            <IPhoneMockup
              model="14-pro"
              color="#5a5a5a"
              orientation="portrait"
              videoSrc="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4"
              videoRef={videoRef as React.RefObject<HTMLVideoElement | null>}
              scale={0.85}
              className="w-full flex justify-center translate-x-2 md:translate-x-0"
            />
            {/* Fallback if video doesn't load */}
            <div 
              ref={fallbackRef}
              className="absolute inset-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black flex items-center justify-center pointer-events-none"
              style={{ display: 'none' }}
            >
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white/40" />
                </div>
                <p className="text-white/30 font-sans text-sm">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </div>

      {/* Demo Modal */}
      <DemoSessionModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
      />
    </div>
  );
}

// Problem Section
function ProblemSection() {
  const problems = [
    {
      icon: <Users className="w-6 h-6" />,
      stat: "40%",
      title: "of New Reps Quit in First 30 Days",
      description:
        "Poor preparation kills confidence.",
    },
    {
      icon: <DollarSign className="w-6 h-6" />,
      stat: "$75K",
      title: "Revenue Gap Between Average & Top Reps",
      description:
        "Top performers close 2-3x more deals.",
    },
    {
      icon: <TrendingDown className="w-6 h-6" />,
      stat: "60%",
      title: "of Deals Lost Due to Poor Objection Handling",
      description:
        "Unprepared reps miss opportunities.",
    },
  ];

  return (
    <section id="problem" className="relative bg-black py-12 sm:py-16 md:py-20">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
          style={{ willChange: 'transform, opacity' }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] font-space mb-3 sm:mb-4 block">
            The Problem
          </span>
          <h2 className="font-space text-3xl sm:text-5xl md:text-4xl lg:text-6xl xl:text-7xl text-white font-medium md:font-light tracking-tight leading-[0.95] mb-4 sm:mb-6 px-4">
            Your Sales Team Is
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Leaking Money</span>
          </h2>
          <p className="font-sans text-white/80 max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light px-4">
            Here&apos;s what you&apos;re really paying for:
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {problems.map((problem, index) => {
            return (
              <div
                key={problem.title}
                className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 sm:p-5 md:p-6 lg:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
              >
                {/* Subtle purple glow at bottom for depth */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Icon */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center text-white mb-4 sm:mb-5 md:mb-6 transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20 relative z-10">
                  {problem.icon}
                </div>

                {/* Stat */}
                <div className="font-space text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-light mb-2 sm:mb-3 tracking-tight relative z-10">
                  {problem.stat}
                </div>

                {/* Title */}
                <h3 className="font-space font-medium text-lg sm:text-xl md:text-2xl text-white/90 mb-2 sm:mb-3 tracking-tight relative z-10">
                  {problem.title}
                </h3>

                {/* Description */}
                <p className="font-sans text-white/80 leading-relaxed text-sm sm:text-base md:text-lg font-light relative z-10">
                  {problem.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Solution Section with Timeline
function SolutionSection() {
  const timelineData = [
    {
      title: "01",
        content: (
        <div className="group relative bg-black border-2 border-white/5 rounded-lg p-4 sm:p-8 md:p-10 lg:p-12 hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 overflow-hidden">
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/5 via-purple-500/3 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="font-space text-2xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-light tracking-tight">
              Connect Your Team
            </h4>
          </div>
          <p className="font-sans text-white/80 leading-relaxed text-base sm:text-lg md:text-xl font-light relative z-10">
            Onboard your entire team in under 10 minutes.
          </p>
        </div>
      ),
    },
    {
      title: "02",
        content: (
        <div className="group relative bg-black border-2 border-white/5 rounded-lg p-4 sm:p-8 md:p-10 lg:p-12 hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 overflow-hidden">
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/5 via-purple-500/3 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="font-space text-2xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-light tracking-tight">
              Practice with AI
            </h4>
          </div>
          <p className="font-sans text-white/80 leading-relaxed text-base sm:text-lg md:text-xl font-light relative z-10">
            Unlimited practice sessions with hyper-realistic AI homeowners.
          </p>
        </div>
      ),
    },
    {
      title: "03",
        content: (
        <div className="group relative bg-black border-2 border-white/5 rounded-lg p-4 sm:p-8 md:p-10 lg:p-12 hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 overflow-hidden">
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/5 via-purple-500/3 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="font-space text-2xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-light tracking-tight">
              Get Real-Time Feedback
            </h4>
          </div>
          <p className="font-sans text-white/80 leading-relaxed text-base sm:text-lg md:text-xl font-light relative z-10">
            Instant AI coaching after every session.
          </p>
        </div>
      ),
    },
    {
      title: "04",
        content: (
        <div className="group relative bg-black border-2 border-white/5 rounded-lg p-4 sm:p-8 md:p-10 lg:p-12 hover:border-white/30 hover:bg-white/[0.02] transition-all duration-300 overflow-hidden">
          {/* Subtle purple glow at bottom for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/5 via-purple-500/3 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 mb-4 sm:mb-6 relative z-10">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
            </div>
            <h4 className="font-space text-2xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-light tracking-tight">
              Track & Improve
            </h4>
          </div>
          <p className="font-sans text-white/80 leading-relaxed text-base sm:text-lg md:text-xl font-light relative z-10">
            Watch your team&apos;s performance metrics climb.
          </p>
        </div>
      ),
    },
  ];

  return (
    <section id="solution" className="relative bg-black py-12 sm:py-16 md:py-20 overflow-hidden">
      {/* Animated background gradients */}
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-[150px] -translate-y-1/2"
      />
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-l from-pink-500/10 via-purple-500/10 to-transparent rounded-full blur-[120px]"
      />

      <div className="relative max-w-7xl mx-auto px-0 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-6 sm:mb-8 px-4 sm:px-0"
          style={{ willChange: 'transform, opacity' }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] font-space mb-3 sm:mb-4 block">
            The Solution
          </span>
          <h2 className="font-space text-3xl sm:text-5xl md:text-4xl lg:text-6xl xl:text-7xl text-white font-medium md:font-light tracking-tight leading-[0.95] mb-4 sm:mb-6 px-4">
            How DoorIQ Works
          </h2>
          <p className="font-sans text-white/80 max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light px-4">
            Transform your sales team into a closing machine.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <Timeline data={timelineData} />
        </div>
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  return (
    <section id="features" className="relative bg-black pt-12 sm:pt-16 md:pt-20 pb-24 sm:pb-20 md:pb-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center mb-6 sm:mb-8"
          style={{ willChange: 'transform, opacity' }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] font-space mb-3 sm:mb-4 block">
            Features
          </span>
          <div className="mb-4 sm:mb-6">
            <h2 className="font-space text-3xl sm:text-5xl md:text-4xl lg:text-6xl xl:text-7xl text-white font-medium md:font-light tracking-tight leading-[1.1] px-4">
              Everything You Need <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">To Win</span>
            </h2>
          </div>
          <p className="font-sans text-white/80 max-w-3xl mx-auto text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed font-light px-4">
            Everything you need to practice, improve, and dominate.
          </p>
        </motion.div>

        {/* Features Grid */}
        <FeaturesSectionWithHoverEffects />
      </div>
    </section>
  );
}

// Inline Agent Carousel Component (from home hero)
const InlineAgentCarousel = React.memo(() => {
  const router = useRouter();
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('laptop');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else if (width < 1440) {
        setScreenSize('laptop');
      } else {
        setScreenSize('desktop');
      }
    };
    if (typeof window !== 'undefined') {
      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }
  }, []);

  const agents = React.useMemo(() => {
    return ALLOWED_AGENT_ORDER.slice(0, 12).map((agentName) => {
      const metadata = PERSONA_METADATA[agentName];
      return {
        name: agentName.split(' ').slice(-1)[0],
        fullName: agentName,
        src: metadata?.bubble?.image || '/agents/default.png',
        color: (metadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
      };
    });
  }, []);


  if (!agents.length) {
    return null;
  }

  const getItemWidth = () => {
    switch (screenSize) {
      case 'mobile': return Math.round((96 + 20) * 1.1); // 10% bigger
      case 'tablet': return 112 + 24;
      case 'laptop': return 128 + 28;
      case 'desktop': return 192 + 36;
      default: return 128 + 28;
    }
  };

  const getAnimationDuration = () => {
    switch (screenSize) {
      case 'mobile': return 18; // Slower - increased from 12.5
      case 'tablet': return 35;
      case 'laptop': return 50;
      case 'desktop': return 65;
      default: return 50;
    }
  };

  const itemWidth = getItemWidth();
  const animationDuration = getAnimationDuration();

  return (
    <div className="relative w-full overflow-hidden py-4 md:py-6" ref={containerRef}>
      <div className="relative w-full">
        <motion.div 
          className="flex items-center justify-center"
          animate={{ 
            x: [0, `-${(agents.length * itemWidth)}px`]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: animationDuration,
              ease: "linear"
            }
          }}
        >
          {[...agents, ...agents, ...agents, ...agents].map((agent, index) => {
            const variantStyles = COLOR_VARIANTS[agent.color];
            return (
              <div
                key={`${agent.fullName}-${index}`}
                className="relative flex-shrink-0 mx-2.5 sm:mx-3 md:mx-4 lg:mx-5 xl:mx-6"
              >
                <div className="relative h-[106px] w-[106px] sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-40 lg:w-40 xl:h-48 xl:w-48 2xl:h-52 2xl:w-52">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className={cn(
                        "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                        variantStyles.border[i],
                        variantStyles.gradient
                      )}
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                      }}
                    >
                      <div
                        className={cn(
                          "absolute inset-0 rounded-full mix-blend-screen",
                          `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace("from-", "")}/20%,transparent_70%)]`
                        )}
                      />
                    </motion.div>
                  ))}

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-[98%] h-[98%] rounded-full overflow-hidden shadow-2xl">
                      {(() => {
                        const imageStyle = getAgentImageStyle(agent.fullName);
                        const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ');
                        let translateY = '0';
                        const verticalNum = parseFloat(vertical);
                        if (verticalNum !== 50) {
                          const translatePercent = ((verticalNum - 50) / 150) * 100;
                          translateY = `${translatePercent}%`;
                        }
                        const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1';
                        const combinedTransform = translateY !== '0' 
                          ? `scale(${scaleValue}) translateY(${translateY})`
                          : imageStyle.transform || `scale(${scaleValue})`;
                        const finalStyle = {
                          objectFit: 'cover' as const,
                          objectPosition: `${horizontal} 50%`,
                          transform: combinedTransform,
                        };
                        // Use regular img tag for images with spaces (Next.js Image doesn't handle them well)
                        // CRITICAL: Add explicit dimensions to prevent CLS (Cumulative Layout Shift)
                        const hasSpaces = agent.src.includes(' ') || agent.src.includes('&');
                        if (hasSpaces) {
                          return (
                            <img
                              src={agent.src}
                              alt={agent.name}
                              width={160}
                              height={160}
                              style={{
                                ...finalStyle,
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                              loading={index < 6 ? 'eager' : 'lazy'}
                              decoding="async"
                              onError={(e) => {
                                console.error('❌ Hero carousel image failed to load:', agent.src);
                                e.stopPropagation();
                              }}
                            />
                          );
                        }
                        return (
                          <Image
                            src={agent.src}
                            alt={agent.name}
                            fill
                            style={finalStyle}
                            sizes="(max-width: 640px) 106px, (max-width: 768px) 112px, (max-width: 1024px) 128px, (max-width: 1440px) 144px, 160px"
                            quality={95}
                            priority={index < 6}
                            onError={(e) => {
                              console.error('❌ Hero carousel image failed to load:', agent.src);
                              e.stopPropagation();
                            }}
                          />
                        );
                      })()}
                    </div>
                  </div>
                  
                  {/* Outer ring overlay that overlaps the image */}
                  <div className={cn(
                    "absolute inset-0 rounded-full border-2 pointer-events-none z-10",
                    variantStyles.border[0]
                  )} />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
});
InlineAgentCarousel.displayName = "InlineAgentCarousel";

// Meet the Trainer Section
function MeetTrainerSection() {
  return (
    <section id="trainers" className="relative bg-black pt-10 sm:pt-12 md:pt-16 pb-10 sm:pb-12 md:pb-16 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-5 sm:mb-6 md:mb-8"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] font-space mb-2 sm:mb-3 block">
            Meet the Trainers
          </span>
          <h2 className="font-space text-3xl sm:text-4xl md:text-4xl lg:text-6xl xl:text-7xl text-white font-medium md:font-light tracking-tight leading-[0.95] mb-3 sm:mb-4 px-4">
            Practice with
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Hyper-Realistic AI</span>
          </h2>
          <p className="font-sans text-white/80 max-w-3xl mx-auto text-sm sm:text-base md:text-lg lg:text-xl leading-relaxed font-light px-4">
            Lifelike AI homeowners that adapt to every response.
          </p>
        </motion.div>
      </div>

      {/* Agent Carousel - Full Width */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full -mt-4 md:-mt-6"
        style={{ willChange: 'transform, opacity' }}
      >
        <InlineAgentCarousel />
      </motion.div>

      {/* AI Voice Input - Hear a snippet from the agents */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 mt-3 sm:mt-4 md:mt-6"
        style={{ willChange: 'transform, opacity' }}
      >
        <div className="flex justify-center dark">
          <AIVoiceInput 
            audioUrl="/api/eleven/sample-audio"
            onStart={() => console.log('Demo started')}
            onStop={(duration) => console.log(`Demo stopped after ${duration}s`)}
          />
        </div>
      </motion.div>
    </section>
  );
}

// Stats Section
function StatsSection() {
  const stats = [
    { value: 40, suffix: "%", label: "Less Shadowing" },
    { value: 10, suffix: "", label: "Hours Saved Per Manager Weekly" },
    { value: 5, suffix: "%", label: "Higher Close Rates" },
    { value: 100, suffix: "+", label: "Reps Trained Consistently" },
  ];

  return (
    <section id="stats" className="relative bg-black py-12 sm:py-16 md:py-20 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            x: [0, 30, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/15 via-purple-500/10 to-transparent rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            x: [0, -25, 0],
            y: [0, -35, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-pink-500/15 via-purple-500/10 to-transparent rounded-full blur-[100px]"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-xs sm:text-sm md:text-base uppercase tracking-[0.2em] font-space mb-3 sm:mb-4 block">
            Results
          </span>
          <h2 className="font-space text-3xl sm:text-5xl md:text-4xl lg:text-6xl xl:text-7xl text-white font-medium md:font-light tracking-tight leading-[0.95] px-4">
            Real Numbers.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Real Results.</span>
          </h2>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="text-center"
            >
              <div className="font-space text-5xl sm:text-5xl md:text-5xl lg:text-7xl xl:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-light tracking-tight mb-3 sm:mb-4">
                {stat.value === 10 ? (
                  <>
                    <AnimatedCounter end={stat.value} suffix="" />
                    <span className="text-2xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl"> Hours</span>
                  </>
                ) : (
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                )}
              </div>
              <p className="font-sans text-white/80 text-sm sm:text-sm md:text-base lg:text-lg leading-relaxed font-light px-2">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Early Access CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <p className="text-white/70 text-sm md:text-base uppercase tracking-[0.2em] mb-4 font-space">
            Join the Early Adopters
          </p>
          <p className="text-white/90 text-lg md:text-xl mb-2 font-space font-medium">
            Be one of the first to transform your sales team
          </p>
          <p className="text-white/60 text-sm md:text-base mb-8 font-sans max-w-2xl mx-auto">
            Get early access to DoorIQ and help shape the future of sales training
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection() {
  // Split testimonials into 3 columns
  const column1 = testimonialsData.slice(0, 4);
  const column2 = testimonialsData.slice(4, 7);
  const column3 = testimonialsData.slice(7, 10);

  return (
    <section id="testimonials" className="relative bg-black py-12 sm:py-16 md:py-20 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-10 md:mb-12"
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-medium text-sm sm:text-base md:text-lg lg:text-xl uppercase tracking-[0.2em] font-space mb-4 sm:mb-5 md:mb-6 block">
            Testimonials
          </span>
          <h2 className="font-space text-3xl sm:text-4xl md:text-6xl lg:text-8xl xl:text-9xl text-white font-medium md:font-light tracking-tight leading-[0.95] px-4">
            What Our Users Say
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 md:gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] h-[500px] sm:h-[600px] md:h-[800px]">
          <TestimonialsColumn testimonials={column1} duration={20} />
          <TestimonialsColumn testimonials={column2} duration={25} />
          <TestimonialsColumn testimonials={column3} duration={22} className="hidden md:block" />
        </div>
      </div>
    </section>
  );
}

// Final CTA Section
function CTASection() {
  return (
    <section className="relative bg-black py-12 sm:py-16 md:py-20 overflow-hidden">
      {/* Animated background gradients - reduced glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/[0.02] via-transparent to-transparent" />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-indigo-500/8 via-purple-500/6 to-pink-500/4 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{
          x: [0, -40, 0],
          y: [0, -20, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-transparent rounded-full blur-[120px]"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Headline */}
          <h2 className="font-space text-3xl sm:text-5xl md:text-4xl lg:text-6xl xl:text-7xl text-white font-medium md:font-light tracking-tight leading-[0.95] mb-4 sm:mb-6 px-4">
            Ready to
            <br />
            Transform
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">Your Sales Team?</span>
          </h2>

          {/* Description */}
          <p className="font-sans text-white/80 mt-4 sm:mt-6 text-base sm:text-lg md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed font-light px-4">
            Join 500+ companies training reps to dominate their markets.
          </p>

          {/* CTA Button */}
          <div className="mt-6 sm:mt-8">
            <Link
              href="/book-demo"
              className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-white text-black font-medium rounded-md text-sm sm:text-base md:text-lg tracking-tight hover:bg-white/95 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Book Your Demo Today
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 sm:mt-8 flex flex-col md:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 text-white/70 text-xs sm:text-sm md:text-base lg:text-lg font-light px-4">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              Setup in 10 minutes
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-500" />
              Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


// Animated Background Component
function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Animated gradient orbs */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-0 left-0 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 right-0 w-[700px] h-[700px] bg-gradient-to-bl from-pink-500/20 via-purple-500/20 to-transparent rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -70, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-500/15 via-blue-500/15 to-transparent rounded-full blur-[100px]"
      />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black" />
      
      {/* Animated grid pattern */}
      <motion.div
        animate={{
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      
      {/* Subtle animated particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            x: [0, Math.random() * 200 - 100],
            y: [0, Math.random() * 200 - 100],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          className="absolute w-2 h-2 bg-white/30 rounded-full blur-sm"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + i * 10}%`,
          }}
        />
      ))}
          </div>
  );
}

// Landing Footer Component
function LandingFooter() {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <footer className="bg-black border-t border-white/[0.03] py-5 sm:py-5 md:py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 md:gap-10 lg:gap-12">
          {/* Logo and Copyright */}
          <div className="col-span-1">
            <Link href="/landing" className="inline-block mb-4 sm:mb-6">
              <Image 
                src="/dooriqlogo.png" 
                alt="DoorIQ Logo" 
                width={1280}
                height={214}
                className="h-6 sm:h-7 md:h-8 w-auto"
                priority={false}
                loading="lazy"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              />
            </Link>
            <p className="text-white/70 text-sm font-light leading-relaxed">
              © {new Date().getFullYear()} DoorIQ. All rights reserved.
            </p>
          </div>

          {/* CTA - Right side on mobile */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 text-right sm:text-right lg:text-left">
            <h3 className="text-sm text-white/70 font-space uppercase tracking-wider mb-4 leading-none">Get Started</h3>
            <Link
              href="/book-demo"
              className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-black font-semibold rounded-md text-sm tracking-tight hover:bg-white/95 transition-all ml-auto sm:ml-0 lg:ml-0"
            >
              Book a Demo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Contact Information */}
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <h3 className="text-sm text-white/70 font-space uppercase tracking-wider mb-4 leading-none">Contact</h3>
            <ul className="space-y-3 list-none p-0 m-0">
              <li>
                <a
                  href="mailto:contact@dooriq.ai"
                  className="text-white/80 font-space hover:text-white transition-colors text-sm inline-flex items-center gap-1.5 break-all"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="break-all">contact@dooriq.ai</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:602-446-1330"
                  className="text-white/80 font-space hover:text-white transition-colors text-sm inline-flex items-center gap-1.5"
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  602-446-1330
                </a>
              </li>
              <li>
                <div className="text-white/80 font-space text-sm inline-flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>2505 Longview St<br />Austin, TX</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Page Sections */}
          <div className="hidden sm:block lg:col-span-1">
            <h3 className="text-sm text-white/70 font-space uppercase tracking-wider mb-4 leading-none">Sections</h3>
            <ul className="space-y-3 list-none p-0 m-0">
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="text-white/80 font-space hover:text-white transition-colors text-sm text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("solution")}
                  className="text-white/80 font-space hover:text-white transition-colors text-sm text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("stats")}
                  className="text-white/80 font-space hover:text-white transition-colors text-sm text-left"
                >
                  Results
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="text-white/80 font-space hover:text-white transition-colors text-sm text-left"
                >
                  Testimonials
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page
export default function LandingPage() {
  return (
    <main className="bg-black min-h-screen text-white relative">
      <Navigation />
      <HeroSection />
      <MeetTrainerSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <StatsSection />
      <TestimonialsSection />
      <CTASection />
      <LandingFooter />
    </main>
  );
}
