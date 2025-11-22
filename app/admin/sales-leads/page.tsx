'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Mail, Video, Clock, Calendar, ChevronRight, Filter, Plus, LayoutGrid, List, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { CreateLeadModal } from '@/components/admin/CreateLeadModal'

type CRMStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost'

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
  status: CRMStage
  created_at: string
  contacted_at: string | null
  last_contacted_at: string | null
  estimated_value: number | null
  probability: number | null
  expected_close_date: string | null
  notes: string | null
}

const stageConfig = {
  lead: {
    label: 'Lead',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    order: 1
  },
  qualified: {
    label: 'Qualified',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    order: 2
  },
  proposal: {
    label: 'Proposal',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    order: 3
  },
  negotiation: {
    label: 'Negotiation',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    order: 4
  },
  closed_won: {
    label: 'Closed Won',
    color: 'bg-green-50 text-green-700 border-green-200',
    order: 5
  },
  closed_lost: {
    label: 'Closed Lost',
    color: 'bg-red-50 text-red-700 border-red-200',
    order: 6
  }
}

const contactIcons = {
  email: Mail,
  phone: Phone,
  video: Video
}

const stages: CRMStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

export default function SalesLeadsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'pipeline' | 'list'>('pipeline')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('sales_leads')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching leads:', error)
    } else {
      setLeads(data || [])
    }
    
    setLoading(false)
  }

  const updateLeadStatus = async (leadId: string, newStatus: CRMStage) => {
    const supabase = createClient()
    
    const updates: any = { status: newStatus }
    if (newStatus !== 'lead' && !leads.find(l => l.id === leadId)?.last_contacted_at) {
      updates.last_contacted_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('sales_leads')
      .update(updates)
      .eq('id', leadId)
    
    if (!error) {
      fetchLeads()
    }
  }

  const getLeadsByStage = (stage: CRMStage) => {
    return leads.filter(lead => lead.status === stage)
  }

  const getTotalValue = (stageLeads: SalesLead[]) => {
    return stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)
  }

  const getWeightedValue = (stageLeads: SalesLead[]) => {
    return stageLeads.reduce((sum, lead) => {
      const value = lead.estimated_value || 0
      const probability = lead.probability || 0
      return sum + (value * probability / 100)
    }, 0)
  }

  const totalPipelineValue = leads
    .filter(l => !['closed_won', 'closed_lost'].includes(l.status))
    .reduce((sum, lead) => sum + (lead.estimated_value || 0), 0)

  const totalWeightedValue = leads
    .filter(l => !['closed_won', 'closed_lost'].includes(l.status))
    .reduce((sum, lead) => {
      const value = lead.estimated_value || 0
      const probability = lead.probability || 0
      return sum + (value * probability / 100)
    }, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-space font-bold tracking-tight text-gray-900 mb-2">Sales CRM</h1>
              <p className="text-gray-600 font-sans leading-relaxed">Manage your sales pipeline and leads</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('pipeline')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    viewMode === 'pipeline'
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <LayoutGrid className="w-4 h-4 inline mr-1" />
                  Pipeline
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    viewMode === 'list'
                      ? "bg-purple-600 text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <List className="w-4 h-4 inline mr-1" />
                  List
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Pipeline Stats */}
          {viewMode === 'pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1 font-sans">Total Pipeline Value</p>
                <p className="text-2xl font-space font-bold tracking-tight text-gray-900">
                  ${totalPipelineValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1 font-sans">Weighted Value</p>
                <p className="text-2xl font-space font-bold tracking-tight text-gray-900">
                  ${Math.round(totalWeightedValue).toLocaleString()}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                <p className="text-sm text-gray-600 mb-1 font-sans">Active Leads</p>
                <p className="text-2xl font-space font-bold tracking-tight text-gray-900">
                  {leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pipeline View */}
        {viewMode === 'pipeline' ? (
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-max">
              {stages.map((stage) => {
                const stageLeads = getLeadsByStage(stage)
                const config = stageConfig[stage]
                
                return (
                  <div
                    key={stage}
                    className="flex-shrink-0 w-80 bg-white rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className={cn("p-4 border-b border-gray-200", config.color)}>
                      <div className="flex items-center justify-between mb-2">
                      <h3 className="font-space font-semibold">{config.label}</h3>
                      <span className="text-sm font-space font-medium">{stageLeads.length}</span>
                      </div>
                      {stageLeads.length > 0 && (
                        <div className="text-xs mt-1">
                          ${getTotalValue(stageLeads).toLocaleString()} • {stageLeads.filter(l => l.probability).length} with probability
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                      {stageLeads.map((lead) => {
                        const ContactIcon = contactIcons[lead.preferred_contact_method]
                        return (
                          <Link
                            key={lead.id}
                            href={`/admin/sales-leads/${lead.id}`}
                            className="block p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-space font-semibold text-gray-900">{lead.full_name}</h4>
                                <p className="text-sm text-gray-600 font-sans">{lead.company_name}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <ContactIcon className="w-3 h-3" />
                              <span>{lead.job_title}</span>
                            </div>
                            {lead.estimated_value && (
                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
                                <span className="text-sm font-space font-medium text-gray-900">
                                  ${lead.estimated_value.toLocaleString()}
                                </span>
                                {lead.probability && (
                                  <span className="text-xs text-gray-600">
                                    {lead.probability}% prob
                                  </span>
                                )}
                              </div>
                            )}
                          </Link>
                        )
                      })}
                      {stageLeads.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm font-sans">
                          No leads in this stage
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Contact</th>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Company</th>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Stage</th>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Value</th>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Probability</th>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Created</th>
                    <th className="text-left p-4 text-gray-700 font-space font-medium text-sm uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => {
                    const ContactIcon = contactIcons[lead.preferred_contact_method]
                    const config = stageConfig[lead.status]
                    
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-space font-medium text-gray-900">{lead.full_name}</p>
                            <p className="text-sm text-gray-600 font-sans">{lead.job_title}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <a href={`mailto:${lead.work_email}`} className="text-sm text-purple-600 hover:text-purple-700 hover:underline">
                                {lead.work_email}
                              </a>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-space font-medium text-gray-900">{lead.company_name}</p>
                            <p className="text-sm text-gray-600 font-sans">{lead.industry}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={lead.status}
                            onChange={(e) => updateLeadStatus(lead.id, e.target.value as CRMStage)}
                            className={cn(
                              "px-3 py-1 rounded-full text-xs font-medium border bg-white",
                              config.color
                            )}
                          >
                            {stages.map(s => (
                              <option key={s} value={s}>{stageConfig[s].label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-4">
                          {lead.estimated_value ? (
                            <span className="font-space font-medium text-gray-900">
                              ${lead.estimated_value.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {lead.probability ? (
                            <span className="text-gray-900">{lead.probability}%</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-gray-600">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin/sales-leads/${lead.id}`}
                            className="text-purple-600 hover:text-purple-700 flex items-center gap-1 text-sm font-space font-medium"
                          >
                            View <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {leads.length === 0 && (
                <div className="p-12 text-center">
                  <p className="text-gray-600 font-sans">No leads found. Create your first lead to get started.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchLeads}
      />
    </div>
  )
}
