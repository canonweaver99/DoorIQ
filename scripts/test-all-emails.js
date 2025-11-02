/**
 * Test All Email Addresses
 * Sends a test email from each dooriq.ai email address
 */

require('dotenv').config({ path: '.env.local' })
const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)
const recipientEmail = 'canonweaver@loopline.design'

const emailAddresses = [
  {
    from: 'notifications@dooriq.ai',
    name: 'DoorIQ Notifications',
    subject: 'Test from Notifications',
    message: 'This is a test email from the DoorIQ notifications system. You\'ll receive session complete alerts from this address.'
  },
  {
    from: 'verify@dooriq.ai',
    name: 'DoorIQ Verification',
    subject: 'Test from Verification',
    message: 'This is a test email from DoorIQ verification. Email verification and account confirmation emails will come from this address.'
  },
  {
    from: 'contact@dooriq.ai',
    name: 'DoorIQ Contact',
    subject: 'Test from Contact',
    message: 'This is a test email from the DoorIQ contact address. Customer support, help requests, team invitations, and general inquiries will come from here.'
  },
]

async function sendTestEmails() {
  console.log('🎯 Sending test emails to:', recipientEmail)
  console.log('📧 Testing', emailAddresses.length, 'email addresses...\n')

  for (const emailConfig of emailAddresses) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${emailConfig.name} <${emailConfig.from}>`,
        to: recipientEmail,
        subject: emailConfig.subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; }
              .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
              .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 24px; }
              .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 12px; }
              .email-badge { display: inline-block; background: #f1f5f9; color: #475569; padding: 8px 16px; border-radius: 6px; font-family: monospace; font-size: 14px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #64748b; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✓ Email Test Successful</h1>
              </div>
              <div class="content">
                <h2 style="margin-top: 0; color: #0f172a;">Email Address Verified</h2>
                <div class="email-badge">${emailConfig.from}</div>
                <p>${emailConfig.message}</p>
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 14px;">
                  <strong>From:</strong> ${emailConfig.name} &lt;${emailConfig.from}&gt;<br>
                  <strong>Status:</strong> Domain verified ✓<br>
                  <strong>Deliverability:</strong> High
                </p>
              </div>
              <div class="footer">
                <strong>DoorIQ</strong> - AI-Powered Sales Training<br>
                All systems operational
              </div>
            </div>
          </body>
          </html>
        `
      })

      if (error) {
        console.error(`❌ Failed to send from ${emailConfig.from}:`, error)
      } else {
        console.log(`✅ Sent from ${emailConfig.from} (ID: ${data?.id})`)
      }

      // Wait 1 second between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))

    } catch (error) {
      console.error(`❌ Error sending from ${emailConfig.from}:`, error.message)
    }
  }

  console.log('\n🎉 Test complete! Check', recipientEmail, 'inbox.')
}

sendTestEmails()

