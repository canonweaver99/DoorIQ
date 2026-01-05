/**
 * Send personalized email to Malakai Christensen
 * Asking about how he found DoorIQ, his experience, and feedback
 */

require('dotenv').config({ path: '.env.local' })

const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendEmailToMalakai() {
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not configured')
    process.exit(1)
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.7; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background: #f5f5f5; 
          }
          .container { 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
          }
          .email-content { 
            background: #ffffff; 
            padding: 40px; 
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            color: #8b5cf6; 
            font-size: 28px; 
            margin: 0 0 10px 0; 
          }
          .content { 
            color: #4b5563; 
            font-size: 16px; 
          }
          .content p { 
            margin: 16px 0; 
          }
          .questions { 
            background: #f9fafb; 
            padding: 20px; 
            border-radius: 8px; 
            margin: 24px 0; 
            border-left: 4px solid #8b5cf6;
          }
          .questions h3 {
            color: #1f2937;
            margin-top: 0;
            font-size: 18px;
          }
          .questions ul {
            margin: 12px 0;
            padding-left: 24px;
          }
          .questions li {
            margin: 8px 0;
            color: #4b5563;
          }
          .signature { 
            margin-top: 40px; 
            padding-top: 30px; 
            border-top: 1px solid #e5e7eb; 
          }
          .signature p { 
            margin: 8px 0; 
            color: #6b7280; 
          }
          .signature strong { 
            color: #1f2937; 
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #9ca3af; 
            font-size: 14px; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-content">
            <div class="header">
              <h1>Hey Malakai! 👋</h1>
            </div>
            <div class="content">
              <p>Thanks so much for signing up for DoorIQ! I noticed you joined us recently, and I wanted to reach out personally to thank you and learn more about your experience so far.</p>
              
              <p>As the founder of DoorIQ, I'm always curious to hear how people discover us and what they think of the platform. Your feedback helps me understand what's working well and what we can improve.</p>
              
              <div class="questions">
                <h3>I'd love to hear from you:</h3>
                <ul>
                  <li><strong>How did you find out about DoorIQ?</strong> Did someone refer you, or did you come across us online?</li>
                  <li><strong>How have you been liking it so far?</strong> Have you had a chance to try out any practice sessions yet?</li>
                  <li><strong>Any feedback or suggestions?</strong> What's working well? What could be better? I'm all ears!</li>
                </ul>
              </div>
              
              <p>Whether you've already jumped into some practice sessions or you're still exploring, I'd genuinely appreciate hearing your thoughts. Your perspective helps me build a better product for sales professionals like yourself.</p>
              
              <p>Feel free to reply directly to this email—I read every response and would love to hear from you!</p>
              
              <div class="signature">
                <p><strong>Canon Weaver</strong></p>
                <p>Founder, DoorIQ</p>
                <p style="margin-top: 12px;">
                  <a href="mailto:canonweaver@loopline.design" style="color: #8b5cf6; text-decoration: none;">canonweaver@loopline.design</a>
                </p>
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

  try {
    const { data, error } = await resend.emails.send({
      from: 'Canon Weaver <canon@dooriq.ai>',
      to: 'malakai.christensen@gmail.com',
      subject: 'Thanks for joining DoorIQ! Quick question...',
      html: emailHtml,
      reply_to: 'canonweaver@loopline.design'
    })

    if (error) {
      console.error('❌ Error sending email:', error)
      process.exit(1)
    }

    console.log('✅ Email sent successfully!')
    console.log('   To: malakai.christensen@gmail.com')
    console.log('   Subject: Thanks for joining DoorIQ! Quick question...')
    console.log('   Message ID:', data?.id)
  } catch (error) {
    console.error('❌ Failed to send email:', error)
    process.exit(1)
  }
}

sendEmailToMalakai()
