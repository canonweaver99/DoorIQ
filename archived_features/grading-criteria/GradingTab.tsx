/**
 * ARCHIVED FEATURE: Grading Criteria Tab
 * 
 * This component was removed from the Knowledge Base tab.
 * It allowed managers to customize grading weights and passing scores.
 * 
 * Archived: 2025-01-XX
 * Reason: Removed from Knowledge Base UI per user request
 */

import { Target } from 'lucide-react'

interface TeamGradingConfig {
  custom_grading_rubric?: {
    weights: {
      rapport_score: number
      objection_handling_score: number
      close_effectiveness_score: number
      needs_discovery_score: number
      introduction_score: number
    }
    custom_criteria: Array<{
      name: string
      description: string
      weight: number
    }>
    automatic_fails: string[]
  }
  passing_score?: number
  enabled?: boolean
}

export function GradingTab({ config, setConfig }: { config: TeamGradingConfig; setConfig: (c: TeamGradingConfig) => void }) {
  const weights = config.custom_grading_rubric?.weights || {
    rapport_score: 15,
    objection_handling_score: 25,
    close_effectiveness_score: 30,
    needs_discovery_score: 20,
    introduction_score: 10
  }

  const updateWeight = (key: string, newValue: number) => {
    const currentWeights = { ...weights }
    const oldValue = currentWeights[key as keyof typeof weights]
    const difference = newValue - oldValue
    
    // Update the changed weight
    currentWeights[key as keyof typeof weights] = newValue
    
    // Distribute the difference across other weights proportionally
    const otherKeys = Object.keys(currentWeights).filter(k => k !== key)
    const totalOtherWeights = otherKeys.reduce((sum, k) => sum + currentWeights[k as keyof typeof weights], 0)
    
    if (totalOtherWeights > 0) {
      otherKeys.forEach(k => {
        const proportion = currentWeights[k as keyof typeof weights] / totalOtherWeights
        const adjustment = -difference * proportion
        currentWeights[k as keyof typeof weights] = Math.max(5, Math.round(currentWeights[k as keyof typeof weights] + adjustment))
      })
    }
    
    // Ensure total is exactly 100
    const total = Object.values(currentWeights).reduce((sum, val) => sum + val, 0)
    if (total !== 100) {
      const firstOtherKey = otherKeys[0]
      if (firstOtherKey) {
        currentWeights[firstOtherKey as keyof typeof weights] += (100 - total)
        currentWeights[firstOtherKey as keyof typeof weights] = Math.max(5, currentWeights[firstOtherKey as keyof typeof weights])
      }
    }

    setConfig({
      ...config,
      custom_grading_rubric: {
        ...config.custom_grading_rubric!,
        weights: currentWeights
      }
    })
  }

  const revertToDefaults = () => {
    const defaultWeights = {
      rapport_score: 15,
      objection_handling_score: 25,
      close_effectiveness_score: 30,
      needs_discovery_score: 20,
      introduction_score: 10
    }
    
    setConfig({
      ...config,
      custom_grading_rubric: {
        ...config.custom_grading_rubric!,
        weights: defaultWeights
      }
    })
  }

  const totalWeight = Object.values(weights).reduce((sum, val) => sum + val, 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Score Weights</h3>
            <p className="text-sm text-slate-400">Adjust the importance of each grading category. Weights automatically balance to total 100%.</p>
          </div>
          <button
            onClick={revertToDefaults}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium text-white transition-all"
          >
            <Target className="w-4 h-4" />
            Reset to Defaults
          </button>
        </div>
        <div className="space-y-4">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-slate-300 capitalize">
                  {key.replace(/_/g, ' ').replace(' score', '')}
                </label>
                <span className="text-sm font-semibold text-white">{value}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={value}
                onChange={(e) => updateWeight(key, parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
              />
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-300">Total Weight:</span>
            <span className="text-sm font-semibold text-green-400">100% ✓</span>
          </div>
          <p className="text-xs text-green-300/70 mt-1">Weights automatically balance when you make changes</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Passing Score</label>
        <input
          type="number"
          min="0"
          max="100"
          value={config.passing_score || 70}
          onChange={(e) => setConfig({ ...config, passing_score: parseInt(e.target.value) })}
          className="w-32 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
        />
        <p className="text-xs text-slate-400 mt-1">Minimum score required to pass</p>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled ?? true}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-5 h-5 rounded bg-white/5 border-white/10"
          />
          <span className="text-sm text-slate-300">Enable custom grading for this team</span>
        </label>
      </div>
    </div>
  )
}

