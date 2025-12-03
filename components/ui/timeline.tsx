"use client";
import {
  useMotionValueEvent,
  useScroll,
  useTransform,
  motion,
  useInView,
} from "framer-motion";
import React, { useEffect, useRef, useState, useMemo } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [lineEndHeight, setLineEndHeight] = useState(0);
  const [cardHeights, setCardHeights] = useState<number[]>([]);

  useEffect(() => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setHeight(rect.height);
    }
  }, [ref]);

  useEffect(() => {
    const calculateLineEnd = () => {
      if (lastItemRef.current && ref.current && cardHeights.length > 0) {
        const lastItemRect = lastItemRef.current.getBoundingClientRect();
        const containerRect = ref.current.getBoundingClientRect();
        const topOffset = window.innerWidth >= 1024 ? 80 : window.innerWidth >= 768 ? 64 : 32;
        const itemPaddingTop = window.innerWidth >= 1024 ? 80 : window.innerWidth >= 768 ? 64 : 32;
        
        // Get the last card ref to measure its bottom
        const lastCardRef = cardRefs.current[cardHeights.length - 1];
        if (lastCardRef) {
          const lastCardRect = lastCardRef.getBoundingClientRect();
          // Calculate from the bottom of the last card
          const lastCardBottom = lastCardRect.bottom - containerRect.top;
          // Ensure line extends to the bottom of the last dot (which is at item top + padding)
          const lastDotCenter = lastItemRect.top - containerRect.top + itemPaddingTop;
          const dotHeight = 40;
          const lastDotBottom = lastDotCenter + (dotHeight / 2);
          // Use the maximum of card bottom or dot bottom to ensure full coverage
          const calculatedHeight = Math.max(lastCardBottom, lastDotBottom) - topOffset;
          setLineEndHeight(Math.max(0, calculatedHeight));
        } else {
          // Fallback: use dot position
          const lastDotCenter = lastItemRect.top - containerRect.top + itemPaddingTop;
          const dotHeight = 40;
          const lastDotBottom = lastDotCenter + (dotHeight / 2);
          setLineEndHeight(Math.max(0, lastDotBottom - topOffset));
        }
      }
    };

    // Calculate immediately
    calculateLineEnd();

    // Recalculate on resize and after a short delay to ensure layout is complete
    window.addEventListener('resize', calculateLineEnd);
    const timeoutId = setTimeout(calculateLineEnd, 200);
    
    return () => {
      window.removeEventListener('resize', calculateLineEnd);
      clearTimeout(timeoutId);
    };
  }, [data, cardHeights, height]);

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
    offset: ["start 40%", "end 60%"],
  });

  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);
  
  // Line height - use calculated end height or fall back to full height
  const effectiveLineHeight = useMemo(() => lineEndHeight || height, [lineEndHeight, height]);
  // Line height - leading the dots (slightly ahead but not too much)
  // Use a gentler acceleration so line leads but doesn't extend too far ahead
  const lineHeightTransform = useTransform(
    scrollYProgress, 
    [0, 0.38, 0.68, 1], 
    [0, effectiveLineHeight * 0.48, effectiveLineHeight * 0.82, effectiveLineHeight],
    { clamp: false }
  );
  
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
            ref={index === data.length - 1 ? lastItemRef : null}
            className="flex justify-start items-start pt-8 md:pt-16 lg:pt-20 md:gap-0"
          >
            <motion.div 
              className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start md:w-auto md:ml-0 lg:ml-0 md:mr-0"
              style={{
                translateY: itemTransforms[index],
              }}
            >
              <div className="h-10 absolute left-[0.875rem] md:left-[1.875rem] w-10 rounded-full bg-black flex items-center justify-center -translate-x-1/2 z-50">
                <div className="h-4 w-4 rounded-full bg-white/[0.05] border border-white/10 p-2" />
              </div>
              <h3 className="hidden md:block text-2xl md:pl-[3.5rem] md:text-5xl lg:text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-space tracking-tight leading-tight md:pr-0">
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
            height: (lineEndHeight || height) + "px",
          }}
          className="absolute md:left-[1.75rem] left-[0.75rem] top-8 md:top-16 lg:top-20 overflow-hidden w-[4px] bg-[linear-gradient(to_bottom,var(--tw-gradient-stops))] from-transparent from-[0%] via-neutral-700 to-transparent to-[99%] [mask-image:linear-gradient(to_bottom,black_0%,black_10%,black_90%,transparent_100%)]"
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

