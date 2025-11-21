import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { name, email, featureDescription } = body
    
    if (!name || !email || !featureDescription) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and featureDescription are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Format email content
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
              background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%); 
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
              border-left: 4px solid #9333EA;
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
            .description-box {
              margin: 15px 0;
              padding: 20px;
              background: #f9fafb;
              border-radius: 6px;
              border-left: 4px solid #9333EA;
            }
            .description-text {
              font-size: 15px;
              color: #374151;
              line-height: 1.6;
              white-space: pre-wrap;
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
              <h1 style="margin: 0; font-size: 24px;">💡 New Feature Request</h1>
            </div>
            <div class="content">
              <p style="margin-top: 0; font-size: 16px; color: #4b5563;">
                Someone has submitted a feature request through the DoorIQ features page:
              </p>
              
              <div class="info-row">
                <div class="info-label">Name</div>
                <div class="info-value">${name}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">${email}</div>
              </div>
              
              <div class="description-box">
                <div class="info-label">Feature Description</div>
                <div class="description-text">${featureDescription.replace(/\n/g, '<br>')}</div>
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

    // Send email to contact@dooriq.ai
    await sendEmail({
      to: 'contact@dooriq.ai',
      subject: `New Feature Request from ${name}`,
      html
    })

    return NextResponse.json({
      success: true,
      message: 'Feature request submitted successfully'
    })

  } catch (error: any) {
    console.error('Feature request error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feature request' },
      { status: 500 }
    )
  }
}

