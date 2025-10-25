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
    text: "DoorIQ gave our new hires the confidence they needed in half the time. We can’t imagine onboarding without it now.",
    image:
      "https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Lina Marshall",
    role: "Sales Rep",
  },
  {
    text: "Our entire org trains on DoorIQ. The AI homeowners feel surprisingly real and the feedback is actionable.",
    image:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "James Patel",
    role: "Manager",
  },
  {
    text: "The weekly leaderboards keep the team competitive and actually excited about practice reps.",
    image:
      "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Amina Khan",
    role: "Manager",
  },
  {
    text: "We saw deal velocity jump within the first month. DoorIQ turned coaching into a superpower for our managers.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Cameron Lee",
    role: "CEO",
  },
  {
    text: "Scheduling live call reviews used to take hours. Now reps self-correct after every simulated conversation.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Riya Sharma",
    role: "Manager",
  },
  {
    text: "DoorIQ keeps our remote team sharp between seasons. It’s the secret sauce behind our record summer.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Morgan Blake",
    role: "Sales Rep",
  },
  {
    text: "The integration was painless and the product team helped us tailor scenarios to our buyer profiles.",
    image:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Avery Chen",
    role: "Marketing Head",
  },
  {
    text: "Our reps now request practice time. That never happened before DoorIQ.",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Jordan Ruiz",
    role: "Sales Rep",
  },
  {
    text: "Every simulated call feels authentic. The AI even handles layered objections like real homeowners do.",
    image:
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Sienna Park",
    role: "Marketing Head",
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
            {testimonials.map(({ text, image, name, role }, testimonialIndex) => (
              <a
                href="/testimonials"
                className="p-8 rounded-3xl border shadow-lg max-w-xs w-full cursor-pointer hover:border-primary/50 transition-all duration-300 block"
                style={{ transform: 'scale(0.75)' }}
                key={`${loopIndex}-${testimonialIndex}`}
              >
                <div>{text}</div>
                <div className="flex items-center gap-2 mt-5">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full"
                  />
                  <div className="flex flex-col">
                    <div className="font-medium tracking-tight leading-5">
                      {name}
                    </div>
                    <div className="leading-5 opacity-60 tracking-tight">
                      {role}
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};


