import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Lazy initialize Resend to avoid build-time errors
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  try {
    const { name, industry, numReps, email, referralSource } = await request.json()

    // Validate required fields
    if (!name || !industry || !numReps || !email || !referralSource) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate number of reps
    const reps = parseInt(numReps)
    if (isNaN(reps) || reps < 5 || reps > 100) {
      return NextResponse.json(
        { error: 'Number of reps must be between 5 and 100' },
        { status: 400 }
      )
    }

    const resend = getResendClient()
    if (!resend) {
      console.error('Resend API key not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    // Send email notification
    const adminEmail = 'canonweaver@loopline.design'
    const subject = `New Pricing Inquiry: ${name}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 0;
              padding: 0;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .header { 
              background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
              color: white; 
              padding: 30px; 
              text-align: center; 
              border-radius: 8px 8px 0 0; 
            }
            .content { 
              background: #ffffff; 
              padding: 30px; 
              border: 1px solid #e5e7eb; 
              border-top: none; 
              border-radius: 0 0 8px 8px; 
            }
            .info-row { 
              margin: 15px 0; 
              padding: 15px; 
              background: #f9fafb; 
              border-radius: 6px; 
              border-left: 4px solid #10b981;
            }
            .info-label { 
              font-weight: 600; 
              color: #6b7280; 
              font-size: 12px; 
              text-transform: uppercase; 
              letter-spacing: 0.5px; 
              margin-bottom: 5px;
            }
            .info-value { 
              font-size: 16px; 
              color: #111827; 
              font-weight: 500;
            }
            .footer { 
              text-align: center; 
              padding: 20px; 
              color: #6b7280; 
              font-size: 14px; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">🚪 New Pricing Inquiry</h1>
            </div>
            <div class="content">
              <p style="margin-top: 0; font-size: 16px; color: #4b5563;">
                Someone has filled out the pricing contact form:
              </p>
              
              <div class="info-row">
                <div class="info-label">Name</div>
                <div class="info-value">${name}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">${email}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Industry</div>
                <div class="info-value">${industry}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Number of Sales Reps</div>
                <div class="info-value">${numReps}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">How They Found DoorIQ</div>
                <div class="info-value">${referralSource}</div>
              </div>
              
              <div class="info-row" style="background: #eff6ff; border-left-color: #3b82f6;">
                <div class="info-label" style="color: #1e40af;">Submitted At</div>
                <div class="info-value" style="color: #1e40af;">
                  ${new Date().toLocaleString('en-US', { 
                    timeZone: 'America/New_York', 
                    dateStyle: 'full', 
                    timeStyle: 'long' 
                  })}
                </div>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'DoorIQ <notifications@dooriq.ai>',
      to: adminEmail,
      subject,
      html,
      reply_to: email // Set reply-to to the user's email so you can reply directly
    })

    if (error) {
      console.error('Resend error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to send email' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id 
    })
  } catch (error: any) {
    console.error('Pricing contact form error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    )
  }
}

