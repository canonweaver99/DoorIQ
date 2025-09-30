'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { COLOR_VARIANTS } from '@/components/ui/background-circles';

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
    <div className="h-full w-full [background-image:repeating-linear-gradient(100deg,#64748B_0%,#64748B_1px,transparent_1px,transparent_4%)] opacity-10" />
  </motion.div>
);

export function BackgroundCirclesBg() {
  const variantKeys = Object.keys(COLOR_VARIANTS) as (keyof typeof COLOR_VARIANTS)[];
  const [autoVariant, setAutoVariant] = useState<keyof typeof COLOR_VARIANTS>("octonary");

  useEffect(() => {
    const id = setInterval(() => {
      setAutoVariant((prev) => {
        const idx = variantKeys.indexOf(prev);
        const next = variantKeys[(idx + 1) % variantKeys.length];
        return next;
      });
    }, 1600);
    return () => clearInterval(id);
  }, []);

  const variantStyles = COLOR_VARIANTS[autoVariant];

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-black">
      <AnimatedGrid />
      <motion.div className="absolute h-[480px] w-[480px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent ${variantStyles.border[i]} ${variantStyles.gradient}`}
            animate={{
              rotate: 360,
              scale: [1, 1.05 + i * 0.05, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <div
              className={`absolute inset-0 rounded-full mix-blend-screen bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                "from-",
                ""
              )}/10%,transparent_70%)]`}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="absolute inset-0 [mask-image:radial-gradient(90%_60%_at_50%_50%,#000_30%,transparent)] pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#7C3AED/10%,transparent_70%)] blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#EC4899/8%,transparent)] blur-[80px]" />
      </div>
    </div>
  );
}
