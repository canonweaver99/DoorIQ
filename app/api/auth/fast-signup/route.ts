import { NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

/**
 * Send confirmation email to newly created user
 * Uses Supabase admin API to resend confirmation email
 */
export async function sendEmailWithLink(email: string, confirmationLink: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY not configured - cannot send confirmation email')
    console.warn('⚠️ Confirmation link generated but email not sent:', confirmationLink)
    return false
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
line-height: 1.6; color: #e2e8f0; margin: 0; padding: 0; background: #02010A; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0A0420 0%, #120836 100%); border: 1px solid rgba(168, 85, 247, 0.2); padding: 50px 40px; text-align: center; border-radius: 12px 12px 0 0; }
            .logo-container { margin-bottom: 20px; }
            .logo { max-width: 180px; height: auto; margin: 0 auto; }
            .header-text { color: white; font-size: 28px; font-weight: 700; margin: 16px 0 8px 0; letter-spacing: -0.5px; }
            .header-subtext { color: rgba(255, 255, 255, 0.7); font-size: 14px; margin: 0; }
            .content { background: #0A0420; border: 1px solid rgba(168, 85, 247, 0.1); border-top: none; padding: 50px 40px; border-radius: 0 0 12px 12px; }
            .content h2 { color: #f1f5f9; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 20px; }
            .content p { color: #cbd5e1; font-size: 16px; line-height: 1.7; margin: 16px 0; }
            .button-container { text-align: center; margin: 40px 0; }
            .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: #ffffff !important; padding: 16px 40px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4); transition: transform 0.2s; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); }
            .button:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5); color: #ffffff !important; }
            .fallback-text { color: #94a3b8; font-size: 14px; margin-top: 32px; }
            .fallback-link { color: #a855f7; font-size: 12px; word-break: break-all; margin-top: 8px; display: block; }
            .footer { text-align: center; padding: 30px 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-container">
                <img src="https://dooriq.ai/dooriqlogo.png" alt="DoorIQ" class="logo" />
              </div>
              <h1 class="header-text">Confirm Your Email</h1>
              <p class="header-subtext">AI-Powered Sales Training</p>
            </div>
            <div class="content">
              <p style="margin-bottom: 24px;">
                Thanks for signing up for DoorIQ! We're excited to help you master door-to-door sales.
              </p>
              <p style="margin-bottom: 32px;">
                Please confirm your email address by clicking the button below to activate your account and start training.
              </p>
              <div class="button-container">
                <a href="${confirmationLink}" class="button">Confirm Email Address</a>
              </div>
              <div class="fallback-text">
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <a href="${confirmationLink}" class="fallback-link">${confirmationLink}</a>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
              <p style="margin-top: 8px;">This email was sent to verify your account. If you didn't sign up, you can safely ignore this email.</p>
            </div>
          </div>
        </body>
      </html>
    `
    
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'DoorIQ <noreply@dooriq.ai>'
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: email.toLowerCase(),
      subject: 'Confirm your DoorIQ account',
      html: emailHtml,
      reply_to: 'canonweaver@loopline.design'
    })

    if (emailError) {
      console.error('❌ Error sending email via Resend:', emailError)
      return false
    }

    console.log(`✅ Confirmation email sent via Resend to ${email} (ID: ${emailData?.id})`)
    return true
  } catch (error: any) {
    console.error('❌ Error sending email via Resend:', error)
    return false
  }
}

async function sendConfirmationEmail(supabase: any, email: string, userId: string, redirectUrl?: string) {
  try {
    console.log(`📧 Attempting to send confirmation email to ${email}...`)
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                    process.env.NEXT_PUBLIC_APP_URL || 
                    'https://dooriq.ai'
    
    // Use provided redirect URL or default to callback
    const finalRedirectTo = redirectUrl || `${siteUrl}/auth/callback`
    
    // Generate confirmation link using generateLink
    // Note: These links expire quickly by default, but we'll generate a fresh one each time
    const { data: linkData, error: linkError } = await (supabase as any).auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: {
        redirectTo: finalRedirectTo
      }
    })

    if (linkError) {
      console.error('❌ Error generating confirmation link:', linkError)
      return false
    }

    if (!linkData?.properties?.action_link) {
      console.error('❌ No action_link in generated link response')
      return false
    }

    const confirmationLink = linkData.properties.action_link
    console.log(`✅ Generated confirmation link: ${confirmationLink}`)

    // Send email via Resend if configured
    if (process.env.RESEND_API_KEY) {
      return await sendEmailWithLink(email, confirmationLink)
    } else {
      console.warn('⚠️ RESEND_API_KEY not configured - cannot send confirmation email')
      console.warn('⚠️ Confirmation link generated but email not sent:', confirmationLink)
      return false
    }
  } catch (error: any) {
    console.error('❌ Error sending confirmation email:', error)
    return false
  }
}

export async function POST(req: Request) {
  try {
    const { email, password, full_name, redirectUrl, invite_token, checkout_intent } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 })
    }

    const supabase = await createServiceSupabaseClient()

    // ============================================
    // INVITE-ONLY SIGNUP VALIDATION
    // ============================================
    // Require either invite token or checkout intent
    if (!invite_token && !checkout_intent) {
      return NextResponse.json({ 
        error: 'Signups are invite-only. Please use a valid invite link or complete checkout first.' 
      }, { status: 403 })
    }

    // Validate invite token if provided
    let inviteData = null
    if (invite_token) {
      const { data: invite, error: inviteError } = await supabase
        .from('admin_invites')
        .select('*')
        .eq('token', invite_token)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single()
      
      if (inviteError || !invite) {
        return NextResponse.json({ 
          error: 'Invalid or expired invite token. Please request a new invite.' 
        }, { status: 403 })
      }
      
      // Check email match if invite has email
      if (invite.email && invite.email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json({ 
          error: 'This invite is for a different email address.' 
        }, { status: 403 })
      }
      
      inviteData = invite
    }

    // Validate checkout intent if provided
    // Note: For now, we just check if checkout_intent exists
    // In production, you might want to verify the Stripe session status
    if (checkout_intent) {
      // TODO: Verify Stripe checkout session is completed
      // For now, just allow if checkout_intent is present
      console.log('✅ Checkout intent provided:', checkout_intent)
    }

    // Try to create user first
    // Set email_confirm to false so Supabase sends confirmation email automatically
    let { data, error } = await (supabase as any).auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { full_name },
      email_redirect_to: redirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'}/auth/callback`
    })

    // If user already exists, delete the orphaned Auth user and retry
    if (error) {
      const alreadyExists = (error.message || '').toLowerCase().includes('already registered') || 
                           (error.message || '').toLowerCase().includes('already exists') ||
                           error.status === 422
      
      if (alreadyExists) {
        console.log(`🔄 User with email ${email} exists in Auth but was deleted from database. Cleaning up to allow re-registration...`)
        
        // Find the user by email and delete from Auth
        const { data: usersData } = await (supabase as any).auth.admin.listUsers()
        if (usersData?.users) {
          const existingUser = usersData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())
          
          if (existingUser) {
            // Delete the existing user from Auth
            const { error: deleteError } = await (supabase as any).auth.admin.deleteUser(existingUser.id)
            
            if (deleteError) {
              console.error('❌ Error deleting existing user from Auth:', deleteError)
              return NextResponse.json({ error: 'Failed to clean up existing account. Please contact support.' }, { status: 400 })
            }
            
            console.log('✅ Deleted orphaned user from Auth, retrying signup...')
            
            // Retry creating the user
            const retryResult = await (supabase as any).auth.admin.createUser({
              email,
              password,
              email_confirm: false,
              user_metadata: { full_name },
              email_redirect_to: redirectUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dooriq.ai'}/auth/callback`
            })
            
            if (retryResult.error) {
              return NextResponse.json({ error: retryResult.error.message || 'Failed to create account after cleanup' }, { status: 400 })
            }
            
            // Send confirmation email for retry
            if (retryResult.data?.user?.id) {
              await sendConfirmationEmail(supabase, email, retryResult.data.user.id, redirectUrl)
            }
            
            return NextResponse.json({ success: true, userId: retryResult.data?.user?.id || null })
          }
        }
        
        // If we couldn't find or delete the user, return helpful error
        return NextResponse.json({ 
          error: 'Email already registered. If you deleted your account, please wait a few minutes and try again, or contact support.' 
        }, { status: 400 })
      }
      
      // Other errors
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Send custom branded confirmation email
    // IMPORTANT: Links generated by generateLink expire quickly (default ~1 hour)
    // To increase expiration time, configure "Email OTP Expiration" in Supabase dashboard:
    // Authentication → Email Templates → Email OTP Expiration
    // Recommended: Set to 24-48 hours to prevent expiration issues
    if (data?.user?.id) {
      await sendConfirmationEmail(supabase, email, data.user.id, redirectUrl)
      
      // Mark invite as used if invite token was provided
      if (invite_token && inviteData) {
        await supabase
          .from('admin_invites')
          .update({
            used_at: new Date().toISOString(),
            used_by: data.user.id
          })
          .eq('token', invite_token)
        
        console.log('✅ Invite marked as used:', invite_token)
      }
    }

    return NextResponse.json({ success: true, userId: data?.user?.id || null })
  } catch (e: any) {
    console.error('❌ Signup error:', e)
    return NextResponse.json({ error: e.message || 'Signup failed' }, { status: 500 })
  }
}


