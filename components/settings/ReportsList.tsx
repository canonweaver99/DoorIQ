'use client'

import { useState } from 'react'
import { Download, FileText, Calendar, Users, TrendingUp, Award, DollarSign, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

export interface ReportDefinition {
  id: string
  name: string
  description: string
  icon: typeof Download
  type: string
  availableFor: ('manager' | 'rep')[]
  dateRange?: 'weekly' | 'monthly' | 'custom'
}

interface ReportsListProps {
  reports: ReportDefinition[]
  userRole: 'manager' | 'rep' | 'admin'
}

export function ReportsList({ reports, userRole }: ReportsListProps) {
  const { showToast } = useToast()
  const [downloading, setDownloading] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<{ [key: string]: 'csv' | 'pdf' }>({})

  const handleDownload = async (report: ReportDefinition, format: 'csv' | 'pdf') => {
    setDownloading(report.id)
    try {
      const response = await fetch('/api/settings/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: report.type,
          format,
          dateRange: report.dateRange || 'monthly'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      // Get the blob from response
      const blob = await response.blob()
      const contentType = response.headers.get('content-type') || ''
      const contentDisposition = response.headers.get('content-disposition') || ''
      
      // Extract filename from content-disposition header or use default
      let filename = `report-${Date.now()}.${format}`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      showToast({
        type: 'success',
        title: 'Report downloaded',
        message: `${report.name} has been downloaded successfully`
      })
    } catch (error: any) {
      console.error('Error downloading report:', error)
      showToast({
        type: 'error',
        title: 'Download failed',
        message: error.message || 'Failed to download report'
      })
    } finally {
      setDownloading(null)
    }
  }

  const filteredReports = reports.filter(report => 
    report.availableFor.includes(userRole === 'admin' ? 'manager' : userRole)
  )

  if (filteredReports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-[#666] mx-auto mb-4" />
        <p className="text-[#a0a0a0] font-sans">No reports available</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {filteredReports.map((report) => {
        const Icon = report.icon
        const isDownloading = downloading === report.id
        const currentFormat = selectedFormat[report.id] || 'csv'

        return (
          <div
            key={report.id}
            className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6 hover:border-[#00d4aa]/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-[#00d4aa]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white mb-1 font-space">
                  {report.name}
                </h3>
                <p className="text-sm text-[#a0a0a0] font-sans mb-4">
                  {report.description}
                </p>
                
                {report.dateRange && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-[#666] font-sans">
                    <Calendar className="w-4 h-4" />
                    <span className="capitalize">{report.dateRange}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex gap-2 flex-1">
                    <Button
                      size="sm"
                      variant={currentFormat === 'csv' ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat({ ...selectedFormat, [report.id]: 'csv' })}
                      className="text-xs"
                      disabled={isDownloading}
                    >
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant={currentFormat === 'pdf' ? 'default' : 'outline'}
                      onClick={() => setSelectedFormat({ ...selectedFormat, [report.id]: 'pdf' })}
                      className="text-xs"
                      disabled={isDownloading}
                    >
                      PDF
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleDownload(report, currentFormat)}
                    disabled={isDownloading}
                    className="bg-[#00d4aa] hover:bg-[#00c19a] text-black font-medium font-sans"
                    size="sm"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

