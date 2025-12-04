"use client";

import React, { useRef, useEffect } from "react";

import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function HeroScrollDemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      // Try to play video when component mounts
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Autoplay was prevented, user will need to interact
          console.log('Video autoplay prevented');
        });
      }
    }
  }, []);

  return (
    <div className="flex flex-col overflow-hidden pb-20 pt-20">
      <ContainerScroll
        titleComponent={
          <>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">
              See DoorIQ in Action <br />
              <span className="text-3xl md:text-5xl lg:text-[6rem] font-bold mt-1 leading-none">
                Demo Video
              </span>
            </h1>
          </>
        }
      >
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            controls
            className="w-full h-full object-cover"
            preload="auto"
          >
            <source 
              src="https://fzhtqmbaxznikmxdglyl.supabase.co/storage/v1/object/public/Demo-Assets/public/demo-video-home.mp4" 
              type="video/mp4" 
            />
          </video>
        </div>
      </ContainerScroll>
    </div>
  );
}

