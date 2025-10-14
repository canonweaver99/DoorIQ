import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { messageEvents } from '@/lib/events/messageEvents'

export function useUnreadMessages(userId: string | null) {
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()
  
  const fetchUnreadCount = async () => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error fetching unread count:', error)
        return
      }
      
      console.log('📬 Unread count fetched:', count)
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
      setUnreadCount(0)
    }
  }

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0)
      return
    }

    // Initial fetch
    fetchUnreadCount()

    // Subscribe to message read events
    const unsubscribe = messageEvents.onMessagesRead(() => {
      console.log('📭 Messages read event received, refetching count...')
      // Add small delay to ensure database has updated
      setTimeout(() => {
        fetchUnreadCount()
      }, 100)
    })

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
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          // Only refetch if the update involves our messages
          if (payload.new.recipient_id === userId || payload.old.recipient_id === userId) {
            fetchUnreadCount()
          }
        }
      )
      .subscribe()

    return () => {
      unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { unreadCount, refetch: fetchUnreadCount }
}

