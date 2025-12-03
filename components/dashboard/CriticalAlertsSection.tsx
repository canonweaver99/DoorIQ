'use client'

import { motion } from 'framer-motion'
import { XCircle, AlertTriangle, Lightbulb, Target, Gauge } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SessionPerformance } from '@/app/dashboard/types'

interface CriticalAlertsSectionProps {
  session: SessionPerformance | null
}

export default function CriticalAlertsSection({ session }: CriticalAlertsSectionProps) {
  const router = useRouter()

  if (!session) {
    return null
  }

  const { closing, conversation, voice, keyIssues } = session
  const alerts: Array<{
    type: 'critical' | 'warning'
    title: string
    icon: React.ReactNode
    description: string
    impact?: string
    quickFix: string
    actions: Array<{ label: string; onClick: () => void }>
  }> = []

  // Critical: Close Failed
  if (closing.status === 'MISSED' || closing.success === 0) {
    alerts.push({
      type: 'critical',
      title: 'CLOSE FAILED - $0 COMMISSION LOST',
      icon: <XCircle className="w-6 h-6 text-red-400" />,
      description: 'Why it failed:',
      impact: '• Didn\'t ask for the close (no attempt detected)',
      quickFix: 'Practice assumptive closes: "When would you like to schedule?" or "Are you ready to get started?"',
      actions: [
        {
          label: 'Take Closing Masterclass',
          onClick: () => router.push('/learning?focus=closing')
        },
        {
          label: `Practice With ${session.agentName} →`,
          onClick: () => router.push('/trainer')
        }
      ]
    })
  }

  // Warning: Speaking Too Fast
  if (conversation.pace > 160) {
    alerts.push({
      type: 'warning',
      title: `SPEAKING TOO FAST - ${conversation.pace} WPM (Target: 140-160)`,
      icon: <Gauge className="w-6 h-6 text-yellow-400" />,
      description: 'Impact: Fast speaking reduces trust by 23%',
      quickFix: 'Slow down when discussing benefits. Speed up for transitions. Add strategic pauses after key points.',
      actions: [
        {
          label: 'Practice Pacing Drills →',
          onClick: () => router.push('/learning?focus=pacing')
        }
      ]
    })
  }

  // Warning: Too Many Filler Words
  const fillerWordIssue = keyIssues.find(issue => 
    issue.text.toLowerCase().includes('filler') || 
    issue.text.toLowerCase().includes('um') ||
    issue.text.toLowerCase().includes('uh')
  )
  if (fillerWordIssue) {
    alerts.push({
      type: 'warning',
      title: 'TOO MANY FILLER WORDS',
      icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
      description: fillerWordIssue.text,
      quickFix: 'Practice pausing instead of using filler words. Take a breath before speaking to gather your thoughts.',
      actions: [
        {
          label: 'Practice Voice Exercises →',
          onClick: () => router.push('/learning?focus=voice')
        }
      ]
    })
  }

  if (alerts.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-400" />
        <h2 className="font-space text-xl md:text-2xl font-bold tracking-tight text-white">
          CRITICAL ALERTS - IMMEDIATE ATTENTION NEEDED
        </h2>
      </div>

      {alerts.map((alert, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 + index * 0.1 }}
          className={`rounded-lg border-2 p-4 md:p-6 ${
            alert.type === 'critical'
              ? 'bg-red-950/50 border-red-500/50'
              : 'bg-yellow-950/50 border-yellow-500/50'
          }`}
        >
          <div className="relative">
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                {alert.icon}
              </div>

              {/* Main Content */}
              <div className="flex-1 space-y-2 md:space-y-3 md:pr-[40%]">
                <h3 className="font-space text-2xl md:text-3xl font-bold tracking-tight text-white">
                  {alert.title}
                </h3>

                {alert.description && (
                  <p className="font-space text-white text-base md:text-lg font-bold">
                    {alert.description}
                  </p>
                )}

                {alert.impact && (
                  <div className="font-space text-white text-base md:text-lg font-bold space-y-1">
                    {alert.impact.split('•').filter(Boolean).map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-white">•</span>
                        <span>{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {alert.actions.map((action, actionIndex) => (
                    <motion.button
                      key={actionIndex}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={action.onClick}
                      className={`px-4 py-2 rounded-md font-space font-bold text-base md:text-lg tracking-tight transition-colors ${
                        alert.type === 'critical'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      }`}
                    >
                      {action.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Quick Fix - Positioned at 60% mark */}
              <div className="hidden md:block absolute left-[60%] top-0 right-0">
                <div className="flex flex-col items-center gap-2 pr-4 text-center">
                  <Lightbulb className="w-5 h-5 text-white flex-shrink-0" />
                  <div>
                    <p className="font-space text-white font-bold text-lg md:text-xl mb-1 underline">Quick Fix:</p>
                    <p className="font-space text-white/80 text-lg md:text-xl font-bold">{alert.quickFix}</p>
                  </div>
                </div>
              </div>

              {/* Quick Fix - Mobile (below content) */}
              <div className="md:hidden pt-2">
                <div className="flex flex-col items-center gap-2 text-center">
                  <Lightbulb className="w-5 h-5 text-white flex-shrink-0" />
                  <div>
                    <p className="font-space text-white font-bold text-lg md:text-xl mb-1 underline">Quick Fix:</p>
                    <p className="font-space text-white/80 text-lg md:text-xl font-bold">{alert.quickFix}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

