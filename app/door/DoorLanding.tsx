"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Props = {
  nextPath?: string;       // default "/trainer"
  label?: string;          // default "Click to knock"
};

export default function DoorLanding({ nextPath = "/trainer", label = "Click to knock" }: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
  };

  return (
    <main
      className="min-h-screen w-full bg-gradient-to-b from-zinc-900 via-black to-zinc-900
                 flex items-center justify-center p-6"
      style={{ perspective: 1200 }}
    >
      <div className="relative w-[320px] h-[560px] md:w-[380px] md:h-[660px]">
        {/* Hint bar */}
        {!opening && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-zinc-200 text-sm">
            {label}
          </div>
        )}

        {/* Door frame */}
        <div className="absolute inset-0 rounded-[22px] bg-zinc-800/40 ring-1 ring-zinc-700/60
                        shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-sm" />

        {/* Door (3D swing) */}
        <motion.div
          role="button"
          aria-label="Open door"
          tabIndex={0}
          onClick={handleOpen}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleOpen()}
          className="absolute inset-2 rounded-[18px] shadow-2xl cursor-pointer
                     will-change-transform"
          style={{
            transformOrigin: "left center",
            backgroundImage: "url(/door.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            transformStyle: "preserve-3d",
          }}
          initial={{ rotateY: 0, x: 0, opacity: 1 }}
          animate={
            opening
              ? { rotateY: -78, x: 56, opacity: 0.98 }
              : { rotateY: 0, x: 0, opacity: 1 }
          }
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          onAnimationComplete={() => {
            if (opening) router.push(nextPath);
          }}
        >
          {/* Subtle knob */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                       bg-amber-400/90 shadow-[inset_0_0_6px_rgba(0,0,0,0.4),0_6px_20px_rgba(0,0,0,0.35)]"
            style={{ transform: "translateZ(2px)" }}
          />

          {/* Soft inner gradient for depth */}
          <div className="absolute inset-0 rounded-[18px] pointer-events-none
                          bg-gradient-to-br from-black/10 via-transparent to-black/25" />
        </motion.div>
      </div>
    </main>
  );
}


