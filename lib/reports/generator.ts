import jsPDF from 'jspdf'

export type ReportType = 
  | 'monthly-analytics'
  | 'weekly-analytics'
  | 'session-report'
  | 'team-performance'
  | 'rep-comparison'
  | 'skill-breakdown'
  | 'revenue-earnings'

export type ReportFormat = 'csv' | 'pdf'

export interface ReportData {
  [key: string]: any
}

/**
 * Generate CSV content from data
 */
export function generateCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = []
  
  // Add headers
  csvRows.push(headers.map(h => `"${h}"`).join(','))
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header] ?? ''
      // Escape quotes and wrap in quotes if contains comma or quote
      const stringValue = String(value).replace(/"/g, '""')
      return `"${stringValue}"`
    })
    csvRows.push(values.join(','))
  })
  
  return csvRows.join('\n')
}

/**
 * Generate PDF report
 */
export function generatePDF(
  title: string,
  data: any[],
  headers: string[],
  metadata?: { [key: string]: string }
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const startY = 30
  let yPos = startY
  
  // Add title
  doc.setFontSize(18)
  doc.text(title, margin, yPos)
  yPos += 10
  
  // Add metadata if provided
  if (metadata) {
    doc.setFontSize(10)
    Object.entries(metadata).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, margin, yPos)
      yPos += 6
    })
    yPos += 5
  }
  
  // Add table headers
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  const colWidth = (pageWidth - 2 * margin) / headers.length
  headers.forEach((header, index) => {
    doc.text(header, margin + index * colWidth, yPos)
  })
  yPos += 8
  
  // Add data rows
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      yPos = startY
    }
    
    headers.forEach((header, colIndex) => {
      const value = String(row[header] ?? '')
      // Truncate long values
      const displayValue = value.length > 30 ? value.substring(0, 27) + '...' : value
      doc.text(displayValue, margin + colIndex * colWidth, yPos)
    })
    yPos += 7
  })
  
  // Generate blob
  const pdfBlob = doc.output('blob')
  return pdfBlob
}

/**
 * Generate detailed PDF report with section headers
 */
export function generateDetailedPDF(
  title: string,
  data: any[],
  headers: string[],
  metadata?: { [key: string]: string }
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const startY = 30
  let yPos = startY
  
  // Add title
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text(title, margin, yPos)
  yPos += 10
  
  // Add metadata if provided
  if (metadata) {
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    Object.entries(metadata).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, margin, yPos)
      yPos += 6
    })
    yPos += 5
  }
  
  // Add data rows with section handling
  const colWidth = (pageWidth - 2 * margin) / headers.length
  data.forEach((row, rowIndex) => {
    // Check if we need a new page
    if (yPos > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      yPos = startY
    }
    
    const metricValue = String(row[headers[0]] ?? '')
    const valueValue = String(row[headers[1]] ?? '')
    
    // Handle section headers (lines starting with ===)
    if (metricValue.startsWith('===')) {
      yPos += 5
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text(metricValue.replace(/=/g, '').trim(), margin, yPos)
      yPos += 8
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
    } else if (metricValue === '') {
      // Empty row for spacing
      yPos += 5
    } else {
      // Regular data row
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      
      // Format metric column
      const displayMetric = metricValue.length > 40 ? metricValue.substring(0, 37) + '...' : metricValue
      doc.text(displayMetric, margin, yPos)
      
      // Format value column (can be longer, wrap if needed)
      const displayValue = valueValue.length > 50 ? valueValue.substring(0, 47) + '...' : valueValue
      doc.text(displayValue, margin + colWidth, yPos)
      
      yPos += 7
    }
  })
  
  // Generate blob
  const pdfBlob = doc.output('blob')
  return pdfBlob
}

/**
 * Generate monthly analytics report
 */
export function generateMonthlyAnalyticsReport(
  analytics: any,
  format: ReportFormat
): { content: string | Blob; filename: string; mimeType: string } {
  const now = new Date()
  const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const filename = `monthly-analytics-${monthName.toLowerCase().replace(' ', '-')}`
  
  // Build comprehensive data array
  const data: any[] = []
  
  // Overview Section
  data.push({ Metric: '=== OVERVIEW ===', Value: '' })
  data.push({ Metric: 'Total Sessions', Value: analytics.totalSessions || 0 })
  data.push({ Metric: 'Team Average Score', Value: `${analytics.teamAverage || 0}%` })
  data.push({ Metric: 'Close Rate', Value: `${analytics.teamClosePercentage || 0}%` })
  data.push({ Metric: 'Active Reps', Value: analytics.activeReps || 0 })
  data.push({ Metric: 'Training ROI', Value: `$${analytics.trainingROI || 0}` })
  data.push({ Metric: '', Value: '' })
  
  // Performance Changes
  data.push({ Metric: '=== PERFORMANCE CHANGES ===', Value: '' })
  const sessionsChange = analytics.changes?.sessions || 0
  const scoreChange = analytics.changes?.score || 0
  const roiChange = analytics.changes?.roi || 0
  data.push({ Metric: 'Sessions Change', Value: `${sessionsChange >= 0 ? '+' : ''}${sessionsChange}%` })
  data.push({ Metric: 'Score Change', Value: `${scoreChange >= 0 ? '+' : ''}${scoreChange}%` })
  data.push({ Metric: 'ROI Change', Value: `${roiChange >= 0 ? '+' : ''}${roiChange}%` })
  data.push({ Metric: '', Value: '' })
  
  // Skill Breakdown
  if (analytics.skillDistribution && analytics.skillDistribution.length > 0) {
    data.push({ Metric: '=== SKILL BREAKDOWN ===', Value: '' })
    analytics.skillDistribution.forEach((skill: any) => {
      data.push({ Metric: skill.name, Value: `${skill.value}%` })
    })
    data.push({ Metric: '', Value: '' })
  }
  
  // Top Performers
  if (analytics.repPerformance && analytics.repPerformance.length > 0) {
    data.push({ Metric: '=== TOP PERFORMERS ===', Value: '' })
    const topPerformers = analytics.repPerformance.slice(0, 5)
    topPerformers.forEach((rep: any, index: number) => {
      data.push({ 
        Metric: `${index + 1}. ${rep.name}`, 
        Value: `${rep.avgScore}% (${rep.sessions} sessions, ${rep.closePercentage || 0}% close rate)` 
      })
    })
    data.push({ Metric: '', Value: '' })
  }
  
  // Performance Trends
  if (analytics.performanceData && analytics.performanceData.length > 0) {
    data.push({ Metric: '=== MONTHLY TRENDS ===', Value: '' })
    analytics.performanceData.slice(-6).forEach((month: any) => {
      data.push({ 
        Metric: month.month, 
        Value: `Avg: ${month.teamAvg}% | Top: ${month.topPerformer}%` 
      })
    })
  }
  
  if (format === 'csv') {
    return {
      content: generateCSV(data, ['Metric', 'Value']),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    }
  } else {
    return {
      content: generateDetailedPDF(
        `Monthly Analytics Report - ${monthName}`,
        data,
        ['Metric', 'Value'],
        { 
          'Generated': now.toLocaleDateString(),
          'Period': monthName,
          'Total Sessions': (analytics.totalSessions || 0).toString(),
          'Team Average': `${analytics.teamAverage || 0}%`
        }
      ),
      filename: `${filename}.pdf`,
      mimeType: 'application/pdf'
    }
  }
}

/**
 * Generate weekly analytics report
 */
export function generateWeeklyAnalyticsReport(
  analytics: any,
  format: ReportFormat
): { content: string | Blob; filename: string; mimeType: string } {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  
  const weekRange = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
  const filename = `weekly-analytics-${weekStart.toISOString().split('T')[0]}`
  
  // Build comprehensive data array
  const data: any[] = []
  
  // Overview Section
  data.push({ Metric: '=== OVERVIEW ===', Value: '' })
  data.push({ Metric: 'Total Sessions', Value: analytics.totalSessions || 0 })
  data.push({ Metric: 'Team Average Score', Value: `${analytics.teamAverage || 0}%` })
  data.push({ Metric: 'Close Rate', Value: `${analytics.teamClosePercentage || 0}%` })
  data.push({ Metric: 'Active Reps', Value: analytics.activeReps || 0 })
  data.push({ Metric: 'Avg Sessions per Rep', Value: analytics.activeReps > 0 ? Math.round((analytics.totalSessions || 0) / analytics.activeReps) : 0 })
  data.push({ Metric: '', Value: '' })
  
  // Performance Changes
  data.push({ Metric: '=== WEEK-OVER-WEEK CHANGES ===', Value: '' })
  const sessionsChange = analytics.changes?.sessions || 0
  const scoreChange = analytics.changes?.score || 0
  data.push({ Metric: 'Sessions Change', Value: `${sessionsChange >= 0 ? '+' : ''}${sessionsChange}%` })
  data.push({ Metric: 'Score Change', Value: `${scoreChange >= 0 ? '+' : ''}${scoreChange}%` })
  data.push({ Metric: '', Value: '' })
  
  // Skill Breakdown
  if (analytics.skillDistribution && analytics.skillDistribution.length > 0) {
    data.push({ Metric: '=== SKILL BREAKDOWN ===', Value: '' })
    analytics.skillDistribution.forEach((skill: any) => {
      data.push({ Metric: skill.name, Value: `${skill.value}%` })
    })
    data.push({ Metric: '', Value: '' })
  }
  
  // Top Performers
  if (analytics.repPerformance && analytics.repPerformance.length > 0) {
    data.push({ Metric: '=== TOP PERFORMERS THIS WEEK ===', Value: '' })
    const topPerformers = analytics.repPerformance.slice(0, 5)
    topPerformers.forEach((rep: any, index: number) => {
      data.push({ 
        Metric: `${index + 1}. ${rep.name}`, 
        Value: `${rep.avgScore}% (${rep.sessions} sessions, ${rep.closePercentage || 0}% close rate)` 
      })
    })
    data.push({ Metric: '', Value: '' })
  }
  
  // Rep Performance Summary
  if (analytics.repPerformance && analytics.repPerformance.length > 0) {
    data.push({ Metric: '=== REP PERFORMANCE SUMMARY ===', Value: '' })
    analytics.repPerformance.forEach((rep: any) => {
      data.push({ 
        Metric: rep.name, 
        Value: `Score: ${rep.avgScore}% | Sessions: ${rep.sessions} | Close Rate: ${rep.closePercentage || 0}% | Trend: ${rep.trend >= 0 ? '+' : ''}${rep.trend}%` 
      })
    })
  }
  
  if (format === 'csv') {
    return {
      content: generateCSV(data, ['Metric', 'Value']),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    }
  } else {
    return {
      content: generateDetailedPDF(
        `Weekly Analytics Report - ${weekRange}`,
        data,
        ['Metric', 'Value'],
        { 
          'Generated': now.toLocaleDateString(),
          'Week': weekRange,
          'Total Sessions': (analytics.totalSessions || 0).toString(),
          'Team Average': `${analytics.teamAverage || 0}%`
        }
      ),
      filename: `${filename}.pdf`,
      mimeType: 'application/pdf'
    }
  }
}

/**
 * Generate team performance report (managers only)
 */
export function generateTeamPerformanceReport(
  repPerformance: any[],
  format: ReportFormat
): { content: string | Blob; filename: string; mimeType: string } {
  const now = new Date()
  const filename = `team-performance-${now.toISOString().split('T')[0]}`
  
  const headers = ['Rep Name', 'Sessions', 'Avg Score', 'Trend', 'Rapport', 'Discovery', 'Objections', 'Closing', 'Revenue']
  const data = repPerformance.map(rep => ({
    'Rep Name': rep.name,
    'Sessions': rep.sessions,
    'Avg Score': `${rep.avgScore}%`,
    'Trend': rep.trend > 0 ? `+${rep.trend}` : rep.trend.toString(),
    'Rapport': `${rep.skills?.rapport || 0}%`,
    'Discovery': `${rep.skills?.discovery || 0}%`,
    'Objections': `${rep.skills?.objections || 0}%`,
    'Closing': `${rep.skills?.closing || 0}%`,
    'Revenue': `$${rep.revenue || 0}`
  }))
  
  if (format === 'csv') {
    return {
      content: generateCSV(data, headers),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    }
  } else {
    return {
      content: generatePDF(
        'Team Performance Report',
        data,
        headers,
        { 'Generated': now.toLocaleDateString(), 'Total Reps': repPerformance.length.toString() }
      ),
      filename: `${filename}.pdf`,
      mimeType: 'application/pdf'
    }
  }
}

/**
 * Generate skill breakdown report
 */
export function generateSkillBreakdownReport(
  skillDistribution: any[],
  format: ReportFormat
): { content: string | Blob; filename: string; mimeType: string } {
  const now = new Date()
  const filename = `skill-breakdown-${now.toISOString().split('T')[0]}`
  
  const headers = ['Skill', 'Average Score']
  const data = skillDistribution.map(skill => ({
    Skill: skill.name,
    'Average Score': `${skill.value}%`
  }))
  
  if (format === 'csv') {
    return {
      content: generateCSV(data, headers),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    }
  } else {
    return {
      content: generatePDF(
        'Skill Breakdown Report',
        data,
        headers,
        { 'Generated': now.toLocaleDateString() }
      ),
      filename: `${filename}.pdf`,
      mimeType: 'application/pdf'
    }
  }
}

/**
 * Generate revenue/earnings report
 */
export function generateRevenueReport(
  revenueData: any[],
  format: ReportFormat
): { content: string | Blob; filename: string; mimeType: string } {
  const now = new Date()
  const filename = `revenue-earnings-${now.toISOString().split('T')[0]}`
  
  const headers = ['Period', 'Revenue', 'Reps Who Sold', 'Total Sales']
  const data = revenueData.map(item => ({
    Period: item.period || item.fullPeriod,
    Revenue: `$${item.revenue || 0}`,
    'Reps Who Sold': item.repsWhoSold || 0,
    'Total Sales': item.totalSales || 0
  }))
  
  if (format === 'csv') {
    return {
      content: generateCSV(data, headers),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    }
  } else {
    return {
      content: generatePDF(
        'Revenue & Earnings Report',
        data,
        headers,
        { 'Generated': now.toLocaleDateString() }
      ),
      filename: `${filename}.pdf`,
      mimeType: 'application/pdf'
    }
  }
}

/**
 * Generate individual session report
 */
export function generateSessionReport(
  sessions: any[],
  format: ReportFormat
): { content: string | Blob; filename: string; mimeType: string } {
  const now = new Date()
  const filename = `session-report-${now.toISOString().split('T')[0]}`
  
  const headers = ['Date', 'Agent', 'Score', 'Rapport', 'Discovery', 'Objections', 'Closing', 'Earnings', 'Sale Closed']
  const data = sessions.map(session => ({
    Date: new Date(session.created_at).toLocaleDateString(),
    Agent: session.agent_name || 'N/A',
    Score: session.overall_score ? `${session.overall_score}%` : 'N/A',
    Rapport: session.rapport_score ? `${session.rapport_score}%` : 'N/A',
    Discovery: session.discovery_score ? `${session.discovery_score}%` : 'N/A',
    Objections: session.objection_handling_score ? `${session.objection_handling_score}%` : 'N/A',
    Closing: session.close_score ? `${session.close_score}%` : 'N/A',
    Earnings: `$${session.virtual_earnings || 0}`,
    'Sale Closed': session.sale_closed ? 'Yes' : 'No'
  }))
  
  if (format === 'csv') {
    return {
      content: generateCSV(data, headers),
      filename: `${filename}.csv`,
      mimeType: 'text/csv'
    }
  } else {
    return {
      content: generatePDF(
        'Session Report',
        data,
        headers,
        { 'Generated': now.toLocaleDateString(), 'Total Sessions': sessions.length.toString() }
      ),
      filename: `${filename}.pdf`,
      mimeType: 'application/pdf'
    }
  }
}

