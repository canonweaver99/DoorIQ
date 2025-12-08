/**
 * Email template for when a user is promoted from rep to manager
 */

export interface ManagerPromotionEmailData {
  recipientName: string
  recipientEmail: string
  promotedBy?: string
}

export function getManagerPromotionEmailHtml(data: ManagerPromotionEmailData): string {
  const { recipientName, promotedBy } = data

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Congratulations! You've Been Promoted to Manager</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #6366f1;
      margin: 0;
      font-size: 28px;
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 10px;
    }
    .content {
      margin: 30px 0;
    }
    .content h2 {
      color: #1f2937;
      font-size: 20px;
      margin-top: 30px;
      margin-bottom: 15px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .feature-list li {
      padding: 12px 0;
      padding-left: 30px;
      position: relative;
    }
    .feature-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
      font-size: 18px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
      color: #ffffff !important;
      padding: 16px 32px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 30px 0;
      text-align: center;
      font-size: 16px;
      box-shadow: 0 4px 6px rgba(168, 85, 247, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(168, 85, 247, 0.4);
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 14px;
    }
    .highlight-box {
      background-color: #f0f9ff;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 25px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Congratulations!</h1>
      <span class="badge">You've Been Promoted to Manager</span>
    </div>

    <div class="content">
      <p>Hi ${recipientName},</p>
      
      <p>We're excited to let you know that ${promotedBy ? `you've been promoted to Manager by ${promotedBy}` : 'you\'ve been promoted to Manager'}! This new role unlocks powerful team management features that will help you lead and develop your sales team.</p>

      <div class="highlight-box">
        <strong>What This Means:</strong> You now have access to comprehensive team analytics, individual rep performance tracking, and team management tools that will help you drive better results across your entire team.
      </div>

      <h2>🚀 New Features Available to You</h2>

      <h3>📊 Manager Dashboard & Analytics</h3>
      <ul class="feature-list">
        <li><strong>Team Performance Overview:</strong> Get a comprehensive view of your entire team's performance at a glance</li>
        <li><strong>Individual Rep Analytics:</strong> Dive deep into each rep's progress, scores, and improvement trends</li>
        <li><strong>Team Comparison:</strong> Compare performance across team members to identify top performers and coaching opportunities</li>
        <li><strong>Session Review:</strong> View and analyze all rep sessions, including transcripts and detailed scoring</li>
      </ul>

      <h3>👥 Team Management</h3>
      <ul class="feature-list">
        <li><strong>Add & Remove Team Members:</strong> Invite new reps to your team and manage your team roster</li>
        <li><strong>Role Management:</strong> Assign roles and permissions to team members</li>
        <li><strong>Team Settings:</strong> Configure team-wide settings and preferences</li>
        <li><strong>Team Leaderboards:</strong> Foster healthy competition with visible rankings and achievements</li>
      </ul>

      <h3>💬 Communication & Coaching</h3>
      <ul class="feature-list">
        <li><strong>In-App Messaging:</strong> Communicate directly with your reps through the platform</li>
        <li><strong>Rep Profiles:</strong> Access detailed profiles for each team member with their complete performance history</li>
        <li><strong>Progress Tracking:</strong> Monitor each rep's improvement over time with detailed progress reports</li>
      </ul>

      <h3>📚 Content Management</h3>
      <ul class="feature-list">
        <li><strong>Upload Training Videos:</strong> Share instructional videos and training materials with your team</li>
        <li><strong>Team Knowledge Base:</strong> Create and manage team-specific training resources</li>
      </ul>

      <h3>📈 Reports & Export</h3>
      <ul class="feature-list">
        <li><strong>Performance Reports:</strong> Generate detailed reports on team and individual performance</li>
        <li><strong>Export Capabilities:</strong> Download data for management review and presentations</li>
      </ul>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://dooriq.ai/manager" class="cta-button" style="color: #ffffff !important;">Access Your Manager Dashboard →</a>
      </div>

      <h2>🎯 Getting Started</h2>
      <p>Here's how to make the most of your new manager role:</p>
      <ol style="padding-left: 20px;">
        <li><strong>Explore the Manager Dashboard:</strong> Navigate to the "Manager" section in your account to see your team overview</li>
        <li><strong>Review Team Performance:</strong> Check out your team's analytics and identify areas for improvement</li>
        <li><strong>Connect with Your Reps:</strong> Use the messaging feature to introduce yourself and set expectations</li>
        <li><strong>Set Up Your Team:</strong> Invite team members and configure your team settings</li>
      </ol>

      <p>You'll still have access to all your previous rep features, including taking training sessions, viewing your own analytics, and participating in the leaderboard.</p>
    </div>

    <div class="footer">
      <p>Need help getting started? Check out our <a href="https://dooriq.ai/help" style="color: #6366f1;">Help Center</a> or reach out to our support team.</p>
      <p style="margin-top: 20px;">
        <strong>The DoorIQ Team</strong><br>
        <a href="https://dooriq.ai" style="color: #6366f1;">dooriq.ai</a>
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

export function getManagerPromotionEmailText(data: ManagerPromotionEmailData): string {
  const { recipientName, promotedBy } = data

  return `
Congratulations! You've Been Promoted to Manager

Hi ${recipientName},

We're excited to let you know that ${promotedBy ? `you've been promoted to Manager by ${promotedBy}` : 'you\'ve been promoted to Manager'}! This new role unlocks powerful team management features that will help you lead and develop your sales team.

WHAT THIS MEANS:
You now have access to comprehensive team analytics, individual rep performance tracking, and team management tools that will help you drive better results across your entire team.

NEW FEATURES AVAILABLE TO YOU:

📊 MANAGER DASHBOARD & ANALYTICS
✓ Team Performance Overview: Get a comprehensive view of your entire team's performance at a glance
✓ Individual Rep Analytics: Dive deep into each rep's progress, scores, and improvement trends
✓ Team Comparison: Compare performance across team members to identify top performers and coaching opportunities
✓ Session Review: View and analyze all rep sessions, including transcripts and detailed scoring

👥 TEAM MANAGEMENT
✓ Add & Remove Team Members: Invite new reps to your team and manage your team roster
✓ Role Management: Assign roles and permissions to team members
✓ Team Settings: Configure team-wide settings and preferences
✓ Team Leaderboards: Foster healthy competition with visible rankings and achievements

💬 COMMUNICATION & COACHING
✓ In-App Messaging: Communicate directly with your reps through the platform
✓ Rep Profiles: Access detailed profiles for each team member with their complete performance history
✓ Progress Tracking: Monitor each rep's improvement over time with detailed progress reports

📚 CONTENT MANAGEMENT
✓ Upload Training Videos: Share instructional videos and training materials with your team
✓ Team Knowledge Base: Create and manage team-specific training resources

📈 REPORTS & EXPORT
✓ Performance Reports: Generate detailed reports on team and individual performance
✓ Export Capabilities: Download data for management review and presentations

GETTING STARTED:
1. Explore the Manager Dashboard: Navigate to the "Manager" section in your account to see your team overview
2. Review Team Performance: Check out your team's analytics and identify areas for improvement
3. Connect with Your Reps: Use the messaging feature to introduce yourself and set expectations
4. Set Up Your Team: Invite team members and configure your team settings

You'll still have access to all your previous rep features, including taking training sessions, viewing your own analytics, and participating in the leaderboard.

Access Your Manager Dashboard: https://dooriq.ai/manager

Need help getting started? Check out our Help Center: https://dooriq.ai/help

The DoorIQ Team
dooriq.ai
  `.trim()
}
