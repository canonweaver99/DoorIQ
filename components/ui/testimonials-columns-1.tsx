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
                    className="group relative p-10 rounded-3xl border-2 border-dashed border-white/20 shadow-lg shadow-black/40 max-w-xs w-full cursor-pointer hover:border-white/30 hover:shadow-black/60 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] bg-gradient-to-br from-black/50 via-black/30 to-black/50 backdrop-blur-sm"
                    key={`${loopIndex}-empty-${testimonialIndex}`}
                    style={{
                      background: 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)',
                    }}
                  >
                    <div className="text-center relative z-10">
                      <div className="text-5xl mb-4 opacity-60 group-hover:opacity-80 transition-opacity duration-300">💬</div>
                      <div className="font-semibold tracking-tight leading-tight text-white/80 mb-2 text-lg font-space group-hover:text-white transition-colors duration-300">
                        Enjoying your time?
                      </div>
                      <div className="text-sm text-white/60 font-sans group-hover:text-white/70 transition-colors duration-300">
                        Leave a review
                      </div>
                    </div>
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/0 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none"></div>
                  </a>
                );
              }
              
              const { text, image, name, role } = testimonial;
              // Only show profile picture if it's a real URL (not empty and not Unsplash placeholder)
              const hasRealProfilePic = image && image.trim() !== "" && !image.includes("unsplash.com");
              
              return (
                <a
                  href="/testimonials"
                  className="group relative p-8 rounded-3xl border border-white/10 shadow-2xl shadow-black/60 max-w-xs w-full cursor-pointer hover:border-white/20 hover:shadow-black/80 transition-all duration-500 block overflow-hidden"
                  key={`${loopIndex}-${testimonialIndex}`}
                  style={{
                    background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 40%, #1a1a1a 100%)',
                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0 rgba(255, 255, 255, 0.05)'
                  }}
                >
                  {/* Animated shine effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  {/* Subtle gradient accent */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    {/* Quote icon */}
                    <div className="mb-4 text-white/20 group-hover:text-white/30 transition-colors duration-300">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                      </svg>
                    </div>
                    
                    {/* Testimonial text */}
                    <p className="text-white/90 leading-relaxed text-base mb-6 font-sans group-hover:text-white transition-colors duration-300">
                      {text}
                    </p>
                    
                    {/* Author info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                      {hasRealProfilePic && (
                        <div className="relative flex-shrink-0">
                          <img
                            width={48}
                            height={48}
                            src={image}
                            alt={name}
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-white/30 transition-all duration-300"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      )}
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="font-semibold tracking-tight leading-tight text-white text-base font-space group-hover:text-white transition-colors duration-300">
                          {name}
                        </div>
                        <div className="leading-tight text-white/60 text-sm font-sans mt-0.5 group-hover:text-white/70 transition-colors duration-300">
                          {role}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/0 group-hover:to-purple-500/5 transition-all duration-500 pointer-events-none"></div>
                </a>
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


