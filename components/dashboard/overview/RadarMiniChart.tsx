'use client'

interface RadarMiniChartProps {
  data: {
    rapport: number
    discovery: number
    objections: number
    closing: number
  }
  size?: number
}

export default function RadarMiniChart({ data, size = 40 }: RadarMiniChartProps) {
  const center = size / 2
  const radius = size / 2 - 2
  const maxValue = 100

  // Calculate points for each skill
  const angles = [0, 90, 180, 270] // degrees for 4 points
  const values = [data.rapport, data.discovery, data.objections, data.closing]
  
  const points = angles.map((angle, index) => {
    const radian = (angle - 90) * (Math.PI / 180)
    const value = values[index]
    const r = (value / maxValue) * radius
    const x = center + r * Math.cos(radian)
    const y = center + r * Math.sin(radian)
    return `${x},${y}`
  }).join(' ')

  // Background grid circles
  const gridCircles = [0.25, 0.5, 0.75, 1].map(scale => radius * scale)

  return (
    <svg width={size} height={size} className="inline-block">
      {/* Background grid */}
      {gridCircles.map((r, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.5"
        />
      ))}
      
      {/* Data polygon */}
      <polygon
        points={points}
        fill="rgba(139, 92, 246, 0.2)"
        stroke="#8B5CF6"
        strokeWidth="1"
      />
      
      {/* Center dot */}
      <circle cx={center} cy={center} r="1" fill="#8B5CF6" />
    </svg>
  )
}

