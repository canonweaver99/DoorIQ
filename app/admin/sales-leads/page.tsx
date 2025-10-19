'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Mail, Video, Clock, Calendar, ChevronRight, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SalesLead {
  id: string
  full_name: string
  work_email: string
  phone_number: string | null
  job_title: string
  company_name: string
  industry: string
  number_of_reps: number
  primary_use_case: string | null
  how_did_you_hear: string
  preferred_contact_method: 'email' | 'phone' | 'video'
  best_time_to_reach: string | null
  timezone: string
  additional_comments: string | null
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
  created_at: string
  contacted_at: string | null
}

const statusColors = {
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contacted: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  qualified: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  converted: 'bg-green-500/10 text-green-400 border-green-500/20',
  lost: 'bg-red-500/10 text-red-400 border-red-500/20'
}

const contactIcons = {
  email: Mail,
  phone: Phone,
  video: Video
}

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'company' | 'reps'>('newest')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    const supabase = createClient()
    
    let query = supabase
      .from('sales_leads')
      .select('*')
    
    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sortBy === 'company') {
      query = query.order('company_name', { ascending: true })
    } else if (sortBy === 'reps') {
      query = query.order('number_of_reps', { ascending: false })
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Error fetching leads:', error)
    } else {
      setLeads(data || [])
    }
    
    setLoading(false)
  }

  const updateLeadStatus = async (leadId: string, newStatus: SalesLead['status']) => {
    const supabase = createClient()
    
    const updates: any = { status: newStatus }
    if (newStatus === 'contacted' && !leads.find(l => l.id === leadId)?.contacted_at) {
      updates.contacted_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('sales_leads')
      .update(updates)
      .eq('id', leadId)
    
    if (!error) {
      fetchLeads()
    }
  }

  const filteredLeads = leads.filter(lead => {
    if (filter === 'all') return true
    return lead.status === filter
  })

  const getTimeSinceSubmission = (createdAt: string) => {
    const now = new Date()
    const submitted = new Date(createdAt)
    const diffMs = now.getTime() - submitted.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else {
      return 'Just now'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Sales Leads</h1>
          <p className="text-slate-400">Manage and track your sales inquiries</p>
        </div>

        {/* Filters and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Stats Cards */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Total Leads</p>
            <p className="text-3xl font-bold text-white">{leads.length}</p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">New This Week</p>
            <p className="text-3xl font-bold text-white">
              {leads.filter(l => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(l.created_at) > weekAgo
              }).length}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Qualified Leads</p>
            <p className="text-3xl font-bold text-white">
              {leads.filter(l => l.status === 'qualified').length}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
            <p className="text-slate-400 text-sm mb-1">Total Reps</p>
            <p className="text-3xl font-bold text-white">
              {leads.reduce((sum, lead) => sum + lead.number_of_reps, 0)}
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400">Filter by status:</span>
          </div>
          
          <div className="flex gap-2">
            {['all', 'new', 'contacted', 'qualified', 'converted', 'lost'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  filter === status
                    ? "bg-primary text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 text-xs opacity-70">
                    ({leads.filter(l => l.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
          
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-400 text-sm">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-800 text-white rounded-lg px-3 py-2 text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="company">Company Name</option>
              <option value="reps">Number of Reps</option>
            </select>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-medium">Contact</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Company</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Details</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Submitted</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const ContactIcon = contactIcons[lead.preferred_contact_method]
                  
                  return (
                    <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white">{lead.full_name}</p>
                          <p className="text-sm text-slate-400">{lead.job_title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <a href={`mailto:${lead.work_email}`} className="text-sm text-primary hover:underline">
                              {lead.work_email}
                            </a>
                            {lead.phone_number && (
                              <a href={`tel:${lead.phone_number}`} className="text-sm text-slate-400 hover:text-white">
                                {lead.phone_number}
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-white">{lead.company_name}</p>
                          <p className="text-sm text-slate-400">{lead.industry}</p>
                          <p className="text-sm text-slate-400">{lead.number_of_reps} reps</p>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <ContactIcon className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-400">Prefers {lead.preferred_contact_method}</span>
                          </div>
                          {lead.best_time_to_reach && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <span className="text-sm text-slate-400">{lead.best_time_to_reach} {lead.timezone}</span>
                            </div>
                          )}
                          <p className="text-sm text-slate-400">Source: {lead.how_did_you_hear}</p>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as any)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium border",
                            statusColors[lead.status]
                          )}
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="converted">Converted</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      
                      <td className="p-4">
                        <div className="text-sm text-slate-400">
                          <p>{getTimeSinceSubmission(lead.created_at)}</p>
                          <p className="text-xs">{new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                      </td>
                      
                      <td className="p-4">
                        <Link
                          href={`/admin/sales-leads/${lead.id}`}
                          className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm font-medium"
                        >
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            
            {filteredLeads.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-slate-400">No leads found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
