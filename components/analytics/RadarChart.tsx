'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

interface SkillData {
  skill: string
  value: number
  teamAverage?: number
}

interface RadarChartProps {
  data: SkillData[]
  showTeamAverage: boolean
  animated?: boolean
}

export default function RadarChart({ data, showTeamAverage, animated = false }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [animationProgress, setAnimationProgress] = useState(animated ? 0 : 1)

  useEffect(() => {
    if (animated) {
      let start: number | null = null
      const duration = 1000

      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        setAnimationProgress(progress)
        
        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }, [animated, data])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const size = 300
    canvas.width = size
    canvas.height = size

    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.35
    const levels = 5

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Draw background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.lineWidth = 1

    for (let i = 1; i <= levels; i++) {
      ctx.beginPath()
      const levelRadius = (radius / levels) * i
      
      for (let j = 0; j < data.length; j++) {
        const angle = (Math.PI * 2 * j) / data.length - Math.PI / 2
        const x = centerX + Math.cos(angle) * levelRadius
        const y = centerY + Math.sin(angle) * levelRadius
        
        if (j === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.closePath()
      ctx.stroke()
    }

    // Draw axis lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(x, y)
      ctx.stroke()
    }

    // Draw team average if enabled
    if (showTeamAverage && data.some(d => d.teamAverage !== undefined)) {
      ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()

      for (let i = 0; i < data.length; i++) {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
        const value = (data[i].teamAverage || 0) / 100
        const distance = radius * value * animationProgress
        const x = centerX + Math.cos(angle) * distance
        const y = centerY + Math.sin(angle) * distance
        
        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])
    }

    // Draw data polygon with gradient
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, 'rgba(168, 85, 247, 0.4)')
    gradient.addColorStop(1, 'rgba(236, 72, 153, 0.2)')

    ctx.fillStyle = gradient
    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)'
    ctx.lineWidth = 2.5
    ctx.beginPath()

    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
      const value = data[i].value / 100
      const distance = radius * value * animationProgress
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // Draw points
    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
      const value = data[i].value / 100
      const distance = radius * value * animationProgress
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance
      
      // Point glow
      const pointGradient = ctx.createRadialGradient(x, y, 0, x, y, 8)
      pointGradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)')
      pointGradient.addColorStop(1, 'rgba(236, 72, 153, 0)')
      ctx.fillStyle = pointGradient
      ctx.beginPath()
      ctx.arc(x, y, 8, 0, Math.PI * 2)
      ctx.fill()

      // Point
      ctx.fillStyle = '#ec4899'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    for (let i = 0; i < data.length; i++) {
      const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2
      const labelDistance = radius + 30
      const x = centerX + Math.cos(angle) * labelDistance
      const y = centerY + Math.sin(angle) * labelDistance
      
      // Wrap text if needed
      const words = data[i].skill.split(' ')
      if (words.length > 1) {
        ctx.fillText(words[0], x, y - 6)
        ctx.fillText(words.slice(1).join(' '), x, y + 6)
      } else {
        ctx.fillText(data[i].skill, x, y)
      }

      // Draw value
      ctx.fillStyle = '#e5e7eb'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(`${data[i].value}`, x, y + 18)
    }

  }, [data, showTeamAverage, animationProgress])

  return (
    <div className="flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="max-w-full" />
    </div>
  )
}

