'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ReportsList, ReportDefinition } from '@/components/settings/ReportsList'
import { Download, Calendar, Users, TrendingUp, Award, DollarSign, FileText } from 'lucide-react'

const availableReports: ReportDefinition[] = [
  {
    id: 'monthly-analytics',
    name: 'Monthly Analytics Summary',
    description: 'Comprehensive monthly performance metrics including sessions, scores, and team averages',
    icon: Calendar,
    type: 'monthly-analytics',
    availableFor: ['manager', 'rep'],
    dateRange: 'monthly'
  },
  {
    id: 'weekly-analytics',
    name: 'Weekly Analytics Summary',
    description: 'Weekly performance overview with session counts and score trends',
    icon: Calendar,
    type: 'weekly-analytics',
    availableFor: ['manager', 'rep'],
    dateRange: 'weekly'
  },
  {
    id: 'session-report',
    name: 'Individual Session Reports',
    description: 'Detailed breakdown of your training sessions with scores and feedback',
    icon: FileText,
    type: 'session-report',
    availableFor: ['rep']
  },
  {
    id: 'team-performance',
    name: 'Team Performance Report',
    description: 'Compare performance across all team members with skill breakdowns',
    icon: Users,
    type: 'team-performance',
    availableFor: ['manager'],
    dateRange: 'monthly'
  },
  {
    id: 'rep-comparison',
    name: 'Rep Performance Comparison',
    description: 'Side-by-side comparison of rep performance metrics and trends',
    icon: TrendingUp,
    type: 'rep-comparison',
    availableFor: ['manager'],
    dateRange: 'monthly'
  },
  {
    id: 'skill-breakdown',
    name: 'Skill Breakdown Report',
    description: 'Detailed analysis of rapport, discovery, objection handling, and closing skills',
    icon: Award,
    type: 'skill-breakdown',
    availableFor: ['manager', 'rep'],
    dateRange: 'monthly'
  },
  {
    id: 'revenue-earnings',
    name: 'Revenue & Earnings Report',
    description: 'Track revenue, sales, and earnings across your team or personal performance',
    icon: DollarSign,
    type: 'revenue-earnings',
    availableFor: ['manager', 'rep'],
    dateRange: 'monthly'
  }
]

export default function ReportsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'manager' | 'rep' | 'admin'>('rep')

  useEffect(() => {
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role) {
        setUserRole(userData.role as 'manager' | 'rep' | 'admin')
      }
    } catch (err) {
      console.error('Error fetching user role:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-8">
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-white" />
          <h2 className="text-2xl font-semibold text-white font-space">Download Reports</h2>
        </div>
        <p className="text-sm text-[#a0a0a0] font-sans mb-6">
          Generate and download comprehensive reports of your performance analytics. 
          Available reports vary based on your role.
        </p>
        <div className="flex items-center gap-2 text-xs text-[#666] font-sans">
          <span className="px-2 py-1 rounded bg-[#0a0a0a] border border-[#2a2a2a] capitalize">
            {userRole === 'admin' ? 'Manager' : userRole}
          </span>
          <span>•</span>
          <span>Reports are generated on-demand</span>
        </div>
      </div>

      <ReportsList reports={availableReports} userRole={userRole} />
    </div>
  )
}

