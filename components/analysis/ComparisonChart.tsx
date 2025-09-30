'use client'

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

export function ComparisonChart({ score }: { score: number }) {
  const data = [
    { metric: 'You', value: score },
    { metric: 'Your Avg', value: Math.max(10, score - 8) },
    { metric: 'Top Performer', value: Math.min(100, score + 12) },
  ]
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <div className="text-slate-200 font-semibold mb-3">Comparison</div>
      <div className="h-64">
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius={90}>
            <PolarGrid />
            <PolarAngleAxis dataKey="metric" stroke="#94a3b8" />
            <PolarRadiusAxis stroke="#334155" />
            <Radar name="Score" dataKey="value" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}


