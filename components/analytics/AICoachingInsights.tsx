'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingUp, Star, MessageSquare, Mic, Video } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AICoachingInsightsProps {
  coachingPlan?: {
    immediate_fixes?: Array<{
      issue: string
      practice_scenario?: string
      resource_link?: string
    }>
    skill_development?: Array<{
      skill: string
      current_level?: string
      target_level?: string
      recommended_exercises?: string[]
    }>
  }
  feedback?: {
    strengths?: string[]
    improvements?: string[]
  }
}

export function AICoachingInsights({ coachingPlan, feedback }: AICoachingInsightsProps) {
  const immediateFix = coachingPlan?.immediate_fixes?.[0]
  const skillDevelopment = coachingPlan?.skill_development?.[0]
  const superpower = feedback?.strengths?.[0]
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 mb-8"
    >
      <h2 className="text-2xl font-bold text-white mb-6">Your Personalized Coaching Plan</h2>
      
      <div className="text-sm text-gray-400 mb-6">
        Based on this session + your last 10 sessions:
      </div>
      
      <div className="space-y-6">
        {/* Immediate Fix */}
        {immediateFix && (
          <div className="p-6 bg-orange-500/10 border border-orange-500/20 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">IMMEDIATE FIX</h3>
              <span className="text-xs text-gray-400">(Do this next session)</span>
            </div>
            <p className="text-white mb-2">{immediateFix.issue}</p>
            {immediateFix.practice_scenario && (
              <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                <div className="text-xs text-gray-400 mb-1">Practice:</div>
                <div className="text-sm text-gray-200">{immediateFix.practice_scenario}</div>
              </div>
            )}
          </div>
        )}
        
        {/* Skill Development */}
        {skillDevelopment && (
          <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">SKILL TO DEVELOP</h3>
              <span className="text-xs text-gray-400">(This week)</span>
            </div>
            <p className="text-white mb-2">{skillDevelopment.skill}</p>
            {skillDevelopment.recommended_exercises && skillDevelopment.recommended_exercises.length > 0 && (
              <div className="mt-3 space-y-2">
                <div className="text-xs text-gray-400 mb-1">Practice:</div>
                {skillDevelopment.recommended_exercises.map((exercise, idx) => (
                  <div key={idx} className="text-sm text-gray-200 pl-4">• {exercise}</div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Superpower */}
        {superpower && (
          <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">YOUR SUPERPOWER</h3>
              <span className="text-xs text-gray-400">(Keep doing)</span>
            </div>
            <p className="text-white">{superpower}</p>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap gap-3">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors">
          <MessageSquare className="w-4 h-4" />
          Chat with AI Coach
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition-colors">
          <Mic className="w-4 h-4" />
          Voice Coach
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium transition-colors">
          <Video className="w-4 h-4" />
          Watch Demo
        </button>
      </div>
    </motion.div>
  )
}

