'use client'

export function MetricsGrid({ metrics }: { metrics: {
  totalTurns: number
  durationSeconds: number
  questions: number
  objections: { raised: number; resolved: number }
  interruptions: number
  fillers: number
  rapport: number
  closeAttempted: boolean
} }) {
  const items = [
    { label: 'Total Turns', value: metrics.totalTurns },
    { label: 'Duration', value: formatDuration(metrics.durationSeconds) },
    { label: 'Questions Asked', value: metrics.questions },
    { label: 'Objections', value: `${metrics.objections.raised} raised, ${metrics.objections.resolved} resolved` },
    { label: 'Interruptions', value: metrics.interruptions },
    { label: 'Filler Words', value: metrics.fillers },
    { label: 'Rapport Score', value: `${metrics.rapport}/20` },
    { label: 'Close Attempted', value: metrics.closeAttempted ? 'Yes' : 'No' },
  ]
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((it) => (
        <div key={it.label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">{it.label}</div>
          <div className="text-slate-100 text-xl font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  )
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}


