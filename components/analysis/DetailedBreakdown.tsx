'use client'

export function DetailedBreakdown({ grading, ai }: { grading: any; ai: any }) {
  const sections = [
    { key: 'opening_introduction', label: 'Opening & Introduction', max: 15 },
    { key: 'rapport_building', label: 'Rapport Building', max: 20 },
    { key: 'needs_discovery', label: 'Needs Discovery', max: 15 },
    { key: 'value_communication', label: 'Value Communication', max: 15 },
    { key: 'objection_handling', label: 'Objection Handling', max: 20 },
    { key: 'closing', label: 'Closing', max: 15 },
  ] as const
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl">
      <div className="divide-y divide-slate-700">
        {sections.map((s) => {
          const points = grading.categories[s.key as keyof typeof grading.categories] || 0
          const reasoning = ai?.grading?.[s.key]?.reasoning || ''
          return (
            <details key={s.key} className="p-5">
              <summary className="cursor-pointer text-slate-200 font-semibold flex items-center justify-between">
                <span>{s.label}</span>
                <span className="text-slate-400">{points}/{s.max}</span>
              </summary>
              <div className="mt-3 text-slate-300">
                {reasoning}
              </div>
            </details>
          )
        })}
      </div>
    </div>
  )
}


