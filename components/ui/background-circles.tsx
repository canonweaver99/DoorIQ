"use client";

import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import clsx from "clsx";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    ? 'h-[280px] w-[280px] sm:h-[350px] sm:w-[350px] md:h-[420px] md:w-[420px]'
    : size === 'small'
    ? 'h-[200px] w-[200px] sm:h-[240px] sm:w-[240px] md:h-[300px] md:w-[300px]'
    : 'h-[140px] w-[140px] sm:h-[180px] sm:w-[180px] md:h-[220px] md:w-[220px]';
  
  const borderWidth = size === 'large' ? 'border-2' : size === 'small' ? 'border-[1.5px]' : 'border-[1px]';
  
  // Get variant styles for side avatars based on their color
  const agentVariantStyles = variantStyles || COLOR_VARIANTS[agent.color as keyof typeof COLOR_VARIANTS];

  return (
    <motion.div 
      className={clsx("relative", sizeClasses, onClick && "cursor-pointer")}
      style={{ opacity }}
      initial={{ opacity: 0.3, scale: 0.8 }}
      animate={{ opacity, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1]  // Custom easing for smooth natural motion
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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

  // Drag/swipe handling
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const SWIPE_THRESHOLD = 50;
    const swipeDistance = info.offset.x;
    
    recordInteraction();
    
    if (Math.abs(swipeDistance) > SWIPE_THRESHOLD) {
      if (swipeDistance > 0) {
        // Swiped right, go to previous
        goToPrevious();
      } else {
        // Swiped left, go to next
        goToNext();
      }
    }
  }, [goToNext, goToPrevious, recordInteraction]);

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
      
      {/* Title and Description - Moved significantly higher */}
      <motion.div
        className="relative z-10 text-center px-4"
        style={{ marginBottom: '60px', marginTop: '-140px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {title && (
          <h1
            className={clsx(
              "text-5xl font-bold tracking-tight md:text-7xl lg:text-8xl",
              "bg-gradient-to-b from-slate-950 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent",
              "drop-shadow-[0_0_32px_rgba(94,234,212,0.4)]"
            )}
            style={{ marginBottom: '20px' }}
          >
            {title}
          </h1>
        )}

        {description && (
          <motion.p
            className="text-lg md:text-xl lg:text-2xl dark:text-white text-slate-950 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {description}
          </motion.p>
        )}
      </motion.div>

      {/* 5-Agent Carousel Container with Pause on Hover and Drag/Swipe */}
      <motion.div 
        className="relative w-full max-w-[1800px] mx-auto px-4 cursor-grab active:cursor-grabbing"
        onMouseEnter={() => recordInteraction()}
        onMouseLeave={() => {}}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
      >
        <div className="relative flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
          {/* Far Left Avatar */}
          <motion.button
            key={`far-left-${carouselAgents.farLeft.index}`}
            onClick={() => goToIndex(carouselAgents.farLeft.index)}
            className="relative z-5 cursor-pointer focus:outline-none group/far-left"
            initial={{ opacity: 0.3, scale: 0.5, x: -200 }}
            animate={{ opacity: 0.5, scale: 0.6, x: 0 }}
            exit={{ opacity: 0.2, scale: 0.5, x: 200 }}
            whileHover={{ scale: 0.65, opacity: 0.7, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.55 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <AvatarWithRings
              agent={carouselAgents.farLeft.agent}
              size="tiny"
              opacity={0.5}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.farLeft.agent.name)}
            />
          </motion.button>

          {/* Left Avatar */}
          <motion.button
            key={`left-${carouselAgents.left.index}`}
            onClick={() => goToIndex(carouselAgents.left.index)}
            className="relative z-10 cursor-pointer focus:outline-none group/left"
            initial={{ opacity: 0.5, scale: 0.65, x: -150 }}
            animate={{ opacity: 0.7, scale: 0.75, x: 0 }}
            exit={{ opacity: 0.4, scale: 0.65, x: 150 }}
            whileHover={{ scale: 0.82, opacity: 0.9, filter: "brightness(1.15)" }}
            whileTap={{ scale: 0.72 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <AvatarWithRings
              agent={carouselAgents.left.agent}
              size="small"
              opacity={0.7}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.left.agent.name)}
            />
          </motion.button>

          {/* Center Avatar (Active) */}
          <motion.div 
            key={`center-${carouselAgents.center.index}`}
            className="relative z-20"
            initial={{ opacity: 0.8, scale: 0.95, x: 0 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0.8, scale: 0.95, x: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.div
              whileHover={{ scale: 1.05, filter: "brightness(1.2) drop-shadow(0 0 30px rgba(94,234,212,0.6))" }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <AvatarWithRings
                agent={carouselAgents.center.agent}
                variantStyles={centerVariantStyles}
                size="large"
                opacity={1}
                isCenter={true}
                onClick={() => handleAgentClick(carouselAgents.center.agent.name)}
              />
            </motion.div>
            
            {/* Agent Name - Modern styling with better visibility */}
            <motion.div
              key={`name-${currentAgentIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute w-full text-center pointer-events-none"
              style={{ 
                top: 'calc(100% + 32px)',
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <p 
                className="text-2xl md:text-3xl lg:text-4xl font-bold dark:text-white text-slate-900 drop-shadow-lg"
                style={{ 
                  letterSpacing: '0.01em', 
                  fontWeight: 700,
                  textShadow: '0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(94,234,212,0.2)'
                }}
              >
                {carouselAgents.center.agent.name}
              </p>
            </motion.div>
          </motion.div>

          {/* Right Avatar */}
          <motion.button
            key={`right-${carouselAgents.right.index}`}
            onClick={() => goToIndex(carouselAgents.right.index)}
            className="relative z-10 cursor-pointer focus:outline-none group/right"
            initial={{ opacity: 0.5, scale: 0.65, x: 150 }}
            animate={{ opacity: 0.7, scale: 0.75, x: 0 }}
            exit={{ opacity: 0.4, scale: 0.65, x: -150 }}
            whileHover={{ scale: 0.82, opacity: 0.9, filter: "brightness(1.15)" }}
            whileTap={{ scale: 0.72 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <AvatarWithRings
              agent={carouselAgents.right.agent}
              size="small"
              opacity={0.7}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.right.agent.name)}
            />
          </motion.button>

          {/* Far Right Avatar */}
          <motion.button
            key={`far-right-${carouselAgents.farRight.index}`}
            onClick={() => goToIndex(carouselAgents.farRight.index)}
            className="relative z-5 cursor-pointer focus:outline-none group/far-right"
            initial={{ opacity: 0.3, scale: 0.5, x: 200 }}
            animate={{ opacity: 0.5, scale: 0.6, x: 0 }}
            exit={{ opacity: 0.2, scale: 0.5, x: -200 }}
            whileHover={{ scale: 0.65, opacity: 0.7, filter: "brightness(1.1)" }}
            whileTap={{ scale: 0.55 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <AvatarWithRings
              agent={carouselAgents.farRight.agent}
              size="tiny"
              opacity={0.5}
              isCenter={false}
              onClick={() => handleAgentClick(carouselAgents.farRight.agent.name)}
            />
          </motion.button>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Navigation Dots - Increased gap from name to account for larger font */}
      <div className="relative z-10 flex items-center justify-center gap-2.5 px-4" style={{ marginTop: '80px' }}>
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


