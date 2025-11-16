"use client";

import React from "react";
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
    text: "Love using DoorIQ! The AI agents sound so real, it's like talking to actual homeowners. Really impressed by how natural the conversations feel.",
    image: "",
    name: "Cooper Jones",
    role: "Dallas, TX",
  },
  {
    text: "This software is amazing. The AI agents are incredibly realistic - sometimes I forget I'm practicing. Really enjoying the platform!",
    image: "",
    name: "Xander Bushman",
    role: "Phoenix, AZ",
  },
  {
    text: "So impressed by how real the AI sounds. The agents respond just like real people would. Really enjoying DoorIQ!",
    image: "",
    name: "Camden Wiser",
    role: "Denver, CO",
  },
  {
    text: "The AI agents are mind-blowing. They sound exactly like real homeowners. Love using this software - it's become part of my daily routine.",
    image: "",
    name: "Teegan Humphreys",
    role: "Tampa, FL",
  },
  {
    text: "Can't get over how realistic the AI agents are. The conversations feel completely natural. Really enjoying DoorIQ!",
    image: "",
    name: "Matt Ohlund",
    role: "Sacramento, CA",
  },
  {
    text: "The software is fantastic. The AI agents sound so real it's almost scary. Really impressed and enjoying every session.",
    image: "",
    name: "Lincoln Weaver",
    role: "Charlotte, NC",
  },
  {
    text: "DoorIQ is incredible. The AI agents are so realistic - they respond just like real people. Really enjoying using this platform!",
    image: "",
    name: "Tracen Adams",
    role: "Austin, TX",
  },
  {
    text: "Love how real the AI agents sound. The conversations feel completely authentic. Really impressed and enjoying DoorIQ!",
    image: "",
    name: "Jackson Blair",
    role: "Las Vegas, NV",
  },
  {
    text: "The AI agents are unbelievably realistic. They sound exactly like real homeowners. Really enjoying this software!",
    image: "",
    name: "Trey Neal",
    role: "Orlando, FL",
  },
  {
    text: "So impressed by DoorIQ. The AI agents sound incredibly real - it's like talking to actual people. Really enjoying it!",
    image: "",
    name: "Bennett Black",
    role: "Seattle, WA",
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

  return (
    <div className={className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {Array.from({ length: 2 }).map((_, loopIndex) => (
          <React.Fragment key={loopIndex}>
            {itemsToShow.map((item, testimonialIndex) => {
              const testimonial = item as any;
              if (testimonial.isEmpty) {
                return (
                  <a
                    href="/testimonials"
                    className="p-10 rounded-3xl border-2 border-dashed border-primary/30 shadow-lg shadow-primary/10 max-w-xs w-full cursor-pointer hover:border-primary/50 hover:shadow-primary/20 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] bg-primary/5"
                    key={`${loopIndex}-empty-${testimonialIndex}`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">💬</div>
                      <div className="font-medium tracking-tight leading-5 text-primary/80 mb-2">
                        Enjoying your time?
                      </div>
                      <div className="text-sm opacity-60">
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
                <a
                  href="/testimonials"
                  className="p-10 rounded-3xl border border-primary/30 shadow-lg shadow-primary/10 max-w-xs w-full cursor-pointer hover:border-primary/50 hover:shadow-primary/20 transition-all duration-300 block bg-white"
                  key={`${loopIndex}-${testimonialIndex}`}
                >
                  <div className="text-black">{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    {hasRealProfilePic && (
                      <img
                        width={40}
                        height={40}
                        src={image}
                        alt={name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    )}
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5 text-black">
                        {name}
                      </div>
                      <div className="leading-5 opacity-60 tracking-tight text-black">
                        {role}
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};


