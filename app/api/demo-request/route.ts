import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const {
      firstName,
      lastName,
      workEmail,
      phoneNumber,
      companyName,
      jobTitle,
      numberOfReps,
      howDidYouHear,
      meetingGoals
    } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !workEmail || !phoneNumber || !companyName || !jobTitle || !numberOfReps || !howDidYouHear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(workEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const supabase = await createServiceSupabaseClient()

    // Save to sales_leads table (combining first and last name into full_name)
    const { data: lead, error: dbError } = await supabase
      .from('sales_leads')
      .insert({
        full_name: `${firstName} ${lastName}`,
        work_email: workEmail,
        phone_number: phoneNumber,
        job_title: jobTitle,
        company_name: companyName,
        industry: 'Other', // Default since not collected in form
        number_of_reps: parseInt(numberOfReps.split('-')[0]) || 10, // Extract minimum from range
        how_did_you_hear: howDidYouHear,
        additional_comments: meetingGoals || null,
        status: 'lead',
        preferred_contact_method: 'email',
        timezone: 'America/New_York'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save demo request' },
        { status: 500 }
      )
    }

    // Send notification email (fire-and-forget)
    sendEmail({
      to: 'canonweaver@loopline.design',
      subject: `New Demo Request: ${companyName} - ${numberOfReps} reps`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .info-row { margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #a855f7; }
              .info-label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
              .info-value { font-size: 16px; color: #111827; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 24px;">New Demo Request</h1>
              </div>
              <div class="content">
                <p>A new demo request has been submitted:</p>
                
                <div class="info-row">
                  <div class="info-label">Name</div>
                  <div class="info-value">${firstName} ${lastName}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Email</div>
                  <div class="info-value">${workEmail}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Phone</div>
                  <div class="info-value">${phoneNumber}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Company</div>
                  <div class="info-value">${companyName}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Job Title</div>
                  <div class="info-value">${jobTitle}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">Number of Reps</div>
                  <div class="info-value">${numberOfReps}</div>
                </div>
                
                <div class="info-row">
                  <div class="info-label">How They Heard About Us</div>
                  <div class="info-value">${howDidYouHear}</div>
                </div>
                
                ${meetingGoals ? `
                <div class="info-row">
                  <div class="info-label">Meeting Goals</div>
                  <div class="info-value">${meetingGoals}</div>
                </div>
                ` : ''}
              </div>
            </div>
          </body>
        </html>
      `,
      from: 'DoorIQ <notifications@dooriq.ai>'
    }).catch((error) => {
      console.error('Failed to send demo request email:', error)
    })

    return NextResponse.json({ success: true, leadId: lead.id })
  } catch (error: any) {
    console.error('Demo request error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

