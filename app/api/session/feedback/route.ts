import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/send'

export async function POST(request: NextRequest) {
  try {
    const { sessionId, rating, improvementArea, feedbackText } = await request.json()

    // Validate input
    if (!sessionId || !rating || !improvementArea) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, rating, and improvementArea are required' },
        { status: 400 }
      )
    }
    
    // Feedback text is optional
    const feedbackTextValue = feedbackText?.trim() || null

    if (rating < 1 || rating > 10) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 10' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify session exists and belongs to user
    const { data: session, error: sessionError } = await supabase
      .from('live_sessions')
      .select('id, user_id, agent_name, started_at, overall_score')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - session does not belong to user' },
        { status: 403 }
      )
    }

    // Check if feedback already submitted
    const { data: existingFeedback } = await supabase
      .from('live_sessions')
      .select('user_feedback_submitted_at')
      .eq('id', sessionId)
      .single()

    if (existingFeedback?.user_feedback_submitted_at) {
      // Allow resubmission (update existing feedback)
      console.log(`Updating existing feedback for session ${sessionId}`)
    }

    // Save feedback to database
    const { error: updateError } = await supabase
      .from('live_sessions')
      .update({
        user_feedback_rating: rating,
        user_feedback_improvement_area: improvementArea,
        user_feedback_text: feedbackTextValue,
        user_feedback_submitted_at: new Date().toISOString()
      })
      .eq('id', sessionId)

    if (updateError) {
      console.error('Error saving feedback:', updateError)
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      )
    }

    // Get user info for email
    const { data: userData } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    // Send email notification (fire-and-forget)
    sendFeedbackEmail({
      sessionId,
      userName: userData?.full_name || 'User',
      userEmail: userData?.email || user.email || 'Unknown',
      agentName: session.agent_name || 'Unknown',
      rating,
      improvementArea,
      feedbackText: feedbackTextValue || '',
      overallScore: session.overall_score
    }).catch((error) => {
      // Log error but don't fail the request
      console.error('Failed to send feedback email:', error)
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function sendFeedbackEmail({
  sessionId,
  userName,
  userEmail,
  agentName,
  rating,
  improvementArea,
  feedbackText,
  overallScore
}: {
  sessionId: string
  userName: string
  userEmail: string
  agentName: string
  rating: number
  improvementArea: string
  feedbackText: string
  overallScore: number | null
}) {
  // Don't send if Resend is not configured
  if (!process.env.RESEND_API_KEY) {
    console.log('⏭️  Skipping feedback email - Resend not configured')
    return
  }

  const adminEmail = 'canonweaver@loopline.design'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.ai'
  const sessionUrl = `${appUrl}/analytics/${sessionId}`
  
  const subject = `Session Feedback: ${userName} - Rating ${rating}/10`
  
  // Generate star rating display
  const stars = '⭐'.repeat(rating) + '☆'.repeat(10 - rating)
  
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
          .info-row { margin: 15px 0; padding: 15px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #a855f7; }
          .info-label { font-weight: 600; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
          .info-value { font-size: 16px; color: #111827; }
          .rating-display { font-size: 24px; text-align: center; padding: 20px; background: #fef3c7; border-radius: 8px; margin: 20px 0; }
          .feedback-text { padding: 15px; background: #f9fafb; border-radius: 6px; border-left: 4px solid #ec4899; margin: 15px 0; white-space: pre-wrap; }
          .button { display: inline-block; background: #a855f7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Session Feedback Received</h1>
          </div>
          <div class="content">
            <p>A user has submitted feedback for their training session:</p>
            
            <div class="rating-display">
              <div style="font-size: 18px; color: #6b7280; margin-bottom: 10px;">Rating</div>
              <div style="font-size: 32px; font-weight: bold; color: #111827;">${rating}/10</div>
              <div style="font-size: 20px; margin-top: 10px;">${stars}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">User</div>
              <div class="info-value">${userName} (${userEmail})</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Session ID</div>
              <div class="info-value">${sessionId}</div>
            </div>
            
            <div class="info-row">
              <div class="info-label">Agent</div>
              <div class="info-value">${agentName}</div>
            </div>
            
            ${overallScore !== null ? `
            <div class="info-row">
              <div class="info-label">Overall Score</div>
              <div class="info-value">${overallScore}/100</div>
            </div>
            ` : ''}
            
            <div class="info-row">
              <div class="info-label">AI Agent Improvement Area</div>
              <div class="info-value">${improvementArea}</div>
            </div>
            
            ${feedbackText ? `
            <div class="info-row">
              <div class="info-label">Feedback</div>
              <div class="feedback-text">${feedbackText}</div>
            </div>
            ` : `
            <div class="info-row">
              <div class="info-label">Feedback</div>
              <div class="info-value" style="color: #9ca3af; font-style: italic;">No additional feedback provided</div>
            </div>
            `}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${sessionUrl}" class="button">View Session Analytics</a>
            </div>
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

  console.log(`✅ Feedback email sent to ${adminEmail} for session: ${sessionId}`)
}

