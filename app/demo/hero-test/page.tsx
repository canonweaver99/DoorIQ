"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";

// Layout + animation tuning - matching BackgroundCircles hero
// Base size will be 240px (smaller overall) and we'll scale it
const AGENT_BASE_SIZE_PX = 240; // smaller base size
const ITEM_SPACING_PX = 280; // adjusted spacing for smaller agents
const CENTER_OFFSET_PX = AGENT_BASE_SIZE_PX / 2;
const SCROLL_SPEED_PX_PER_FRAME = 0.75; // continuous scroll speed

// Visual tuning - extreme shrinking at edges for intense effect
const SCALE_MIN = 0.15; // extremely small at far edges
const SCALE_MAX = 1.0;  // keep center at normal size (no bigger)
const EDGE_OPACITY = 0.2; // very faded at far edges

// Color variants matching BackgroundCircles
export const COLOR_VARIANTS = {
  primary: {
    border: ["border-emerald-500/60", "border-cyan-400/50", "border-slate-600/30"],
    gradient: "from-emerald-500/30",
  },
  secondary: {
    border: ["border-violet-500/60", "border-fuchsia-400/50", "border-slate-600/30"],
    gradient: "from-violet-500/30",
  },
  tertiary: {
    border: ["border-orange-500/60", "border-yellow-400/50", "border-slate-600/30"],
    gradient: "from-orange-500/30",
  },
  quaternary: {
    border: ["border-purple-500/60", "border-pink-400/50", "border-slate-600/30"],
    gradient: "from-purple-500/30",
  },
  quinary: {
    border: ["border-red-500/60", "border-rose-400/50", "border-slate-600/30"],
    gradient: "from-red-500/30",
  },
  senary: {
    border: ["border-blue-500/60", "border-sky-400/50", "border-slate-600/30"],
    gradient: "from-blue-500/30",
  },
  septenary: {
    border: ["border-gray-500/60", "border-gray-400/50", "border-slate-600/30"],
    gradient: "from-gray-500/30",
  },
  octonary: {
    border: ["border-red-500/60", "border-rose-400/50", "border-slate-600/30"],
    gradient: "from-red-500/30",
  },
  nonary: {
    border: ["border-amber-500/60", "border-yellow-300/50", "border-slate-600/30"],
    gradient: "from-amber-500/30",
  },
  denary: {
    border: ["border-purple-500/60", "border-fuchsia-300/50", "border-slate-600/30"],
    gradient: "from-purple-500/30",
  },
  duodenary: {
    border: ["border-cyan-500/60", "border-teal-300/50", "border-slate-600/30"],
    gradient: "from-cyan-500/30",
  },
  undenary: {
    border: ["border-violet-500/60", "border-purple-300/50", "border-slate-600/30"],
    gradient: "from-violet-500/30",
  },
} as const;

const agents = [
  { name: "Alan", fullName: "Already Got It Alan", src: "/agents/alan.png", color: "tertiary" },
  { name: "Austin", fullName: "Austin", src: "/Austin pfp.png", color: "primary" },
  { name: "Beth", fullName: "Busy Beth", src: "/agents/beth.png", color: "octonary" },
  { name: "Dave", fullName: "DIY Dave", src: "/agents/dave.png", color: "quinary" },
  { name: "Jerry", fullName: "Just Treated Jerry", src: "/agents/jerry.png", color: "duodenary" },
  { name: "Nancy", fullName: "No Problem Nancy", src: "/agents/nancy.png", color: "secondary" },
  { name: "Nick", fullName: "Not Interested Nick", src: "/agents/nick.png", color: "quaternary" },
  { name: "Randy", fullName: "Renter Randy", src: "/agents/randy.png", color: "nonary" },
  { name: "Sam", fullName: "Skeptical Sam", src: "/agents/sam.png", color: "denary" },
  { name: "Susan", fullName: "Spouse Check Susan", src: "/agents/susan.png", color: "septenary" },
  { name: "Tim", fullName: "Too Expensive Tim", src: "/agents/tim.png", color: "senary" },
  { name: "Tina", fullName: "Think About It Tina", src: "/agents/tina.png", color: "undenary" },
];

// Duplicate agents to create seamless loop
const loopedAgents = [...agents, ...agents, ...agents];

// Animated Grid Background (matching hero)
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

export default function HeroTest() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Continuous scrolling animation
    const speed = SCROLL_SPEED_PX_PER_FRAME; // pixels per frame
    let animationFrameId: number;

    const animate = () => {
      setScrollPosition((prev) => {
        // Only scroll if not paused
        if (isPaused) return prev;
        
        // Reset when we've scrolled through one full set of agents
        const resetPoint = agents.length * ITEM_SPACING_PX; // spacing between agents
        return prev >= resetPoint ? prev - resetPoint : prev + speed;
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused]);

  // Calculate scale based on distance from center
  const calculateScale = (index: number) => {
    if (!containerRef.current) return 1;

    const containerWidth = containerRef.current.offsetWidth;
    const centerX = containerWidth / 2;

    // Position of this agent
    const agentX = index * ITEM_SPACING_PX - scrollPosition + CENTER_OFFSET_PX; // center of item

    // Distance from center
    const distanceFromCenter = Math.abs(centerX - agentX);
    const maxDistance = containerWidth / 2;

    // Use a stronger exponential curve for very dramatic scaling
    // This makes agents drop off in size very quickly as they move away from center
    const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
    const curve = Math.pow(normalizedDistance, 2.0); // Stronger exponential curve for intense drop-off
    const scale = SCALE_MAX - curve * (SCALE_MAX - SCALE_MIN);

    return scale;
  };

  // Calculate opacity based on distance from center
  const calculateOpacity = (index: number) => {
    if (!containerRef.current) return 1;

    const containerWidth = containerRef.current.offsetWidth;
    const centerX = containerWidth / 2;

    // Position of this agent
    const agentX = index * ITEM_SPACING_PX - scrollPosition + CENTER_OFFSET_PX;

    // Distance from center
    const distanceFromCenter = Math.abs(centerX - agentX);
    const maxDistance = containerWidth / 2;

    // Opacity fades toward edges with same exponential curve as scale
    const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
    const curve = Math.pow(normalizedDistance, 2.0); // Match stronger scale curve
    const opacity = 1.0 - curve * (1.0 - EDGE_OPACITY);

    return opacity;
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-[#02010A] via-[#0A0420] to-[#120836]">
      <AnimatedGrid />
      
      {/* Title */}
      <div className="absolute top-20 left-0 right-0 z-10 flex items-center justify-center">
        <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-b from-slate-100 to-slate-300 bg-clip-text text-transparent drop-shadow-[0_0_32px_rgba(94,234,212,0.4)]">
          Meet Our Agents
        </h1>
      </div>

      {/* Carousel Container - Centered vertically */}
      <div
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="relative w-full h-[400px]">
          {loopedAgents.map((agent, index) => {
            const scale = calculateScale(index);
            const opacity = calculateOpacity(index);
            const xPosition = index * ITEM_SPACING_PX - scrollPosition;

            return (
              <div
                key={`${agent.name}-${index}`}
                className="absolute transition-transform duration-100 ease-linear cursor-pointer"
                style={{
                  left: `${xPosition}px`,
                  transform: `scale(${scale})`,
                  opacity: opacity,
                  transformOrigin: "center center",
                  zIndex: Math.round(scale * 100), // Higher scale = higher z-index
                }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                {/* Agent with animated rings */}
                <div className="relative h-[150px] w-[150px] sm:h-[200px] sm:w-[200px] md:h-[240px] md:w-[240px]">
                  {/* Animated rings */}
                  {[0, 1, 2].map((i) => {
                    const variantStyles = COLOR_VARIANTS[agent.color as keyof typeof COLOR_VARIANTS];
                    const isCenter = scale > 0.6; // approximate center detection
                    return (
                      <motion.div
                        key={i}
                        className={clsx(
                          "absolute inset-0 rounded-full bg-gradient-to-br to-transparent border-2",
                          variantStyles.border[i],
                          variantStyles.gradient
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
                            `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace("from-", "")}/12%,transparent_70%)]`
                          )}
                        />
                      </motion.div>
                    );
                  })}
                  
                  {/* Agent Avatar */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                        <div
                          className={clsx(
                            "absolute inset-[-12%] rounded-full bg-gradient-to-br mix-blend-screen hero-gradient-spin",
                            COLOR_VARIANTS[agent.color as keyof typeof COLOR_VARIANTS].gradient,
                            "to-transparent opacity-60"
                          )}
                          style={{
                            "--hero-gradient-speed": scale > 0.6 ? "14s" : "18s",
                          } as React.CSSProperties}
                        />
                        <div
                          className={clsx(
                            "absolute inset-[-8%] rounded-full bg-gradient-to-tr mix-blend-screen hero-gradient-spin reverse",
                            COLOR_VARIANTS[agent.color as keyof typeof COLOR_VARIANTS].gradient,
                            "to-transparent opacity-35"
                          )}
                          style={{
                            "--hero-gradient-speed": scale > 0.6 ? "16s" : "22s",
                          } as React.CSSProperties}
                        />
                      </div>
                      <Image
                        src={agent.src}
                        alt={agent.name}
                        fill
                        className="object-cover relative z-10"
                        sizes="(max-width: 640px) 150px, (max-width: 768px) 200px, 240px"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-white font-semibold text-xl drop-shadow-lg">
                    {agent.fullName}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Radial gradient backgrounds (matching hero) */}
      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_40%,transparent)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0F766E/30%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#2DD4BF/15%,transparent)] blur-[80px]" />
      </div>
    </div>
  );
}

