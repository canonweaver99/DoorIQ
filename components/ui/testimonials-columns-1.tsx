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
    text: "The AI agents sound so real. I love using this software.",
    image: "",
    name: "Cooper Jones",
    role: "Provo, UT",
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
    role: "Austin, TX",
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
    role: "Round Rock, TX",
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
    text: "Really impressed. It's like talking to actual people.",
    image: "",
    name: "Bennett Black",
    role: "Tempe, AZ",
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


