interface KeyMomentFlagProps {
  label: string
  active: boolean
}

export function KeyMomentFlag({ label, active }: KeyMomentFlagProps) {
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
      active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
    }`}>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-400'}`} />
      <span>{label}</span>
    </div>
  )
}
