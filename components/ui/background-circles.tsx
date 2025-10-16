"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from "@/components/trainer/personas";

export interface BackgroundCirclesProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: keyof typeof COLOR_VARIANTS; // if omitted, colors will auto-cycle
  autoCycleIntervalMs?: number; // only used when variant is not provided
  ctaPrimaryHref?: string;
  ctaPrimaryText?: string;
  ctaSecondaryHref?: string;
  ctaSecondaryText?: string;
}

export const COLOR_VARIANTS = {
  primary: {
    border: [
      "border-emerald-500/60",
      "border-cyan-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-emerald-500/30",
  },
  secondary: {
    border: [
      "border-violet-500/60",
      "border-fuchsia-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-violet-500/30",
  },
  tertiary: {
    border: [
      "border-orange-500/60",
      "border-yellow-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-orange-500/30",
  },
  quaternary: {
    border: [
      "border-purple-500/60",
      "border-pink-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-purple-500/30",
  },
  quinary: {
    border: [
      "border-red-500/60",
      "border-rose-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-red-500/30",
  },
  senary: {
    border: [
      "border-blue-500/60",
      "border-sky-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-blue-500/30",
  },
  septenary: {
    border: [
      "border-gray-500/60",
      "border-gray-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-gray-500/30",
  },
  octonary: {
    border: [
      "border-red-500/60",
      "border-rose-400/50",
      "border-slate-600/30",
    ],
    gradient: "from-red-500/30",
  },
  nonary: {
    border: [
      "border-amber-500/60",
      "border-yellow-300/50",
      "border-slate-600/30",
    ],
    gradient: "from-amber-500/30",
  },
  denary: {
    border: [
      "border-purple-500/60",
      "border-fuchsia-300/50",
      "border-slate-600/30",
    ],
    gradient: "from-purple-500/30",
  },
  duodenary: {
    border: [
      "border-cyan-500/60",
      "border-teal-300/50",
      "border-slate-600/30",
    ],
    gradient: "from-cyan-500/30",
  },
  undenary: {
    border: [
      "border-violet-500/60",
      "border-purple-300/50",
      "border-slate-600/30",
    ],
    gradient: "from-violet-500/30",
  },
} as const;

const AnimatedGrid = () => (
  <motion.div
    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
    animate={{
      backgroundPosition: ["0% 0%", "100% 100%"],
    }}
    transition={{
      duration: 40,
      repeat: Number.POSITIVE_INFINITY,
      ease: "linear",
    }}
  >
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#64748B_0%,#64748B_1px,transparent_1px,transparent_4%)] opacity-20" />
  </motion.div>
);

// Create agent data with avatars
const AGENTS_WITH_AVATARS = ALLOWED_AGENT_ORDER.map((agentName) => {
  const metadata = PERSONA_METADATA[agentName];
  return {
    name: agentName,
    image: metadata.bubble.image,
    color: metadata.bubble.color,
  };
}).filter((agent) => agent.image); // Only include agents with images

export function BackgroundCircles({
  title = "Background Circles",
  description = "Optional Description",
  className,
  variant,
  autoCycleIntervalMs = 2500,
  ctaPrimaryHref,
  ctaPrimaryText,
  ctaSecondaryHref,
  ctaSecondaryText,
}: BackgroundCirclesProps) {
  const variantKeys = Object.keys(COLOR_VARIANTS) as (keyof typeof COLOR_VARIANTS)[];
  const [autoVariant, setAutoVariant] = useState<keyof typeof COLOR_VARIANTS>("octonary");
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToNext = useCallback(() => {
    setCurrentAgentIndex((prev) => (prev + 1) % AGENTS_WITH_AVATARS.length);
    setAutoVariant((prev) => {
      const idx = variantKeys.indexOf(prev);
      const next = variantKeys[(idx + 1) % variantKeys.length];
      return next;
    });
  }, [variantKeys]);

  const goToPrevious = useCallback(() => {
    setCurrentAgentIndex((prev) => (prev - 1 + AGENTS_WITH_AVATARS.length) % AGENTS_WITH_AVATARS.length);
    setAutoVariant((prev) => {
      const idx = variantKeys.indexOf(prev);
      const next = variantKeys[(idx - 1 + variantKeys.length) % variantKeys.length];
      return next;
    });
  }, [variantKeys]);

  const goToIndex = useCallback((index: number) => {
    setCurrentAgentIndex(index);
    setAutoVariant(variantKeys[index % variantKeys.length]);
  }, [variantKeys]);

  useEffect(() => {
    if (variant || isPaused) return; // respect explicit variant or pause
    const id = setInterval(() => {
      goToNext();
    }, autoCycleIntervalMs);
    return () => clearInterval(id);
  }, [variant, autoCycleIntervalMs, isPaused, goToNext]);

  const activeVariant = variant ?? autoVariant;
  const variantStyles = COLOR_VARIANTS[activeVariant];
  const currentAgent = AGENTS_WITH_AVATARS[currentAgentIndex];

  const handleSecondaryClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (!ctaSecondaryHref) return;
      if (!ctaSecondaryHref.startsWith('#')) return;

      event.preventDefault();
      const targetElement = document.querySelector(ctaSecondaryHref);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [ctaSecondaryHref]
  );

  return (
    <div
      className={clsx(
        "relative flex h-screen w-full flex-col items-center justify-center overflow-hidden",
        "bg-white dark:bg-black/5",
        className
      )}
    >
      <AnimatedGrid />
      
      {/* Title and Description - Above circles with more spacing */}
      <motion.div
        className="relative z-10 text-center mb-16 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {title && (
          <h1
            className={clsx(
              "text-5xl font-bold tracking-tight md:text-7xl mb-6",
              "bg-gradient-to-b from-slate-950 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent",
              "drop-shadow-[0_0_32px_rgba(94,234,212,0.4)]"
            )}
          >
            {title}
          </h1>
        )}

        {description && (
          <motion.p
            className="text-lg md:text-xl dark:text-white text-slate-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}
      </motion.div>

      {/* Carousel Container with Pause on Hover */}
      <div 
        className="relative group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Circles with Agent Avatar - Center */}
        <motion.div 
          className="relative h-[320px] w-[320px] sm:h-[400px] sm:w-[400px] md:h-[480px] md:w-[480px]"
          key={currentAgentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`${currentAgentIndex}-${i}`}
              className={clsx(
                "absolute inset-0 rounded-full",
                "border-2 bg-gradient-to-br to-transparent",
                variantStyles.border[i],
                variantStyles.gradient
              )}
              initial={{ opacity: 0 }}
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                opacity: { duration: 0.8 },
                rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
              }}
            >
              <div
                className={clsx(
                  "absolute inset-0 rounded-full mix-blend-screen",
                  `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                    "from-",
                    ""
                  )}/10%,transparent_70%)]`
                )}
              />
            </motion.div>
          ))}
          
          {/* Agent Avatar in Center - synchronized with circles */}
          {currentAgent?.image && (
            <motion.div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                scale: [1, 1.05, 1],
              }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: 0.8 },
                scale: {
                  duration: 4,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: 0,
                }
              }}
            >
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                <Image
                  key={currentAgentIndex}
                  src={currentAgent.image}
                  alt={currentAgent.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 320px, (max-width: 768px) 400px, 480px"
                  priority
                />
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Navigation Arrows - Show on Hover (hidden on mobile) */}
        <motion.button
          onClick={goToPrevious}
          className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 lg:-translate-x-20 bg-white/10 dark:bg-black/20 backdrop-blur-sm hover:bg-white/20 dark:hover:bg-black/30 text-slate-900 dark:text-white p-3 rounded-full transition-all shadow-lg opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Previous agent"
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        <motion.button
          onClick={goToNext}
          className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 lg:translate-x-20 bg-white/10 dark:bg-black/20 backdrop-blur-sm hover:bg-white/20 dark:hover:bg-black/30 text-slate-900 dark:text-white p-3 rounded-full transition-all shadow-lg opacity-0 group-hover:opacity-100"
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Next agent"
        >
          <ChevronRight className="w-6 h-6" />
        </motion.button>

        {/* Agent Name Display */}
        {currentAgent && (
          <motion.div
            key={`name-${currentAgentIndex}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="absolute -bottom-12 sm:-bottom-14 md:-bottom-16 left-1/2 -translate-x-1/2 text-center w-full px-4"
          >
            <p className="text-lg sm:text-xl md:text-2xl font-semibold dark:text-white text-slate-900 truncate">
              {currentAgent.name}
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation Dots */}
      <div className="relative z-10 flex items-center justify-center gap-2 mt-16 sm:mt-18 md:mt-20 px-4">
        {AGENTS_WITH_AVATARS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className={clsx(
              "rounded-full transition-all duration-300",
              index === currentAgentIndex
                ? "bg-white dark:bg-white w-6 h-2 sm:w-8 sm:h-2"
                : "bg-white/40 dark:bg-white/40 hover:bg-white/60 dark:hover:bg-white/60 w-2 h-2"
            )}
            aria-label={`Go to agent ${index + 1}`}
          />
        ))}
      </div>

      {/* CTA Buttons - Below dots */}
      {(ctaPrimaryHref || ctaSecondaryHref) && (
        <motion.div 
          className="relative z-10 mt-8 flex items-center justify-center gap-4 flex-wrap px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {ctaPrimaryHref && (
            <Link href={ctaPrimaryHref}>
              <Button className="px-8 py-5 text-lg" size="lg" variant="brand">
                {ctaPrimaryText ?? "Get Started"}
              </Button>
            </Link>
          )}
          {ctaSecondaryHref && (
            <Link href={ctaSecondaryHref} onClick={handleSecondaryClick}>
              <Button className="px-8 py-5 text-lg" size="lg" variant="subtle">
                {ctaSecondaryText ?? "Learn More"}
              </Button>
            </Link>
          )}
        </motion.div>
      )}

      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_40%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0F766E/30%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2DD4BF/15%,transparent)] blur-[80px]" />
      </div>
    </div>
  );
}

export function DemoCircles() {
  const [currentVariant, setCurrentVariant] =
    useState<keyof typeof COLOR_VARIANTS>("octonary");

  const variants = Object.keys(
    COLOR_VARIANTS
  ) as (keyof typeof COLOR_VARIANTS)[];

  function getNextVariant() {
    const currentIndex = variants.indexOf(currentVariant);
    const nextVariant = variants[(currentIndex + 1) % variants.length];
    return nextVariant;
  }

  return (
    <>
      <BackgroundCircles variant={currentVariant} />
      <div className="absolute top-12 right-12">
        <button
          type="button"
          className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-4 py-1 rounded-md z-10 text-sm font-medium"
          onClick={() => {
            setCurrentVariant(getNextVariant());
          }}
        >
          Change Variant
        </button>
      </div>
    </>
  );
}


