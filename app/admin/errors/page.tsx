'use client'
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { 
  Search, Filter, RefreshCw, AlertTriangle, CheckCircle2, 
  ChevronDown, ChevronUp, ExternalLink, XCircle
} from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'

type ErrorLog = {
  id: string
  created_at: string
  user_id: string | null
  user_email: string | null
  error_message: string
  error_stack: string | null
  error_type: string | null
  page_url: string | null
  user_agent: string | null
  component_name: string | null
  severity: 'warning' | 'error' | 'critical'
  resolved: boolean
  metadata: any
}

type ErrorStats = {
  total: number
  critical: number
  error: number
  warning: number
  unresolved: number
}

export default function AdminErrorsPage() {
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all')
  const [resolvedFilter, setResolvedFilter] = useState<string>('unresolved')
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50
  
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchErrors()
  }, [page, severityFilter, errorTypeFilter, resolvedFilter, search])

  const fetchErrors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      
      if (severityFilter !== 'all') {
        params.append('severity', severityFilter)
      }
      
      if (errorTypeFilter !== 'all') {
        params.append('error_type', errorTypeFilter)
      }
      
      if (resolvedFilter !== 'all') {
        params.append('resolved', resolvedFilter === 'resolved' ? 'true' : 'false')
      }
      
      if (search.trim()) {
        params.append('search', search.trim())
      }
      
      const response = await fetch(`/api/admin/errors?${params.toString()}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch errors')
      }
      
      setErrors(data.errors || [])
      setTotalPages(data.pagination?.totalPages || 1)
      
      // Calculate stats from current page (could be enhanced with separate stats endpoint)
      calculateStats(data.errors || [])
    } catch (error) {
      console.error('Error fetching errors:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (errorList: ErrorLog[]) => {
    const stats: ErrorStats = {
      total: errorList.length,
      critical: 0,
      error: 0,
      warning: 0,
      unresolved: 0,
    }
    
    errorList.forEach(err => {
      if (err.severity === 'critical') stats.critical++
      if (err.severity === 'error') stats.error++
      if (err.severity === 'warning') stats.warning++
      if (!err.resolved) stats.unresolved++
    })
    
    setStats(stats)
  }

  const toggleResolved = async (id: string, currentResolved: boolean) => {
    try {
      const response = await fetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: !currentResolved }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update error')
      }
      
      // Refresh errors
      fetchErrors()
    } catch (error) {
      console.error('Error updating error:', error)
      alert('Failed to update error status')
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'error':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getErrorTypeColor = (errorType: string | null) => {
    switch (errorType) {
      case 'elevenlabs':
        return 'bg-purple-500/20 text-purple-400'
      case 'webrtc':
        return 'bg-blue-500/20 text-blue-400'
      case 'api':
        return 'bg-indigo-500/20 text-indigo-400'
      case 'server':
        return 'bg-red-500/20 text-red-400'
      default:
        return 'bg-gray-500/20 text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 sm:px-6 lg:px-8 pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-space font-bold tracking-tight text-white mb-2">Error Logs</h1>
          <p className="text-sm sm:text-base text-[#a0a0a0] font-sans leading-relaxed">Monitor and manage application errors</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
              <div className="text-xs text-[#a0a0a0] font-space mb-1">Total</div>
              <div className="text-2xl font-space font-bold text-white">{stats.total}</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <div className="text-xs text-red-400 font-space mb-1">Critical</div>
              <div className="text-2xl font-space font-bold text-red-400">{stats.critical}</div>
            </div>
            <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/30">
              <div className="text-xs text-orange-400 font-space mb-1">Errors</div>
              <div className="text-2xl font-space font-bold text-orange-400">{stats.error}</div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
              <div className="text-xs text-yellow-400 font-space mb-1">Warnings</div>
              <div className="text-2xl font-space font-bold text-yellow-400">{stats.warning}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#666] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1) // Reset to first page on search
              }}
              placeholder="Search error message or user email"
              className="w-full pl-9 pr-3 py-2.5 sm:py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value)
                setPage(1)
              }}
              className="flex-1 sm:flex-none py-2.5 sm:py-2 px-3 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
            </select>
            <select
              value={errorTypeFilter}
              onChange={(e) => {
                setErrorTypeFilter(e.target.value)
                setPage(1)
              }}
              className="flex-1 sm:flex-none py-2.5 sm:py-2 px-3 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            >
              <option value="all">All Types</option>
              <option value="client">Client</option>
              <option value="server">Server</option>
              <option value="api">API</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="webrtc">WebRTC</option>
            </select>
            <select
              value={resolvedFilter}
              onChange={(e) => {
                setResolvedFilter(e.target.value)
                setPage(1)
              }}
              className="flex-1 sm:flex-none py-2.5 sm:py-2 px-3 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            >
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
            <button 
              onClick={fetchErrors} 
              className="inline-flex items-center justify-center px-4 py-2.5 sm:py-2 text-sm bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-lg hover:bg-[#2a2a2a] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[44px] sm:min-h-0"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </button>
          </div>
        </div>

        {/* Error List */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#a0a0a0] font-sans">No errors found</p>
            </div>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {errors.map((error) => (
                <div key={error.id} className="hover:bg-[#0a0a0a] transition-colors">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            error.severity === 'critical' ? 'text-red-400' :
                            error.severity === 'error' ? 'text-orange-400' :
                            'text-yellow-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(error.severity)}`}>
                                {error.severity}
                              </span>
                              {error.error_type && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getErrorTypeColor(error.error_type)}`}>
                                  {error.error_type}
                                </span>
                              )}
                              {error.resolved && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                  Resolved
                                </span>
                              )}
                            </div>
                            <p className="text-white font-space font-medium mb-1 break-words">
                              {error.error_message}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#a0a0a0] font-sans">
                              <span>{format(new Date(error.created_at), 'MMM d, yyyy h:mm a')}</span>
                              {error.user_email && (
                                <span>{error.user_email}</span>
                              )}
                              {error.component_name && (
                                <span>Component: {error.component_name}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => toggleResolved(error.id, error.resolved)}
                          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            error.resolved
                              ? 'bg-[#2a2a2a] text-[#a0a0a0] hover:bg-[#3a3a3a]'
                              : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                          }`}
                        >
                          {error.resolved ? (
                            <>
                              <XCircle className="w-3 h-3 inline mr-1" />
                              Unresolve
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 inline mr-1" />
                              Mark Resolved
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setExpandedId(expandedId === error.id ? null : error.id)}
                          className="px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-xs font-medium hover:bg-[#3a3a3a] transition-colors"
                        >
                          {expandedId === error.id ? (
                            <>
                              <ChevronUp className="w-3 h-3 inline mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-3 h-3 inline mr-1" />
                              Details
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedId === error.id && (
                      <div className="mt-4 pt-4 border-t border-[#2a2a2a] space-y-3">
                        {error.error_stack && (
                          <div>
                            <div className="text-xs font-space font-medium text-[#a0a0a0] mb-2">Stack Trace</div>
                            <pre className="text-xs text-[#a0a0a0] bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a] overflow-x-auto font-mono">
                              {error.error_stack}
                            </pre>
                          </div>
                        )}
                        {error.page_url && (
                          <div>
                            <div className="text-xs font-space font-medium text-[#a0a0a0] mb-1">Page URL</div>
                            <a 
                              href={error.page_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-purple-400 hover:text-purple-300 break-all inline-flex items-center gap-1"
                            >
                              {error.page_url}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {error.user_agent && (
                          <div>
                            <div className="text-xs font-space font-medium text-[#a0a0a0] mb-1">User Agent</div>
                            <div className="text-xs text-[#a0a0a0] break-all">{error.user_agent}</div>
                          </div>
                        )}
                        {error.metadata && Object.keys(error.metadata).length > 0 && (
                          <div>
                            <div className="text-xs font-space font-medium text-[#a0a0a0] mb-1">Metadata</div>
                            <pre className="text-xs text-[#a0a0a0] bg-[#0a0a0a] p-3 rounded border border-[#2a2a2a] overflow-x-auto">
                              {JSON.stringify(error.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-[#2a2a2a] flex items-center justify-between">
              <div className="text-sm text-[#a0a0a0] font-sans">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-sm font-medium hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-sm font-medium hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
