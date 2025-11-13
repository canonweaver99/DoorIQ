import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Cal.com webhook handler
// This receives booking notifications from Cal.com
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Cal.com webhook payload structure
    // See: https://cal.com/docs/core-features/webhooks
    const {
      triggerEvent,
      payload: bookingData
    } = payload

    // Only process booking created events
    if (triggerEvent !== 'BOOKING_CREATED') {
      return NextResponse.json({ success: true, message: 'Event not processed' })
    }

    const {
      id,
      title,
      description,
      startTime,
      endTime,
      attendees,
      organizer,
      metadata,
      responses
    } = bookingData

    // Extract pricing data from description, metadata, or responses
    let pricingInfo = {
      numReps: 'Not specified',
      pricingOption: 'Not specified',
      selectedPrice: 'Not specified'
    }

    // Try to parse from description field (where we inject the data)
    if (description) {
      const pricingMatch = description.match(/Pricing Info:\s*(\d+)\s*reps?,\s*(\w+)\s*plan,\s*\$?([\d,]+)/i)
      if (pricingMatch) {
        pricingInfo = {
          numReps: pricingMatch[1],
          pricingOption: pricingMatch[2].toLowerCase(),
          selectedPrice: pricingMatch[3].replace(/,/g, '')
        }
      }
    }

    // Try to get from metadata
    if (metadata && pricingInfo.numReps === 'Not specified') {
      try {
        const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata
        if (parsedMetadata.numReps) {
          pricingInfo = {
            numReps: parsedMetadata.numReps || pricingInfo.numReps,
            pricingOption: parsedMetadata.pricingOption || pricingInfo.pricingOption,
            selectedPrice: parsedMetadata.selectedPrice || pricingInfo.selectedPrice
          }
        }
      } catch (e) {
        console.error('Error parsing metadata:', e)
      }
    }

    // Try to get from custom questions/responses
    if (responses && Array.isArray(responses) && pricingInfo.numReps === 'Not specified') {
      responses.forEach((response: any) => {
        const label = (response.label || '').toLowerCase()
        const value = response.value || ''
        
        if (label.includes('reps') || label.includes('sales rep') || label.includes('number of')) {
          const repsMatch = value.match(/(\d+)/)
          if (repsMatch) {
            pricingInfo.numReps = repsMatch[1]
          }
        }
        if (label.includes('pricing') || label.includes('plan') || label.includes('billing')) {
          if (value.toLowerCase().includes('annual') || value.toLowerCase().includes('year')) {
            pricingInfo.pricingOption = 'annual'
          } else if (value.toLowerCase().includes('month')) {
            pricingInfo.pricingOption = 'monthly'
          }
        }
        if (label.includes('price') || label.includes('cost')) {
          const priceMatch = value.match(/\$?([\d,]+)/)
          if (priceMatch) {
            pricingInfo.selectedPrice = priceMatch[1].replace(/,/g, '')
          }
        }
      })
    }

    // Get organizer email (your email)
    const organizerEmail = organizer?.email || process.env.CAL_NOTIFICATION_EMAIL || 'canonweaver@loopline.design'
    
    // Get attendee info
    const attendeeName = attendees?.[0]?.name || attendees?.[0]?.email || 'Unknown'
    const attendeeEmail = attendees?.[0]?.email || 'No email provided'

    // Format the selected price
    const priceDisplay = pricingInfo.selectedPrice !== 'Not specified' 
      ? `$${parseInt(pricingInfo.selectedPrice).toLocaleString('en-US')}` 
      : 'Not specified'

    // Send notification email
    const emailSubject = `New Demo Booking: ${attendeeName}`
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
            .info-box { background: #f9fafb; border-left: 4px solid #8b5cf6; padding: 16px; margin: 20px 0; }
            .info-box strong { color: #1f2937; }
            .pricing-info { background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; }
            .pricing-info h3 { margin-top: 0; color: #065f46; }
            .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="email-content">
              <div class="header">
                <h1>New Demo Booking 🎉</h1>
              </div>
              <div class="content">
                <p>You have a new demo booking scheduled!</p>
                
                <div class="info-box">
                  <p><strong>Attendee:</strong> ${attendeeName}</p>
                  <p><strong>Email:</strong> ${attendeeEmail}</p>
                  <p><strong>Meeting:</strong> ${title || 'Demo Call'}</p>
                  <p><strong>Date & Time:</strong> ${new Date(startTime).toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'short'
                  })}</p>
                  <p><strong>Duration:</strong> ${Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000)} minutes</p>
                </div>

                <div class="pricing-info">
                  <h3>Pricing Information</h3>
                  <p><strong>Number of Sales Reps:</strong> ${pricingInfo.numReps}</p>
                  <p><strong>Selected Pricing Option:</strong> ${pricingInfo.pricingOption === 'annual' ? 'Annual' : pricingInfo.pricingOption === 'monthly' ? 'Monthly' : pricingInfo.pricingOption}</p>
                  <p><strong>Selected Price:</strong> ${priceDisplay}</p>
                </div>

                ${description ? `<p><strong>Additional Notes:</strong><br>${description}</p>` : ''}
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} DoorIQ. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'DoorIQ <notifications@dooriq.ai>',
        to: organizerEmail,
        subject: emailSubject,
        html: emailHtml,
        replyTo: attendeeEmail !== 'No email provided' ? attendeeEmail : undefined
      })

      console.log(`✅ Booking notification email sent to ${organizerEmail} for booking ${id}`)
    } else {
      console.warn('Resend API key not configured, skipping email')
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error processing Cal.com webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process webhook' },
      { status: 500 }
    )
  }
}

