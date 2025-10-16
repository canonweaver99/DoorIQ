"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
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
  autoCycleIntervalMs = 1600,
  ctaPrimaryHref,
  ctaPrimaryText,
  ctaSecondaryHref,
  ctaSecondaryText,
}: BackgroundCirclesProps) {
  const variantKeys = Object.keys(COLOR_VARIANTS) as (keyof typeof COLOR_VARIANTS)[];
  const [autoVariant, setAutoVariant] = useState<keyof typeof COLOR_VARIANTS>("octonary");
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);

  useEffect(() => {
    if (variant) return; // respect explicit variant
    const id = setInterval(() => {
      setAutoVariant((prev) => {
        const idx = variantKeys.indexOf(prev);
        const next = variantKeys[(idx + 1) % variantKeys.length];
        return next;
      });
      // Cycle through agents when color changes
      setCurrentAgentIndex((prev) => (prev + 1) % AGENTS_WITH_AVATARS.length);
    }, autoCycleIntervalMs);
    return () => clearInterval(id);
  }, [variant, autoCycleIntervalMs, variantKeys.length]);

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
      
      {/* Title and Description - Above circles */}
      <motion.div
        className="relative z-10 text-center mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {title && (
          <h1
            className={clsx(
              "text-5xl font-bold tracking-tight md:text-7xl",
              "bg-gradient-to-b from-slate-950 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent",
              "drop-shadow-[0_0_32px_rgba(94,234,212,0.4)]"
            )}
          >
            {title}
          </h1>
        )}

        {description && (
          <motion.p
            className="mt-6 text-lg md:text-xl dark:text-white text-slate-950"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}
      </motion.div>

      {/* Background Circles with Agent Avatar - Center */}
      <motion.div 
        className="relative h-[480px] w-[480px]"
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
                sizes="480px"
                priority
              />
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* CTA Buttons - Below circles */}
      {(ctaPrimaryHref || ctaSecondaryHref) && (
        <motion.div 
          className="relative z-10 mt-12 flex items-center justify-center gap-4"
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


