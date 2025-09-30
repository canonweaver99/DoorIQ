'use client'

export function SentimentTimeline({ sentiment }: { sentiment: string }) {
  const stages = sentiment?.split('→').map(s => s.trim()).filter(Boolean) || []
  const colors: Record<string, string> = {
    hostile: 'bg-red-600',
    neutral: 'bg-yellow-600',
    interested: 'bg-blue-600',
    committed: 'bg-emerald-600',
  }
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5">
      <div className="text-slate-200 font-semibold mb-3">Sentiment Progression</div>
      <div className="flex items-center gap-2">
        {stages.map((s, i) => (
          <div key={i} className={`px-3 py-1 rounded text-white text-sm ${colors[s.toLowerCase()] || 'bg-slate-600'}`}>{s}</div>
        ))}
      </div>
    </div>
  )
}


