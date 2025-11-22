'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Phone, Video, Building, Users, Calendar, Clock, MessageSquare, Target, DollarSign, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  updated_at: string
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
    color: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  qualified: {
    label: 'Qualified',
    color: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  proposal: {
    label: 'Proposal',
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  negotiation: {
    label: 'Negotiation',
    color: 'bg-orange-50 text-orange-700 border-orange-200'
  },
  closed_won: {
    label: 'Closed Won',
    color: 'bg-green-50 text-green-700 border-green-200'
  },
  closed_lost: {
    label: 'Closed Lost',
    color: 'bg-red-50 text-red-700 border-red-200'
  }
}

const stages: CRMStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']

const contactIcons = {
  email: Mail,
  phone: Phone,
  video: Video
}

export default function SalesLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<SalesLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingDeal, setEditingDeal] = useState(false)
  const [dealFields, setDealFields] = useState({
    estimated_value: '',
    probability: '',
    expected_close_date: ''
  })

  useEffect(() => {
    if (params.id) {
      fetchLead(params.id as string)
    }
  }, [params.id])

  const fetchLead = async (id: string) => {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('sales_leads')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Error fetching lead:', error)
      router.push('/admin/sales-leads')
    } else {
      setLead(data)
      setNotes(data.notes || '')
      setDealFields({
        estimated_value: data.estimated_value?.toString() || '',
        probability: data.probability?.toString() || '',
        expected_close_date: data.expected_close_date || ''
      })
    }
    
    setLoading(false)
  }

  const updateLeadStatus = async (newStatus: CRMStage) => {
    if (!lead) return
    
    const supabase = createClient()
    
    const updates: any = { status: newStatus }
    if (newStatus !== 'lead' && !lead.last_contacted_at) {
      updates.last_contacted_at = new Date().toISOString()
    }
    
    const { error } = await supabase
      .from('sales_leads')
      .update(updates)
      .eq('id', lead.id)
    
    if (!error) {
      fetchLead(lead.id)
    }
  }

  const saveNotes = async () => {
    if (!lead) return
    
    setSavingNotes(true)
    const supabase = createClient()
    
    const { error } = await supabase
      .from('sales_leads')
      .update({ notes })
      .eq('id', lead.id)
    
    if (!error) {
      setLead({ ...lead, notes })
    }
    
    setSavingNotes(false)
  }

  const saveDealInfo = async () => {
    if (!lead) return
    
    const supabase = createClient()
    
    const { error } = await supabase
      .from('sales_leads')
      .update({
        estimated_value: dealFields.estimated_value ? parseFloat(dealFields.estimated_value) : null,
        probability: dealFields.probability ? parseInt(dealFields.probability) : null,
        expected_close_date: dealFields.expected_close_date || null
      })
      .eq('id', lead.id)
    
    if (!error) {
      setEditingDeal(false)
      fetchLead(lead.id)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!lead) {
    return null
  }

  const ContactIcon = contactIcons[lead.preferred_contact_method]
  const config = stageConfig[lead.status]
  const weightedValue = lead.estimated_value && lead.probability 
    ? (lead.estimated_value * lead.probability / 100)
    : null

  return (
    <div className="min-h-screen bg-gray-50 px-6 pb-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/sales-leads"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors font-sans"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CRM
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-space font-bold tracking-tight text-gray-900 mb-2">{lead.full_name}</h1>
              <p className="text-gray-600 font-sans leading-relaxed">{lead.job_title} at {lead.company_name}</p>
            </div>
            
            <select
              value={lead.status}
              onChange={(e) => updateLeadStatus(e.target.value as CRMStage)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border bg-white",
                config.color
              )}
            >
              {stages.map(s => (
                <option key={s} value={s}>{stageConfig[s].label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-space font-semibold tracking-tight text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Deal Information
              </h2>
                {!editingDeal && (
                  <button
                    onClick={() => setEditingDeal(true)}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {editingDeal ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-space font-medium text-gray-700 mb-1">
                        Estimated Value ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={dealFields.estimated_value}
                        onChange={(e) => setDealFields({ ...dealFields, estimated_value: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-space font-medium text-gray-700 mb-1">
                        Probability (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={dealFields.probability}
                        onChange={(e) => setDealFields({ ...dealFields, probability: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-space font-medium text-gray-700 mb-1">
                        Expected Close Date
                      </label>
                      <input
                        type="date"
                        value={dealFields.expected_close_date}
                        onChange={(e) => setDealFields({ ...dealFields, expected_close_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingDeal(false)
                        setDealFields({
                          estimated_value: lead.estimated_value?.toString() || '',
                          probability: lead.probability?.toString() || '',
                          expected_close_date: lead.expected_close_date || ''
                        })
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveDealInfo}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Value</p>
                    <p className="text-lg font-space font-semibold tracking-tight text-gray-900">
                      {lead.estimated_value ? `$${lead.estimated_value.toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-sans">Probability</p>
                    <p className="text-lg font-space font-semibold tracking-tight text-gray-900">
                      {lead.probability ? `${lead.probability}%` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 font-sans">Expected Close Date</p>
                    <p className="text-lg font-space font-semibold tracking-tight text-gray-900">
                      {lead.expected_close_date 
                        ? new Date(lead.expected_close_date).toLocaleDateString()
                        : '—'}
                    </p>
                  </div>
                  {weightedValue && (
                    <div className="md:col-span-3 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <p className="text-sm text-gray-600 font-sans">Weighted Value:</p>
                        <p className="text-lg font-space font-semibold tracking-tight text-purple-600">
                          ${Math.round(weightedValue).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-space font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-600" />
                Contact Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <a href={`mailto:${lead.work_email}`} className="text-purple-600 hover:text-purple-700 hover:underline">
                    {lead.work_email}
                  </a>
                </div>
                
                {lead.phone_number && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <a href={`tel:${lead.phone_number}`} className="text-gray-900 hover:text-purple-600">
                      {lead.phone_number}
                    </a>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Preferred Contact Method</p>
                  <div className="flex items-center gap-2">
                    <ContactIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 capitalize">{lead.preferred_contact_method}</span>
                  </div>
                </div>
                
                {lead.best_time_to_reach && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Best Time to Reach</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900">{lead.best_time_to_reach} {lead.timezone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-space font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-purple-600" />
                Company Details
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company Name</p>
                  <p className="text-gray-900 font-space font-medium">{lead.company_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Industry</p>
                  <p className="text-gray-900">{lead.industry}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Team Size</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 font-space font-medium">{lead.number_of_reps} sales reps</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Needs & Interest */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-space font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                Needs & Interest
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">How They Found Us</p>
                  <p className="text-gray-900">{lead.how_did_you_hear}</p>
                </div>
                
                {lead.primary_use_case && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Primary Use Case</p>
                    <p className="text-gray-900">{lead.primary_use_case}</p>
                  </div>
                )}
                
                {lead.additional_comments && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Additional Comments</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{lead.additional_comments}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-space font-semibold tracking-tight text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                Internal Notes
              </h2>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                placeholder="Add notes about this lead..."
              />
              
              <button
                onClick={saveNotes}
                disabled={savingNotes || notes === lead.notes}
                className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-space font-semibold tracking-tight text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <a
                  href={`mailto:${lead.work_email}`}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Send Email
                </a>
                
                {lead.phone_number && (
                  <a
                    href={`tel:${lead.phone_number}`}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                )}
                
                <button
                  onClick={() => updateLeadStatus('qualified')}
                  disabled={lead.status === 'qualified'}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-purple-100 hover:bg-purple-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-purple-700 rounded-lg font-medium transition-all"
                >
                  <Target className="w-5 h-5" />
                  Mark as Qualified
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-space font-semibold tracking-tight text-gray-900 mb-4">Timeline</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="text-gray-900 font-space font-medium">
                    {new Date(lead.created_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                {lead.last_contacted_at && (
                  <div>
                    <p className="text-sm text-gray-600">Last Contacted</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(lead.last_contacted_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(lead.updated_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
