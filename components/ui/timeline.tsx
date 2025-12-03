"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
  useInView,
} from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState(0);
  const [cardHeights, setCardHeights] = useState<number[]>([]);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  useEffect(() => {
    // Measure each card's height
    const measureHeights = () => {
      const heights = cardRefs.current
        .filter((ref) => ref !== null)
        .map((ref) => ref?.getBoundingClientRect().height || 0);
      setCardHeights(heights);
    };

    measureHeights();

    // Re-measure on resize
    window.addEventListener('resize', measureHeights);
    return () => window.removeEventListener('resize', measureHeights);
  }, [data]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 20%", "end 80%"],
  });

  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  
  // Line height - slightly ahead of the dot (extends 5% more)
  const lineHeightTransform = useTransform(scrollYProgress, [0, 1], [0, height * 1.05]);
  
  // Calculate transforms for each timeline item - each number constrained to its card's height
  const itemTransforms = data.map((_, index) => {
    const totalItems = data.length;
    
    // Each number should move from top to bottom of its card
    // Calculate the scroll progress range for each card
    const segmentStart = index / totalItems;
    const segmentEnd = (index + 1) / totalItems;
    
    // Use actual card height if available, otherwise estimate conservatively
    const cardHeight = cardHeights[index] || height / totalItems;
    // Each number moves from 0 (top of card) to card height (bottom of card)
    // Use 90% to ensure it doesn't go past the bottom
    const maxTranslate = cardHeight * 0.9;
    
    return useTransform(
      scrollYProgress,
      [segmentStart, segmentEnd],
      [0, maxTranslate],
      {
        clamp: true, // Clamp to keep within bounds
      }
    );
  });

  return (
    <div
      className="w-full font-sans md:px-10"
      ref={containerRef}
    >
      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start items-start pt-8 md:pt-16 lg:pt-20 md:gap-0"
          >
            <motion.div 
              className="sticky flex flex-col md:flex-row z-40 items-start top-40 self-start md:w-auto md:ml-8 lg:ml-12 md:mr-0"
              style={{
                translateY: itemTransforms[index],
              }}
            >
              <div className="h-10 absolute left-[0.5rem] md:left-[2.5rem] w-10 rounded-full bg-black flex items-center justify-center -translate-x-1/2 z-50">
                <div className="h-4 w-4 rounded-full bg-white/[0.05] border border-white/10 p-2" />
              </div>
              <h3 className="hidden md:block text-2xl md:pl-12 md:text-5xl lg:text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-space tracking-tight leading-tight md:pr-0">
                {item.title}
              </h3>
            </motion.div>

            <div 
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className="relative pl-16 pr-4 md:pl-[5.5rem] w-full flex items-start pt-1"
            >
              <h3 className="md:hidden block text-3xl mb-4 text-left font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-space tracking-tight">
                {item.title}
              </h3>
              <TimelineCardWrapper index={index}>
                {item.content}
              </TimelineCardWrapper>
            </div>
          </div>
        ))}
        <div
          style={{
            height: height + "px",
          }}
          className="absolute md:left-[3.5rem] left-6 top-0 overflow-hidden w-[4px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          <motion.div
            style={{
              height: lineHeightTransform,
              opacity: opacityTransform,
            }}
            className="absolute inset-x-0 top-0 w-[4px] bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-600 from-[0%] via-[10%] rounded-full"
          />
        </div>
      </div>
    </div>
  );
};

// Wrapper component for timeline cards with scroll highlight effect
function TimelineCardWrapper({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ delay: index * 0.3, duration: 0.6 }}
      className={`w-full ${isInView ? 'timeline-card-highlight' : ''}`}
    >
      {children}
    </motion.div>
  );
};

