'use client'

interface SparklineProps {
  data: Array<{ time: number; value: number }>
  width?: number
  height?: number
  color?: string
}

export function Sparkline({ data, width = 50, height = 20, color = '#3b82f6' }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="inline-block" style={{ width, height }}>
        <svg width={width} height={height} className="text-slate-500">
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    )
  }

  // Normalize data to fit sparkline dimensions
  const values = data.map(d => d.value).filter(v => v !== undefined && v !== null)
  if (values.length === 0) {
    return null
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1 // Avoid division by zero

  // Create points for the path
  const points = data.map((d, index) => {
    const x = (index / (data.length - 1 || 1)) * width
    const normalizedValue = (d.value - min) / range
    const y = height - (normalizedValue * height * 0.8) - (height * 0.1) // Add padding
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="inline-block" style={{ width, height }}>
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

