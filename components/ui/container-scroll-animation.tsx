"use client";

import React, { useRef } from "react";

import { useScroll, useTransform, motion, MotionValue } from "framer-motion";
import { useIsMobile, useReducedMotion } from "@/hooks/useIsMobile";

export const ContainerScroll = ({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile(768);
  const prefersReducedMotion = useReducedMotion();
  
  // Disable scroll animations only if user prefers reduced motion
  const shouldAnimate = !prefersReducedMotion;
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const scaleDims = scaleDimensions();
  const rotate = shouldAnimate 
    ? useTransform(scrollYProgress, [0, 0.25, 1], [20, 0, 0])
    : useTransform(scrollYProgress, [0, 1], [0, 0]);
  const scale = shouldAnimate
    ? useTransform(scrollYProgress, [0, 0.25, 1], [scaleDims[0], scaleDims[1], scaleDims[1]])
    : useTransform(scrollYProgress, [0, 1], [1, 1]);
  const translate = shouldAnimate
    ? useTransform(scrollYProgress, [0, 0.25, 1], [0, -100, -100])
    : useTransform(scrollYProgress, [0, 1], [0, 0]);

  return (
    <div
      className={`${isMobile ? 'h-auto min-h-[40rem]' : 'h-[55rem] md:h-[90rem]'} flex items-center justify-center relative overflow-visible`}
      ref={containerRef}
    >
      <div
        className={`${isMobile ? 'py-8' : 'py-8 pt-[1px] pb-[1px]'} w-full relative overflow-visible`}
        style={shouldAnimate ? {
          perspective: "1000px",
        } : {}}
      >
        <Header translate={translate} titleComponent={titleComponent} />
        <Card rotate={rotate} translate={translate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
};

export const Header = ({ translate, titleComponent }: any) => {
  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      className="div max-w-6xl mx-auto text-center"
    >
      {titleComponent}
    </motion.div>
  );
};

export const Card = ({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      className="max-w-6xl -mt-12 md:mt-8 mx-auto w-full p-2 md:p-6 shadow-2xl"
    >
      <div className="w-full overflow-visible">
        {children}
      </div>
    </motion.div>
  );
};

