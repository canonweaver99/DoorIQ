"use client";

import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState, useCallback, useRef } from "react";
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

// Avatar with Rings Component for 3D Carousel
interface AvatarWithRingsProps {
  agent: typeof AGENTS_WITH_AVATARS[number];
  variantStyles?: typeof COLOR_VARIANTS[keyof typeof COLOR_VARIANTS];
  size: 'small' | 'large';
  opacity: number;
  isCenter: boolean;
}

function AvatarWithRings({ agent, variantStyles, size, opacity, isCenter }: AvatarWithRingsProps) {
  const sizeClasses = size === 'large' 
    ? 'h-[320px] w-[320px] sm:h-[400px] sm:w-[400px] md:h-[480px] md:w-[480px]'
    : 'h-[240px] w-[240px] sm:h-[300px] sm:w-[300px] md:h-[360px] md:w-[360px]';
  
  const borderWidth = size === 'large' ? 'border-2' : 'border-[1.5px]';
  
  // Get variant styles for side avatars based on their color
  const agentVariantStyles = variantStyles || COLOR_VARIANTS[agent.color as keyof typeof COLOR_VARIANTS];

  return (
    <motion.div 
      className={clsx("relative", sizeClasses)}
      style={{ opacity }}
      initial={{ opacity: 0.3, scale: 0.8 }}
      animate={{ opacity, scale: 1 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.4, 0, 0.2, 1]  // Custom easing for smooth natural motion
      }}
    >
      {isCenter && variantStyles ? (
        // Center avatar with animated rings
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
                scale: [1, 1.05, 1],
                opacity: [0.7, 0.9, 0.7],
              }}
              transition={{
                rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                scale: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
                opacity: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0 },
              }}
            >
              <div
                className={clsx(
                  "absolute inset-0 rounded-full mix-blend-screen",
                  `bg-[radial-gradient(ellipse_at_center,${agentVariantStyles.gradient.replace("from-", "")}/10%,transparent_70%)]`
                )}
              />
            </motion.div>
          ))}
        </>
      ) : (
        // Side avatars with static rings
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
              style={{ opacity: 0.5 }}
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
      )}
      
      {/* Agent Avatar */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        animate={isCenter ? {
          scale: [1, 1.05, 1],
        } : undefined}
        transition={isCenter ? {
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0,
        } : undefined}
      >
        <motion.div 
          className="relative w-full h-full rounded-full overflow-hidden shadow-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Image
            src={agent.image!}
            alt={agent.name}
            fill
            className="object-cover transition-opacity duration-300"
            sizes={size === 'large' 
              ? "(max-width: 640px) 280px, (max-width: 768px) 350px, 420px"
              : "(max-width: 640px) 180px, (max-width: 768px) 220px, 260px"
            }
            priority={isCenter}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function BackgroundCircles({
  title = "Background Circles",
  description = "Optional Description",
  className,
  variant,
  autoCycleIntervalMs = 4500,
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

  // Drag/swipe handling
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const SWIPE_THRESHOLD = 50;
    const swipeDistance = info.offset.x;
    
    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        // Swiped right, go to previous
        goToPrevious();
      } else {
        // Swiped left, go to next
        goToNext();
      }
    }
  }, [goToNext, goToPrevious]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

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

  // Get left, center, and right agents for 3D carousel
  const getCarouselAgents = () => {
    const leftIndex = (currentAgentIndex - 1 + AGENTS_WITH_AVATARS.length) % AGENTS_WITH_AVATARS.length;
    const rightIndex = (currentAgentIndex + 1) % AGENTS_WITH_AVATARS.length;
    
    return {
      left: { agent: AGENTS_WITH_AVATARS[leftIndex], index: leftIndex },
      center: { agent: AGENTS_WITH_AVATARS[currentAgentIndex], index: currentAgentIndex },
      right: { agent: AGENTS_WITH_AVATARS[rightIndex], index: rightIndex },
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
      
      {/* Title and Description - Balanced spacing */}
      <motion.div
        className="relative z-10 text-center px-4"
        style={{ marginBottom: '48px' }}
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
            style={{ marginBottom: '18px' }}
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

      {/* 3D Carousel Container with Pause on Hover and Drag/Swipe */}
      <motion.div 
        className="relative w-full max-w-7xl mx-auto px-4 cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className="relative flex items-center justify-center gap-6 md:gap-10 lg:gap-16">
          
          {/* Left Avatar (Previous) */}
          <motion.button
            onClick={() => goToIndex(carouselAgents.left.index)}
            className="relative z-10 cursor-pointer focus:outline-none group/left"
            initial={{ opacity: 0.7, scale: 0.75 }}
            animate={{ opacity: 0.7, scale: 0.75 }}
            whileHover={{ scale: 0.8, opacity: 0.85 }}
            whileTap={{ scale: 0.7 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <AvatarWithRings
              agent={carouselAgents.left.agent}
              size="small"
              opacity={0.7}
              isCenter={false}
            />
          </motion.button>

          {/* Center Avatar (Active) */}
          <motion.div 
            className="relative z-20"
            initial={{ opacity: 0.7, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <AvatarWithRings
              agent={carouselAgents.center.agent}
              variantStyles={centerVariantStyles}
              size="large"
              opacity={1}
              isCenter={true}
            />
            
            {/* Agent Name - Enhanced styling and positioning */}
            <motion.div
              key={`name-${currentAgentIndex}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="absolute left-1/2 -translate-x-1/2 text-center"
              style={{ top: 'calc(100% + 24px)' }}
            >
              <p className="text-xl md:text-2xl font-bold dark:text-white text-slate-900 whitespace-nowrap" style={{ letterSpacing: '0.3px', fontWeight: 700 }}>
                {carouselAgents.center.agent.name}
              </p>
            </motion.div>
          </motion.div>

          {/* Right Avatar (Next) */}
          <motion.button
            onClick={() => goToIndex(carouselAgents.right.index)}
            className="relative z-10 cursor-pointer focus:outline-none group/right"
            initial={{ opacity: 0.7, scale: 0.75 }}
            animate={{ opacity: 0.7, scale: 0.75 }}
            whileHover={{ scale: 0.8, opacity: 0.85 }}
            whileTap={{ scale: 0.7 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <AvatarWithRings
              agent={carouselAgents.right.agent}
              size="small"
              opacity={0.7}
              isCenter={false}
            />
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Dots - 24px gap from name */}
      <div className="relative z-10 flex items-center justify-center gap-2 px-4" style={{ marginTop: '24px' }}>
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

      {/* CTA Buttons - 36px gap from dots */}
      {(ctaPrimaryHref || ctaSecondaryHref) && (
        <motion.div 
          className="relative z-10 flex items-center justify-center gap-4 flex-wrap px-4"
          style={{ marginTop: '36px' }}
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


