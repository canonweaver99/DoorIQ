import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator, StyleSheet, Linking } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../lib/supabase/client'
import { createClient } from '../../lib/supabase/client'

export default function AuthCallbackScreen() {
  const router = useRouter()
  const params = useLocalSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle initial URL (when app opens from deep link)
    handleOAuthCallback()

    // Also listen for URL events (when app is already running)
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('🔗 URL event received:', event.url)
      handleOAuthCallbackFromUrl(event.url)
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const handleOAuthCallbackFromUrl = async (url: string) => {
    try {
      console.log('🔗 Processing URL event:', url.substring(0, 100) + '...')
      const urlParams = parseUrlParams(url)
      console.log('📦 Parsed URL params keys:', Object.keys(urlParams))

      const accessToken = urlParams.access_token
      const refreshToken = urlParams.refresh_token
      const code = urlParams.code || urlParams['#code']
      const errorParam = urlParams.error || urlParams['#error']
      const errorDescription = urlParams.error_description || urlParams['#error_description']

      if (errorParam) {
        console.error('❌ OAuth error from URL:', errorParam, errorDescription)
        setError(errorDescription || errorParam || 'Authentication failed')
        setLoading(false)
        setTimeout(() => {
          router.replace('/auth/login')
        }, 3000)
        return
      }

      // Handle tokens from URL hash - rely on auto-detection
      if (accessToken && refreshToken) {
        console.log('✅ Tokens found in URL event')
        // Wait for auto-detection (multiple attempts)
        for (let attempt = 0; attempt < 5; attempt++) {
          const delay = (attempt + 1) * 300
          await new Promise(resolve => setTimeout(resolve, delay))
          
          const { data: { session } } = await supabase.auth.getSession()
          if (session && session.user) {
            console.log('✅ Session detected from URL event:', session.user.email)
            try {
              await handleUserProfile(session.user)
            } catch (profileError) {
              console.error('⚠️ Error handling user profile:', profileError)
            }
            router.replace('/(tabs)/home')
            return
          }
        }
        console.warn('⚠️ Session not detected from URL event after multiple attempts')
      } else if (code) {
        console.log('✅ Code found in URL event, exchanging...')
        await exchangeCodeForSession(code)
      } else {
        console.warn('⚠️ No tokens or code in URL event')
      }
    } catch (err: any) {
      console.error('❌ Error handling URL callback:', err)
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  const exchangeCodeForSession = async (code: string) => {
    try {
      console.log('✅ Code received, exchanging for session...')

      // Exchange code for session
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('❌ Error exchanging code for session:', exchangeError)
        setError(exchangeError.message || 'Failed to complete authentication')
        setLoading(false)
        setTimeout(() => {
          router.replace('/auth/login')
        }, 3000)
        return
      }

      if (data.session && data.user) {
        console.log('✅ Session created successfully:', data.user.email)
        try {
          await handleUserProfile(data.user)
        } catch (profileError) {
          console.error('⚠️ Error handling user profile, but continuing:', profileError)
        }
        router.replace('/(tabs)/home')
      } else {
        console.error('❌ No session or user in response')
        setError('Failed to create session')
        setLoading(false)
        setTimeout(() => {
          router.replace('/auth/login')
        }, 3000)
      }
    } catch (err: any) {
      console.error('❌ Error exchanging code:', err)
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
      setTimeout(() => {
        router.replace('/auth/login')
      }, 3000)
    }
  }

  const handleUserProfile = async (user: any) => {
    try {
      if (!user || !user.id) {
        console.error('❌ Invalid user object:', user)
        return
      }

      console.log('👤 Handling user profile for:', user.email || user.id)
      
      // Check if user profile exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected for new users
        console.error('⚠️ Error fetching user profile:', fetchError)
      }

      // If user doesn't exist, create profile
      if (!existingUser) {
        console.log('📝 Creating user profile...')
        const userMetadata = user.user_metadata || {}
        
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || 'User',
          rep_id: `REP-${Date.now().toString().slice(-6)}`,
          role: 'rep',
          virtual_earnings: 0
        })

        if (insertError) {
          console.error('⚠️ Failed to create user profile:', insertError)
          // Don't fail the flow - user is authenticated even if profile creation fails
        } else {
          console.log('✅ User profile created')
          
          // Create session limits record
          const { error: limitsError } = await supabase.from('user_session_limits').insert({
            user_id: user.id,
            sessions_this_month: 0,
            sessions_limit: 75,
            last_reset_date: new Date().toISOString().split('T')[0]
          })

          if (limitsError) {
            console.error('⚠️ Failed to create session limits:', limitsError)
          } else {
            console.log('✅ Session limits created')
          }
        }
      } else {
        console.log('✅ User profile already exists')
      }
    } catch (error: any) {
      console.error('❌ Error in handleUserProfile:', error)
      // Don't throw - allow auth to complete even if profile handling fails
    }
  }

  const parseUrlParams = (url: string) => {
    try {
      console.log('🔍 Parsing URL:', url.substring(0, 100) + '...') // Log first 100 chars to avoid spam
      const queryParams: Record<string, string> = {}
      
      // Handle deep link format: dooriq://auth/callback?code=... or dooriq://auth/callback#access_token=...
      // Replace custom scheme with https:// for URL parsing
      const normalizedUrl = url.replace(/^dooriq:\/\//, 'https://')
      
      const urlObj = new URL(normalizedUrl)
      
      // Parse query params (after ?)
      urlObj.searchParams.forEach((value, key) => {
        queryParams[key] = value
        console.log(`  Query param: ${key}`)
      })

      // Parse hash fragment (OAuth tokens come in hash: #access_token=...&refresh_token=...)
      const hash = urlObj.hash.substring(1) // Remove #
      if (hash) {
        console.log('🔍 Hash fragment detected (length:', hash.length, ')')
        console.log('🔍 Hash fragment preview (first 200 chars):', hash.substring(0, 200))
        
        // Hash contains tokens: #access_token=xxx&refresh_token=yyy&expires_at=zzz
        const hashParams = new URLSearchParams(hash)
        
        // Log all keys first
        console.log('🔍 Hash param keys found:', Array.from(hashParams.keys()))
        
        hashParams.forEach((value, key) => {
          queryParams[key] = value
          // Log token lengths for debugging
          if (key === 'access_token' || key === 'refresh_token') {
            console.log(`  Hash param: ${key} = [length: ${value.length}]`)
            // Log first/last few chars for debugging (not full token)
            if (value.length > 0) {
              console.log(`    Preview: ${value.substring(0, 10)}...${value.substring(value.length - 10)}`)
            }
          } else if (key !== 'provider_token') {
            console.log(`  Hash param: ${key} = ${value}`)
          } else {
            console.log(`  Hash param: ${key} = [REDACTED]`)
          }
        })
      }

      console.log('✅ Parsed params keys:', Object.keys(queryParams))
      return queryParams
    } catch (e) {
      console.error('❌ Error parsing URL:', e)
      console.log('🔍 Attempting regex fallback extraction...')
      // Fallback: try regex extraction for tokens
      // Use non-greedy match and capture until next & or end of string
      const fallbackParams: Record<string, string> = {}
      
      // Match access_token - capture everything until next & or end
      const accessTokenMatch = url.match(/[#&]access_token=([^&]*)/)
      if (accessTokenMatch && accessTokenMatch[1]) {
        try {
          fallbackParams.access_token = decodeURIComponent(accessTokenMatch[1])
          console.log('✅ Regex extracted access_token, length:', fallbackParams.access_token.length)
        } catch (decodeErr) {
          console.warn('⚠️ Failed to decode access_token, using raw:', decodeErr)
          fallbackParams.access_token = accessTokenMatch[1]
        }
      }
      
      // Match refresh_token - capture everything until next & or end
      const refreshTokenMatch = url.match(/[#&]refresh_token=([^&]*)/)
      if (refreshTokenMatch && refreshTokenMatch[1]) {
        try {
          fallbackParams.refresh_token = decodeURIComponent(refreshTokenMatch[1])
          console.log('✅ Regex extracted refresh_token, length:', fallbackParams.refresh_token.length)
        } catch (decodeErr) {
          console.warn('⚠️ Failed to decode refresh_token, using raw:', decodeErr)
          fallbackParams.refresh_token = refreshTokenMatch[1]
        }
      }
      
      // Also try to extract expires_at and type
      const expiresAtMatch = url.match(/[#&]expires_at=([^&]*)/)
      if (expiresAtMatch && expiresAtMatch[1]) {
        fallbackParams.expires_at = expiresAtMatch[1]
      }
      
      const typeMatch = url.match(/[#&]type=([^&]*)/)
      if (typeMatch && typeMatch[1]) {
        fallbackParams.type = decodeURIComponent(typeMatch[1])
      }
      
      console.log('📦 Fallback extraction result keys:', Object.keys(fallbackParams))
      return fallbackParams
    }
  }

  const handleOAuthCallback = async () => {
    try {
      console.log('🔗 OAuth callback received')
      console.log('📦 Params from useLocalSearchParams:', params)

      // First, check if Supabase already has a session (it might auto-handle OAuth)
      const { data: { session: existingSession }, error: sessionCheckError } = await supabase.auth.getSession()
      
      if (sessionCheckError) {
        console.error('❌ Error checking session:', sessionCheckError)
      }
      
      if (existingSession && existingSession.user) {
        console.log('✅ Session already exists - OAuth completed automatically')
        console.log('👤 User:', existingSession.user.email)
        try {
          await handleUserProfile(existingSession.user)
        } catch (profileError) {
          console.error('⚠️ Error handling user profile, but continuing:', profileError)
        }
        router.replace('/(tabs)/home')
        return
      }

      // Get the full URL from Linking - this is more reliable than useLocalSearchParams for deep links
      // expo-router's useLocalSearchParams doesn't capture hash fragments properly
      let urlParams: Record<string, string> = {}
      let fullUrl: string | null = null
      
      try {
        // Try getInitialURL first (works when app opens from closed state)
        fullUrl = await Linking.getInitialURL()
        console.log('📱 Linking.getInitialURL() result:', fullUrl ? fullUrl.substring(0, 150) + '...' : 'null')
        
        // If no initial URL, the app was already running - check if expo-router captured anything
        if (!fullUrl) {
          console.log('⚠️ No initial URL from Linking.getInitialURL()')
          console.log('💡 App was likely already running - checking expo-router params')
          
          // expo-router might have captured query params but not hash
          // Check if we have a code parameter (magic links use query params)
          if (params.code) {
            console.log('✅ Found code in expo-router params, using it')
            await exchangeCodeForSession(params.code as string)
            return
          }
          
          // If no code and no initial URL, wait a moment for URL event to fire
          console.log('⏳ Waiting for URL event (app was already running)...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Check session again in case URL event handler already processed it
          const { data: { session: delayedSession } } = await supabase.auth.getSession()
          if (delayedSession && delayedSession.user) {
            console.log('✅ Session found after delay:', delayedSession.user.email)
            try {
              await handleUserProfile(delayedSession.user)
            } catch (profileError) {
              console.error('⚠️ Error handling user profile:', profileError)
            }
            router.replace('/(tabs)/home')
            return
          }
          
          setError('Could not detect authentication callback. Please try signing in again.')
          setLoading(false)
          setTimeout(() => {
            router.replace('/auth/login')
          }, 3000)
          return
        }
        
        // Parse the full URL
        console.log('📱 Parsing initial URL (length:', fullUrl.length, ')')
        urlParams = parseUrlParams(fullUrl)
        console.log('📦 Parsed URL params keys:', Object.keys(urlParams))
      } catch (e) {
        console.error('❌ Error getting initial URL:', e)
        setError('Error processing authentication callback')
        setLoading(false)
        setTimeout(() => {
          router.replace('/auth/login')
        }, 3000)
        return
      }

      // Merge params from useLocalSearchParams and parsed URL (prioritize parsed URL)
      const allParams = { ...params, ...urlParams }
      console.log('📦 All merged params keys:', Object.keys(allParams))
      console.log('📦 Full URL length:', fullUrl?.length)

      // Check for OAuth tokens in hash OR code in query (Supabase can use either)
      const accessToken = allParams.access_token as string
      const refreshToken = allParams.refresh_token as string
      const code = allParams.code as string
      const errorParam = (allParams.error || allParams['#error'] || params.error) as string
      const errorDescription = (allParams.error_description || allParams['#error_description'] || params.error_description) as string
      
      // Debug: Log what we found
      console.log('🔍 Authentication data check:')
      console.log('  access_token exists:', !!accessToken, 'length:', accessToken?.length)
      console.log('  refresh_token exists:', !!refreshToken, 'length:', refreshToken?.length)
      console.log('  code exists:', !!code, 'length:', code?.length)
      
      if (refreshToken && refreshToken.length < 50) {
        console.warn('⚠️ WARNING: Refresh token seems too short! This might indicate a parsing issue.')
        console.warn('  Refresh token preview:', refreshToken.substring(0, 20))
      }

      // Handle OAuth errors
      if (errorParam) {
        console.error('❌ OAuth error:', errorParam, errorDescription)
        setError(errorDescription || errorParam || 'Authentication failed')
        setLoading(false)
        setTimeout(() => {
          router.replace('/auth/login')
        }, 3000)
        return
      }

      // Priority 1: If we have a code (magic links), exchange it for session
      // This is more reliable than token-based auth
      if (code) {
        console.log('✅ Code found in callback, exchanging for session...')
        await exchangeCodeForSession(code)
        return
      }

      // Priority 2: If we have tokens in the hash, manually set the session
      // detectSessionInUrl doesn't work for deep links, so we need to do it manually
      if (accessToken && refreshToken) {
        console.log('✅ OAuth tokens found in URL hash')
        
        // Check if refresh token seems too short (likely parsing issue)
        let finalAccessToken = accessToken
        let finalRefreshToken = refreshToken
        
        if (refreshToken.length < 50 && fullUrl) {
          console.warn('⚠️ Refresh token seems too short, trying direct extraction from raw URL...')
          // Try extracting directly from raw URL using regex
          const rawAccessMatch = fullUrl.match(/access_token=([^&]+)/)
          const rawRefreshMatch = fullUrl.match(/refresh_token=([^&]+)/)
          
          if (rawAccessMatch && rawAccessMatch[1] && rawAccessMatch[1].length > accessToken.length) {
            console.log('✅ Found longer access_token in raw URL')
            finalAccessToken = rawAccessMatch[1]
          }
          
          if (rawRefreshMatch && rawRefreshMatch[1] && rawRefreshMatch[1].length > refreshToken.length) {
            console.log('✅ Found longer refresh_token in raw URL')
            finalRefreshToken = rawRefreshMatch[1]
          }
        }
        
        console.log('🔐 Manually setting session with tokens...')
        
        try {
          // Extract tokens - they might be URL encoded
          const token = decodeURIComponent(finalAccessToken).trim()
          const refresh = decodeURIComponent(finalRefreshToken).trim()
          
          console.log('📋 Final token lengths:', { access: token.length, refresh: refresh.length })
          
          // If refresh token is too short, check if Supabase auto-detected session first
          if (refresh.length < 50) {
            console.warn('⚠️ Refresh token seems too short (length:', refresh.length, ')')
            console.warn('  This might indicate URL truncation, but checking if session was auto-detected...')
            
            // Wait a moment for Supabase to potentially auto-detect from URL
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Check if session was auto-detected despite truncated token
            const { data: { session: autoSession }, error: autoError } = await supabase.auth.getSession()
            if (autoSession && autoSession.user) {
              console.log('✅ Session was auto-detected despite truncated token!')
              try {
                await handleUserProfile(autoSession.user)
              } catch (profileError) {
                console.error('⚠️ Error handling user profile:', profileError)
              }
              router.replace('/(tabs)/home')
              return
            }
            
            // Also check getUser
            const { data: { user: autoUser }, error: userError } = await supabase.auth.getUser()
            if (!userError && autoUser) {
              console.log('✅ User was auto-detected despite truncated token!')
              try {
                await handleUserProfile(autoUser)
              } catch (profileError) {
                console.error('⚠️ Error handling user profile:', profileError)
              }
              router.replace('/(tabs)/home')
              return
            }
            
            // If no auto-detection, suggest using Magic Link instead
            console.error('❌ Refresh token is too short and no session was auto-detected')
            console.error('💡 Tip: Try using Magic Link authentication instead - it\'s more reliable!')
            setError('OAuth token appears to be truncated. Please try using Magic Link authentication instead (more reliable for mobile apps).')
            setLoading(false)
            setTimeout(() => {
              router.replace('/auth/login')
            }, 5000)
            return
          }
          
          console.log('🔐 Attempting to set session...')
          
          // Wait a moment to ensure Supabase client is ready
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Try setting session - wrap in try/catch to handle errors gracefully
          let sessionSet = false
          try {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refresh,
            })

            if (setSessionError) {
              console.warn('⚠️ setSession returned error (but may have worked):', setSessionError.message)
            } else if (data.session && data.user) {
              console.log('✅ Session set successfully via setSession:', data.user.email)
              sessionSet = true
              try {
                await handleUserProfile(data.user)
              } catch (profileError) {
                console.error('⚠️ Error handling user profile:', profileError)
              }
              router.replace('/(tabs)/home')
              return
            }
          } catch (setSessionErr: any) {
            console.warn('⚠️ setSession threw error (but may have worked):', setSessionErr.message)
          }
          
          // Even if setSession had errors, check if session was actually set
          // Sometimes Supabase sets it despite errors
          for (let attempt = 0; attempt < 3; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 300))
            
            const { data: { session: checkSession }, error: sessionError } = await supabase.auth.getSession()
            if (sessionError) {
              console.warn(`⚠️ Error checking session (attempt ${attempt + 1}):`, sessionError.message)
            }
            
            if (checkSession && checkSession.user) {
              console.log('✅ Session detected after setSession:', checkSession.user.email)
              try {
                await handleUserProfile(checkSession.user)
              } catch (profileError) {
                console.error('⚠️ Error handling user profile:', profileError)
              }
              router.replace('/(tabs)/home')
              return
            }
            
            // Also try getUser as a fallback
            const { data: { user: checkUser }, error: userError } = await supabase.auth.getUser()
            if (!userError && checkUser) {
              console.log('✅ User detected via getUser:', checkUser.email)
              try {
                await handleUserProfile(checkUser)
              } catch (profileError) {
                console.error('⚠️ Error handling user profile:', profileError)
              }
              router.replace('/(tabs)/home')
              return
            }
          }
          
          // If we get here, session wasn't set
          throw new Error('Session could not be set or detected')
        } catch (err: any) {
          console.error('❌ Error setting session:', err)
          setError('Failed to create session. Please try signing in again.')
          setLoading(false)
          setTimeout(() => {
            router.replace('/auth/login')
          }, 5000)
          return
        }
      }

      // If no tokens and no code, check if session already exists
      console.log('⚠️ No tokens or code found, checking for existing session...')
      console.log('📋 Available param keys:', Object.keys(allParams))
      
      // Wait a moment - sometimes Supabase needs time to process the redirect
      console.log('⏳ Waiting 1 second for Supabase to process...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Final check: maybe Supabase handled it automatically
      console.log('🔄 Checking session one more time after delay...')
      const { data: { session: finalCheckSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('❌ Error checking session:', sessionError)
      }
      
      if (finalCheckSession && finalCheckSession.user) {
        console.log('✅ Session found on final check - OAuth completed!')
        console.log('👤 User:', finalCheckSession.user.email)
        try {
          await handleUserProfile(finalCheckSession.user)
        } catch (profileError) {
          console.error('⚠️ Error handling user profile, but continuing:', profileError)
        }
        router.replace('/(tabs)/home')
        return
      }
      
      // If still no session, show helpful error
      console.error('❌ No session found after all checks')
      setError('OAuth redirect received but could not create session. Please try signing in again.')
      setLoading(false)
      setTimeout(() => {
        router.replace('/auth/login')
      }, 5000)
    } catch (err: any) {
      console.error('❌ OAuth callback error:', err)
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
      setTimeout(() => {
        router.replace('/auth/login')
      }, 3000)
    }
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.text}>Completing sign in...</Text>
        </>
      ) : error ? (
        <>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Text style={styles.text}>Redirecting to login...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.text}>Sign in successful!</Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
})

