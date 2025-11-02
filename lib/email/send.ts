import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
  from?: string
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

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
    const fromEmail = from || 'DoorIQ <noreply@dooriq.ai>'
    
    // Add signature if sending from canon@dooriq.ai
    const htmlWithSignature = addSignatureIfNeeded(html, fromEmail)
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: htmlWithSignature
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

