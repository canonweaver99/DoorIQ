import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organizationName,
      seatCount,
      userEmail,
      userName,
      planType = 'team',
      billingPeriod = 'monthly',
      monthlyCost,
      annualCost
    } = body

    if (!organizationName || !seatCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn('Resend API key not configured, skipping email')
      return NextResponse.json({ success: true, message: 'Email service not configured' })
    }

    const adminEmail = process.env.ADMIN_EMAIL || 'canonweaver@loopline.design'
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'DoorIQ <notifications@dooriq.ai>'

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .info-row { padding: 12px 0; border-bottom: 1px solid #f3f4f6; }
            .info-label { font-weight: 600; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { color: #111827; font-size: 16px; margin-top: 4px; }
            .highlight { background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">New ${planType === 'starter' ? 'Starter' : 'Team'} Plan Signup</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; margin-bottom: 24px;">A new ${planType === 'starter' ? 'Starter' : 'Team'} plan signup has been initiated:</p>
              
              <div class="info-row">
                <div class="info-label">Organization Name</div>
                <div class="info-value">${organizationName}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Number of Seats</div>
                <div class="info-value">${seatCount}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Plan Type</div>
                <div class="info-value">${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Billing Period</div>
                <div class="info-value">${billingPeriod === 'annual' ? 'Annual (2 months free)' : 'Monthly'}</div>
              </div>
              
              ${monthlyCost ? `
              <div class="info-row">
                <div class="info-label">${billingPeriod === 'annual' ? 'Annual Cost' : 'Monthly Cost'}</div>
                <div class="info-value">$${billingPeriod === 'annual' ? annualCost?.toLocaleString() || (monthlyCost * 10).toLocaleString() : monthlyCost.toLocaleString()}/${billingPeriod === 'annual' ? 'year' : 'month'}</div>
              </div>
              ` : ''}
              
              ${userName ? `
              <div class="info-row">
                <div class="info-label">Contact Name</div>
                <div class="info-value">${userName}</div>
              </div>
              ` : ''}
              
              ${userEmail ? `
              <div class="info-row">
                <div class="info-label">Contact Email</div>
                <div class="info-value"><a href="mailto:${userEmail}" style="color: #a855f7;">${userEmail}</a></div>
              </div>
              ` : ''}
              
              <div class="highlight">
                <strong>Next Steps:</strong><br>
                The user has been redirected to Stripe checkout to complete their ${planType === 'starter' ? 'Starter' : 'Team'} plan signup with a 14-day free trial.
              </div>
              
              <p style="margin-top: 24px; color: #6b7280; font-size: 14px;">
                This is an automated notification from DoorIQ.
              </p>
            </div>
            <div class="footer">
              <p>DoorIQ Team Signup Notification</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `New ${planType === 'starter' ? 'Starter' : 'Team'} Plan Signup: ${organizationName}`,
      html: emailHtml,
      reply_to: userEmail || 'canonweaver@loopline.design'
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: data?.id })
  } catch (error: any) {
    console.error('Error sending team signup email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

