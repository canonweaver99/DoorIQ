import React from 'react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'green' | 'yellow' | 'red'
}

export function MetricCard({ title, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <div className={`rounded-lg p-3 border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">{title}</span>
        {icon}
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  )
}
