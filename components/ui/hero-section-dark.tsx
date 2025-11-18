"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronDown, TrendingUp } from "lucide-react"
import { DashboardHeroPreview } from "@/components/ui/dashboard-hero-preview"
// import { LiveSessionPreview } from "@/components/ui/live-session-preview" // Archived - removed sample session from hero
import { motion } from "framer-motion"
import { useScrollAnimation, fadeInUp, fadeInLeft, fadeInRight, fadeInScale } from "@/hooks/useScrollAnimation"
import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { PERSONA_METADATA, ALLOWED_AGENT_ORDER, type AllowedAgentName } from "@/components/trainer/personas"
import { getAgentImageStyle } from "@/lib/agents/imageStyles"
import { createClient } from "@/lib/supabase/client"
import { COLOR_VARIANTS } from "@/components/ui/scrolling-agent-carousel"


interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  titleHref?: string
  subtitle?: {
    regular: string
    gradient: string
  }
  description?: string
  ctaText?: string
  ctaHref?: string
  onCtaClick?: () => void
  ctaSecondaryText?: string
  ctaSecondaryHref?: string
  onCtaSecondaryClick?: () => void
  bottomImage?: {
    light: string
    dark: string
  }
  gridOptions?: {
    angle?: number
    cellSize?: number
    opacity?: number
    lightLineColor?: string
    darkLineColor?: string
  }
}

const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.15,
  lightLineColor = "rgb(100, 100, 120)",
  darkLineColor = "rgb(60, 60, 80)",
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties

  return (
    <div
      className={cn(
        "pointer-events-none absolute size-full overflow-hidden [perspective:200px]",
        `opacity-[var(--opacity)]`,
      )}
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  )
}

// Inline Agent Carousel Component for Hero
const InlineAgentCarousel = React.memo(() => {
  const router = useRouter()
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'laptop' | 'desktop'>('laptop')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 640) {
        setScreenSize('mobile')
      } else if (width < 1024) {
        setScreenSize('tablet')
      } else if (width < 1440) {
        setScreenSize('laptop')
      } else {
        setScreenSize('desktop')
      }
    }
    if (typeof window !== 'undefined') {
      checkScreenSize()
      window.addEventListener('resize', checkScreenSize)
      return () => window.removeEventListener('resize', checkScreenSize)
    }
  }, [])

  const agents = React.useMemo(() => {
    return ALLOWED_AGENT_ORDER.slice(0, 12).map((agentName) => {
      const metadata = PERSONA_METADATA[agentName]
      return {
        name: agentName.split(' ').slice(-1)[0],
        fullName: agentName,
        src: metadata?.bubble?.image || '/agents/default.png',
        color: (metadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
      }
    })
  }, [])

  const handleAgentClick = async (agentName: AllowedAgentName) => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const metadata = PERSONA_METADATA[agentName]
      const elevenAgentId = metadata?.card?.elevenAgentId

      if (!elevenAgentId) {
        router.push(`/trainer/select-homeowner?agent=${encodeURIComponent(agentName)}`)
        return
      }

      if (session) {
        router.push(`/trainer?agent=${encodeURIComponent(elevenAgentId)}`)
      } else {
        router.push(`/auth/login?next=${encodeURIComponent(`/trainer?agent=${encodeURIComponent(elevenAgentId)}`)}`)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/auth/login')
    }
  }

  if (!agents.length) {
    return null
  }

  // Optimized item widths for different screen sizes
  const getItemWidth = () => {
    switch (screenSize) {
      case 'mobile': return 96 + 16 // 112px (increased from 80px)
      case 'tablet': return 112 + 20 // 132px
      case 'laptop': return 144 + 28 // 172px (optimized for laptop - smaller)
      case 'desktop': return 160 + 32 // 192px
      default: return 144 + 28 // 172px default for laptop
    }
  }

  const getAnimationDuration = () => {
    switch (screenSize) {
      case 'mobile': return 12.5
      case 'tablet': return 35
      case 'laptop': return 50 // Smooth scrolling for laptop
      case 'desktop': return 65
      default: return 50
    }
  }

  const itemWidth = getItemWidth()
  const animationDuration = getAnimationDuration()

  return (
    <div className="relative w-full overflow-hidden my-2 sm:my-3 lg:my-4 py-2 lg:py-3" ref={containerRef}>
      <div className="relative w-full">
        <motion.div 
          className="flex items-center justify-center"
          animate={{ 
            x: [0, `-${(agents.length * itemWidth)}px`]
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: animationDuration,
              ease: "linear"
            }
          }}
        >
          {/* Quadruple the agents for seamless infinite loop */}
          {[...agents, ...agents, ...agents, ...agents].map((agent, index) => {
            const variantStyles = COLOR_VARIANTS[agent.color]
            return (
              <div
                key={`${agent.fullName}-${index}`}
                onClick={() => handleAgentClick(agent.fullName as AllowedAgentName)}
                className="relative flex-shrink-0 cursor-pointer group transition-transform hover:scale-110 active:scale-95 mx-2 sm:mx-3 md:mx-4 lg:mx-5 xl:mx-6"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleAgentClick(agent.fullName as AllowedAgentName)
                  }
                }}
              >
                <div className="relative h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 lg:h-36 lg:w-36 xl:h-40 xl:w-40 2xl:h-44 2xl:w-44">
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
                          `bg-[radial-gradient(ellipse_at_center,${variantStyles.gradient.replace("from-", "")}/20%,transparent_70%)]`
                        )}
                      />
                    </motion.div>
                  ))}

                  {/* Profile Image in Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                      {(() => {
                        const imageStyle = getAgentImageStyle(agent.fullName)
                        const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                        let translateY = '0'
                        const verticalNum = parseFloat(vertical)
                        if (verticalNum !== 50) {
                          const translatePercent = ((verticalNum - 50) / 150) * 100
                          translateY = `${translatePercent}%`
                        }
                        const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                        const combinedTransform = translateY !== '0' 
                          ? `scale(${scaleValue}) translateY(${translateY})`
                          : imageStyle.transform || `scale(${scaleValue})`
                        const finalStyle = {
                          objectFit: 'cover' as const,
                          objectPosition: `${horizontal} 50%`,
                          transform: combinedTransform,
                        }
                        const imageSrc = agent.src.includes(' ') || agent.src.includes('&')
                          ? agent.src.split('/').map((part, i) => i === 0 ? part : encodeURIComponent(part)).join('/')
                          : agent.src
                        return (
                          <Image
                            src={imageSrc}
                            alt={agent.name}
                            fill
                            style={finalStyle}
                            sizes="(max-width: 640px) 96px, (max-width: 768px) 112px, (max-width: 1024px) 128px, (max-width: 1440px) 144px, 160px"
                            quality={95}
                            priority={index < 6}
                            unoptimized={agent.src.includes(' ') || agent.src.includes('&')}
                            width={160}
                            height={160}
                            onError={(e) => {
                              console.error('❌ Hero carousel image failed to load:', agent.src, 'Encoded:', imageSrc)
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
    </div>
  )
})

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      title = "Build products for everyone",
      titleHref,
      subtitle = {
        regular: "Designing your projects faster with ",
        gradient: "the largest figma UI kit.",
      },
      description,
      ctaText,
      ctaHref,
      onCtaClick,
      ctaSecondaryText,
      ctaSecondaryHref,
      onCtaSecondaryClick,
      bottomImage,
      gridOptions,
      ...props
    },
    ref,
  ) => {
    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        <div className="absolute top-0 z-[0] h-screen w-screen bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
        
        {/* Hero Section - Full Viewport Height */}
        <section className="relative w-full max-w-full mx-auto z-1 min-h-screen flex items-center justify-center pt-32 sm:pt-0 pb-0">
          <RetroGrid {...gridOptions} />
          <div className="max-w-[1400px] xl:max-w-[1800px] 2xl:max-w-[2000px] z-10 mx-auto w-full px-4 sm:px-6 lg:px-20 xl:px-24 2xl:px-32">
            {/* Centered Copy Layout */}
            <div className="flex items-center justify-center pt-0 lg:pt-0">
              {/* Centered Copy */}
              <motion.div 
                className="space-y-4 sm:space-y-4 lg:space-y-4 w-full max-w-5xl text-center flex flex-col items-center justify-center px-0 sm:px-0" 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <motion.a 
                  href={titleHref || "/testimonials"} 
                  className="inline-block"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <h1 className="text-base text-white group font-geist px-6 py-3 bg-gradient-to-tr from-zinc-300/20 via-gray-400/20 to-transparent dark:from-zinc-300/5 dark:via-gray-400/5 border-[2px] border-black/5 dark:border-white/5 rounded-3xl cursor-pointer hover:border-purple-500/30 transition-all flex items-center gap-2">
                    {title}
                    <ChevronRight className="inline w-4 h-4 ml-1 group-hover:translate-x-1 duration-300" />
                  </h1>
                </motion.a>
                <motion.h2 
                  className="text-[2.5rem] leading-tight sm:text-4xl md:text-5xl lg:text-[72px] xl:text-[80px] 2xl:text-[88px] sm:leading-[1.1] tracking-tight font-geist bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] w-full break-words hyphens-auto"
                  style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {subtitle.regular}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300 animate-gradient-flow">
                    {subtitle.gradient}
                  </span>
                </motion.h2>
                {/* Agent Carousel */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                >
                  <InlineAgentCarousel />
                </motion.div>
                {/* Instructional Text - Below Carousel */}
                <motion.p 
                  className="text-white text-sm sm:text-base lg:text-lg mt-2 lg:mt-3 px-0 sm:px-0"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  Click any agent above to start an immediate training session
                </motion.p>
                {/* Industry Cards - Temporarily Archived */}
                {/* <motion.div 
                  className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full mt-3 lg:mt-4"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  {[
                    { name: "Solar", icon: "☀️" },
                    { name: "Pest Control", icon: "🐛" },
                    { name: "Roofing", icon: "🏠" },
                    { name: "Security", icon: "🔒" },
                    { name: "Internet", icon: "📡" },
                    { name: "Windows", icon: "🪟" }
                  ].map((industry, index) => (
                    <motion.button
                      key={industry.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.05, duration: 0.4 }}
                      className="group relative flex flex-col items-center justify-center p-2 sm:p-3 lg:p-3 rounded-lg border-2 border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 overflow-hidden min-w-[70px] sm:min-w-[80px] lg:min-w-[85px]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-blue-500/0 group-hover:from-purple-500/20 group-hover:to-blue-500/20 transition-all duration-300 rounded-2xl" />
                      <span className="text-2xl sm:text-2xl lg:text-3xl mb-1 relative z-10 transform group-hover:scale-110 transition-transform duration-300">
                        {industry.icon}
                      </span>
                      <span className="text-[10px] sm:text-xs font-semibold text-white relative z-10 text-center">
                        {industry.name}
                      </span>
                    </motion.button>
                  ))}
                </motion.div> */}
                {/* Book a Demo Button - At Bottom */}
                {ctaSecondaryText && (
                  <motion.div 
                    className="flex items-center justify-center pt-3 sm:pt-4 lg:pt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                  >
                    <motion.span 
                      className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                      <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                        {onCtaSecondaryClick ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                                try {
                                  navigator.vibrate(10)
                                } catch {}
                              }
                              onCtaSecondaryClick()
                            }}
                            className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/10 via-purple-400/20 to-transparent dark:from-zinc-300/5 dark:via-purple-400/15 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-purple-400/30 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/25 transition-all py-3.5 px-8 text-base sm:text-lg font-semibold"
                          >
                            {ctaSecondaryText}
                          </button>
                        ) : (
                          <a
                            href={ctaSecondaryHref}
                            onClick={(e) => {
                              if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                                try {
                                  navigator.vibrate(10)
                                } catch {}
                              }
                              if (ctaSecondaryHref?.startsWith('#')) {
                                e.preventDefault()
                                const element = document.querySelector(ctaSecondaryHref)
                                element?.scrollIntoView({ behavior: 'smooth' })
                              }
                            }}
                            className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/10 via-purple-400/20 to-transparent dark:from-zinc-300/5 dark:via-purple-400/15 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-purple-400/30 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/25 transition-all py-3.5 px-8 text-base sm:text-lg font-semibold"
                          >
                            {ctaSecondaryText}
                          </a>
                        )}
                      </div>
                    </motion.span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator - At Bottom */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
            <ChevronDown className="w-6 h-6 text-purple-400" />
          </div>
        </section>

        {/* Dashboard Section - Archived: Moved to allow See DoorIQ in Action section directly under hero */}
        {/* <section className="relative w-full max-w-full mx-auto z-1 py-16">
          <div className="max-w-[1400px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto px-1.5 sm:px-4 lg:px-20 xl:px-24 2xl:px-32">
            <motion.div 
              className="text-center mb-8 sm:mb-12 -mt-4"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-[56px] leading-[1.1] tracking-tight font-geist bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)] pb-2">
                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Dashboards</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Analytics</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto mt-6">
                Track every rep's performance in real-time with detailed analytics and insights
              </p>
            </motion.div>

            <motion.div
              id="features"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 sm:mb-12"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:justify-center gap-3 sm:gap-3 lg:gap-4 max-w-6xl mx-auto px-4">
                {[
                  { feature: "AI-Powered Roleplay", isMobileOnly: true },
                  { feature: "Real-Time Feedback", isMobileOnly: true },
                  { feature: "Performance Analytics", isMobileOnly: true },
                  { feature: "Objection Handling", isMobileOnly: true },
                  { feature: "Team Leaderboards", isMobileOnly: true },
                  { feature: "Progress Tracking", isMobileOnly: true },
                  { feature: "Unlimited Practice", isMobileOnly: true },
                  { feature: "Manager Insights", isMobileOnly: true },
                ].map((item, index) => (
                  <motion.div
                    key={`mobile-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium text-white backdrop-blur-sm transition-all cursor-default text-center whitespace-nowrap overflow-hidden text-ellipsis sm:hidden"
                    style={{ contain: 'layout style paint', willChange: 'transform, opacity' }}
                  >
                    {item.feature}
                  </motion.div>
                ))}
                {[
                  "AI-Powered Roleplay",
                  "Real-Time Feedback",
                  "Performance Analytics",
                  "Speech Analysis",
                  "Objection Handling",
                  "Upload Pitch Recordings",
                  "Team Leaderboards",
                  "Custom Grading",
                  "Progress Tracking",
                  "Export Reports",
                  "Manager Insights",
                  "Mobile Friendly",
                  "Unlimited Practice",
                  "In-App Messaging",
                  "Knowledge Base"
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: index * 0.02 }}
                    className="px-4 sm:px-5 lg:px-6 xl:px-7 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium text-white backdrop-blur-sm transition-all cursor-default text-center whitespace-nowrap flex-shrink-0 hidden sm:block"
                    style={{ contain: 'layout style paint', willChange: 'transform, opacity' }}
                  >
                    {feature}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            >
              <DashboardHeroPreview />
            </motion.div>
          </div>
        </section> */}
      </div>
    )
  },
)
HeroSection.displayName = "HeroSection"

export { HeroSection }

