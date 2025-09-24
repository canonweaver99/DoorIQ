"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function play(src: string, volume = 0.9) {
  try {
    const a = new Audio(src);
    a.volume = volume;
    a.play().catch(() => {});
    return a;
  } catch { return null; }
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

type Props = {
  nextPath?: string;       // default "/trainer"
  label?: string;          // default "Click to knock"
};

export default function DoorLanding({ nextPath = "/trainer", label = "Click to knock" }: Props) {
  const router = useRouter();
  const [opening, setOpening] = useState(false);

  const handleOpen = async () => {
    if (opening) return;
    setOpening(true);
    // Play knock then door open SFX before route
    play('/sounds/knock.mp3', 0.95);
    await delay(350);
    play('/sounds/door_open.mp3', 0.95);
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
            background: "linear-gradient(145deg, #8B4513, #A0522D)",
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
          {/* Door panels */}
          <div className="absolute inset-4 grid grid-rows-2 gap-3">
            <div className="bg-amber-900/30 rounded-lg shadow-inner border border-amber-800/50" />
            <div className="bg-amber-900/30 rounded-lg shadow-inner border border-amber-800/50" />
          </div>

          {/* Door knob */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full
                       bg-gradient-to-br from-yellow-500 to-yellow-600 shadow-lg"
            style={{ transform: "translateZ(2px)" }}
          />

          {/* Wood grain texture overlay */}
          <div className="absolute inset-0 rounded-[18px] pointer-events-none opacity-20"
               style={{
                 backgroundImage: `repeating-linear-gradient(
                   90deg,
                   transparent,
                   transparent 2px,
                   rgba(139, 69, 19, 0.1) 2px,
                   rgba(139, 69, 19, 0.1) 4px
                 )`
               }} />

          {/* Soft inner shadow for depth */}
          <div className="absolute inset-0 rounded-[18px] pointer-events-none
                          shadow-[inset_0_4px_8px_rgba(0,0,0,0.3)]" />
        </motion.div>
      </div>
    </main>
  );
}


