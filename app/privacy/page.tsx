export default function PrivacyPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <h1 className="text-4xl font-bold mb-2">DOORIQ PRIVACY POLICY</h1>
      <p className="text-slate-400 mb-8">
        Last Updated: November 20, 2025<br />
        Effective Date: November 20, 2025
      </p>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. INTRODUCTION</h2>
          <p>
            Welcome to DoorIQ ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our AI-powered sales training platform at dooriq.ai (the "Service").
        </p>
        <p>
            By using DoorIQ, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.
          </p>
          <p className="mt-4">
            <strong>Contact Information:</strong><br />
            DoorIQ Inc.<br />
            Email: privacy@dooriq.ai<br />
            Website: dooriq.ai
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. INFORMATION WE COLLECT</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">2.1 Information You Provide Directly</h3>
          <p><strong>Account Information:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Name and email address</li>
            <li>Company name and role</li>
            <li>Phone number (optional)</li>
            <li>Password (encrypted)</li>
            <li>Billing information (processed securely through third-party payment processors)</li>
          </ul>

          <p className="mt-4"><strong>Profile Information:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>User preferences and settings</li>
            <li>Training goals and objectives</li>
            <li>Team and organization details</li>
            <li>Profile photo (optional)</li>
          </ul>

          <p className="mt-4"><strong>Training Session Data:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Voice recordings of your practice sessions</li>
            <li>Conversation transcripts</li>
            <li>Performance scores and analytics</li>
            <li>Feedback and coaching notes</li>
            <li>Session history and progress tracking</li>
          </ul>

          <p className="mt-4"><strong>Communications:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Support requests and correspondence</li>
            <li>Feedback and survey responses</li>
            <li>Messages sent through the platform</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.2 Information Collected Automatically</h3>
          <p><strong>Usage Data:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pages visited and features used</li>
            <li>Time spent on platform</li>
            <li>Click patterns and navigation paths</li>
            <li>Session frequency and duration</li>
            <li>Device type and browser information</li>
          </ul>

          <p className="mt-4"><strong>Technical Data:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Operating system</li>
            <li>Device identifiers</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Log files and error reports</li>
          </ul>

          <p className="mt-4"><strong>Audio Data:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Voice recordings during training sessions</li>
            <li>Speech patterns and vocal characteristics</li>
            <li>Audio quality metrics</li>
            <li>Microphone permissions and usage</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">2.3 Information from Third Parties</h3>
          <p><strong>Authentication Services:</strong></p>
          <p className="ml-4">If you sign up using Google, LinkedIn, or other OAuth providers, we receive basic profile information (name, email, profile photo)</p>

          <p className="mt-4"><strong>Payment Processors:</strong></p>
          <p className="ml-4">We use Stripe/[payment processor] for payments. We receive confirmation of transactions but do not store full credit card numbers</p>

          <p className="mt-4"><strong>AI Service Providers:</strong></p>
          <p className="ml-4">We use ElevenLabs for conversational AI. Audio data is processed through their secure API. See Section 4 for details on third-party data sharing</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. HOW WE USE YOUR INFORMATION</h2>
          <p>We use collected information for the following purposes:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Provide and Improve Our Service</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create and manage your account</li>
            <li>Deliver AI-powered training sessions</li>
            <li>Generate performance analytics and feedback</li>
            <li>Provide customer support</li>
            <li>Process payments and billing</li>
            <li>Send service-related notifications</li>
            <li>Improve platform features and user experience</li>
            <li>Develop new features and capabilities</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Personalization</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Customize training scenarios to your industry</li>
            <li>Adjust AI difficulty based on skill level</li>
            <li>Recommend relevant practice sessions</li>
            <li>Track progress and improvement over time</li>
            <li>Generate personalized coaching insights</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.3 Analytics and Research</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Understand how users interact with the platform</li>
            <li>Analyze training effectiveness and outcomes</li>
            <li>Identify bugs and technical issues</li>
            <li>Conduct internal research to improve AI models</li>
            <li>Generate anonymized, aggregated statistics</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.4 Communications</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Send account-related emails (login alerts, password resets)</li>
            <li>Deliver performance reports and summaries</li>
            <li>Share product updates and new features</li>
            <li>Send marketing communications (with your consent - you can opt out anytime)</li>
            <li>Respond to support requests</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.5 Legal and Security</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Comply with legal obligations</li>
            <li>Enforce our Terms of Service</li>
            <li>Protect against fraud and abuse</li>
            <li>Ensure platform security</li>
            <li>Resolve disputes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. HOW WE SHARE YOUR INFORMATION</h2>
          <p>We do not sell your personal information. We share information only in the following limited circumstances:</p>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">4.1 With Your Consent</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>When you explicitly authorize us to share information</li>
            <li>When you invite team members or managers to view your performance</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.2 Service Providers</h3>
          <p>We share data with trusted third-party service providers who help us operate the platform:</p>
          
          <p className="mt-4"><strong>ElevenLabs (AI Voice Provider):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Voice recordings are sent to ElevenLabs API for conversational AI processing</li>
            <li>Audio data is processed in real-time and not permanently stored by ElevenLabs</li>
            <li>Subject to ElevenLabs Privacy Policy: elevenlabs.io/privacy</li>
          </ul>

          <p className="mt-4"><strong>Hosting and Infrastructure:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Vercel (web hosting)</li>
            <li>Supabase (database)</li>
            <li>Amazon Web Services (file storage)</li>
          </ul>

          <p className="mt-4"><strong>Payment Processing:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Stripe (credit card processing - we never see full card numbers)</li>
          </ul>

          <p className="mt-4"><strong>Analytics:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google Analytics (anonymized usage data)</li>
            <li>Sentry (error tracking)</li>
          </ul>

          <p className="mt-4"><strong>Email Services:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>SendGrid for transactional and marketing emails</li>
          </ul>

          <p className="mt-4">All service providers are contractually required to protect your data and use it only for specified purposes.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.3 Within Your Organization</h3>
          <p>If you're part of a team/company account:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your manager can view your training session results, scores, and progress</li>
            <li>Organization admins can see team-level analytics</li>
            <li>Other team members may see leaderboard rankings (if enabled)</li>
            <li>Voice recordings are private unless explicitly shared</li>
          </ul>

          <p className="mt-4"><strong>Organization admins control:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Who has access to your performance data</li>
            <li>What data is visible to managers vs. reps</li>
            <li>Whether leaderboards are enabled</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.4 Legal Requirements</h3>
          <p>We may disclose information if required by law or in response to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Valid legal processes (subpoenas, court orders)</li>
            <li>Requests from government authorities</li>
            <li>Protection of our rights and property</li>
            <li>Safety concerns or fraud prevention</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">4.5 Business Transfers</h3>
          <p>If DoorIQ is acquired or merged with another company, your information may be transferred to the new entity. We will notify you before your information becomes subject to a different privacy policy.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. DATA RETENTION</h2>
          <p><strong>Account Data:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Retained as long as your account is active</li>
            <li>Deleted within 30 days of account deletion request</li>
          </ul>

          <p className="mt-4"><strong>Training Session Data:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Voice recordings: Retained for 90 days, then automatically deleted</li>
            <li>Transcripts: Retained for 1 year for analytics purposes</li>
            <li>Performance scores: Retained as long as account is active</li>
          </ul>

          <p className="mt-4"><strong>Anonymized Analytics:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>May be retained indefinitely in aggregated, de-identified form</li>
          </ul>

          <p className="mt-4"><strong>Backups:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Data in backups may persist for up to 90 days after deletion</li>
          </ul>

          <p className="mt-4"><strong>Legal Requirements:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We may retain data longer if required by law or for dispute resolution</li>
          </ul>

          <p className="mt-4">You can request deletion of your data at any time by contacting privacy@dooriq.ai.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. DATA SECURITY</h2>
          <p>We implement industry-standard security measures to protect your information:</p>
          
          <p className="mt-4"><strong>Technical Safeguards:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption in transit (TLS/SSL)</li>
            <li>Encryption at rest for sensitive data</li>
            <li>Secure database access controls</li>
            <li>Regular security audits and monitoring</li>
            <li>Automatic security updates</li>
          </ul>

          <p className="mt-4"><strong>Access Controls:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Role-based access to user data</li>
            <li>Multi-factor authentication for admin accounts</li>
            <li>Password hashing and secure storage</li>
            <li>Limited employee access on need-to-know basis</li>
          </ul>

          <p className="mt-4"><strong>Operational Security:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Regular backups</li>
            <li>Disaster recovery procedures</li>
            <li>Incident response plan</li>
            <li>Employee security training</li>
          </ul>

          <p className="mt-4">Despite our efforts, no system is 100% secure. We cannot guarantee absolute security of your data.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. YOUR RIGHTS AND CHOICES</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">7.1 Access and Correction</h3>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Update your account information</li>
            <li>Export your training data</li>
          </ul>
          <p className="mt-2"><strong>How:</strong> Log into your account settings or email privacy@dooriq.ai</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.2 Deletion</h3>
          <p>You can request deletion of:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your entire account</li>
            <li>Specific training sessions</li>
            <li>Voice recordings</li>
            <li>Personal information</li>
          </ul>
          <p className="mt-2"><strong>How:</strong> Account settings → Delete Account, or email privacy@dooriq.ai</p>
          <p className="mt-2">Note: Some data may be retained in anonymized form for analytics.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.3 Marketing Communications</h3>
          <p>You can opt out of marketing emails by:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Clicking "unsubscribe" in any marketing email</li>
            <li>Adjusting email preferences in account settings</li>
            <li>Emailing privacy@dooriq.ai</li>
          </ul>
          <p className="mt-2">You will still receive essential account-related emails (login alerts, security notifications).</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.4 Cookie Preferences</h3>
          <p>You can control cookies through:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Browser settings (disable cookies)</li>
            <li>Our cookie consent banner (on first visit)</li>
            <li>Do Not Track signals (we honor DNT)</li>
          </ul>
          <p className="mt-2">Note: Disabling cookies may limit platform functionality.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">7.5 Data Portability</h3>
          <p>You can export your data in machine-readable format:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Training session transcripts (JSON/CSV)</li>
            <li>Performance analytics (CSV)</li>
            <li>Account information (JSON)</li>
          </ul>
          <p className="mt-2"><strong>How:</strong> Account settings → Export Data</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. CHILDREN'S PRIVACY</h2>
          <p>DoorIQ is not intended for users under 18 years old. We do not knowingly collect information from children.</p>
          <p>If you believe a child has provided information to us, contact privacy@dooriq.ai and we will delete it promptly.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. INTERNATIONAL DATA TRANSFERS</h2>
          <p>DoorIQ is based in the United States. If you access our Service from outside the US, your information will be transferred to, stored, and processed in the US.</p>
          <p>By using DoorIQ, you consent to the transfer of your information to the US and other countries where we operate.</p>
          
          <p className="mt-4"><strong>For EU/UK Users:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>We comply with GDPR requirements</li>
            <li>Data transfers are protected by Standard Contractual Clauses</li>
            <li>You have additional rights under GDPR (see Section 10)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. ADDITIONAL RIGHTS FOR EU/UK/CALIFORNIA USERS</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">10.1 GDPR Rights (EU/UK Users)</h3>
          <p>Under GDPR, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Access:</strong> Obtain a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Limit how we process your data</li>
            <li><strong>Portability:</strong> Receive data in portable format</li>
            <li><strong>Objection:</strong> Object to processing for marketing/legitimate interests</li>
            <li><strong>Withdraw Consent:</strong> Revoke consent at any time</li>
            <li><strong>Complain:</strong> File complaint with supervisory authority</li>
          </ul>
          <p className="mt-4">To exercise these rights, email privacy@dooriq.ai.</p>
          
          <p className="mt-4"><strong>Legal Basis for Processing:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Contract performance (providing the Service)</li>
            <li>Legitimate interests (improving platform, fraud prevention)</li>
            <li>Consent (marketing communications, non-essential cookies)</li>
            <li>Legal obligations (compliance with laws)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">10.2 CCPA Rights (California Users)</h3>
          <p>Under California Consumer Privacy Act (CCPA), you have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Know:</strong> What personal information we collect and how we use it</li>
            <li><strong>Access:</strong> Request a copy of your information (up to 2 times/year)</li>
            <li><strong>Delete:</strong> Request deletion of your information</li>
            <li><strong>Opt-Out:</strong> Opt out of "sale" of personal information (we don't sell data)</li>
            <li><strong>Non-Discrimination:</strong> Not be discriminated against for exercising rights</li>
          </ul>
          <p className="mt-4">To exercise these rights, email privacy@dooriq.ai or call (555) 123-4567.</p>
          <p>We do not sell personal information as defined by CCPA.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. COOKIES AND TRACKING TECHNOLOGIES</h2>
          <p>We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Keep you logged in</li>
            <li>Remember your preferences</li>
            <li>Analyze usage patterns</li>
            <li>Improve user experience</li>
          </ul>

          <p className="mt-4"><strong>Types of Cookies We Use:</strong></p>
          
          <p className="mt-4"><strong>Essential Cookies (Required):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authentication tokens</li>
            <li>Session management</li>
            <li>Security features</li>
          </ul>

          <p className="mt-4"><strong>Analytics Cookies (Optional):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Google Analytics (anonymized)</li>
            <li>User behavior tracking</li>
            <li>Feature usage statistics</li>
          </ul>

          <p className="mt-4"><strong>Preference Cookies (Optional):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Language settings</li>
            <li>Display preferences</li>
            <li>Notification settings</li>
          </ul>

          <p className="mt-4">You can control cookies through your browser settings. Disabling essential cookies may prevent platform functionality.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. THIRD-PARTY LINKS</h2>
          <p>Our Service may contain links to third-party websites or services. We are not responsible for their privacy practices.</p>
          <p>We encourage you to review the privacy policies of any third-party sites you visit.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. CHANGES TO THIS PRIVACY POLICY</h2>
          <p>We may update this Privacy Policy periodically. We will notify you of material changes by:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email notification</li>
            <li>Prominent notice on the platform</li>
            <li>Updating the "Last Updated" date</li>
          </ul>
          <p className="mt-4">Your continued use of DoorIQ after changes constitutes acceptance of the updated policy.</p>
          <p>We encourage you to review this Privacy Policy regularly.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">14. CONTACT US</h2>
          <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices:</p>
          <p className="mt-4">
            Email: privacy@dooriq.ai<br />
            Mail: DoorIQ Inc., 123 Innovation Drive, San Francisco, CA 94105<br />
            Phone: (555) 123-4567
          </p>
          <p className="mt-4">
            <strong>For GDPR-related inquiries (EU/UK users):</strong><br />
            Data Protection Officer: dpo@dooriq.ai
          </p>
          <p className="mt-4">
            <strong>For CCPA-related inquiries (California users):</strong><br />
            Privacy Contact: privacy@dooriq.ai or 1-800-555-0123
          </p>
          <p className="mt-4">We will respond to all requests within 30 days (or as required by applicable law).</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">15. DATA PROTECTION OFFICER</h2>
          <p>For users in the EU/UK, our Data Protection Officer can be reached at:</p>
          <p className="mt-4">
            Email: dpo@dooriq.ai<br />
            Mail: DoorIQ Inc., Attn: Data Protection Officer, 123 Innovation Drive, San Francisco, CA 94105
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">16. DISPUTE RESOLUTION</h2>
          <p>Any disputes arising from this Privacy Policy will be resolved in accordance with our Terms of Service.</p>
          <p className="mt-4">For EU users: You have the right to lodge a complaint with your local supervisory authority.</p>
        </section>

        <section className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-slate-400 italic">
            By using DoorIQ, you acknowledge that you have read and understood this Privacy Policy.
          </p>
          <p className="mt-4 text-slate-400">
            This Privacy Policy was last updated on November 20, 2025.
        </p>
      </section>
      </div>
    </div>
  )
}
