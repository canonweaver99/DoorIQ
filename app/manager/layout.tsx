'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/navigation/Header'

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkManagerAccess()
  }, [])

  const checkManagerAccess = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!userData || !['manager', 'admin'].includes(userData.role)) {
        router.push('/')
        return
      }

      setIsAuthorized(true)
    } catch (error) {
      console.error('Error checking manager access:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  // Determine back button destination
  const getBackDestination = () => {
    if (pathname === '/manager') {
      return '/'
    }
    // For nested manager pages, go back to manager panel
    if (pathname?.startsWith('/manager/')) {
      return '/manager'
    }
    return '/'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header with Sidebar */}
      <Header />
      
      {/* Back Button - only show on nested pages */}
      {pathname !== '/manager' && (
        <div className="sticky top-0 z-10 bg-[#1a1a1a] border-b border-[#2a2a2a] px-6 py-4">
          <Link
            href={getBackDestination()}
            className="inline-flex items-center gap-2 text-[#a0a0a0] hover:text-white transition-colors font-sans"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </Link>
        </div>
      )}

      {/* Main Content */}
      {children}
    </div>
  )
}
