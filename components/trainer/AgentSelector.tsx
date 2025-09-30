'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/database.types'

type Agent = Database['public']['Tables']['agents']['Row']

interface AgentSelectorProps {
  onSelectAgent: (agent: Agent) => void
  selectedAgent: Agent | null
  disabled?: boolean
}

export default function AgentSelector({ onSelectAgent, selectedAgent, disabled }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'customers' | 'reps'>('customers')
  const supabase = createClient()

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setAgents(data)
      // Auto-select Austin (first agent) if nothing selected
      if (!selectedAgent && data.length > 0) {
        onSelectAgent(data[0])
      }
    }
    setLoading(false)
  }

  // Customer personas (homeowners to practice with)
  const customerAgents = agents.filter(agent => 
    ['Austin', 'Decisive Derek', 'Skeptical Sarah', 'Budget-Conscious Bill', 'Analytical Ashley'].includes(agent.name)
  )

  // Sales rep personas (to learn from)
  const repAgents = agents.filter(agent => 
    ['College Hustle Jake', 'Smooth Talker Marcus', 'Tech Bro Tyler', 'Earnest Ethan', 'Competitive Chase'].includes(agent.name)
  )

  const displayAgents = activeTab === 'customers' ? customerAgents : repAgents

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">Select Training Scenario</h3>
        <p className="text-sm text-slate-400">Choose who you want to practice with</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 p-1 bg-slate-900 rounded-lg">
        <button
          onClick={() => setActiveTab('customers')}
          disabled={disabled}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'customers'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          🏠 Customer Personas
        </button>
        <button
          onClick={() => setActiveTab('reps')}
          disabled={disabled}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'reps'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          👔 Sales Rep Styles
        </button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {displayAgents.map((agent) => {
          const isSelected = selectedAgent?.id === agent.id
          const winRate = agent.persona?.match(/(\d+(?:\.\d+)?)%.*win rate/i)?.[1]
          const threshold = agent.persona?.match(/needs (\d+)\+ to close/i)?.[1]
          const difficulty = threshold ? (
            parseInt(threshold) >= 100 ? 'EXPERT' :
            parseInt(threshold) >= 80 ? 'HARD' :
            parseInt(threshold) >= 70 ? 'MEDIUM' :
            'EASY'
          ) : null

          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent)}
              disabled={disabled}
              className={`text-left p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-950/50'
                  : 'border-slate-700 hover:border-slate-600 bg-slate-900'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800/50'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-white">{agent.name}</h4>
                {isSelected && (
                  <span className="text-blue-400 text-sm">✓ Selected</span>
                )}
              </div>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-2">
                {winRate && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    parseFloat(winRate) >= 70 ? 'bg-green-900 text-green-300' :
                    parseFloat(winRate) >= 60 ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {winRate}% Win Rate
                  </span>
                )}
                {difficulty && (
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    difficulty === 'EXPERT' ? 'bg-purple-900 text-purple-300' :
                    difficulty === 'HARD' ? 'bg-red-900 text-red-300' :
                    difficulty === 'MEDIUM' ? 'bg-orange-900 text-orange-300' :
                    'bg-green-900 text-green-300'
                  }`}>
                    {difficulty}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-slate-400 line-clamp-3">{agent.persona?.split('.')[0]}.</p>
            </button>
          )
        })}
      </div>

      {displayAgents.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          No {activeTab === 'customers' ? 'customer' : 'sales rep'} personas available
        </div>
      )}
    </div>
  )
}
