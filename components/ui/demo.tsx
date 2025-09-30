"use client";
import React from "react";
import { Boxes } from "@/components/ui/background-boxes";
import { cn } from "@/lib/utils";

export function BackgroundBoxesDemo() {
  return (
    <div className="min-h-[calc(100vh-64px)] relative w-full overflow-hidden bg-white flex flex-col items-center justify-center rounded-none border-0">
      <div className="absolute inset-0 w-full h-full bg-white z-20 [mask-image:radial-gradient(transparent,white)] pointer-events-none" />

      <Boxes />
      <h1 className={cn("md:text-4xl text-xl text-slate-900 relative z-20 font-serif")}>
        Practice Before You Knock
      </h1>
      <p className="text-center mt-2 text-slate-700 relative z-20">
        Lifelike AI homeowners. Instant feedback. Better reps.
      </p>
    </div>
  );
}


