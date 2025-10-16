"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    ? 'h-[220px] w-[220px] sm:h-[260px] sm:w-[260px] md:h-[300px] md:w-[300px]'
    : size === 'small'
    ? 'h-[130px] w-[130px] sm:h-[155px] sm:w-[155px] md:h-[180px] md:w-[180px]'
    : 'h-[80px] w-[80px] sm:h-[95px] sm:w-[95px] md:h-[110px] md:w-[110px]';
  
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
      {/* Static rings for all avatars */}
      <>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={clsx(
              "absolute inset-0 rounded-full bg-gradient-to-br to-transparent",
              borderWidth,
              agentVariantStyles.border[i],
              agentVariantStyles.gradient
            )}
            style={{ opacity: isCenter ? 0.7 : 0.5 }}
          >
            <div
              className={clsx(
                "absolute inset-0 rounded-full mix-blend-screen",
                `bg-[radial-gradient(ellipse_at_center,${agentVariantStyles.gradient.replace("from-", "")}/12%,transparent_70%)]`
              )}
            />
          </div>
        ))}
      </>
      
      {/* Agent Avatar */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div 
          className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
        >
          <Image
            src={agent.image!}
            alt={agent.name}
            fill
            className="object-cover"
            sizes={size === 'large' 
              ? "(max-width: 640px) 220px, (max-width: 768px) 260px, 300px"
              : size === 'small'
              ? "(max-width: 640px) 130px, (max-width: 768px) 155px, 180px"
              : "(max-width: 640px) 80px, (max-width: 768px) 95px, 110px"
            }
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
  const variantKeys = Object.keys(COLOR_VARIANTS) as (keyof typeof COLOR_VARIANTS)[];
  const [autoVariant, setAutoVariant] = useState<keyof typeof COLOR_VARIANTS>("octonary");
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const inactivityTimeout = 5000; // 5 seconds of inactivity before resuming auto-rotation

  const router = useRouter();

  const recordInteraction = useCallback(() => {
    setLastInteractionTime(Date.now());
    setIsPaused(true);
  }, []);

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
    recordInteraction();
  }, [variantKeys, recordInteraction]);

  const handleAgentClick = useCallback((agentName: string) => {
    // Navigate to trainer with selected agent
    router.push(`/trainer/select-homeowner?agent=${encodeURIComponent(agentName)}`);
  }, [router]);


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

  // Get 5 agents for carousel: far-left, left, center, right, far-right
  const getCarouselAgents = () => {
    const farLeftIndex = (currentAgentIndex - 2 + AGENTS_WITH_AVATARS.length) % AGENTS_WITH_AVATARS.length;
    const leftIndex = (currentAgentIndex - 1 + AGENTS_WITH_AVATARS.length) % AGENTS_WITH_AVATARS.length;
    const rightIndex = (currentAgentIndex + 1) % AGENTS_WITH_AVATARS.length;
    const farRightIndex = (currentAgentIndex + 2) % AGENTS_WITH_AVATARS.length;
    
    return {
      farLeft: { agent: AGENTS_WITH_AVATARS[farLeftIndex], index: farLeftIndex },
      left: { agent: AGENTS_WITH_AVATARS[leftIndex], index: leftIndex },
      center: { agent: AGENTS_WITH_AVATARS[currentAgentIndex], index: currentAgentIndex },
      right: { agent: AGENTS_WITH_AVATARS[rightIndex], index: rightIndex },
      farRight: { agent: AGENTS_WITH_AVATARS[farRightIndex], index: farRightIndex },
    };
  };

  const carouselAgents = getCarouselAgents();
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
      <div 
        className="relative w-full max-w-[1200px] mx-auto px-4"
        onMouseEnter={() => recordInteraction()}
        onMouseLeave={() => {}}
      >
        <div className="relative flex items-center justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6">
          {/* Far Left Avatar */}
          <button
            key={`far-left-${carouselAgents.farLeft.index}`}
            onClick={() => goToIndex(carouselAgents.farLeft.index)}
            className="relative z-5 cursor-pointer focus:outline-none group/far-left"
          >
            <AvatarWithRings
              agent={carouselAgents.farLeft.agent}
              size="tiny"
              opacity={0.5}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.farLeft.agent.name)}
            />
          </button>

          {/* Left Avatar */}
          <button
            key={`left-${carouselAgents.left.index}`}
            onClick={() => goToIndex(carouselAgents.left.index)}
            className="relative z-10 cursor-pointer focus:outline-none group/left"
          >
            <AvatarWithRings
              agent={carouselAgents.left.agent}
              size="small"
              opacity={0.7}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.left.agent.name)}
            />
          </button>

          {/* Center Avatar (Active) */}
          <div 
            key={`center-${carouselAgents.center.index}`}
            className="relative z-20"
          >
            <div>
              <AvatarWithRings
                agent={carouselAgents.center.agent}
                variantStyles={centerVariantStyles}
                size="large"
                opacity={1}
                isCenter={true}
                onClick={() => handleAgentClick(carouselAgents.center.agent.name)}
              />
            </div>
          </div>

          {/* Right Avatar */}
          <button
            key={`right-${carouselAgents.right.index}`}
            onClick={() => goToIndex(carouselAgents.right.index)}
            className="relative z-10 cursor-pointer focus:outline-none group/right"
          >
            <AvatarWithRings
              agent={carouselAgents.right.agent}
              size="small"
              opacity={0.7}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.right.agent.name)}
            />
          </button>

          {/* Far Right Avatar */}
          <button
            key={`far-right-${carouselAgents.farRight.index}`}
            onClick={() => goToIndex(carouselAgents.farRight.index)}
            className="relative z-5 cursor-pointer focus:outline-none group/far-right"
          >
            <AvatarWithRings
              agent={carouselAgents.farRight.agent}
              size="tiny"
              opacity={0.5}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.farRight.agent.name)}
            />
          </button>
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="relative z-10 flex items-center justify-center gap-2.5 px-4" style={{ marginTop: '50px' }}>
        {AGENTS_WITH_AVATARS.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className={clsx(
              "rounded-full transition-all duration-300 hover:scale-110",
              index === currentAgentIndex
                ? "bg-white dark:bg-white w-8 h-2.5 sm:w-10 sm:h-3"
                : "bg-white/40 dark:bg-white/40 hover:bg-white/70 dark:hover:bg-white/70 w-2.5 h-2.5"
            )}
            aria-label={`Go to agent ${index + 1}`}
          />
        ))}
      </div>

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


