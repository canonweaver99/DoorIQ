import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useUnreadMessages(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    // Initial fetch
    fetchUnreadCount()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`unread-messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          fetchUnreadCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchUnreadCount = async () => {
    if (!userId) return

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return unreadCount
}

