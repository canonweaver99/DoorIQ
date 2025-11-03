import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronDown, TrendingUp } from "lucide-react"
import { DashboardHeroPreview } from "@/components/ui/dashboard-hero-preview"
import { LiveSessionPreview } from "@/components/ui/live-session-preview"
import { motion } from "framer-motion"
import { useScrollAnimation, fadeInUp, fadeInLeft, fadeInRight, fadeInScale } from "@/hooks/useScrollAnimation"


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
  ctaSecondaryText?: string
  ctaSecondaryHref?: string
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
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
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
      description = "Sed ut perspiciatis unde omnis iste natus voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae.",
      ctaText = "Browse courses",
      ctaHref = "#",
      ctaSecondaryText,
      ctaSecondaryHref,
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
        <section className="relative w-full max-w-full mx-auto z-1 min-h-screen flex items-start pt-0">
          <RetroGrid {...gridOptions} />
          <div className="max-w-[1400px] xl:max-w-[1800px] 2xl:max-w-[2000px] z-10 mx-auto w-full px-4 sm:px-8 lg:px-20 xl:px-24 2xl:px-32">
            {/* Split Screen: Copy Left, Live Session Right */}
            <div className="grid grid-cols-1 lg:[grid-template-columns:48%_52%] xl:[grid-template-columns:45%_55%] gap-12 xl:gap-16 items-center pt-8 xl:pt-12">
              {/* Left Side - Copy */}
              <motion.div 
                className="space-y-5 text-center flex flex-col items-center justify-center" 
                style={{ paddingRight: '0px' }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
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
                  className="text-5xl sm:text-5xl lg:text-[56px] xl:text-[64px] 2xl:text-[72px] leading-[1.1] tracking-tight font-geist bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8 }}
                >
                  {subtitle.regular}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300 animate-gradient-flow">
                    {subtitle.gradient}
                  </span>
                </motion.h2>
                {/* CTAs moved directly under sub header */}
                <motion.div 
                  className="flex items-center justify-center gap-4 flex-wrap pt-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  {/* Primary CTA */}
                  <motion.span 
                    className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                    <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
                      <a
                        href={ctaHref}
                        onClick={() => {
                          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
                            try {
                              navigator.vibrate(10)
                            } catch {}
                          }
                        }}
                        className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/30 hover:via-purple-400/40 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/30 transition-all py-2.5 px-6 text-sm font-semibold"
                      >
                        {ctaText}
                      </a>
                    </div>
                  </motion.span>
                  {/* Secondary CTA */}
                  {ctaSecondaryText && (
                    <motion.span 
                      className="relative inline-block overflow-hidden rounded-full p-[1.5px]"
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                      <div className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-white dark:bg-gray-950 text-xs font-medium backdrop-blur-3xl">
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
                          className="inline-flex rounded-full text-center group items-center justify-center bg-gradient-to-tr from-zinc-300/10 via-purple-400/20 to-transparent dark:from-zinc-300/5 dark:via-purple-400/15 text-gray-900 dark:text-white border-input border-[1px] hover:bg-gradient-to-tr hover:from-zinc-300/20 hover:via-purple-400/30 hover:to-transparent dark:hover:from-zinc-300/10 dark:hover:via-purple-400/25 transition-all py-2.5 px-6 text-sm font-semibold"
                        >
                          {ctaSecondaryText}
                        </a>
                      </div>
                    </motion.span>
                  )}
                </motion.div>
                <motion.p 
                  className="text-white text-lg xl:text-xl 2xl:text-2xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                >
                  {description}
                </motion.p>
                {/* Industry Grid moved beneath all left-column content and reduced to 6 */}
                <motion.div 
                  className="grid grid-cols-2 gap-3 w-full"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                >
                  {[
                    "Solar",
                    "Pest Control",
                    "Roofing",
                    "Security",
                    "HVAC",
                    "Windows"
                  ].map((industry, index) => (
                    <motion.div
                      key={industry}
                      className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 + index * 0.08, duration: 0.4 }}
                    >
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-base text-white font-semibold">{industry}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Right Side - Live Session (Expanded) */}
              <motion.div 
                className="w-full h-full mt-3" 
                style={{ paddingLeft: '40px' }}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              >
                <LiveSessionPreview />
              </motion.div>
            </div>
          </div>

          {/* Scroll Indicator - Moved Up */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 animate-bounce z-20">
            <ChevronDown className="w-6 h-6 text-purple-400" />
          </div>
        </section>

        {/* Dashboard Section - Below the Fold */}
        <section className="relative w-full max-w-full mx-auto z-1 py-16">
          <div className="max-w-[1400px] xl:max-w-[1800px] 2xl:max-w-[2000px] mx-auto px-1.5 sm:px-4 lg:px-20 xl:px-24 2xl:px-32">
            <motion.div 
              className="text-center mb-8 sm:mb-12"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-3xl sm:text-4xl lg:text-[56px] leading-[1.1] tracking-tight font-geist bg-clip-text text-transparent bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
                Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Dashboards</span> and <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 dark:from-purple-300 dark:via-pink-300 dark:to-purple-300">Analytics</span>
              </h2>
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-3xl mx-auto">
                Track every rep's performance in real-time with detailed analytics and insights
              </p>
            </motion.div>

            {/* Features Pills */}
            <motion.div
              id="features"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 sm:mb-12"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:justify-center gap-2 sm:gap-3 max-w-5xl mx-auto">
                {/* Mobile-only features (most important) - shown on mobile, hidden on larger screens */}
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
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium text-white backdrop-blur-sm transition-all cursor-default text-center whitespace-nowrap overflow-hidden text-ellipsis sm:hidden"
                  >
                    {item.feature}
                  </motion.div>
                ))}
                {/* Desktop features - hidden on mobile, shown on larger screens */}
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
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-purple-500/20 border border-purple-500/30 rounded-full text-[10px] sm:text-xs lg:text-sm font-medium text-white backdrop-blur-sm transition-all cursor-default text-center whitespace-nowrap overflow-hidden text-ellipsis hidden sm:block"
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
        </section>
      </div>
    )
  },
)
HeroSection.displayName = "HeroSection"

export { HeroSection }

