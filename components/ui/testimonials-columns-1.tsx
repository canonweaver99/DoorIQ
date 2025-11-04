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
    text: "Game changer for new reps. Started using DoorIQ three weeks ago and already seeing results in the field. The AI homeowners are scary realistic - especially the 'busy parent' persona that keeps trying to end the conversation.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Marcus Thompson",
    role: "Dallas, TX",
  },
  {
    text: "Finally, practice that doesn't waste real leads. I manage a team of 12 solar sales reps. We were burning through leads letting new guys practice on real doors. DoorIQ solved this completely. New reps get 50+ practice conversations before they touch a real lead.",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Jennifer Chen",
    role: "Phoenix, AZ",
  },
  {
    text: "Great concept, needs mobile app. Love the platform and the AI is genuinely impressive. Knocked off one star because I really need a mobile app - I'm always on the road between territories and want to practice during downtime.",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Tyler Rodriguez",
    role: "Denver, CO",
  },
  {
    text: "Worth every penny. Been doing D2D for 8 years and wish this existed when I started. I use it to practice new product launches and test different approaches. The grading system is tough but fair.",
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Ashley Williams",
    role: "Tampa, FL",
  },
  {
    text: "My confidence is through the roof. I'm naturally introverted and door knocking was terrifying. After 100+ sessions on DoorIQ, I actually look forward to real doors now. The session reminders keep me consistent.",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Brandon Mitchell",
    role: "Sacramento, CA",
  },
  {
    text: "Solid platform, occasional tech issues. The training is legit and definitely helps with objection handling. Sometimes the AI takes a second to respond which throws off the flow, but support said they're working on it.",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Rachel Foster",
    role: "Charlotte, NC",
  },
  {
    text: "Best investment in my sales career. Switched from roofing to solar sales and DoorIQ helped me adapt my pitch fast. The 'Recent Storm Victim' persona helped me understand how to approach storm damage conversations with empathy.",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "David Park",
    role: "Austin, TX",
  },
  {
    text: "Our retention is up 40%. I run a mid-size pest control company. New rep turnover was killing us - kids would quit after two bad days. Now they train on DoorIQ first, build confidence, then hit real doors.",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=facearea&w=200&h=200&q=80",
    name: "Nicole Martinez",
    role: "Las Vegas, NV",
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
  showEmptyCards = false,
}: TestimonialsColumnProps & { showEmptyCards?: boolean }) => {
  // Create empty review cards for the first column only
  const emptyReviewCard = {
    text: "",
    image: "",
    name: "",
    role: "",
    isEmpty: true,
  };

  // Add 2-3 empty cards to the first column
  const itemsToShow = showEmptyCards 
    ? [...testimonials, emptyReviewCard, emptyReviewCard, emptyReviewCard]
    : testimonials;

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
              return (
                <a
                  href="/testimonials"
                  className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full cursor-pointer hover:border-primary/50 hover:shadow-primary/20 transition-all duration-300 block"
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
              );
            })}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};


