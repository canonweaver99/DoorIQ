'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, TrendingUp, Clock, Target, Download, Filter,
  BarChart3, Activity, AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'

interface TeamMember {
  id: string
  full_name: string
  rep_id: string
  sessions_count: number
  average_score: number
  last_session: string
  improvement_trend: number
}

interface TeamStats {
  total_members: number
  active_today: number
  average_score: number
  total_sessions: number
}

export default function AdminDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats>({
    total_members: 0,
    active_today: 0,
    average_score: 0,
    total_sessions: 0
  })
  const [performanceData, setPerformanceData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('week')
  const [sortBy, setSortBy] = useState<'score' | 'sessions' | 'recent'>('score')
  
  const supabase = createClient()

  useEffect(() => {
    fetchTeamData()
    fetchPerformanceData()
  }, [dateRange, sortBy])

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      // In production, this would fetch real data based on team_id
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          full_name: 'Sarah Johnson',
          rep_id: 'REP-001',
          sessions_count: 52,
          average_score: 82,
          last_session: new Date().toISOString(),
          improvement_trend: 15
        },
        {
          id: '2',
          full_name: 'Mike Chen',
          rep_id: 'REP-002',
          sessions_count: 48,
          average_score: 85,
          last_session: new Date(Date.now() - 86400000).toISOString(),
          improvement_trend: -5
        },
        {
          id: '3',
          full_name: 'Alex Rivera',
          rep_id: 'REP-003',
          sessions_count: 45,
          average_score: 88,
          last_session: new Date(Date.now() - 172800000).toISOString(),
          improvement_trend: 20
        },
        {
          id: '4',
          full_name: 'Emma Davis',
          rep_id: 'REP-004',
          sessions_count: 38,
          average_score: 75,
          last_session: new Date().toISOString(),
          improvement_trend: 10
        }
      ]

      // Sort team members
      const sorted = [...mockTeamMembers].sort((a, b) => {
        switch (sortBy) {
          case 'score':
            return b.average_score - a.average_score
          case 'sessions':
            return b.sessions_count - a.sessions_count
          case 'recent':
            return new Date(b.last_session).getTime() - new Date(a.last_session).getTime()
          default:
            return 0
        }
      })

      setTeamMembers(sorted)

      // Calculate team stats
      const today = new Date().toDateString()
      const activeToday = mockTeamMembers.filter(
        m => new Date(m.last_session).toDateString() === today
      ).length

      setTeamStats({
        total_members: mockTeamMembers.length,
        active_today: activeToday,
        average_score: Math.round(
          mockTeamMembers.reduce((sum, m) => sum + m.average_score, 0) / mockTeamMembers.length
        ),
        total_sessions: mockTeamMembers.reduce((sum, m) => sum + m.sessions_count, 0)
      })
    } catch (error) {
      console.error('Error fetching team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPerformanceData = async () => {
    // Mock performance data for charts
    const days = dateRange === 'week' ? 7 : 30
    const data = Array.from({ length: days }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))
      return {
        date: format(date, 'MMM d'),
        avgScore: 70 + Math.random() * 20,
        sessions: Math.floor(Math.random() * 20) + 10
      }
    })
    setPerformanceData(data)
  }

  const exportData = () => {
    // In production, this would generate a CSV file
    alert('Exporting team data...')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Team Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor and manage your sales team&apos;s performance</p>
          </div>
          <button
            onClick={exportData}
            className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Team Members"
            value={teamStats.total_members}
            icon={<Users className="w-6 h-6 text-blue-500" />}
            trend={`${teamStats.active_today} active today`}
          />
          <StatCard
            title="Team Average"
            value={`${teamStats.average_score}%`}
            icon={<Target className="w-6 h-6 text-green-500" />}
            trend="+5% from last week"
            positive
          />
          <StatCard
            title="Total Sessions"
            value={teamStats.total_sessions}
            icon={<Activity className="w-6 h-6 text-purple-500" />}
            trend="This month"
          />
          <StatCard
            title="Practice Time"
            value="156h"
            icon={<Clock className="w-6 h-6 text-orange-500" />}
            trend="23h this week"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Performance Trend</h2>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="avgScore" 
                  stroke="#3B82F6" 
                  name="Average Score"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Sessions</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sessions" fill="#10B981" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Members Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
                >
                  <option value="score">Sort by Score</option>
                  <option value="sessions">Sort by Sessions</option>
                  <option value="recent">Sort by Recent Activity</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8">
              <div className="animate-pulse space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Team Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trend
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.full_name}
                          </div>
                          <div className="text-sm text-gray-500">{member.rep_id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {member.sessions_count}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {member.average_score}%
                          </span>
                          {member.average_score >= 80 && (
                            <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Top
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center text-sm ${
                          member.improvement_trend > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`w-4 h-4 mr-1 ${
                            member.improvement_trend < 0 ? 'rotate-180' : ''
                          }`} />
                          {Math.abs(member.improvement_trend)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(member.last_session), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(member.last_session).toDateString() === new Date().toDateString() ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts Section */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Performance Alert</h3>
              <p className="text-sm text-yellow-700 mt-1">
                3 team members haven&apos;t practiced in over 3 days. Consider sending reminders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  positive 
}: { 
  title: string
  value: string | number
  icon: React.ReactNode
  trend: string
  positive?: boolean 
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-500 text-sm">{title}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className={`text-sm mt-1 ${positive ? 'text-green-600' : 'text-gray-500'}`}>
        {trend}
      </p>
    </div>
  )
}
