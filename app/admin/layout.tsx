'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import Header from '@/components/navigation/Header'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
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

      if (userData?.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  // Determine back button destination
  const getBackDestination = () => {
    if (pathname === '/admin') {
      return '/dashboard'
    }
    // For nested admin pages, go back to admin dashboard
    if (pathname?.startsWith('/admin/')) {
      return '/admin'
    }
    return '/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Sidebar */}
      <Header />
      
      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <Link
          href={getBackDestination()}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors font-sans"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="pt-8">
        {children}
      </div>
    </div>
  )
}
