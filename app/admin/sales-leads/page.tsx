'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Phone, Mail, Video, Clock, Calendar, ChevronRight, Filter, Plus, LayoutGrid, List, DollarSign, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { CreateLeadModal } from '@/components/admin/CreateLeadModal'
import { useIsMobile } from '@/hooks/useIsMobile'

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
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    order: 1
  },
  qualified: {
    label: 'Qualified',
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    order: 2
  },
  proposal: {
    label: 'Proposal',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    order: 3
  },
  negotiation: {
    label: 'Negotiation',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    order: 4
  },
  closed_won: {
    label: 'Closed Won',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    order: 5
  },
  closed_lost: {
    label: 'Closed Lost',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
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
  const [expandedStages, setExpandedStages] = useState<Set<CRMStage>>(new Set(['lead', 'qualified']))
  const isMobile = useIsMobile()

  const toggleStage = (stage: CRMStage) => {
    const newExpanded = new Set(expandedStages)
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage)
    } else {
      newExpanded.add(stage)
    }
    setExpandedStages(newExpanded)
  }

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-space font-bold tracking-tight text-white mb-2">Sales CRM</h1>
              <p className="text-sm sm:text-base text-[#a0a0a0] font-sans leading-relaxed">Manage your sales pipeline and leads</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!isMobile && (
                <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('pipeline')}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      viewMode === 'pipeline'
                        ? "bg-purple-600 text-white"
                        : "text-[#a0a0a0] hover:bg-[#2a2a2a]"
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
                        : "text-[#a0a0a0] hover:bg-[#2a2a2a]"
                    )}
                  >
                    <List className="w-4 h-4 inline mr-1" />
                    List
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2.5 sm:py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2 min-h-[44px] sm:min-h-0"
              >
                <Plus className="w-5 h-5" />
                Add Lead
              </button>
            </div>
          </div>

          {/* Pipeline Stats */}
          {viewMode === 'pipeline' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] shadow-sm">
                <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 font-sans">Total Pipeline Value</p>
                <p className="text-xl sm:text-2xl font-space font-bold tracking-tight text-white">
                  ${totalPipelineValue.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] shadow-sm">
                <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 font-sans">Weighted Value</p>
                <p className="text-xl sm:text-2xl font-space font-bold tracking-tight text-white">
                  ${Math.round(totalWeightedValue).toLocaleString()}
                </p>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] shadow-sm">
                <p className="text-xs sm:text-sm text-[#a0a0a0] mb-1 font-sans">Active Leads</p>
                <p className="text-xl sm:text-2xl font-space font-bold tracking-tight text-white">
                  {leads.filter(l => !['closed_won', 'closed_lost'].includes(l.status)).length}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pipeline View */}
        {viewMode === 'pipeline' ? (
          isMobile ? (
            /* Mobile Accordion View */
            <div className="space-y-3">
              {stages.map((stage) => {
                const stageLeads = getLeadsByStage(stage)
                const config = stageConfig[stage]
                const isExpanded = expandedStages.has(stage)
                
                return (
                  <div
                    key={stage}
                    className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm overflow-hidden"
                  >
                    <button
                      onClick={() => toggleStage(stage)}
                      className={cn("w-full p-4 border-b border-[#2a2a2a] flex items-center justify-between", config.color)}
                    >
                      <div className="flex items-center gap-3">
                        <h3 className="font-space font-semibold">{config.label}</h3>
                        <span className="text-sm font-space font-medium bg-white/10 px-2 py-0.5 rounded">
                          {stageLeads.length}
                        </span>
                        {stageLeads.length > 0 && (
                          <span className="text-xs opacity-80">
                            ${getTotalValue(stageLeads).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                    </button>
                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        {stageLeads.map((lead) => {
                          const ContactIcon = contactIcons[lead.preferred_contact_method]
                          return (
                            <Link
                              key={lead.id}
                              href={`/admin/sales-leads/${lead.id}`}
                              className="block p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 hover:shadow-md transition-all"
                            >
                              <div className="mb-2">
                                <h4 className="font-space font-semibold text-white mb-1">{lead.full_name}</h4>
                                <p className="text-sm text-[#a0a0a0] font-sans">{lead.company_name}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#666] mb-2">
                                <ContactIcon className="w-3 h-3" />
                                <span>{lead.job_title}</span>
                              </div>
                              {lead.estimated_value && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
                                  <span className="text-sm font-space font-medium text-white">
                                    ${lead.estimated_value.toLocaleString()}
                                  </span>
                                  {lead.probability && (
                                    <span className="text-xs text-[#a0a0a0]">
                                      {lead.probability}% prob
                                    </span>
                                  )}
                                </div>
                              )}
                            </Link>
                          )
                        })}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8 text-[#666] text-sm font-sans">
                            No leads in this stage
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            /* Desktop Horizontal Scroll View */
            <div className="overflow-x-auto pb-4">
              <div className="flex gap-4 min-w-max">
                {stages.map((stage) => {
                  const stageLeads = getLeadsByStage(stage)
                  const config = stageConfig[stage]
                  
                  return (
                    <div
                      key={stage}
                      className="flex-shrink-0 w-80 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm"
                    >
                      <div className={cn("p-4 border-b border-[#2a2a2a]", config.color)}>
                        <div className="flex items-center justify-between mb-2">
                        <h3 className="font-space font-semibold">{config.label}</h3>
                        <span className="text-sm font-space font-medium">{stageLeads.length}</span>
                        </div>
                        {stageLeads.length > 0 && (
                          <div className="text-xs mt-1 opacity-80">
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
                              className="block p-4 bg-[#0a0a0a] rounded-lg border border-[#2a2a2a] hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h4 className="font-space font-semibold text-white">{lead.full_name}</h4>
                                  <p className="text-sm text-[#a0a0a0] font-sans">{lead.company_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-[#666] mb-2">
                                <ContactIcon className="w-3 h-3" />
                                <span>{lead.job_title}</span>
                              </div>
                              {lead.estimated_value && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#2a2a2a]">
                                  <span className="text-sm font-space font-medium text-white">
                                    ${lead.estimated_value.toLocaleString()}
                                  </span>
                                  {lead.probability && (
                                    <span className="text-xs text-[#a0a0a0]">
                                      {lead.probability}% prob
                                    </span>
                                  )}
                                </div>
                              )}
                            </Link>
                          )
                        })}
                        {stageLeads.length === 0 && (
                          <div className="text-center py-8 text-[#666] text-sm font-sans">
                            No leads in this stage
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        ) : (
          /* List View */
          isMobile ? (
            /* Mobile Card View */
            <div className="space-y-3">
              {leads.map((lead) => {
                const ContactIcon = contactIcons[lead.preferred_contact_method]
                const config = stageConfig[lead.status]
                
                return (
                  <Link
                    key={lead.id}
                    href={`/admin/sales-leads/${lead.id}`}
                    className="block bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] p-4 hover:border-purple-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-space font-semibold text-white mb-1 truncate">{lead.full_name}</h3>
                        <p className="text-sm text-[#a0a0a0] font-sans truncate">{lead.company_name}</p>
                        <div className="flex items-center gap-2 text-xs text-[#666] mt-1">
                          <ContactIcon className="w-3 h-3" />
                          <span>{lead.job_title}</span>
                        </div>
                      </div>
                      <select
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation()
                          updateLeadStatus(lead.id, e.target.value as CRMStage)
                        }}
                        value={lead.status}
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium border bg-[#0a0a0a] text-white min-h-[32px]",
                          config.color
                        )}
                      >
                        {stages.map(s => (
                          <option key={s} value={s}>{stageConfig[s].label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-[#2a2a2a]">
                      <div className="flex flex-col gap-1">
                        {lead.estimated_value && (
                          <div className="text-sm font-space font-medium text-white">
                            ${lead.estimated_value.toLocaleString()}
                          </div>
                        )}
                        {lead.probability && (
                          <div className="text-xs text-[#a0a0a0]">
                            {lead.probability}% probability
                          </div>
                        )}
                        <div className="text-xs text-[#a0a0a0] font-sans">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center text-purple-400 font-space font-medium">
                        View
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </div>
                  </Link>
                )
              })}
              {leads.length === 0 && (
                <div className="p-12 text-center bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
                  <p className="text-[#a0a0a0] font-sans">No leads found. Create your first lead to get started.</p>
                </div>
              )}
            </div>
          ) : (
            /* Desktop Table View */
            <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
                    <tr>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Contact</th>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Company</th>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Stage</th>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Value</th>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Probability</th>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Created</th>
                      <th className="text-left p-4 text-[#a0a0a0] font-space font-medium text-sm uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2a2a2a]">
                    {leads.map((lead) => {
                      const ContactIcon = contactIcons[lead.preferred_contact_method]
                      const config = stageConfig[lead.status]
                      
                      return (
                        <tr key={lead.id} className="hover:bg-[#0a0a0a] transition-colors">
                          <td className="p-4">
                            <div>
                              <p className="font-space font-medium text-white">{lead.full_name}</p>
                              <p className="text-sm text-[#a0a0a0] font-sans">{lead.job_title}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <a href={`mailto:${lead.work_email}`} className="text-sm text-purple-400 hover:text-purple-300 hover:underline">
                                  {lead.work_email}
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <p className="font-space font-medium text-white">{lead.company_name}</p>
                              <p className="text-sm text-[#a0a0a0] font-sans">{lead.industry}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            <select
                              value={lead.status}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value as CRMStage)}
                              className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium border bg-[#0a0a0a] text-white",
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
                              <span className="font-space font-medium text-white">
                                ${lead.estimated_value.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[#666]">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            {lead.probability ? (
                              <span className="text-white">{lead.probability}%</span>
                            ) : (
                              <span className="text-[#666]">—</span>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-[#a0a0a0]">
                              {new Date(lead.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/admin/sales-leads/${lead.id}`}
                              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm font-space font-medium min-h-[44px] items-center"
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
                    <p className="text-[#a0a0a0] font-sans">No leads found. Create your first lead to get started.</p>
                  </div>
                )}
              </div>
            </div>
          )
        )}
      </div>

      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchLeads()
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}
