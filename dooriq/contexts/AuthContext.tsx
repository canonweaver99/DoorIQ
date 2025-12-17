import React, { createContext, useContext } from 'react'
import { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { User } from '../lib/types'

interface AuthContextType {
  session: Session | null
  user: SupabaseUser | null
  userProfile: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const signOut = async () => {
    // Stub
  }

  const refreshProfile = async () => {
    // Stub
  }

  return (
    <AuthContext.Provider
      value={{
        session: null,
        user: null,
        userProfile: null,
        loading: false,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

