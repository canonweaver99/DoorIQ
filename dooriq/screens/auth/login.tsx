import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native'
import { Link, router } from 'expo-router'
import { supabase } from '../../lib/supabase/client'
import { getUserFriendlyError } from '../../lib/errorLogger'
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '../../constants/theme'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [showMagicLink, setShowMagicLink] = useState(false)
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Attempting to sign in...')
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        throw signInError
      }

      // Verify session was created
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Session not created after sign in')
      }

      console.log('Sign in successful, session verified, navigating to home...')
      
      // Wait a moment for auth state to update, then navigate
      setTimeout(() => {
        try {
          if (router && typeof router.replace === 'function') {
            // Navigate to tabs home to match index.tsx redirect logic
            router.replace('/(tabs)/home')
          } else {
            console.error('Router not available or replace method missing')
            setError('Sign in successful but navigation failed. Please restart the app.')
            setLoading(false)
          }
        } catch (navError: any) {
          console.error('Navigation error:', navError)
          setError('Sign in successful but navigation failed: ' + (navError.message || 'Unknown error'))
          setLoading(false)
        }
      }, 300)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(getUserFriendlyError(err))
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(resetEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setResetLoading(true)
    setError(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'dooriq://auth/reset-password',
      })

      if (resetError) throw resetError

      Alert.alert(
        'Password Reset Sent',
        'Check your email for a password reset link. You can close this screen.',
        [
          {
            text: 'OK',
            onPress: () => setShowPasswordReset(false),
          },
        ]
      )
      setResetEmail('')
    } catch (err: any) {
      setError(getUserFriendlyError(err))
    } finally {
      setResetLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log('🔐 Attempting Google sign in...')
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'dooriq://auth/callback',
        },
      })

      console.log('📦 OAuth response:', { 
        hasData: !!data, 
        hasUrl: !!data?.url, 
        url: data?.url,
        error: signInError 
      })

      if (signInError) {
        console.error('❌ Google OAuth error:', signInError)
        throw signInError
      }

      // In React Native, we need to manually open the OAuth URL
      if (data?.url) {
        console.log('✅ Opening OAuth URL:', data.url)
        const canOpen = await Linking.canOpenURL(data.url)
        if (canOpen) {
          await Linking.openURL(data.url)
          // Don't reset loading - the OAuth flow will redirect back to the app
          // The loading state will be reset when the user returns from OAuth
          return
        } else {
          throw new Error('Cannot open OAuth URL. Please check your app configuration.')
        }
      }

      // If no URL returned, show error
      console.error('❌ No URL returned from OAuth')
      setLoading(false)
      setError('Failed to get OAuth URL. Please try again.')
    } catch (err: any) {
      console.error('❌ Google sign in error:', err)
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    if (!magicLinkEmail) {
      setError('Please enter your email address')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(magicLinkEmail)) {
      setError('Please enter a valid email address')
      return
    }

    setMagicLinkLoading(true)
    setError(null)

    try {
      console.log('📧 Sending magic link to:', magicLinkEmail)
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: magicLinkEmail,
        options: {
          emailRedirectTo: 'dooriq://auth/callback',
        },
      })

      if (magicLinkError) {
        console.error('❌ Magic link error:', magicLinkError)
        throw magicLinkError
      }

      console.log('✅ Magic link sent successfully')
      setMagicLinkSent(true)
      Alert.alert(
        'Magic Link Sent!',
        `Check your email (${magicLinkEmail}) for a sign-in link. Click the link to sign in.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Keep the magic link UI open so user can see the message
            },
          },
        ]
      )
    } catch (err: any) {
      console.error('❌ Magic link error:', err)
      setError(getUserFriendlyError(err))
    } finally {
      setMagicLinkLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome to</Text>
            <Text style={styles.brandTitle}>DoorIQ</Text>
            <Text style={styles.subtitle}>
              Access your training sessions and master door-to-door sales
            </Text>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPasswordReset(true)}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>

            {showPasswordReset && (
              <View style={styles.passwordResetContainer}>
                <Text style={styles.passwordResetTitle}>Reset Password</Text>
                <Text style={styles.passwordResetSubtitle}>
                  Enter your email and we'll send you a reset link
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!resetLoading}
                />
                <View style={styles.passwordResetActions}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonSecondary]}
                    onPress={() => {
                      setShowPasswordReset(false)
                      setResetEmail('')
                    }}
                    disabled={resetLoading}
                  >
                    <Text style={styles.buttonSecondaryText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, resetLoading && styles.buttonDisabled]}
                    onPress={handlePasswordReset}
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Send Reset Link</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {showMagicLink ? (
              <View style={styles.magicLinkContainer}>
                {magicLinkSent ? (
                  <View style={styles.magicLinkSuccess}>
                    <Text style={styles.magicLinkSuccessText}>
                      ✅ Check your email for a sign-in link!
                    </Text>
                    <Text style={styles.magicLinkSuccessSubtext}>
                      Click the link in your email to sign in. You can close this screen.
                    </Text>
                    <TouchableOpacity
                      style={[styles.button, styles.buttonSecondary]}
                      onPress={() => {
                        setShowMagicLink(false)
                        setMagicLinkEmail('')
                        setMagicLinkSent(false)
                      }}
                    >
                      <Text style={styles.buttonSecondaryText}>Back to Login</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.magicLinkTitle}>Sign in with Magic Link</Text>
                    <Text style={styles.magicLinkSubtitle}>
                      Enter your email and we'll send you a sign-in link
                    </Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor="#666"
                      value={magicLinkEmail}
                      onChangeText={setMagicLinkEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoComplete="email"
                      editable={!magicLinkLoading}
                    />
                    <View style={styles.magicLinkActions}>
                      <TouchableOpacity
                        style={[styles.button, styles.buttonSecondary]}
                        onPress={() => {
                          setShowMagicLink(false)
                          setMagicLinkEmail('')
                          setMagicLinkSent(false)
                        }}
                        disabled={magicLinkLoading}
                      >
                        <Text style={styles.buttonSecondaryText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, magicLinkLoading && styles.buttonDisabled]}
                        onPress={handleMagicLink}
                        disabled={magicLinkLoading}
                      >
                        {magicLinkLoading ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.buttonText}>Send Magic Link</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.buttonMagicLink, loading && styles.buttonDisabled]}
                  onPress={() => setShowMagicLink(true)}
                  disabled={loading}
                >
                  <Text style={styles.buttonMagicLinkText}>Sign in with Magic Link</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.buttonGoogle, loading && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  disabled={loading}
                >
                  <Text style={styles.buttonGoogleText}>Continue with Google</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <Link href="/auth/signup" asChild>
                <TouchableOpacity>
                  <Text style={styles.footerLink}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#a855f7',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    height: 56,
  },
  button: {
    backgroundColor: '#a855f7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGoogle: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  buttonGoogleText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a2a2a',
  },
  dividerText: {
    color: '#666',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  footerLink: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#dc2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.xs,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
  },
  passwordResetContainer: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  passwordResetTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  passwordResetSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  passwordResetActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  buttonSecondary: {
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonSecondaryText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonMagicLink: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  buttonMagicLinkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  magicLinkContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  magicLinkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  magicLinkSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  magicLinkActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  magicLinkSuccess: {
    alignItems: 'center',
  },
  magicLinkSuccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  magicLinkSuccessSubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
})

