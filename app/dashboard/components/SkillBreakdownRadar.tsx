'use client'

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts'

interface SkillBreakdown {
  opening: number
  objectionHandling: number
  closing: number
  tonality: number
  pace: number
}

interface SkillBreakdownRadarProps {
  data: SkillBreakdown
}

export default function SkillBreakdownRadar({ data }: SkillBreakdownRadarProps) {
  const chartData = [
    { skill: 'Opening', value: data.opening },
    { skill: 'Objections', value: data.objectionHandling },
    { skill: 'Closing', value: data.closing },
    { skill: 'Tonality', value: data.tonality },
    { skill: 'Pace', value: data.pace }
  ]

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="rgba(255,255,255,0.1)" />
          <PolarAngleAxis 
            dataKey="skill" 
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
          />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 100]}
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
          />
          <Radar 
            name="Score" 
            dataKey="value" 
            stroke="#8b5cf6" 
            fill="#8b5cf6" 
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

