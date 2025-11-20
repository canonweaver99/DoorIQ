const { Resend } = require('resend')
require('dotenv').config({ path: '.env.local' })

const resend = new Resend(process.env.RESEND_API_KEY)

const email = 'canonweaver@loopline.design'

const emailHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.7; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
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
            <h1>Just Checking In 👋</h1>
          </div>
          <div class="content">
            <p>Hey there,</p>
            <p>Canon here, just wanted to check in and see how things are going with DoorIQ!</p>
            <p>I hope you've been able to get some practice sessions in and that the platform is helping you sharpen your sales skills. Whether you're working on handling objections, perfecting your pitch, or building confidence, I'm here to support your journey.</p>
            <p>If you've had a chance to use DoorIQ, I'd love to hear about your experience. What's working well? What could be better? Your feedback helps me make DoorIQ even more valuable for sales professionals like you.</p>
            <p>And if you haven't had a chance to dive in yet, no worries! The AI agents are always ready when you are. Remember, every session is a chance to improve without any real-world consequences.</p>
            <p>Feel free to reply to this email if you have any questions, feedback, or just want to share how things are going. I'm always happy to hear from you!</p>
            <p><strong>Keep knocking on those virtual doors!</strong></p>
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

async function sendCheckInEmail() {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      process.exit(1)
    }

    console.log(`📧 Sending check-in email to ${email}...`)

    const { data, error } = await resend.emails.send({
      from: 'Canon Weaver <welcome@dooriq.ai>',
      to: email,
      subject: 'Just Checking In 👋',
      html: emailHtml,
      reply_to: 'canonweaver@loopline.design'
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      process.exit(1)
    }

    console.log(`✅ Check-in email sent successfully!`)
    console.log(`📬 Email ID: ${data?.id}`)
    console.log(`📧 Sent to: ${email}`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

sendCheckInEmail()

