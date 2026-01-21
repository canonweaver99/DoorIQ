"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black)]"
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
  if (!metadata || !metadata.bubble) {
    return null;
  }
  return {
    name: agentName,
    image: metadata.bubble.image,
    color: metadata.bubble.color,
  };
}).filter((agent) => agent && agent.image); // Only include agents with images

const TOTAL_AGENTS = AGENTS_WITH_AVATARS.length;

// Avatar with Rings Component for 5-agent Carousel
interface AvatarWithRingsProps {
  agent: typeof AGENTS_WITH_AVATARS[number];
  variantStyles?: typeof COLOR_VARIANTS[keyof typeof COLOR_VARIANTS];
  size: 'tiny' | 'small' | 'large';
  opacity: number;
  isCenter: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function AvatarWithRings({ agent, variantStyles, size, opacity, isCenter, onClick, onMouseEnter, onMouseLeave }: AvatarWithRingsProps) {
  const sizeClasses = size === 'large' 
    ? 'h-[180px] w-[180px] sm:h-[240px] sm:w-[240px] md:h-[300px] md:w-[300px]'
    : size === 'small'
    ? 'h-[110px] w-[110px] sm:h-[150px] sm:w-[150px] md:h-[190px] md:w-[190px]'
    : 'h-[70px] w-[70px] sm:h-[95px] sm:w-[95px] md:h-[120px] md:w-[120px]';
  
  const borderWidth = size === 'large' ? 'border-2' : size === 'small' ? 'border-[1.5px]' : 'border-[1px]';
  
  // Get variant styles for side avatars based on their color
  const agentVariantStyles = variantStyles || COLOR_VARIANTS[agent.color as keyof typeof COLOR_VARIANTS];

  return (
    <div 
      className={clsx("relative", sizeClasses, onClick && "cursor-pointer")}
      style={{ opacity }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Animated rings for all avatars */}
      <>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={clsx(
              "absolute inset-0 rounded-full bg-gradient-to-br to-transparent",
              borderWidth,
              agentVariantStyles.border[i],
              agentVariantStyles.gradient
            )}
            animate={{
              rotate: 360,
            }}
            transition={{
              rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
            }}
            style={{ opacity: isCenter ? 0.7 : 0.5 }}
          >
            <div
              className={clsx(
                "absolute inset-0 rounded-full mix-blend-screen",
                `bg-[radial-gradient(ellipse_at_center,${agentVariantStyles.gradient.replace("from-", "")}/12%,transparent_70%)]`
              )}
            />
          </motion.div>
        ))}
      </>
      
      {/* Agent Avatar */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div 
          className={clsx(
            "relative w-full h-full rounded-full overflow-hidden",
            isCenter ? "shadow-[0_0_20px_rgba(94,234,212,0.2)]" : "shadow-2xl"
          )}
        >
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div
              className={clsx(
                "absolute inset-[-12%] rounded-full bg-gradient-to-br mix-blend-screen hero-gradient-spin",
                agentVariantStyles.gradient,
                "to-transparent opacity-60"
              )}
              style={{
                "--hero-gradient-speed": isCenter ? "14s" : "18s",
              }}
            />
            <div
              className={clsx(
                "absolute inset-[-8%] rounded-full bg-gradient-to-tr mix-blend-screen hero-gradient-spin reverse",
                agentVariantStyles.gradient,
                "to-transparent opacity-35"
              )}
              style={{
                "--hero-gradient-speed": isCenter ? "16s" : "22s",
              }}
            />
          </div>
          <Image
            src={agent.image!}
            alt={agent.name}
            fill
            className="object-cover relative z-10"
            sizes={size === 'large' 
              ? "(max-width: 640px) 440px, (max-width: 768px) 520px, 600px"
              : size === 'small'
              ? "(max-width: 640px) 260px, (max-width: 768px) 310px, 360px"
              : "(max-width: 640px) 160px, (max-width: 768px) 190px, 220px"
            }
            quality={95}
            priority={isCenter}
          />
        </div>
      </div>
    </div>
  );
}

export function BackgroundCircles({
  title = "Background Circles",
  description = "Optional Description",
  className,
  variant,
  autoCycleIntervalMs = 2500, // Updated to 2.5 seconds
  ctaPrimaryHref,
  ctaPrimaryText,
  ctaSecondaryHref,
  ctaSecondaryText,
}: BackgroundCirclesProps) {
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [direction, setDirection] = useState<1 | -1>(1);
  const inactivityTimeout = 5000; // 5 seconds of inactivity before resuming auto-rotation

  const router = useRouter();

  const recordInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
    setIsPaused(true);
  }, []);

  const handleAgentClick = useCallback((agentName: string) => {
    // Navigate to trainer with selected agent
    router.push(`/trainer/select-homeowner?agent=${encodeURIComponent(agentName)}`);
  }, [router]);

  const goToNext = useCallback(() => {
    if (TOTAL_AGENTS === 0) return;
    setDirection(1);
    setCurrentAgentIndex((prev) => (prev + 1) % TOTAL_AGENTS);
  }, []);

  const goToPrevious = useCallback(() => {
    if (TOTAL_AGENTS === 0) return;
    setDirection(-1);
    setCurrentAgentIndex((prev) => (prev - 1 + TOTAL_AGENTS) % TOTAL_AGENTS);
  }, []);

  const goToIndex = useCallback((index: number) => {
    if (TOTAL_AGENTS === 0) return;
    if (index === currentAgentIndex) {
      recordInteraction();
      return;
    }

    const forwardSteps = (index - currentAgentIndex + TOTAL_AGENTS) % TOTAL_AGENTS;
    const backwardSteps = (currentAgentIndex - index + TOTAL_AGENTS) % TOTAL_AGENTS;
    setDirection(forwardSteps <= backwardSteps ? 1 : -1);

    setCurrentAgentIndex(index);
    recordInteraction();
  }, [currentAgentIndex, recordInteraction]);

  const handleAvatarClick = useCallback((index: number, agentName: string) => {
    if (index === currentAgentIndex) {
      handleAgentClick(agentName);
    } else {
      goToIndex(index);
    }
  }, [currentAgentIndex, goToIndex, handleAgentClick]);

  const handleNextClick = useCallback(() => {
    recordInteraction();
    goToNext();
  }, [recordInteraction, goToNext]);

  const handlePreviousClick = useCallback(() => {
    recordInteraction();
    goToPrevious();
  }, [recordInteraction, goToPrevious]);


  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        recordInteraction();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        recordInteraction();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, recordInteraction]);

  // Auto-resume after inactivity
  useEffect(() => {
    if (variant) return; // respect explicit variant
    
    const checkInactivity = setInterval(() => {
      const timeSinceLastInteraction = Date.now() - lastInteractionTime;
      if (isPaused && timeSinceLastInteraction > inactivityTimeout) {
        setIsPaused(false);
      }
    }, 1000);

    return () => clearInterval(checkInactivity);
  }, [variant, lastInteractionTime, isPaused, inactivityTimeout]);

  // Auto-rotation
  useEffect(() => {
    if (variant || isPaused) return; // respect explicit variant or pause
    const id = setInterval(() => {
      goToNext();
    }, autoCycleIntervalMs);
    return () => clearInterval(id);
  }, [variant, autoCycleIntervalMs, isPaused, goToNext]);

  const currentAgent = AGENTS_WITH_AVATARS[currentAgentIndex];
  // Use the agent's assigned color from metadata, or fall back to variant prop
  const activeVariant = variant ?? (currentAgent.color as keyof typeof COLOR_VARIANTS);
  const variantStyles = COLOR_VARIANTS[activeVariant];

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

  // Get 5 agents for carousel: far-left, left, center, right, far-right
  if (TOTAL_AGENTS === 0) {
    return null;
  }

  type SlotName = "farLeft" | "left" | "center" | "right" | "farRight";

  const slotConfig: Record<SlotName, { size: AvatarWithRingsProps["size"]; opacity: number; zIndex: number; scale: number }> = {
    farLeft: { size: "tiny", opacity: 0.8, zIndex: 5, scale: 0.55 },
    left: { size: "small", opacity: 0.9, zIndex: 10, scale: 0.8 },
    center: { size: "large", opacity: 1, zIndex: 20, scale: 1 },
    right: { size: "small", opacity: 0.9, zIndex: 10, scale: 0.8 },
    farRight: { size: "tiny", opacity: 0.8, zIndex: 5, scale: 0.55 },
  };

  const carouselAgents = useMemo(() => {
    if (TOTAL_AGENTS === 0) {
      return [] as Array<{ agent: typeof AGENTS_WITH_AVATARS[number]; index: number; slot: SlotName }>;
    }

    const offsets: Array<{ offset: number; slot: SlotName }> = [
      { offset: -2, slot: "farLeft" },
      { offset: -1, slot: "left" },
      { offset: 0, slot: "center" },
      { offset: 1, slot: "right" },
      { offset: 2, slot: "farRight" },
    ];

    return offsets.map(({ offset, slot }) => {
      const agentIndex = (currentAgentIndex + offset + TOTAL_AGENTS) % TOTAL_AGENTS;
      return {
        agent: AGENTS_WITH_AVATARS[agentIndex],
        index: agentIndex,
        slot,
      };
    });
  }, [currentAgentIndex]);

  const centerVariantStyles = COLOR_VARIANTS[activeVariant];

  return (
    <div
      className={clsx(
        "relative flex h-screen w-full flex-col items-center justify-center overflow-hidden",
        "bg-white dark:bg-black/5",
        className
      )}
    >
      <AnimatedGrid />
      
      {/* Title and Description */}
      <motion.div
        className="relative z-10 text-center px-4"
        style={{ marginBottom: '40px', marginTop: '-100px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {title && (
          <h1
            className={clsx(
              "text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl",
              "bg-gradient-to-b from-slate-950 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent",
              "drop-shadow-[0_0_32px_rgba(94,234,212,0.4)]"
            )}
            style={{ marginBottom: '16px' }}
          >
            {title}
          </h1>
        )}

        {description && (
          <motion.p
            className="text-base md:text-lg lg:text-xl dark:text-white text-slate-950 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}
      </motion.div>

      {/* 5-Agent Carousel Container */}
      <div className="relative w-full max-w-[1800px] mx-auto px-4">
        <div className="relative flex items-center justify-center gap-4 md:gap-8">
          <button
            type="button"
            onClick={handlePreviousClick}
            aria-label="View previous agent"
            className="group/arrow-left flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/80 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:ring-offset-slate-950 z-50 relative cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-5 w-5 transition group-hover/arrow-left:-translate-x-0.5 pointer-events-none" strokeWidth={1.75} />
          </button>

          <div className="relative flex-1 max-w-6xl" style={{ height: '400px' }}>
            <div className="absolute inset-0 flex items-center justify-center">
              {carouselAgents.map(({ agent, index, slot }) => {
                const config = slotConfig[slot];
                const isCenter = slot === "center";
                
                const positions = {
                  farLeft: '-350%',
                  left: '-150%',
                  center: '0%',
                  right: '150%',
                  farRight: '350%',
                };

                return (
                  <motion.div
                    key={slot}
                    className="absolute flex items-center justify-center will-change-transform"
                    style={{
                      x: positions[slot],
                      zIndex: config.zIndex,
                    }}
                  >
                    <motion.div
                      animate={{
                        scale: config.scale,
                        opacity: config.opacity,
                      }}
                      transition={{
                        type: "tween",
                        duration: 0.8,
                        ease: [0.25, 0.1, 0.25, 1],
                      }}
                    >
                      <button
                        onClick={() => handleAvatarClick(index, agent.name)}
                        className="focus:outline-none transition-transform hover:scale-105 active:scale-95"
                        aria-label={isCenter ? `Select ${agent.name}` : `View ${agent.name}`}
                      >
                        <AvatarWithRings
                          agent={agent}
                          variantStyles={isCenter ? centerVariantStyles : undefined}
                          size={config.size}
                          opacity={config.opacity}
                          isCenter={isCenter}
                        />
                      </button>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextClick}
            aria-label="View next agent"
            className="group/arrow-right flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-white/80 text-slate-900 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:focus-visible:ring-offset-slate-950 z-50 relative cursor-pointer shrink-0"
          >
            <ArrowRight className="h-5 w-5 transition group-hover/arrow-right:translate-x-0.5 pointer-events-none" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* Navigation Dots removed per request */}

      {/* CTA Buttons */}
      {(ctaPrimaryHref || ctaSecondaryHref) && (
        <motion.div 
          className="relative z-10 flex items-center justify-center gap-4 flex-wrap px-4"
          style={{ marginTop: '28px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {ctaPrimaryHref && (
            <Link href={ctaPrimaryHref}>
              <Button className="px-6 py-4 text-base md:px-8 md:py-5 md:text-lg" size="lg" variant="brand">
                {ctaPrimaryText ?? "Get Started"}
              </Button>
            </Link>
          )}
          {ctaSecondaryHref && (
            <Link href={ctaSecondaryHref} onClick={handleSecondaryClick}>
              <Button className="px-6 py-4 text-base md:px-8 md:py-5 md:text-lg" size="lg" variant="subtle">
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


