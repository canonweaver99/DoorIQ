import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    const testEmail = email || 'canonweaver@loopline.design'
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
    }

    // Welcome email template from subscription route
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .email-content { background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #8b5cf6; font-size: 28px; margin: 0 0 10px 0; }
            .content { color: #4b5563; font-size: 16px; }
            .content p { margin: 16px 0; }
            .signature { margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb; }
            .signature p { margin: 8px 0; color: #6b7280; }
            .signature strong { color: #1f2937; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-content">
              <div class="header">
                <h1>Welcome to DoorIQ! 🚀</h1>
              </div>
              <div class="content">
                <p>Hey there,</p>
                <p>Canon here, founder of DoorIQ. I wanted to personally thank you for joining us and trusting DoorIQ to help sharpen your door-to-door sales skills.</p>
                <p>When I built DoorIQ, I had one goal in mind: create the most realistic sales training experience possible, without the rejection and burnout that comes from learning on real doors. Every AI homeowner personality, every objection pattern, and every piece of feedback has been carefully crafted to accelerate your growth as a sales professional.</p>
                <p>You've just taken a huge step toward mastering your craft. Whether you're perfecting your pitch, handling tough objections, or building confidence, our AI agents are here 24/7 to help you practice in a safe, judgment-free environment.</p>
                <p><strong>Here's my advice as you get started:</strong> Don't aim for perfection on your first sessions. Focus on getting comfortable with the platform, try different approaches, and pay attention to the feedback. The beauty of DoorIQ is that you can fail fast, learn faster, and improve without any real-world consequences.</p>
                <p>If you ever have questions, suggestions, or just want to share a win from the field after applying what you've practiced, I'd love to hear from you. I'm building this for sales professionals like you, and your feedback directly shapes what we build next.</p>
                <p><strong>Time to knock on some virtual doors. Let's get after it!</strong></p>
                <div class="signature">
                  <p><strong>Canon Weaver</strong></p>
                  <p>Founder, DoorIQ</p>
                </div>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const { data, error } = await resend.emails.send({
      from: 'Canon Weaver <welcome@dooriq.ai>',
      to: testEmail,
      subject: 'Welcome to DoorIQ! 🚀',
      html: emailHtml,
      reply_to: 'canonweaver@loopline.design'
    })

    if (error) {
      console.error('Error sending welcome email:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      messageId: data?.id,
      email: testEmail,
      message: `Welcome email sent successfully to ${testEmail}`
    })
  } catch (error: any) {
    console.error('Error in test-welcome route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}

