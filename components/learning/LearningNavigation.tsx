'use client'

import Link from 'next/link'
import { BookOpen, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LearningNavigationProps {
  currentPage?: 'modules' | 'objections' | 'home'
}

export function LearningNavigation({ currentPage = 'home' }: LearningNavigationProps) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <Link
        href="/learning/modules"
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors font-space',
          currentPage === 'modules'
            ? 'bg-purple-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        )}
      >
        <BookOpen className="w-4 h-4" />
        Modules
      </Link>
      <Link
        href="/learning/objections"
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors font-space',
          currentPage === 'objections'
            ? 'bg-red-600 text-white'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        )}
      >
        <AlertCircle className="w-4 h-4" />
        Objections
      </Link>
    </div>
  )
}


