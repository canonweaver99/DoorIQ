/**
 * Email Templates for DoorIQ Notifications
 * Using Resend for email delivery
 */

interface SessionCompleteData {
  userName: string
  score: number
  grade: string
  bestMoment?: string
  topImprovement?: string
  sessionId: string
  virtualEarnings: number
  saleClosed: boolean
}

interface AchievementData {
  userName: string
  achievementType: string
  achievementTitle: string
  achievementDescription: string
  badgeEmoji: string
}

interface ManagerSessionAlertData {
  repName: string
  score: number
  grade: string
  sessionId: string
  highlights: string[]
  needsWork: string[]
}

const baseStyles = `
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
    line-height: 1.6; 
    color: #1e293b; 
    background-color: #f8fafc;
    margin: 0;
    padding: 0;
  }
  .email-wrapper {
    background-color: #f8fafc;
    padding: 40px 20px;
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  }
  .header { 
    background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%); 
    color: white; 
    padding: 40px 30px; 
    text-align: center; 
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
  }
  .header p {
    margin: 8px 0 0 0;
    opacity: 0.95;
    font-size: 16px;
  }
  .content { 
    padding: 40px 30px; 
  }
  .score-badge {
    display: inline-block;
    font-size: 48px;
    font-weight: 800;
    padding: 20px 40px;
    border-radius: 12px;
    margin: 20px 0;
  }
  .grade-a { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; }
  .grade-b { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; }
  .grade-c { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
  .grade-f { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; }
  .highlight-box {
    background: #f0fdf4;
    border-left: 4px solid #10b981;
    padding: 16px 20px;
    margin: 20px 0;
    border-radius: 8px;
  }
  .improvement-box {
    background: #fef3c7;
    border-left: 4px solid #f59e0b;
    padding: 16px 20px;
    margin: 20px 0;
    border-radius: 8px;
  }
  .button { 
    display: inline-block; 
    background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
    color: white; 
    padding: 14px 32px; 
    text-decoration: none; 
    border-radius: 8px; 
    margin: 24px 0;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.2s;
  }
  .button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(168, 85, 247, 0.4);
  }
  .footer { 
    text-align: center; 
    padding: 30px 20px; 
    color: #64748b; 
    font-size: 14px;
    background: #f8fafc;
  }
  .footer a {
    color: #a855f7;
    text-decoration: none;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin: 24px 0;
  }
  .stat-card {
    background: #f8fafc;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #a855f7;
    display: block;
  }
  .stat-label {
    font-size: 14px;
    color: #64748b;
    margin-top: 4px;
  }
`

export function sessionCompleteEmail(data: SessionCompleteData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.com'
  const analyticsUrl = `${appUrl}/analytics/${data.sessionId}`
  
  const gradeClass = 
    data.score >= 90 ? 'grade-a' :
    data.score >= 70 ? 'grade-b' :
    data.score >= 60 ? 'grade-c' : 'grade-f'

  const subject = data.saleClosed 
    ? `🎉 Great job ${data.userName}! You closed the sale - ${data.score}% score`
    : `Session Complete: ${data.score}% (${data.grade} grade)`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>🎯 Session Complete!</h1>
        <p>Your training results are ready to review</p>
      </div>
      
      <div class="content">
        <p style="font-size: 18px; margin-top: 0;">Hey ${data.userName},</p>
        
        <p>Great work on completing your training session! Here's how you did:</p>
        
        <div style="text-align: center;">
          <div class="score-badge ${gradeClass}">
            ${data.score}%
          </div>
          <p style="font-size: 20px; font-weight: 600; color: #334155; margin: 8px 0;">
            ${data.grade} Grade
          </p>
        </div>

        ${data.saleClosed ? `
          <div class="highlight-box">
            <strong style="color: #059669; font-size: 16px;">💰 Sale Closed!</strong>
            <p style="margin: 8px 0 0 0; color: #065f46;">
              You earned <strong>$${data.virtualEarnings.toFixed(2)}</strong> in virtual commission. Nice work!
            </p>
          </div>
        ` : ''}

        ${data.bestMoment ? `
          <div class="highlight-box">
            <strong style="color: #059669; font-size: 16px;">✨ Best Moment</strong>
            <p style="margin: 8px 0 0 0; color: #065f46;">
              "${data.bestMoment}"
            </p>
          </div>
        ` : ''}

        ${data.topImprovement ? `
          <div class="improvement-box">
            <strong style="color: #d97706; font-size: 16px;">💡 Top Opportunity</strong>
            <p style="margin: 8px 0 0 0; color: #92400e;">
              ${data.topImprovement}
            </p>
          </div>
        ` : ''}

        <p style="margin-top: 32px;">
          Want to see the full breakdown? Check out your detailed analytics with line-by-line feedback, 
          conversation insights, and coaching recommendations.
        </p>

        <div style="text-align: center;">
          <a href="${analyticsUrl}" class="button">
            View Full Analytics →
          </a>
        </div>

        <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
          Keep practicing to improve your scores and master your sales technique!
        </p>
      </div>
      
      <div class="footer">
        <p>
          <strong>DoorIQ</strong> - AI-Powered Sales Training<br>
          <a href="${appUrl}/settings">Notification Preferences</a> | 
          <a href="${appUrl}/help">Get Help</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px;">
          This email was sent because you completed a training session.<br>
          To stop receiving these emails, visit your notification settings.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  return { subject, html }
}

export function achievementEmail(data: AchievementData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.com'
  
  const subject = `${data.badgeEmoji} Achievement Unlocked: ${data.achievementTitle}!`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>${data.badgeEmoji}</h1>
        <h2 style="margin: 12px 0 0 0; font-size: 24px;">Achievement Unlocked!</h2>
      </div>
      
      <div class="content">
        <p style="font-size: 18px; margin-top: 0;">Congratulations ${data.userName}!</p>
        
        <div style="text-align: center; margin: 32px 0;">
          <div style="font-size: 72px; margin-bottom: 16px;">${data.badgeEmoji}</div>
          <h3 style="font-size: 24px; color: #a855f7; margin: 0 0 8px 0;">
            ${data.achievementTitle}
          </h3>
          <p style="color: #64748b; font-size: 16px;">
            ${data.achievementDescription}
          </p>
        </div>

        <p>
          You're making great progress! Keep up the excellent work and unlock even more achievements.
        </p>

        <div style="text-align: center;">
          <a href="${appUrl}/trainer" class="button">
            Start Next Session →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>
          <strong>DoorIQ</strong> - AI-Powered Sales Training<br>
          <a href="${appUrl}/settings">Notification Preferences</a> | 
          <a href="${appUrl}/help">Get Help</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  return { subject, html }
}

export function managerSessionAlertEmail(data: ManagerSessionAlertData) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dooriq.com'
  const analyticsUrl = `${appUrl}/analytics/${data.sessionId}`
  
  const gradeClass = 
    data.score >= 90 ? 'grade-a' :
    data.score >= 70 ? 'grade-b' :
    data.score >= 60 ? 'grade-c' : 'grade-f'

  const subject = `${data.repName} completed a session - ${data.score}% (${data.grade})`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${baseStyles}</style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">
      <div class="header">
        <h1>📊 Team Activity</h1>
        <p>${data.repName} just completed a training session</p>
      </div>
      
      <div class="content">
        <p style="font-size: 18px; margin-top: 0;">New Session Alert</p>
        
        <div style="text-align: center;">
          <div class="score-badge ${gradeClass}">
            ${data.score}%
          </div>
          <p style="font-size: 20px; font-weight: 600; color: #334155; margin: 8px 0;">
            ${data.grade} Grade
          </p>
        </div>

        ${data.highlights.length > 0 ? `
          <div class="highlight-box">
            <strong style="color: #059669; font-size: 16px;">✨ Highlights</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #065f46;">
              ${data.highlights.map(h => `<li>${h}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${data.needsWork.length > 0 ? `
          <div class="improvement-box">
            <strong style="color: #d97706; font-size: 16px;">💡 Coaching Opportunities</strong>
            <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #92400e;">
              ${data.needsWork.map(n => `<li>${n}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        <p style="margin-top: 32px;">
          Review the full session analytics to provide personalized coaching and feedback.
        </p>

        <div style="text-align: center;">
          <a href="${analyticsUrl}" class="button">
            View Session Analytics →
          </a>
        </div>
      </div>
      
      <div class="footer">
        <p>
          <strong>DoorIQ</strong> - AI-Powered Sales Training<br>
          <a href="${appUrl}/settings">Notification Preferences</a> | 
          <a href="${appUrl}/manager">Manager Dashboard</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  return { subject, html }
}

export default {
  sessionComplete: sessionCompleteEmail,
  achievement: achievementEmail,
  managerSessionAlert: managerSessionAlertEmail
}

