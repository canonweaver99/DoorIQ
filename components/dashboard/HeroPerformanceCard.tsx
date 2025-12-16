'use client'

import { motion } from 'framer-motion'
import { AlertCircle, XCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Image from 'next/image'
import { PERSONA_METADATA, type AllowedAgentName } from '@/components/trainer/personas'
import type { SessionPerformance } from '@/app/dashboard/types'
import { COLOR_VARIANTS } from '@/components/ui/background-circles'
import { getAgentImageStyle } from '@/lib/agents/imageStyles'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/useIsMobile'

interface HeroPerformanceCardProps {
  userName: string
  currentDateTime: string
  session: SessionPerformance | null
}

export default function HeroPerformanceCard({
  userName,
  currentDateTime,
  session
}: HeroPerformanceCardProps) {
  const router = useRouter()
  const isMobile = useIsMobile(640)
  
  const formattedDate = format(new Date(currentDateTime), 'EEEE, MMMM d, yyyy')
  const formattedTime = format(new Date(currentDateTime), 'h:mm a')

  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-2.5 sm:p-4 md:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
      >
        {/* Subtle purple glow at bottom for depth */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="text-center py-12 relative z-10">
          <p className="font-space text-white/80 text-lg font-bold">Complete your first session to see your performance</p>
        </div>
      </motion.div>
    )
  }

  const { overallScore, grade, agentName, keyIssues, durationSeconds } = session
  const durationMinutes = durationSeconds ? Math.floor(durationSeconds / 60) : null
  const durationSecs = durationSeconds ? durationSeconds % 60 : null

  // Get agent metadata for bubble styling
  const agentMetadata = PERSONA_METADATA[agentName as AllowedAgentName]
  const agentImage = agentMetadata?.bubble?.image || '/agents/default.png'
  const variantKey = (agentMetadata?.bubble?.color || 'primary') as keyof typeof COLOR_VARIANTS
  const variantStyles = COLOR_VARIANTS[variantKey]
  const imageStyle = getAgentImageStyle(agentName as AllowedAgentName)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-2.5 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
    >
      {/* Subtle purple glow at bottom for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Header with title and date/time */}
        <div className="flex items-start sm:items-center justify-between mb-2 sm:mb-4 md:mb-6 gap-2">
          <div className="flex-1">
            <h2 className="font-space text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">Most Recent Session</h2>
            <p className="font-space text-white/60 text-xs sm:text-xs font-semibold mt-0.5">
              {durationMinutes !== null && durationSecs !== null ? (
                <>Duration: {durationMinutes}m {durationSecs}s</>
              ) : (
                'Session details'
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center text-white transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20">
              <Clock className="w-3 h-3 sm:w-5 sm:h-5" />
            </div>
            <div className="text-right">
              <p className="font-space text-white/80 text-xs sm:text-sm md:text-base font-bold whitespace-nowrap">
                Updated {formattedDate} at {formattedTime}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4 md:mb-6">
          {/* Agent Picture */}
          <div className="relative h-16 w-16 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 flex-shrink-0">
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
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 },
                  opacity: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0 },
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

            {/* Profile Image */}
            <motion.div 
              className="absolute inset-[2px] flex items-center justify-center pointer-events-none"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0,
              }}
            >
              <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
                {(() => {
                  const [horizontal, vertical] = (imageStyle.objectPosition?.toString() || '50% 52%').split(' ')
                  let translateY = '0'
                  const verticalNum = parseFloat(vertical)
                  if (verticalNum !== 50) {
                    const translatePercent = ((verticalNum - 50) / 150) * 100
                    translateY = `${translatePercent}%`
                  }
                  const scaleValue = imageStyle.transform?.match(/scale\(([^)]+)\)/)?.[1] || '1'
                  
                  return (
                    <Image
                      src={agentImage}
                      alt={agentName}
                      fill
                      className="object-cover"
                      style={{
                        objectPosition: `${horizontal} ${vertical}`,
                        transform: `scale(${scaleValue}) translateY(${translateY})`,
                      }}
                      sizes="128px"
                    />
                  )
                })()}
              </div>
            </motion.div>
          </div>

          {/* Agent Name and Score on Same Line */}
          <div className="flex-1 flex items-center justify-between gap-1.5 sm:gap-3 md:gap-4">
            <div>
              <p className="font-space text-white/60 text-xs sm:text-sm md:text-base uppercase tracking-wider mb-0.5 sm:mb-1 font-semibold">Practice with</p>
              <p className="font-space text-white text-base sm:text-lg md:text-xl lg:text-2xl font-bold tracking-tight">{agentName}</p>
            </div>
            
            {/* Score and Grade Badge */}
            <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
              <div className="flex items-baseline gap-0.5 sm:gap-2">
                <div className="font-space text-2xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-bold tracking-tight">
                  {overallScore}
                </div>
                <p className="font-space text-white/60 text-xs sm:text-base md:text-lg lg:text-xl font-bold">/100</p>
              </div>
              <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20">
                <span className={`font-space text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight ${grade.color}`}>
                  {grade.letter}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-3 mb-2 sm:mb-4 md:mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/analytics/${session.id}`)}
            className="group/btn flex-1 bg-gray-300 text-black font-bold rounded-md text-xs sm:text-base md:text-lg tracking-tight hover:bg-gray-400 transition-all flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2.5 md:py-3 px-3 sm:px-5 md:px-6 font-space"
          >
            View Full Analysis
            <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 group-hover/btn:translate-x-0.5 transition-transform" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => router.push('/trainer')}
            className="group/btn flex-1 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 text-white font-bold rounded-md text-xs sm:text-base md:text-lg tracking-tight transition-all flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2.5 md:py-3 px-3 sm:px-5 md:px-6 font-space shadow-md shadow-purple-500/15"
          >
            Practice Again
            <ArrowRight className="w-3 h-3 sm:w-5 sm:h-5 group-hover/btn:translate-x-0.5 transition-transform" />
          </motion.button>
        </div>

        {/* Critical Issues Section - Horizontal at bottom */}
        {keyIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-2 sm:pt-4 md:pt-6 border-t border-white/10"
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6">
              <span className="font-space text-white/90 text-base sm:text-sm md:text-base lg:text-lg font-bold tracking-tight">Critical Issues:</span>
              {(isMobile ? keyIssues.slice(0, 1) : keyIssues).map((issue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-1.5 sm:gap-2 font-space text-white/80 text-base sm:text-sm md:text-base lg:text-lg font-bold"
                >
                  {issue.severity === 'error' ? (
                    <XCircle className="w-5 h-5 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                  )}
                  <span>{issue.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

