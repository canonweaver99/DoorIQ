"use client";
import * as React from "react";
import { motion, Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
  duration?: number;
  delay?: number;
  startDelay?: number;
  replay?: boolean;
  animationType?: "letter" | "word" | "fade";
  underlineFirst?: boolean;
  className?: string;
  textClassName?: string;
  underlineClassName?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  underlineGradient?: string;
  underlineHeight?: string;
  underlineOffset?: string;
}

const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  (
    {
      text,
      duration = 0.5,
      delay = 0.1,
      startDelay = 0,
      replay = true,
      animationType = "letter",
      underlineFirst = false,
      className,
      textClassName,
      underlineClassName,
      as: Component = "h1",
      underlineGradient = "from-[#00D4AA] via-[#00D4AA] to-[#F59E0B]",
      underlineHeight = "h-1",
      underlineOffset = "-bottom-2",
      ...props
    },
    ref
  ) => {
    const letters = Array.from(text);
    const words = text.split(" ");

    const container: Variants = {
      hidden: {
        opacity: 0,
      },
      visible: (i: number = 1) => ({
        opacity: 1,
        transition: {
          staggerChildren: duration,
          delayChildren: startDelay + (i * delay),
        },
      }),
    };

    const child: Variants = {
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          type: "spring",
          damping: 14,
          stiffness: 180,
        },
      },
      hidden: {
        opacity: 0,
        y: 20,
        transition: {
          type: "spring",
          damping: 14,
          stiffness: 180,
        },
      },
    };
    
    // Optimize for GPU acceleration
    const containerStyle = {
      willChange: 'opacity, transform' as const,
    };

    const fadeChild: Variants = {
      visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.9,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
      hidden: {
        opacity: 0,
        y: 15,
        scale: 0.95,
        transition: {
          duration: 0.9,
          ease: [0.25, 0.46, 0.45, 0.94],
        },
      },
    };

    // Calculate timing for underline
    const underlineDelay = underlineFirst 
      ? startDelay 
      : startDelay + (animationType === "letter" 
        ? letters.length * delay 
        : animationType === "word" 
        ? words.length * delay 
        : delay);
    
    const underlineDuration = 0.8;
    
    // Calculate timing for text when underline appears first
    const textDelay = underlineFirst 
      ? underlineDelay + underlineDuration // Start after underline finishes
      : startDelay;

    const lineVariants: Variants = {
      hidden: {
        width: "0%",
        left: "50%",
      },
      visible: {
        width: "100%",
        left: "0%",
        transition: {
          delay: underlineDelay,
          duration: 0.8,
          ease: "easeOut",
        },
      },
    };

    // Render based on animation type
    const renderContent = () => {
      if (animationType === "fade") {
        return (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={replay ? {
              opacity: 1,
              y: 0,
              scale: 1,
            } : {
              opacity: 0,
              y: 15,
              scale: 0.95,
            }}
            transition={{
              delay: textDelay,
              duration: 0.9,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className={cn("text-4xl font-bold text-center", textClassName)}
          >
            {text}
          </motion.div>
        );
      }

      if (animationType === "word") {
        return (
          <motion.div
            style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", overflow: "hidden", paddingBottom: "0.25rem" }}
            variants={container}
            initial="hidden"
            animate={replay ? "visible" : "hidden"}
            className={cn("text-4xl font-bold text-center", textClassName)}
          >
            {words.map((word, index) => (
              <React.Fragment key={index}>
                <motion.span variants={child}>
                  {word}
                </motion.span>
                {index < words.length - 1 && <span className="inline-block w-[0.25em]" />}
              </React.Fragment>
            ))}
          </motion.div>
        );
      }

      // Default: letter-by-letter
      return (
        <motion.div
          style={{ display: "flex", overflow: "hidden", paddingBottom: "0.25rem" }}
          variants={container}
          initial="hidden"
          animate={replay ? "visible" : "hidden"}
          className={cn("text-4xl font-bold text-center", textClassName)}
        >
          {letters.map((letter, index) => (
            <motion.span key={index} variants={child}>
              {letter === " " ? "\u00A0" : letter}
            </motion.span>
          ))}
        </motion.div>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center gap-2",
          className
        )}
        {...props}
      >
        <div className="relative pb-2">
          {renderContent()}

          <motion.div
            variants={lineVariants}
            initial="hidden"
            animate="visible"
            className={cn(
              "absolute",
              underlineHeight,
              underlineOffset,
              "bg-gradient-to-r",
              underlineGradient,
              underlineClassName
            )}
          />
        </div>
      </div>
    );
  }
);
AnimatedText.displayName = "AnimatedText";

export { AnimatedText };

