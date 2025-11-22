'use client'

import { Mail, Clock, X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PendingInvite {
  id: string
  email: string
  created_at: string
  expires_at: string
  role: string
}

interface PendingInvitesProps {
  invites: PendingInvite[]
  onResend?: (inviteId: string) => Promise<void>
  onCancel?: (inviteId: string) => Promise<void>
  loading?: boolean
}

export function PendingInvites({
  invites,
  onResend,
  onCancel,
  loading = false,
}: PendingInvitesProps) {
  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryBadge = (expiresAt: string) => {
    const days = getDaysUntilExpiry(expiresAt)
    if (days < 0) {
      return <Badge className="bg-red-900/50 text-red-300 border-red-700">Expired</Badge>
    } else if (days <= 2) {
      return <Badge className="bg-yellow-900/50 text-yellow-300 border-yellow-700">Expires soon</Badge>
    } else {
      return <Badge className="bg-gray-700 text-gray-300">{days} days left</Badge>
    }
  }

  if (invites.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
        <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">No pending invites</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">
          Pending Invites ({invites.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-700">
        {invites.map((invite) => {
          const days = getDaysUntilExpiry(invite.expires_at)
          const isExpired = days < 0

          return (
            <div
              key={invite.id}
              className="p-4 hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    isExpired ? 'bg-gray-700' : 'bg-purple-900/30'
                  }`}>
                    <Mail className={`w-5 h-5 ${
                      isExpired ? 'text-gray-500' : 'text-purple-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{invite.email}</span>
                      {getExpiryBadge(invite.expires_at)}
                      <Badge className="bg-gray-700 text-gray-300 capitalize">
                        {invite.role}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                      <Clock className="w-3 h-3" />
                      Invited {new Date(invite.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isExpired && onResend && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResend(invite.id)}
                      disabled={loading}
                      className="border-purple-700 text-purple-400 hover:bg-purple-900/30"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Resend
                    </Button>
                  )}
                  {onCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancel(invite.id)}
                      disabled={loading}
                      className="border-red-700 text-red-400 hover:bg-red-900/30"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

