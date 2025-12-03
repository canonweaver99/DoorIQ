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
  
  const formattedDate = format(new Date(currentDateTime), 'EEEE, MMMM d, yyyy')
  const formattedTime = format(new Date(currentDateTime), 'h:mm a')

  if (!session) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
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
      className="group relative bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.025] overflow-hidden"
    >
      {/* Subtle purple glow at bottom for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="relative z-10">
        {/* Header with title and date/time */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-space text-white text-2xl md:text-3xl font-bold tracking-tight">Most Recent Session</h2>
            {durationMinutes !== null && durationSecs !== null && (
              <p className="font-space text-white/60 text-xs md:text-sm font-semibold mt-0.5">
                Duration: {durationMinutes}m {durationSecs}s
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center text-white transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20">
              <Clock className="w-5 h-5" />
            </div>
            <div className="text-right">
              <p className="font-space text-white/80 text-sm md:text-base font-bold">
                {formattedDate} at {formattedTime}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left: Agent Info */}
          <div className="flex items-center gap-4">
            <div className="relative h-28 w-28 md:h-32 md:w-32 flex-shrink-0">
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
            <div>
              <p className="font-space text-white/60 text-sm md:text-base uppercase tracking-wider mb-1 font-semibold">Practice with</p>
              <p className="font-space text-white text-xl md:text-2xl font-bold tracking-tight">{agentName}</p>
            </div>
          </div>

          {/* Right: Score and Grade Badge */}
          <div className="flex items-center justify-center md:justify-end gap-4">
            <div className="flex items-baseline gap-2">
              <div className="font-space text-5xl md:text-6xl text-white font-bold tracking-tight">
                {overallScore}
              </div>
              <p className="font-space text-white/60 text-lg md:text-xl font-bold">/100</p>
            </div>
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg border border-white/10 bg-white/[0.05] flex items-center justify-center transition-colors group-hover:bg-white/[0.08] group-hover:border-white/20">
              <span className={`font-space text-4xl md:text-5xl font-bold tracking-tight ${grade.color}`}>
                {grade.letter}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(`/analytics/${session.id}`)}
            className="group/btn flex-1 bg-white text-black font-bold rounded-md text-base md:text-lg tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 py-3 px-6 font-space"
          >
            View Full Analysis
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/trainer')}
            className="group/btn flex-1 bg-white text-black font-bold rounded-md text-base md:text-lg tracking-tight hover:bg-white/95 transition-all flex items-center justify-center gap-2 py-3 px-6 font-space"
          >
            Practice Again
            <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-0.5 transition-transform" />
          </motion.button>
        </div>

        {/* Critical Issues Section - Horizontal at bottom */}
        {keyIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="pt-6 border-t border-white/10"
          >
            <div className="flex flex-wrap items-center gap-4 md:gap-6 lg:gap-8">
              <span className="font-space text-white/90 text-base md:text-lg font-bold tracking-tight">Critical Issues:</span>
              {keyIssues.map((issue, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2 font-space text-white/80 text-base md:text-lg font-bold"
                >
                  {issue.severity === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
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

