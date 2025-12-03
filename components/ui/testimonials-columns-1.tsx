"use client";

import React, { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

export type Testimonial = {
  text: string;
  image: string;
  name: string;
  role: string;
};

export type Testimonials = Testimonial[];

export const testimonialsData: Testimonials = [
  {
    text: "The AI agents sound so real. I love using this software.",
    image: "",
    name: "Cooper Jones",
    role: "Sales Rep, Gilbert AZ",
  },
  {
    text: "This is amazing. Sometimes I forget I'm even practicing.",
    image: "",
    name: "Xander Bushman",
    role: "Gilbert, AZ",
  },
  {
    text: "The AI sounds just like real people. Really impressed.",
    image: "",
    name: "Camden Wiser",
    role: "Sales Rep, Provo UT",
  },
  {
    text: "Mind blown by how real these agents sound. Love it.",
    image: "",
    name: "Teegan Humphreys",
    role: "Orem, UT",
  },
  {
    text: "Can't believe how realistic this is. Conversations feel natural.",
    image: "",
    name: "Matt Ohlund",
    role: "Mesa, AZ",
  },
  {
    text: "The agents sound so real it's crazy. Really enjoying this.",
    image: "",
    name: "Lincoln Weaver",
    role: "LaGrange KY",
  },
  {
    text: "DoorIQ is awesome. The AI responds just like real people.",
    image: "",
    name: "Tracen Adams",
    role: "Lehi, UT",
  },
  {
    text: "Love how real the conversations feel. This is legit.",
    image: "",
    name: "Jackson Blair",
    role: "Chandler, AZ",
  },
  {
    text: "The agents sound exactly like real homeowners. So good.",
    image: "",
    name: "Trey Neal",
    role: "Cedar Park, TX",
  },
  {
    text: "The UI looks really good. Clean and easy to use.",
    image: "",
    name: "Bennett Black",
    role: "Software dev, Austin TX",
  },
];

export type TestimonialsColumnProps = {
  className?: string;
  testimonials: Testimonials;
  duration?: number;
};

export const TestimonialsColumn = ({
  className,
  testimonials,
  duration,
}: TestimonialsColumnProps) => {
  // Create empty review card
  const emptyReviewCard = {
    text: "",
    image: "",
    name: "",
    role: "",
    isEmpty: true,
  };

  // Add one review card per column
  const itemsToShow = [...testimonials, emptyReviewCard];
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [animateDistance, setAnimateDistance] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      // Calculate the actual height of the first set of items
      const firstSet = contentRef.current.querySelector('[data-set="0"]') as HTMLElement;
      if (firstSet) {
        const height = firstSet.getBoundingClientRect().height;
        setAnimateDistance(-height);
      }
    }
  }, [testimonials]);

  return (
    <div className={`${className} overflow-hidden`}>
      <motion.div
        ref={containerRef}
        animate={{
          y: animateDistance !== 0 ? [0, animateDistance] : 0,
        }}
        transition={{
          duration: duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
        style={{ willChange: 'transform' }}
      >
        <div ref={contentRef} className="contents">
        {Array.from({ length: 2 }).map((_, loopIndex) => (
          <React.Fragment key={loopIndex}>
            <div data-set={loopIndex} className="flex flex-col gap-6">
              {itemsToShow.map((item, testimonialIndex) => {
              const testimonial = item as any;
              if (testimonial.isEmpty) {
                return (
                  <a
                    href="/testimonials"
                    className="group relative bg-white/[0.02] border-2 border-dashed border-white/20 rounded-lg p-6 md:p-8 hover:border-white/30 transition-all duration-500 hover:bg-white/[0.03] max-w-xs w-full cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
                    key={`${loopIndex}-empty-${testimonialIndex}`}
                  >
                    <div className="text-center relative z-10">
                      <div className="text-4xl mb-4 opacity-60 group-hover:opacity-80 transition-opacity duration-300">💬</div>
                      <div className="font-medium tracking-tight leading-tight text-white/80 mb-2 text-base md:text-lg font-space group-hover:text-white transition-colors duration-300">
                        Enjoying your time?
                      </div>
                      <div className="text-sm text-white/60 font-sans group-hover:text-white/70 transition-colors duration-300">
                        Leave a review
                      </div>
                    </div>
                  </a>
                );
              }
              
              const { text, image, name, role } = testimonial;
              // Only show profile picture if it's a real URL (not empty and not Unsplash placeholder)
              const hasRealProfilePic = image && image.trim() !== "" && !image.includes("unsplash.com");
              
              return (
                <div
                  className="group relative bg-white/[0.02] border-2 border-white/20 rounded-lg p-6 md:p-8 hover:border-white/30 transition-all duration-500 hover:bg-white/[0.03] max-w-xs w-full"
                  key={`${loopIndex}-${testimonialIndex}`}
                >
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Testimonial text */}
                    <p className="text-white/95 leading-relaxed text-base md:text-lg mb-6 font-sans font-normal">
                      {text}
                    </p>
                    
                    {/* Author info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/20">
                      {hasRealProfilePic && (
                        <div className="relative flex-shrink-0">
                          <img
                            width={40}
                            height={40}
                            src={image}
                            alt={name}
                            className="h-10 w-10 rounded-full object-cover border border-white/20"
                          />
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="font-medium tracking-tight leading-tight text-white text-sm md:text-base font-space">
                          {name}
                        </div>
                        <div className="leading-tight text-white/80 text-xs md:text-sm font-sans mt-0.5">
                          {role}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </React.Fragment>
        ))}
        </div>
      </motion.div>
    </div>
  );
};


