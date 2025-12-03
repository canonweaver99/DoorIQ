import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Reply-to email for all DoorIQ emails - replies will go to this address
export const REPLY_TO_EMAIL = 'canonweaver@loopline.design'

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

/**
 * Get email signature HTML for canon@dooriq.ai emails
 */
export function getEmailSignature(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.ai'
  const signatureUrl = `${appUrl}/dooriq-email-signature.png`
  
  return `
    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <img 
        src="${signatureUrl}" 
        alt="DoorIQ Email Signature" 
        style="max-width: 600px; width: 100%; height: auto; display: block;"
      />
    </div>
  `
}

/**
 * Add signature to email HTML if sending from canon@dooriq.ai
 * Exported so it can be used in other email-sending modules
 */
export function addSignatureIfNeeded(html: string, fromEmail: string): string {
  // Check if email is from canon@dooriq.ai
  const isCanonEmail = fromEmail.includes('canon@dooriq.ai') || fromEmail.toLowerCase().includes('canon@dooriq')
  
  if (!isCanonEmail) {
    return html
  }
  
  // Insert signature before closing body/html tags
  // Try to insert before </body> first
  if (html.includes('</body>')) {
    return html.replace('</body>', getEmailSignature() + '</body>')
  }
  
  // If no </body> tag, try before </html>
  if (html.includes('</html>')) {
    return html.replace('</html>', getEmailSignature() + '</html>')
  }
  
  // If neither tag exists, append to end
  return html + getEmailSignature()
}

export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailParams) {
  try {
    const fromEmail = from || 'DoorIQ <noreply@dooriq.ai>'
    
    // Add signature if sending from canon@dooriq.ai
    const htmlWithSignature = addSignatureIfNeeded(html, fromEmail)
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: htmlWithSignature,
      reply_to: replyTo || REPLY_TO_EMAIL
    })

    if (error) {
      console.error('Error sending email:', error)
      throw error
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    throw error
  }
}

/**
 * Send notification email to admin when a new user signs up
 */
export async function sendNewUserNotification(userEmail: string, fullName: string, userId: string, source?: string) {
  try {
    // Don't send if Resend is not configured
    if (!process.env.RESEND_API_KEY) {
      console.log('⏭️  Skipping new user notification - Resend not configured')
      return
    }

    const adminEmail = 'canonweaver@loopline.design'
    const sourceText = source === 'bulk-signup' ? ' (Bulk Signup)' : ''
    const subject = `New User Signup${sourceText}: ${fullName || userEmail}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
            .info-row { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 6px; }
            .info-label { font-weight: 600; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 16px; color: #111827; margin-top: 5px; }
            .source-badge { display: inline-block; background: #f3e8ff; color: #a855f7; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">New User Signup${source === 'bulk-signup' ? ' (Bulk Signup)' : ''}</h1>
            </div>
            <div class="content">
              <p>A new user has just created an account on DoorIQ${source === 'bulk-signup' ? ' via bulk signup link' : ''}:</p>
              
              <div class="info-row">
                <div class="info-label">Name</div>
                <div class="info-value">${fullName || 'Not provided'}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Email</div>
                <div class="info-value">${userEmail}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">User ID</div>
                <div class="info-value">${userId}</div>
              </div>
              
              <div class="info-row">
                <div class="info-label">Signup Time</div>
                <div class="info-value">${new Date().toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'full', timeStyle: 'long' })}</div>
              </div>
              
              ${source === 'bulk-signup' ? `
              <div class="info-row" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                <div class="info-label" style="color: #92400e;">Signup Source</div>
                <div class="info-value" style="color: #92400e;">Bulk Signup Link</div>
              </div>
              ` : ''}
            </div>
          </div>
        </body>
      </html>
    `

    await sendEmail({
      to: adminEmail,
      subject,
      html,
      from: 'DoorIQ <notifications@dooriq.ai>'
    })

    console.log(`✅ New user notification sent to ${adminEmail} for user: ${userEmail}`)
  } catch (error) {
    // Don't throw - this is a notification, shouldn't fail user creation
    console.error('❌ Failed to send new user notification:', error)
  }
}

