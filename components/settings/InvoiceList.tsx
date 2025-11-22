'use client'

import { Download, FileText, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface Invoice {
  id: string
  number: string | null
  amountPaid: number
  currency: string
  status: string
  invoicePdf: string | null
  hostedInvoiceUrl: string | null
  invoiceDate: string
  periodStart: string | null
  periodEnd: string | null
}

interface InvoiceListProps {
  invoices: Invoice[]
  loading?: boolean
}

export function InvoiceList({ invoices, loading }: InvoiceListProps) {
  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100)
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-500/20 text-green-400 border border-green-500/30`
      case 'open':
        return `${baseClasses} bg-yellow-500/20 text-yellow-400 border border-yellow-500/30`
      case 'void':
        return `${baseClasses} bg-gray-500/20 text-gray-400 border border-gray-500/30`
      default:
        return `${baseClasses} bg-red-500/20 text-red-400 border border-red-500/30`
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
        <p className="text-foreground/60 font-sans">No invoices found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="p-4 rounded-lg bg-background/30 border border-border/40 hover:bg-background/40 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium text-foreground">
                    {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                  </p>
                  <p className="text-sm text-foreground/60 font-sans">
                    {format(new Date(invoice.invoiceDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>

              {invoice.periodStart && invoice.periodEnd && (
                <div className="flex items-center gap-2 text-xs text-foreground/50 mb-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {format(new Date(invoice.periodStart), 'MMM dd')} -{' '}
                    {format(new Date(invoice.periodEnd), 'MMM dd, yyyy')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-foreground/60" />
                  <span className="text-lg font-bold text-foreground font-space">
                    {formatCurrency(invoice.amountPaid, invoice.currency)}
                  </span>
                </div>
                <div className={getStatusBadge(invoice.status)}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {invoice.invoicePdf && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Try to download via our API route first, fallback to direct URL
                    const downloadUrl = `/api/billing/invoices/${invoice.id}/download`
                    window.open(downloadUrl, '_blank')
                  }}
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              )}
              {invoice.hostedInvoiceUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(invoice.hostedInvoiceUrl!, '_blank')}
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

