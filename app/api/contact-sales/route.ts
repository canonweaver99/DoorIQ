import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['fullName', 'workEmail', 'jobTitle', 'companyName', 'industry', 'numberOfReps', 'howDidYouHear']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.workEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get Supabase client
    const supabase = createClient()

    // Save lead to database
    const { data: lead, error: dbError } = await supabase
      .from('sales_leads')
      .insert({
        full_name: body.fullName,
        work_email: body.workEmail,
        phone_number: body.phoneNumber || null,
        job_title: body.jobTitle,
        company_name: body.companyName,
        industry: body.industry,
        number_of_reps: body.numberOfReps,
        primary_use_case: body.primaryUseCase || null,
        how_did_you_hear: body.howDidYouHear,
        preferred_contact_method: body.preferredContactMethod,
        best_time_to_reach: body.bestTimeToReach || null,
        timezone: body.timezone,
        additional_comments: body.additionalComments || null,
        status: 'new',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Continue even if database save fails - we still want to send the email
    }

    // Send notification email to sales team
    const salesNotificationHtml = `
      <h2>New Sales Lead from DoorIQ</h2>
      
      <h3>Contact Information</h3>
      <ul>
        <li><strong>Name:</strong> ${body.fullName}</li>
        <li><strong>Email:</strong> ${body.workEmail}</li>
        <li><strong>Phone:</strong> ${body.phoneNumber || 'Not provided'}</li>
        <li><strong>Job Title:</strong> ${body.jobTitle}</li>
      </ul>
      
      <h3>Company Details</h3>
      <ul>
        <li><strong>Company:</strong> ${body.companyName}</li>
        <li><strong>Industry:</strong> ${body.industry}</li>
        <li><strong>Number of Reps:</strong> ${body.numberOfReps}</li>
      </ul>
      
      <h3>Needs Assessment</h3>
      <ul>
        <li><strong>Primary Use Case:</strong> ${body.primaryUseCase || 'Not specified'}</li>
        <li><strong>How They Heard About Us:</strong> ${body.howDidYouHear}</li>
      </ul>
      
      <h3>Contact Preferences</h3>
      <ul>
        <li><strong>Preferred Method:</strong> ${body.preferredContactMethod}</li>
        <li><strong>Best Time:</strong> ${body.bestTimeToReach || 'Not specified'}</li>
      </ul>
      
      ${body.additionalComments ? `
        <h3>Additional Comments</h3>
        <p>${body.additionalComments}</p>
      ` : ''}
      
      <hr>
      <p><small>Lead submitted on ${new Date().toLocaleString()}</small></p>
    `

    // Send to sales team
    await sendEmail({
      to: 'sales@dooriq.ai',
      subject: `New Sales Lead: ${body.companyName} - ${body.numberOfReps} reps`,
      html: salesNotificationHtml
    })

    // Send confirmation email to the lead
    const confirmationHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6B46C1 0%, #9333EA 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Thank You for Your Interest!</h1>
        </div>
        
        <div style="background: #f9fafb; padding: 40px 30px; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Hi ${body.fullName},
          </p>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            Thank you for contacting DoorIQ! We've received your information and our sales team is excited to show you how DoorIQ can transform your sales team's performance.
          </p>
          
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #111827; margin-top: 0;">What happens next?</h3>
            <ul style="color: #374151; font-size: 14px; line-height: 1.8;">
              <li>Our sales team will review your information</li>
              <li>We'll reach out within 24 hours to schedule a personalized demo</li>
              <li>During the demo, we'll show you how DoorIQ can help your ${body.numberOfReps} sales rep${body.numberOfReps > 1 ? 's' : ''} improve their skills</li>
            </ul>
          </div>
          
          <p style="color: #374151; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
            In the meantime, feel free to explore our platform and see how our AI-powered training is helping sales teams across the ${body.industry} industry.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #9333EA; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Explore DoorIQ
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            If you have any immediate questions, feel free to reply to this email or call us at (555) 123-4567.
          </p>
        </div>
      </div>
    `

    await sendEmail({
      to: body.workEmail,
      subject: 'Thank you for contacting DoorIQ',
      html: confirmationHtml
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      leadId: lead?.id
    })

  } catch (error) {
    console.error('Contact sales error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
