'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Briefcase, Loader2 } from 'lucide-react'

interface IndustrySelectionProps {
  onSelect: (industry: string) => void
  loading?: boolean
}

const industries = [
  { value: 'pest', label: 'Pest Control', icon: '🐛' },
  { value: 'fiber', label: 'Fiber Internet', icon: '📡' },
  { value: 'roofing', label: 'Roofing', icon: '🏠' },
  { value: 'solar', label: 'Solar', icon: '☀️' },
  { value: 'windows', label: 'Windows & Doors', icon: '🪟' },
  { value: 'security', label: 'Home Security', icon: '🛡️' },
]

export function IndustrySelection({ onSelect, loading = false }: IndustrySelectionProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('')

  const handleIndustrySelect = async (industry: string) => {
    setSelectedIndustry(industry)
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase.from('users').update({
          industry_slug: industry,
        }).eq('id', user.id)

        if (error) {
          console.error('Error updating industry:', error)
          throw error
        }
      }

      onSelect(industry)
    } catch (error) {
      console.error('Error in handleIndustrySelect:', error)
      // Still call onSelect to continue flow even if save fails
      onSelect(industry)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Briefcase className="w-8 h-8 text-purple-400" />
        </div>
        <h1 className="font-space text-3xl font-bold text-white mb-3">
          What Industry Are You In?
        </h1>
        <p className="text-white/70">
          We'll customize your training experience based on your industry
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {industries.map((industry) => (
          <button
            key={industry.value}
            onClick={() => handleIndustrySelect(industry.value)}
            disabled={loading}
            className={`p-6 rounded-lg border-2 transition-all text-left ${
              selectedIndustry === industry.value
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{industry.icon}</span>
              <span className="font-space text-lg font-semibold text-white">
                {industry.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 text-white/60">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
    </div>
  )
}
