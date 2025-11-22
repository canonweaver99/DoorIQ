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
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  qualified: 'bg-purple-50 text-purple-700 border-purple-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-red-50 text-red-700 border-red-200'
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

const statusColors = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  qualified: 'bg-purple-50 text-purple-700 border-purple-200',
  converted: 'bg-green-50 text-green-700 border-green-200',
  lost: 'bg-red-50 text-red-700 border-red-200'
}
}
