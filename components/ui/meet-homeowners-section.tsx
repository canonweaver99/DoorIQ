'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Target, TrendingUp, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useScrollAnimation, fadeInUp, fadeInScale, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'
import { cn } from '@/lib/utils'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'

export function MeetHomeownersSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  
  const agents = [
    { name: "Austin", image: "/agents/austin.png", trait: "The Skeptic", color: "primary" as keyof typeof COLOR_VARIANTS },
    { name: "Nancy", image: "/agents/nancy.png", trait: "Problem-Free Nancy", color: "tertiary" as keyof typeof COLOR_VARIANTS },
    { name: "Tim", image: "/agents/tim.png", trait: "Price Conscious", color: "quinary" as keyof typeof COLOR_VARIANTS },
    { name: "Beth", image: "/agents/beth.png", trait: "Always Busy", color: "secondary" as keyof typeof COLOR_VARIANTS },
    { name: "Sam", image: "/agents/sam.png", trait: "Data-Driven", color: "senary" as keyof typeof COLOR_VARIANTS },
    { name: "Susan", image: "/agents/susan.png", trait: "Decision Deferred", color: "quaternary" as keyof typeof COLOR_VARIANTS },
  ]

  return (
    <motion.section 
      ref={ref}
      className="relative py-16 md:py-20"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Introduction */}
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <h2 className="text-[56px] leading-[1.1] tracking-tight font-geist mb-6 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
            Meet Your Training Partners
          </h2>
          <p className="text-lg text-white max-w-3xl mx-auto">
            These aren't just chatbots. They're AI-powered homeowners with real personalities, objections, and behaviors that mirror your toughest doors. 
            Built for sales managers who need their reps to practice the scenarios that matter most.
          </p>
        </motion.div>

        {/* Agent Carousel - Just Bubbles */}
        <motion.div 
          className="relative overflow-hidden mb-12 py-8"
          variants={fadeInScale}
        >
          <motion.div 
            className="flex gap-16 items-center justify-center"
            animate={{ x: [0, `-${100 / 3}%`] }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 50,
                ease: "linear"
              }
            }}
          >
            {/* Triple the agents for seamless loop */}
            {[...agents, ...agents, ...agents].map((agent, index) => {
              const variantStyles = COLOR_VARIANTS[agent.color]
              return (
                <div key={index} className="relative flex-shrink-0">
                  <div className="relative h-40 w-40">
                    {/* Concentric circles */}
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          "absolute inset-0 rounded-full border-2 bg-gradient-to-br to-transparent",
                          variantStyles.border[i],
                          variantStyles.gradient
                        )}
                        animate={{
                          rotate: 360,
                          scale: [1, 1.05, 1],
                          opacity: [0.7, 0.9, 0.7],
                        }}
                        transition={{
                          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                        }}
                      >
                        <div
                          className={cn(
                            "absolute inset-0 rounded-full mix-blend-screen",
                            `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace(
                              "from-",
                              ""
                            )}/20%,transparent_70%)]`
                          )}
                        />
                      </motion.div>
                    ))}

                    {/* Profile Image in Center */}
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "absolute inset-[-12%] rounded-full bg-gradient-to-br mix-blend-screen",
                              variantStyles.gradient,
                              "to-transparent opacity-60"
                            )}
                            style={{
                              animation: "spin 14s linear infinite"
                            }}
                          />
                          <div
                            className={cn(
                              "absolute inset-[-8%] rounded-full bg-gradient-to-tr mix-blend-screen",
                              variantStyles.gradient,
                              "to-transparent opacity-35"
                            )}
                            style={{
                              animation: "spin 16s linear infinite reverse"
                            }}
                          />
                        </div>
                        <Image
                          src={agent.image}
                          alt={agent.name}
                          fill
                          className="object-cover relative z-10"
                          sizes="160px"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        </motion.div>
        
        {/* Three Key Benefits - Now Second */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
          variants={staggerContainer}
        >
            <motion.div 
              className="flex flex-col items-center p-6 rounded-lg bg-white/5 border border-white/10"
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Authentic Interactions</h3>
              <p className="text-sm text-white text-center">
                Each homeowner interrupts, hesitates, and pushes back just like real prospects
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-6 rounded-lg bg-white/5 border border-white/10"
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Scenario-Based Learning</h3>
              <p className="text-sm text-white text-center">
                Target specific objections and situations your team struggles with most
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-6 rounded-lg bg-white/5 border border-white/10"
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Measurable Progress</h3>
              <p className="text-sm text-white text-center">
                Track improvement across your team with objective scoring and detailed analytics
              </p>
            </motion.div>
          </motion.div>

        {/* CTA */}
        <motion.div 
          className="text-center"
          variants={fadeInUp}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/trainer/select-homeowner" className="inline-flex rounded-full text-center items-center justify-center bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 text-white border border-purple-500/30 hover:border-purple-500/50 transition-all px-6 py-3 text-base font-semibold backdrop-blur-sm group">
              Start Training Now
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.section>
  )
}

