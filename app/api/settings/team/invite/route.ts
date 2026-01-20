
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { addSignatureIfNeeded } from '@/lib/email/send'

// Lazy initialize Resend to avoid build-time errors
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is manager/admin
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'manager' && userData.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only managers can invite team members' },
        { status: 403 }
      )
    }

    if (!userData.organization_id) {
      return NextResponse.json(
        { error: 'You are not part of an organization' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, organization_id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.organization_id === userData.organization_id) {
        return NextResponse.json(
          { error: 'User is already a member of your team' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'User is already part of another organization' },
        { status: 400 }
      )
    }

    // Check seat availability
    const { data: org } = await supabase
      .from('organizations')
      .select('seat_limit, seats_used')
      .eq('id', userData.organization_id)
      .single()

    if (org && org.seats_used >= org.seat_limit) {
      return NextResponse.json(
        { error: 'No available seats. Please add more seats to your plan.' },
        { status: 400 }
      )
    }

    // Generate a unique token
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    
    // Set expiration to 7 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // Create the invite directly
    const { data: invite, error: inviteError } = await supabase
      .from('team_invites')
      .insert({
        team_id: null, // Teams are now within organizations
        organization_id: userData.organization_id,
        invited_by: user.id,
        email: email.toLowerCase(),
        token,
        role: 'rep',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: inviteError.message || 'Failed to create invite' },
        { status: 500 }
      )
    }

    // Generate the invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/invite/${token}`

    // Send invite email via Resend directly
    let emailSent = false
    let emailError: string | null = null
    
    try {
      const { data: inviterData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const resend = getResendClient()
      if (!resend) {
        emailError = 'Email service not configured'
        console.warn('⚠️ Resend API key not configured - skipping email')
      } else {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'invites@dooriq.ai'
        const roleText = 'Sales Rep'

        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
line-height: 1.6; color: #333; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
                .button { display: inline-block; background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 24px 0; font-weight: 600; }
                .role-badge { display: inline-block; background: #f3e8ff; color: #a855f7; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin: 16px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1 style="margin: 0; font-size: 32px;">🚪 DoorIQ</h1>
                  <p style="margin: 8px 0 0 0; opacity: 0.9;">AI-Powered Sales Training</p>
                </div>
                <div class="content">
                  <h2 style="color: #a855f7; margin-top: 0;">You've Been Invited!</h2>
                  <p style="font-size: 16px; color: #4b5563;">
                    ${inviterData?.full_name ? `<strong>${inviterData.full_name}</strong> has` : 'You have been'} invited you to join their team on DoorIQ!
                  </p>
                  <div class="role-badge">${roleText}</div>
                  <p style="font-size: 16px; color: #4b5563; margin-top: 24px;">
                    DoorIQ is the premier AI-powered sales training platform for door-to-door sales teams. 
                    Practice your pitch with 12 realistic AI homeowners, get instant feedback, and become a top performer.
                  </p>
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteUrl}" class="button">Accept Invitation</a>
                  </div>
                  <p style="font-size: 14px; color: #6b7280; margin-top: 32px;">
                    <strong>What you'll get:</strong>
                  </p>
                  <ul style="color: #4b5563; margin: 8px 0;">
                    <li>Access to 14 AI training agents with unique objections</li>
                    <li>Real-time performance analytics and feedback</li>
                    <li>Team leaderboards and competitions</li>
                    <li>Manager coaching and insights</li>
                    <li>Unlimited practice sessions</li>
                  </ul>
                  <p style="font-size: 14px; color: #ef4444; margin-top: 24px; padding: 16px; background: #fef2f2; border-radius: 6px;">
                    ⏰ This invitation expires in 7 days.
                  </p>
                </div>
                <div class="footer">
                  <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
                  <p style="font-size: 12px; margin-top: 8px;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </div>
              </div>
            </body>
          </html>
        `
        
        const htmlWithSignature = addSignatureIfNeeded(emailHtml, fromEmail)

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: email.toLowerCase(),
          subject: `You've been invited to join DoorIQ as a ${roleText}`,
          html: htmlWithSignature,
          reply_to: 'canonweaver@loopline.design'
        })

        if (error) {
          emailError = error.message || 'Failed to send email'
          console.error('❌ Resend error:', error)
        } else {
          emailSent = true
          console.log('✅ Invite email sent successfully to:', email.toLowerCase(), 'Message ID:', data?.id)
        }
      }
    } catch (err) {
      emailError = err instanceof Error ? err.message : 'Failed to send email'
      console.error('❌ Email send error:', err)
    }

    // Return success with warning if email failed, but invite was created
    if (!emailSent) {
      return NextResponse.json({ 
        success: true, 
        message: 'Invitation created successfully, but email could not be sent',
        warning: emailError || 'Email service unavailable',
        inviteUrl // Include invite URL so user can manually send it
      })
    }

    return NextResponse.json({ success: true, message: 'Invitation sent successfully' })
  } catch (error: any) {
    console.error('Error inviting team member:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

