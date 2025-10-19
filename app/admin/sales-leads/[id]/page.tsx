'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Phone, Video, Building, Users, Calendar, Clock, MessageSquare, Target } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
  updated_at: string
  contacted_at: string | null
  notes: string | null
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

export default function SalesLeadDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [lead, setLead] = useState<SalesLead | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

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
    }
    
    setLoading(false)
  }

  const updateLeadStatus = async (newStatus: SalesLead['status']) => {
    if (!lead) return
    
    const supabase = createClient()
    
    const updates: any = { status: newStatus }
    if (newStatus === 'contacted' && !lead.contacted_at) {
      updates.contacted_at = new Date().toISOString()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!lead) {
    return null
  }

  const ContactIcon = contactIcons[lead.preferred_contact_method]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin/sales-leads"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sales Leads
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{lead.full_name}</h1>
              <p className="text-slate-400">{lead.job_title} at {lead.company_name}</p>
            </div>
            
            <select
              value={lead.status}
              onChange={(e) => updateLeadStatus(e.target.value as any)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium border",
                statusColors[lead.status]
              )}
            >
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Contact Information
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Email</p>
                  <a href={`mailto:${lead.work_email}`} className="text-primary hover:underline">
                    {lead.work_email}
                  </a>
                </div>
                
                {lead.phone_number && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Phone</p>
                    <a href={`tel:${lead.phone_number}`} className="text-white hover:text-primary">
                      {lead.phone_number}
                    </a>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-slate-400 mb-1">Preferred Contact Method</p>
                  <div className="flex items-center gap-2">
                    <ContactIcon className="w-4 h-4 text-primary" />
                    <span className="text-white capitalize">{lead.preferred_contact_method}</span>
                  </div>
                </div>
                
                {lead.best_time_to_reach && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Best Time to Reach</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-white">{lead.best_time_to_reach} {lead.timezone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Details */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Company Details
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Company Name</p>
                  <p className="text-white font-medium">{lead.company_name}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400 mb-1">Industry</p>
                  <p className="text-white">{lead.industry}</p>
                </div>
                
                <div>
                  <p className="text-sm text-slate-400 mb-1">Team Size</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-white font-medium">{lead.number_of_reps} sales reps</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Needs & Interest */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Needs & Interest
              </h2>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-slate-400 mb-1">How They Found Us</p>
                  <p className="text-white">{lead.how_did_you_hear}</p>
                </div>
                
                {lead.primary_use_case && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Primary Use Case</p>
                    <p className="text-white">{lead.primary_use_case}</p>
                  </div>
                )}
                
                {lead.additional_comments && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Additional Comments</p>
                    <p className="text-white whitespace-pre-wrap">{lead.additional_comments}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Internal Notes */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Internal Notes
              </h2>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                placeholder="Add notes about this lead..."
              />
              
              <button
                onClick={saveNotes}
                disabled={savingNotes || notes === lead.notes}
                className="mt-4 px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <a
                  href={`mailto:${lead.work_email}`}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Send Email
                </a>
                
                {lead.phone_number && (
                  <a
                    href={`tel:${lead.phone_number}`}
                    className="flex items-center gap-3 w-full px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all"
                  >
                    <Phone className="w-5 h-5" />
                    Call Now
                  </a>
                )}
                
                <button
                  onClick={() => updateLeadStatus('qualified')}
                  disabled={lead.status === 'qualified'}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-all"
                >
                  <Target className="w-5 h-5" />
                  Mark as Qualified
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-800">
              <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Submitted</p>
                  <p className="text-white font-medium">
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
                
                {lead.contacted_at && (
                  <div>
                    <p className="text-sm text-slate-400">First Contacted</p>
                    <p className="text-white font-medium">
                      {new Date(lead.contacted_at).toLocaleDateString('en-US', {
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
                  <p className="text-sm text-slate-400">Last Updated</p>
                  <p className="text-white font-medium">
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
