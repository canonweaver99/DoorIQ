import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email templates for different subscription events
const EMAIL_TEMPLATES = {
  trial_started: (data: any) => ({
    subject: '🎉 Welcome to DoorIQ - Your 7-Day Free Trial Starts Now!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8b5cf6;">Welcome to DoorIQ!</h1>
        <p>Your 7-day free trial has started! You now have full access to all premium features:</p>
        <ul>
          <li>✅ Access to ALL 12 AI training agents</li>
          <li>✅ Unlimited practice sessions</li>
          <li>✅ Advanced analytics & scoring</li>
          <li>✅ Real-time feedback & coaching</li>
          <li>✅ Custom sales scenarios</li>
          <li>✅ Priority support</li>
        </ul>
        <p>Your trial ends on <strong>${new Date(data.trialEndsAt * 1000).toLocaleDateString()}</strong>.</p>
        <p>No credit card charges will occur until after your trial period. Cancel anytime before then.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/trainer" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Start Training Now
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Questions? Reply to this email or visit our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Help Center</a>.
        </p>
      </div>
    `
  }),

  trial_ending_soon: (data: any) => ({
    subject: `⏰ Your DoorIQ Trial Ends in ${data.daysRemaining} Day${data.daysRemaining !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Your Trial is Ending Soon</h1>
        <p>Your 7-day free trial of DoorIQ will end in <strong>${data.daysRemaining} day${data.daysRemaining !== 1 ? 's' : ''}</strong>.</p>
        <p>To continue enjoying unlimited access to all features, your subscription will automatically start on <strong>${new Date(data.trialEndsAt * 1000).toLocaleDateString()}</strong>.</p>
        
        <h3>What happens next?</h3>
        <ul>
          <li>💳 Your payment method will be charged on ${new Date(data.trialEndsAt * 1000).toLocaleDateString()}</li>
          <li>✨ You'll continue with uninterrupted access to all premium features</li>
          <li>🔄 Your subscription will renew automatically each billing period</li>
        </ul>

        <p>Want to cancel? No problem!</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Manage Subscription
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          You can cancel anytime before ${new Date(data.trialEndsAt * 1000).toLocaleDateString()} to avoid being charged.
        </p>
      </div>
    `
  }),

  trial_ended_converted: () => ({
    subject: '🎊 Welcome to DoorIQ Premium!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Welcome to DoorIQ Premium!</h1>
        <p>Your trial has ended and your subscription is now active. Thank you for choosing DoorIQ!</p>
        <p>You now have continued access to:</p>
        <ul>
          <li>✅ All 12 AI training agents</li>
          <li>✅ Unlimited practice sessions</li>
          <li>✅ Advanced analytics</li>
          <li>✅ Priority support</li>
          <li>✅ And much more!</li>
        </ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/trainer" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Continue Training
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Manage your subscription anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing">billing page</a>.
        </p>
      </div>
    `
  }),

  payment_succeeded: (data: any) => ({
    subject: '✅ Payment Successful - DoorIQ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981;">Payment Successful</h1>
        <p>Your payment of <strong>$${data.amount} ${data.currency?.toUpperCase()}</strong> has been processed successfully.</p>
        <p>Your DoorIQ subscription is active and you have continued access to all premium features.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          View Billing Details
        </a>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Thank you for being a valued DoorIQ customer!
        </p>
      </div>
    `
  }),

  payment_failed: (data: any) => ({
    subject: '⚠️ Payment Failed - Action Required',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #ef4444;">Payment Failed</h1>
        <p>We were unable to process your payment of <strong>$${data.amount} ${data.currency?.toUpperCase()}</strong>.</p>
        <p>This was attempt ${data.attemptCount} of 4. To avoid service interruption, please update your payment method.</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
          <strong>What happens if payment continues to fail?</strong>
          <p style="margin: 8px 0 0 0;">After 4 failed attempts, your subscription will be canceled and you'll lose access to premium features.</p>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Update Payment Method
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          Need help? Contact our support team at contact@dooriq.ai
        </p>
      </div>
    `
  }),

  subscription_canceled: () => ({
    subject: 'Your DoorIQ Subscription Has Been Canceled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6b7280;">Subscription Canceled</h1>
        <p>Your DoorIQ subscription has been canceled as requested.</p>
        <p>You still have access to:</p>
        <ul>
          <li>✅ 3 basic AI training agents</li>
          <li>✅ Up to 10 practice calls per month</li>
          <li>✅ Basic performance analytics</li>
        </ul>
        
        <p>We'd love to have you back! Reactivate anytime to regain access to all premium features.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/pricing" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          View Plans
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          We're sorry to see you go. If you have feedback, we'd love to hear it at contact@dooriq.ai
        </p>
      </div>
    `
  }),

  subscription_cancel_scheduled: (data: any) => ({
    subject: 'Subscription Cancellation Confirmed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Cancellation Scheduled</h1>
        <p>Your subscription has been scheduled for cancellation.</p>
        <p>You'll continue to have full access to all premium features until <strong>${new Date(data.cancelAt * 1000).toLocaleDateString()}</strong>.</p>
        
        <p>Changed your mind? You can reactivate your subscription anytime before that date.</p>
        
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/billing" style="display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
          Reactivate Subscription
        </a>
        
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          We're sorry to see you go. If there's anything we can do to improve, please let us know.
        </p>
      </div>
    `
  })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, eventType, data } = await request.json()

    if (!userId || !eventType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user's email
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: user } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (!user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 404 })
    }

    // Get email template
    const template = EMAIL_TEMPLATES[eventType as keyof typeof EMAIL_TEMPLATES]
    if (!template) {
      console.warn(`No email template for event type: ${eventType}`)
      return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    const { subject, html } = template(data)

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'DoorIQ <notifications@dooriq.ai>',
        to: user.email,
        subject,
        html
      })

      // Mark notification as sent
      await supabase
        .from('subscription_events')
        .update({
          notification_sent: true,
          notification_sent_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('event_type', eventType)
        .is('notification_sent', false)

      console.log(`Notification email sent to ${user.email} for event: ${eventType}`)
    } else {
      console.warn('Resend API key not configured, skipping email')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending subscription email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

