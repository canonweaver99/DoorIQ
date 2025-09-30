"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BoxesCore = ({ className, ...rest }: { className?: string }) => {
  // Reduced grid for performance while preserving the visual density via transforms
  const numRows = 60;
  const numCols = 40;
  const rows = new Array(numRows).fill(1);
  const cols = new Array(numCols).fill(1);

  // Brown newspaper-like palette
  const baseTile = "rgb(210 180 140)"; // tan
  const tileHover = "rgb(201 168 126)"; // slightly darker tan on hover
  const outlineColor = "rgb(120 63 4)"; // deep brown outline (amber-900-ish)
  const knobColor = "rgb(67 20 7)"; // darker brown for the knob
  const borderColor = "rgb(87 64 37)"; // brownish border

  // Define a door rectangle in grid space
  const doorWidth = Math.floor(numCols * 0.22);
  const doorHeight = Math.floor(numRows * 0.55);
  const doorLeft = Math.floor((numCols - doorWidth) / 2);
  const doorRight = doorLeft + doorWidth - 1;
  const doorTop = Math.floor(numRows * 0.18);
  const doorBottom = doorTop + doorHeight - 1;
  const knobRow = Math.floor(doorTop + doorHeight * 0.5);
  const knobCol = Math.max(doorLeft, doorRight - 2);

  return (
    <div
      style={{
        transform: `translate(-50%,-50%) skewX(38deg) skewY(-10deg) scale(0.9) rotate(0deg) translateZ(0)`,
      }}
      className={cn(
        "absolute left-1/2 top-1/2 p-4 flex -translate-x-1/2 -translate-y-1/2 w-full h-full z-0",
        className
      )}
      {...rest}
    >
      {rows.map((_, i) => (
        <motion.div
          key={`row` + i}
          className="w-16 h-8 border-l relative"
          style={{ borderColor }}
        >
          {cols.map((_, j) => {
            const isTop = i === doorTop && j >= doorLeft && j <= doorRight;
            const isBottom = i === doorBottom && j >= doorLeft && j <= doorRight;
            const isLeft = j === doorLeft && i >= doorTop && i <= doorBottom;
            const isRight = j === doorRight && i >= doorTop && i <= doorBottom;
            const isDoorBorder = isTop || isBottom || isLeft || isRight;
            const isKnob = i === knobRow && j === knobCol;
            const seeded = ((i * 31 + j * 17) % 100) / 100; // deterministic per-cell pseudo random
            const delay = isDoorBorder || isKnob ? 0.6 * seeded : 0;

            return (
              <motion.div
                key={`col` + j}
                className="w-16 h-8 border-r border-t relative"
                style={{ borderColor, backgroundColor: baseTile }}
                initial={{ backgroundColor: baseTile }}
                animate={{
                  backgroundColor: isKnob ? knobColor : isDoorBorder ? outlineColor : baseTile,
                }}
                transition={{ delay, duration: 0.6, ease: "easeOut" }}
                whileHover={{
                  backgroundColor: tileHover,
                  transition: { duration: 0 },
                }}
              />
            );
          })}
        </motion.div>
      ))}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);


