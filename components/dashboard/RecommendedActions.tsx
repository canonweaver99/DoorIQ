'use client'

import { motion } from 'framer-motion'
import { Target, Gauge, Mic, BookOpen, ArrowRight, PlayCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SessionPerformance } from '@/app/dashboard/types'

interface RecommendedActionsProps {
  session: SessionPerformance | null
}

export default function RecommendedActions({ session }: RecommendedActionsProps) {
  const router = useRouter()

  if (!session) {
    return null
  }

  const { closing, conversation, voice } = session
  const actions: Array<{
    title: string
    description: string
    icon: React.ReactNode
    onClick: () => void
    priority: 'high' | 'medium' | 'low'
  }> = []

  // High priority: Closing issues
  if (closing.averageScore < 60) {
    actions.push({
      title: 'Practice Closing Masterclass',
      description: 'Master assumptive closes and objection handling',
      icon: <Target className="w-6 h-6" />,
      onClick: () => router.push('/learning?focus=closing'),
      priority: 'high'
    })
  }

  // High priority: Speaking too fast
  if (conversation.pace > 160) {
    actions.push({
      title: 'Practice Pacing Drills',
      description: 'Learn to control your speaking speed for better clarity',
      icon: <Gauge className="w-6 h-6" />,
      onClick: () => router.push('/learning?focus=pacing'),
      priority: 'high'
    })
  }

  // Medium priority: Voice quality
  if (voice.averageScore < 70) {
    actions.push({
      title: 'Voice Quality Training',
      description: 'Improve confidence, energy, and clarity',
      icon: <Mic className="w-6 h-6" />,
      onClick: () => router.push('/learning?focus=voice'),
      priority: 'medium'
    })
  }

  // Medium priority: Conversation balance
  if (conversation.averageScore < 70) {
    actions.push({
      title: 'Conversation Balance Course',
      description: 'Perfect your talk ratio and listening skills',
      icon: <BookOpen className="w-6 h-6" />,
      onClick: () => router.push('/learning?focus=conversation'),
      priority: 'medium'
    })
  }

  // Low priority: General practice
  if (actions.length === 0) {
    actions.push({
      title: 'Continue Practicing',
      description: 'Keep up the great work and maintain your skills',
      icon: <Target className="w-6 h-6" />,
      onClick: () => router.push('/trainer'),
      priority: 'low'
    })
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  // Add practice session card - replace the last action if we have 3+ actions
  const displayActions = actions.slice(0, 2) // Take first 2 learning actions
  const practiceSessionAction = {
    title: 'Recommended Practice Session',
    description: session.agentName ? `Practice with ${session.agentName} to improve your skills` : 'Start a practice session to work on your sales skills',
    icon: <PlayCircle className="w-6 h-6" />,
    onClick: () => router.push('/trainer'),
    priority: 'high' as const
  }

  if (actions.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="space-y-6"
    >
      <h2 className="font-space text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-purple-400" />
        RECOMMENDED NEXT ACTIONS
      </h2>

      <div className="md:grid md:grid-cols-3 md:gap-6">
        {/* Mobile: Horizontal scrolling */}
        <div className="md:hidden overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          <div className="flex gap-4 w-max">
            {displayActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="flex-shrink-0 w-[280px] snap-center bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300 cursor-pointer group"
                onClick={action.onClick}
              >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg flex-shrink-0 ${
                action.priority === 'high' 
                  ? 'bg-red-500/20 text-red-400' 
                  : action.priority === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}>
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-space text-white text-base font-bold tracking-tight mb-1 group-hover:text-purple-400 transition-colors">
                  {action.title}
                </h3>
                <p className="font-space text-white/80 text-sm font-bold mb-2">
                  {action.description}
                </p>
                <div className="flex items-center gap-1.5 font-space text-purple-400 text-xs font-bold">
                  <span>Get Started</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
            ))}
            {/* Practice Session Card - Mobile */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + displayActions.length * 0.1 }}
              className="flex-shrink-0 w-[280px] snap-center bg-white/[0.02] border-2 border-white/5 rounded-lg p-4 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300 cursor-pointer group"
              onClick={practiceSessionAction.onClick}
            >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg flex-shrink-0 bg-blue-500/20 text-blue-400">
              {practiceSessionAction.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-space text-white text-base font-bold tracking-tight mb-1 group-hover:text-purple-400 transition-colors">
                {practiceSessionAction.title}
              </h3>
              <p className="font-space text-white/80 text-sm font-bold mb-2">
                {practiceSessionAction.description}
              </p>
              <div className="flex items-center gap-1.5 font-space text-purple-400 text-xs font-bold">
                <span>Start Practice</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </motion.div>
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:contents">
          {displayActions.map((action, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300 cursor-pointer group"
              onClick={action.onClick}
            >
              <div className="flex items-start gap-4 md:gap-6">
                <div className={`p-3 rounded-lg ${
                  action.priority === 'high' 
                    ? 'bg-red-500/20 text-red-400' 
                    : action.priority === 'medium'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-space text-white text-xl md:text-2xl font-bold tracking-tight mb-1 group-hover:text-purple-400 transition-colors">
                    {action.title}
                  </h3>
                  <p className="font-space text-white/80 text-base md:text-lg font-bold mb-3">
                    {action.description}
                  </p>
                  <div className="flex items-center gap-2 font-space text-purple-400 text-sm md:text-base font-bold">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {/* Practice Session Card - Desktop */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + displayActions.length * 0.1 }}
            className="bg-white/[0.02] border-2 border-white/5 rounded-lg p-6 md:p-8 hover:border-white/20 hover:bg-white/[0.025] transition-all duration-300 cursor-pointer group"
            onClick={practiceSessionAction.onClick}
          >
            <div className="flex items-start gap-4 md:gap-6">
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                {practiceSessionAction.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-space text-white text-xl md:text-2xl font-bold tracking-tight mb-1 group-hover:text-purple-400 transition-colors">
                  {practiceSessionAction.title}
                </h3>
                <p className="font-space text-white/80 text-base md:text-lg font-bold mb-3">
                  {practiceSessionAction.description}
                </p>
                <div className="flex items-center gap-2 font-space text-purple-400 text-sm md:text-base font-bold">
                  <span>Start Practice</span>
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

