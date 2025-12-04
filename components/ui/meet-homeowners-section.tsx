'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Target, TrendingUp, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useScrollAnimation, fadeInUp, fadeInScale, staggerContainer, staggerItem } from '@/hooks/useScrollAnimation'
import { cn } from '@/lib/utils'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from '@/components/trainer/personas'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { createClient } from '@/lib/supabase/client'
import { useIsMobile } from '@/hooks/useIsMobile'

export function MeetHomeownersSection() {
  const { ref, controls } = useScrollAnimation(0.2)
  const router = useRouter()
  const isMobile = useIsMobile(640)

  const handleAgentClick = async (agentName: AllowedAgentName) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      // Get the eleven_agent_id from persona metadata
      const metadata = PERSONA_METADATA[agentName]
      const elevenAgentId = metadata?.card?.elevenAgentId
      
      if (!elevenAgentId) {
        console.error('No eleven_agent_id found for agent:', agentName)
        // Fallback to select-homeowner page
        router.push(`/trainer/select-homeowner?agent=${encodeURIComponent(agentName)}`)
        return
      }
      
      if (session) {
        // User is authenticated - navigate directly to trainer page with agent selected
        router.push(`/trainer?agent=${encodeURIComponent(elevenAgentId)}`)
      } else {
        // User is not authenticated - redirect to login with return path
        router.push(`/auth/login?next=${encodeURIComponent(`/trainer?agent=${encodeURIComponent(elevenAgentId)}`)}`)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      // Fallback to login page
      router.push('/auth/login')
    }
  }
  
  // Use the same agents as practice page with cutout bubble images
  const agentNames: AllowedAgentName[] = ['Average Austin', 'No Problem Nancy', 'Too Expensive Tim', 'Busy Beth', 'Skeptical Sam', 'Spouse Check Susan']
  
  const agents = agentNames.map((agentName) => {
    const metadata = PERSONA_METADATA[agentName]
    return {
      name: agentName.split(' ').slice(-1)[0], // Get last name for display
      fullName: agentName,
      image: metadata?.bubble?.image || '/agents/default.png', // Use cutout bubble image (no background)
      trait: metadata?.bubble?.subtitle || 'Training Partner',
      color: (metadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
    }
  })

  return (
    <motion.section 
      ref={ref}
      className="relative py-16 md:py-20"
      initial="hidden"
      animate={controls}
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-8">
        {/* Introduction */}
        <motion.div className="text-center mb-8" variants={fadeInUp}>
          <h2 className="text-[64px] sm:text-[72px] lg:text-[80px] leading-[1.1] tracking-tight font-geist mb-6 bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
            Meet Your Training Partners
          </h2>
          <p className="text-xl sm:text-2xl text-white max-w-3xl mx-auto mb-4">
            AI homeowners with real personalities and objections that mirror your toughest doors. Built for sales managers.
          </p>
          <p className="text-xl sm:text-2xl text-purple-300 max-w-3xl mx-auto font-semibold">
            Click any agent below to start an immediate training session
          </p>
        </motion.div>

        {/* Agent Carousel - Just Bubbles */}
        <motion.div 
          className="relative overflow-hidden mb-12 py-8"
          variants={fadeInScale}
        >
          <div className="relative w-full">
            <motion.div 
              className="flex items-center justify-start"
              animate={{ 
                x: [0, `-${(agents.length * 208)}px`]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: isMobile ? 12.5 : 62.5,
                  ease: "linear"
                }
              }}
            >
              {/* Quadruple the agents for seamless infinite loop - each agent is ~208px wide (160px + 48px gap) */}
              {[...agents, ...agents, ...agents, ...agents].map((agent, index) => {
                const variantStyles = COLOR_VARIANTS[agent.color]
                return (
                  <div
                    key={`${agent.fullName}-${index}`}
                    onClick={() => handleAgentClick(agent.fullName)}
                    className="relative flex-shrink-0 cursor-pointer group mx-6 transition-transform hover:scale-110 active:scale-95"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleAgentClick(agent.fullName)
                      }
                    }}
                  >
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

                    {/* Profile Image in Center - Simplified to match practice page */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                        {(() => {
                          const imageStyle = getAgentImageStyle(agent.fullName)
                          const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                          
                          // Convert vertical percentage to translateY (same logic as practice page)
                          let translateY = '0'
                          const verticalNum = parseFloat(vertical)
                          if (verticalNum !== 50) {
                            const translatePercent = ((verticalNum - 50) / 150) * 100
                            translateY = `${translatePercent}%`
                          }
                          
                          // Combine transforms - scale from imageStyle and translateY
                          const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                          const combinedTransform = translateY !== '0' 
                            ? `scale(${scaleValue}) translateY(${translateY})`
                            : imageStyle.transform || `scale(${scaleValue})`
                          
                          const finalStyle = {
                            objectFit: 'cover' as const,
                            objectPosition: `${horizontal} 50%`, // Keep horizontal, center vertical
                            transform: combinedTransform,
                          }
                          
                          // URL encode image path if it contains spaces to ensure proper loading
                          const imageSrc = agent.image.includes(' ') || agent.image.includes('&')
                            ? agent.image.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                            : agent.image
                          
                          return (
                            <Image
                              src={imageSrc}
                              alt={agent.name}
                              fill
                              style={finalStyle}
                              sizes="160px"
                              quality={95}
                              priority={index < 6}
                              unoptimized={agent.image.includes(' ') || agent.image.includes('&')}
                              onError={(e) => {
                                console.error('❌ Homeowners section image failed to load:', agent.image, 'Encoded:', imageSrc)
                                e.stopPropagation()
                              }}
                            />
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  </div>
                )
              })}
            </motion.div>
          </div>
        </motion.div>
        
        {/* Three Key Benefits - Now Second */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12"
          variants={staggerContainer}
        >
            <motion.div 
              className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30"
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <h3 className="text-xl font-semibold text-white mb-3">Authentic Interactions</h3>
              <p className="text-base text-white text-center">
                Each homeowner interrupts, hesitates, and pushes back just like real prospects
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30"
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <h3 className="text-xl font-semibold text-white mb-3">Scenario-Based Learning</h3>
              <p className="text-base text-white text-center">
                Target specific objections and situations your team struggles with most
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center p-6 rounded-lg bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30"
              variants={staggerItem}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            >
              <h3 className="text-xl font-semibold text-white mb-3">Measurable Progress</h3>
              <p className="text-base text-white text-center">
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

