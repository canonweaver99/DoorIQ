export default function HelpPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
      <h1 className="text-4xl font-bold mb-2">DOORIQ HELP CENTER</h1>
      <p className="text-slate-400 mb-8">
        Welcome to DoorIQ Support! Find answers to common questions and learn how to get the most out of your AI-powered sales training.
      </p>

      <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">GETTING STARTED</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">What is DoorIQ?</h3>
          <p>DoorIQ is an AI-powered training platform that helps door-to-door sales reps practice their pitch with realistic AI homeowners. Practice handling objections, perfect your close, and get instant feedback - all without requiring manager time or burning real leads.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How do I create an account?</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to dooriq.ai</li>
            <li>Click "Start Free Trial" or "Sign Up"</li>
            <li>Enter your name, email, and create a password</li>
            <li>Choose your plan (or start with 7-day free trial)</li>
            <li>Complete payment information (if selecting paid plan)</li>
            <li>Start training immediately!</li>
          </ol>
          <p className="mt-4"><strong>No credit card required for free trial.</strong></p>

          <h3 className="text-xl font-semibold mt-6 mb-3">What's included in the free trial?</h3>
          <p>Your 7-day free trial includes:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full access to all AI personas</li>
            <li>Unlimited practice sessions</li>
            <li>Complete analytics and feedback</li>
            <li>All features of your selected plan tier</li>
            <li>No credit card required</li>
          </ul>
          <p className="mt-4">After 14 days, you'll automatically downgrade to a free limited plan (1 session per week) unless you upgrade.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How do I start my first training session?</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Log into your DoorIQ account</li>
            <li>Click "Practice" in the navigation menu</li>
            <li>Choose a homeowner persona (we recommend starting with "Average Austin" or "Nancy Williams")</li>
            <li>Allow microphone access when prompted</li>
            <li>Click "Start Session"</li>
            <li>The AI homeowner will answer the door - start your pitch!</li>
            <li>Session ends when the AI closes the door or you click "End Session"</li>
          </ol>
          <p className="mt-4"><strong>Tip:</strong> Treat it like a real door knock. Be natural, confident, and handle objections as they come up.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">TRAINING SESSIONS</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">How long are training sessions?</h3>
          <p>Sessions typically last 5-15 minutes, similar to a real door knock. The AI will naturally end the conversation when appropriate (purchase, rejection, or time constraint).</p>
          <p className="mt-2">You can also manually end sessions at any time by clicking "End Session."</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Which persona should I practice with?</h3>
          <p><strong>For beginners:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Nancy Williams - Reasonable buyer, good for learning basics</li>
            <li>Average Austin - Skeptical but fair, common objections</li>
          </ul>
          <p className="mt-4"><strong>For intermediate reps:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Busy Beth - Time objection focused, quick conversations</li>
            <li>Price-Conscious Paul - Budget objections, negotiation practice</li>
          </ul>
          <p className="mt-4"><strong>For advanced reps:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Defensive Dave - Hostile, challenging interactions</li>
            <li>The Closer Killer - Experienced buyer, hard to close</li>
          </ul>
          <p className="mt-4">See all personas at: Practice → Browse Personas</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">What if the AI doesn't understand me?</h3>
          <p>Check these common issues:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>✓ Microphone access: Ensure your browser has microphone permission</li>
            <li>✓ Background noise: Find a quiet space for best recognition</li>
            <li>✓ Speaking clearly: Speak at normal volume and pace</li>
            <li>✓ Internet connection: Weak connection can cause delays</li>
          </ul>
          <p className="mt-4"><strong>If problems persist:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Try a different browser (Chrome recommended)</li>
            <li>Check microphone settings in your device</li>
            <li>Restart the session</li>
            <li>Contact support if issue continues</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I pause a training session?</h3>
          <p>No, sessions cannot be paused. This simulates real door-knocking where you can't pause a conversation with a homeowner.</p>
          <p className="mt-2">If you need to stop, click "End Session" - your progress up to that point will be saved.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How do I view my session results?</h3>
          <p><strong>During the session:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Live feedback appears in the right panel</li>
            <li>Real-time metrics show talk time, objections, techniques</li>
          </ul>
          <p className="mt-4"><strong>After the session:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Session automatically redirects to analytics page</li>
            <li>Or go to "Sessions" → click on any past session</li>
            <li>View complete transcript, scores, and detailed feedback</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">What do the scores mean?</h3>
          <p><strong>Overall Score (0-100):</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>85+: Excellent - ready for real doors</li>
            <li>70-84: Good - minor improvements needed</li>
            <li>60-69: Fair - practice specific areas</li>
            <li>Below 60: Needs work - focus on fundamentals</li>
          </ul>
          <p className="mt-4"><strong>Category Breakdown:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Rapport (0-100%): Opening strength and connection building</li>
            <li>Discovery (0-100%): Question quality and listening</li>
            <li>Objection Handling (0-100%): How well you addressed concerns</li>
            <li>Closing (0-100%): Effectiveness of your close attempt</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">PLANS & BILLING</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">What plans do you offer?</h3>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-slate-700">
              <thead>
                <tr className="bg-slate-800">
                  <th className="border border-slate-700 px-4 py-2 text-left">Plan</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Price</th>
                  <th className="border border-slate-700 px-4 py-2 text-left">Best For</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-700 px-4 py-2">Solo/Startup</td>
                  <td className="border border-slate-700 px-4 py-2">$99/month</td>
                  <td className="border border-slate-700 px-4 py-2">Individual reps or 1-person teams</td>
                </tr>
                <tr>
                  <td className="border border-slate-700 px-4 py-2">Team</td>
                  <td className="border border-slate-700 px-4 py-2">$79/month per rep</td>
                  <td className="border border-slate-700 px-4 py-2">Small-medium companies (5-20 reps)</td>
                </tr>
                <tr>
                  <td className="border border-slate-700 px-4 py-2">Growth</td>
                  <td className="border border-slate-700 px-4 py-2">$59/month per rep</td>
                  <td className="border border-slate-700 px-4 py-2">Regional companies (21-100 reps)</td>
                </tr>
                <tr>
                  <td className="border border-slate-700 px-4 py-2">Enterprise</td>
                  <td className="border border-slate-700 px-4 py-2">Custom pricing</td>
                  <td className="border border-slate-700 px-4 py-2">Large organizations (100+ reps)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4">All plans include unlimited practice sessions.</p>
          <p>See full details: dooriq.ai/pricing</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I change plans?</h3>
          <p>Yes! You can upgrade or downgrade anytime:</p>
          <p className="mt-4"><strong>To upgrade:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to Settings → Billing</li>
            <li>Click "Change Plan"</li>
            <li>Select new plan</li>
            <li>Confirm - prorated charge applied immediately</li>
          </ol>
          <p className="mt-4"><strong>To downgrade:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to Settings → Billing</li>
            <li>Click "Change Plan"</li>
            <li>Select lower plan</li>
            <li>Change takes effect at end of current billing cycle</li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-3">How do I cancel my subscription?</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to Settings → Billing</li>
            <li>Click "Cancel Subscription"</li>
            <li>Confirm cancellation</li>
            <li>You'll retain access until end of paid period</li>
            <li>No further charges after cancellation</li>
          </ol>
          <p className="mt-4"><strong>Refunds:</strong> Contact support within 14 days of initial purchase for refund consideration.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Do you offer refunds?</h3>
          <p>Yes, with our 14-Day Money-Back Guarantee:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Full refund if unsatisfied within first 14 days</li>
            <li>Email support@dooriq.ai within 14 days of purchase</li>
            <li>Refund processed in 7-10 business days</li>
          </ul>
          <p className="mt-4"><strong>After 14 days:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Subscription fees are non-refundable</li>
            <li>You can cancel anytime to stop future charges</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">What payment methods do you accept?</h3>
          <p>We accept:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All major credit cards (Visa, Mastercard, Amex, Discover)</li>
            <li>Debit cards</li>
            <li>ACH bank transfer (Enterprise plans only)</li>
          </ul>
          <p className="mt-4">We use Stripe for secure payment processing. We never store your full credit card number.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I get an invoice?</h3>
          <p>Yes! Invoices are automatically emailed after each payment.</p>
          <p className="mt-4"><strong>To access past invoices:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to Settings → Billing</li>
            <li>Click "Payment History"</li>
            <li>Download any invoice as PDF</li>
          </ol>
          <p className="mt-4">Need a custom invoice? Email support@dooriq.ai with your requirements.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">TEAM MANAGEMENT</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">How do I add team members?</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to "Manager" → "Team"</li>
            <li>Click "Add Team Member"</li>
            <li>Enter their name and email</li>
            <li>Assign role (Rep or Manager)</li>
            <li>Click "Send Invitation"</li>
            <li>They'll receive email with account setup link</li>
          </ol>
          <p className="mt-4">You're only charged for active seats, starting the day they join.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">What's the difference between Rep and Manager roles?</h3>
          <p><strong>Reps can:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Take training sessions</li>
            <li>View their own scores and analytics</li>
            <li>See team leaderboard (if enabled)</li>
          </ul>
          <p className="mt-4"><strong>Managers can:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Everything reps can do</li>
            <li>View all rep performance and sessions</li>
            <li>Access team analytics dashboard</li>
            <li>Add/remove team members</li>
            <li>Configure team settings</li>
          </ul>
          <p className="mt-4"><strong>Admin (account owner) can:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Everything managers can do</li>
            <li>Manage billing and subscription</li>
            <li>Delete the account</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can managers listen to rep sessions?</h3>
          <p><strong>Managers can:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>View session transcripts</li>
            <li>See performance scores and feedback</li>
            <li>Access analytics and trends</li>
          </ul>
          <p className="mt-4"><strong>Managers cannot:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Listen to actual voice recordings (privacy protection)</li>
            <li>Join live sessions in progress</li>
          </ul>
          <p className="mt-4">Voice recordings are private to the rep unless they explicitly share them.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How does the leaderboard work?</h3>
          <p>The leaderboard ranks reps based on:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Average overall score</li>
            <li>Total sessions completed</li>
            <li>Improvement rate</li>
            <li>Current streak</li>
          </ul>
          <p className="mt-4"><strong>Leaderboard settings:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Managers can enable/disable leaderboard</li>
            <li>Can be filtered by date range</li>
            <li>Updates in real-time</li>
          </ul>
          <p className="mt-4">To view: Go to "Sessions" → "Leaderboard"</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">TECHNICAL SUPPORT</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Browser requirements</h3>
          <p><strong>Recommended:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Chrome (latest version)</li>
            <li>Edge (latest version)</li>
            <li>Safari 14+ (Mac only)</li>
            <li>Firefox (latest version)</li>
          </ul>
          <p className="mt-4"><strong>Required:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Microphone access enabled</li>
            <li>Stable internet connection (2+ Mbps)</li>
            <li>JavaScript enabled</li>
            <li>Cookies enabled</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Microphone not working?</h3>
          <p><strong>Chrome:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Click the lock icon in address bar</li>
            <li>Ensure Microphone is set to "Allow"</li>
            <li>Refresh the page</li>
          </ol>
          <p className="mt-4"><strong>Safari:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Safari → Settings → Websites → Microphone</li>
            <li>Find dooriq.ai and set to "Allow"</li>
            <li>Refresh the page</li>
          </ol>
          <p className="mt-4"><strong>Still not working?</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Try a different browser</li>
            <li>Check System Preferences → Privacy → Microphone</li>
            <li>Restart your computer</li>
            <li>Contact support</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Session won't start or keeps loading?</h3>
          <p><strong>Common fixes:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Check internet connection - Speed test at speedtest.net (need 2+ Mbps)</li>
            <li>Clear browser cache:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Chrome: Settings → Privacy → Clear browsing data</li>
                <li>Select "Cached images and files"</li>
                <li>Clear and reload</li>
              </ul>
            </li>
            <li>Disable browser extensions - Ad blockers can interfere</li>
            <li>Try incognito/private mode - Rules out extension conflicts</li>
            <li>Try different browser - Chrome works best</li>
            <li>Restart your device</li>
          </ul>
          <p className="mt-4"><strong>Still stuck?</strong> Email support@dooriq.ai with:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Browser and version</li>
            <li>Screenshot of error (if any)</li>
            <li>What happens when you try to start session</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Audio quality is poor or choppy?</h3>
          <p><strong>Improve audio quality:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>✓ Use headphones with mic - Better than built-in laptop mic</li>
            <li>✓ Reduce background noise - Close windows, mute notifications</li>
            <li>✓ Check internet speed - Need at least 2 Mbps upload</li>
            <li>✓ Close other tabs/apps - Frees up bandwidth and processing</li>
            <li>✓ Move closer to WiFi router - Or use ethernet cable</li>
          </ul>
          <p className="mt-4">Persistent issues? Contact support - we can adjust quality settings.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">The AI is responding slowly</h3>
          <p><strong>Normal response time:</strong> 1-3 seconds (like a real person thinking)</p>
          <p className="mt-4"><strong>If longer than 5 seconds:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Check internet connection speed</li>
            <li>Close other applications using bandwidth</li>
            <li>Try a different time of day (peak hours may be slower)</li>
            <li>Contact support if consistently slow</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I use DoorIQ on mobile?</h3>
          <p><strong>Currently:</strong> DoorIQ is optimized for desktop browsers.</p>
          <p className="mt-4"><strong>Mobile support:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Viewing sessions and analytics works on mobile</li>
            <li>Taking training sessions is not yet supported on mobile</li>
            <li>Mobile app is on our roadmap for 2026</li>
          </ul>
          <p className="mt-4"><strong>Best experience:</strong> Use laptop or desktop computer with headset.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">FEATURES & CUSTOMIZATION</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Can I create custom training scenarios?</h3>
          <p>Growth and Enterprise plans include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Custom AI persona creation</li>
            <li>Industry-specific scenarios</li>
            <li>Custom objection types</li>
            <li>Voice cloning of your top performers (Enterprise)</li>
          </ul>
          <p className="mt-4"><strong>To request custom personas:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Email support@dooriq.ai</li>
            <li>Describe the persona (personality, objections, background)</li>
            <li>We'll create it within 3-5 business days</li>
            <li>Available in your Practice menu</li>
          </ol>

          <h3 className="text-xl font-semibold mt-6 mb-3">How do I clone my top rep's voice?</h3>
          <p><strong>Available on:</strong> Enterprise plans only</p>
          <p className="mt-4"><strong>Process:</strong></p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Contact support@dooriq.ai to request voice cloning</li>
            <li>We'll provide audio recording instructions</li>
            <li>Your top rep records 10-15 minutes of sample audio</li>
            <li>We process and create custom AI persona (7-10 days)</li>
            <li>Persona added to your account for all reps to practice with</li>
          </ol>
          <p className="mt-4">This creates a powerful training tool - reps learn from your best performer 24/7!</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I export my training data?</h3>
          <p>Yes! Export your data anytime:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to Settings → Account</li>
            <li>Click "Export Data"</li>
            <li>Choose data type:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Session transcripts (JSON/CSV)</li>
                <li>Performance scores (CSV)</li>
                <li>Analytics reports (PDF)</li>
              </ul>
            </li>
            <li>Click "Generate Export"</li>
            <li>Download link sent to your email</li>
          </ol>
          <p className="mt-4">Exports are ready within 24 hours.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Do you have an API?</h3>
          <p>API access is available for Enterprise customers.</p>
          <p className="mt-4"><strong>Use our API to:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Integrate DoorIQ with your CRM</li>
            <li>Build custom dashboards</li>
            <li>Automate reporting</li>
            <li>Create custom workflows</li>
          </ul>
          <p className="mt-4">Contact sales@dooriq.ai for API documentation and access.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">PRIVACY & SECURITY</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Is my data secure?</h3>
          <p>Yes. We take security seriously:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>✓ Encryption in transit - TLS/SSL for all data transmission</li>
            <li>✓ Encryption at rest - Sensitive data encrypted in database</li>
            <li>✓ Secure hosting - Enterprise-grade infrastructure</li>
            <li>✓ Regular backups - Daily automated backups</li>
            <li>✓ Access controls - Role-based permissions</li>
            <li>✓ SOC 2 compliance - Currently pursuing certification</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Who can see my voice recordings?</h3>
          <p><strong>Voice recording privacy:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Only you can access your voice recordings</li>
            <li>Managers see transcripts and scores, but NOT audio</li>
            <li>Voice data sent to ElevenLabs API for processing</li>
            <li>Recordings automatically deleted after 90 days</li>
            <li>You can delete recordings anytime</li>
          </ul>
          <p className="mt-4">See Privacy Policy for full details: dooriq.ai/privacy</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How long do you keep my data?</h3>
          <p><strong>While account is active:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Session data: 1 year</li>
            <li>Voice recordings: 90 days</li>
            <li>Analytics: Indefinitely (anonymized)</li>
          </ul>
          <p className="mt-4"><strong>After account deletion:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>All personal data deleted within 30 days</li>
            <li>Anonymized analytics may be retained</li>
            <li>Backups purged within 90 days</li>
          </ul>
          <p className="mt-4">Request data deletion anytime: support@dooriq.ai</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I delete specific sessions?</h3>
          <p>Yes!</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to "Sessions"</li>
            <li>Find the session you want to delete</li>
            <li>Click the ⋮ menu icon</li>
            <li>Select "Delete Session"</li>
            <li>Confirm deletion</li>
          </ol>
          <p className="mt-4"><strong>Note:</strong> This removes the session from analytics and cannot be undone.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">TROUBLESHOOTING</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Common Error Messages</h3>
          <p><strong>"Microphone access denied"</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Go to browser settings and allow microphone for dooriq.ai</li>
            <li>Reload the page</li>
          </ul>
          <p className="mt-4"><strong>"Connection lost"</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Check internet connection</li>
            <li>Refresh page</li>
            <li>Session progress is auto-saved</li>
          </ul>
          <p className="mt-4"><strong>"Session limit reached"</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Free plan: 1 session per week (upgrade for unlimited)</li>
            <li>Contact support if you're on paid plan</li>
          </ul>
          <p className="mt-4"><strong>"Payment failed"</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Update payment method in Settings → Billing</li>
            <li>Check with your bank</li>
            <li>Contact support for help</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">I forgot my password</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to dooriq.ai/login</li>
            <li>Click "Forgot Password?"</li>
            <li>Enter your email address</li>
            <li>Check email for reset link (check spam folder)</li>
            <li>Click link and create new password</li>
            <li>Log in with new password</li>
          </ol>
          <p className="mt-4">Link expires in 1 hour. No email? Contact support.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How do I change my email address?</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to Settings → Account</li>
            <li>Click "Change Email"</li>
            <li>Enter new email address</li>
            <li>Verify via confirmation email</li>
            <li>New email becomes your login</li>
          </ol>
          <p className="mt-4">You'll receive confirmation at both old and new email addresses.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">My session disappeared</h3>
          <p>Sessions are auto-saved, but if missing:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Check "Sessions" page - may be on page 2+</li>
            <li>Check date filter - sessions older than selected range won't show</li>
            <li>If still missing, email support@dooriq.ai with:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>Approximate date/time of session</li>
                <li>Persona you were practicing with</li>
                <li>Your account email</li>
              </ul>
            </li>
          </ul>
          <p className="mt-4">We can usually recover lost sessions from backups.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">CONTACT SUPPORT</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">How do I get help?</h3>
          <p><strong>Email Support (Response within 24 hours):</strong></p>
          <p>support@dooriq.ai</p>
          <p className="mt-4"><strong>For urgent issues (paid customers):</strong></p>
          <p>(555) 123-4567</p>
          <p>Monday-Friday, 9am-6pm CT</p>
          <p className="mt-4"><strong>Live Chat:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Click the chat icon in bottom right corner</li>
            <li>Monday-Friday, 9am-5pm CT</li>
          </ul>
          <p className="mt-4"><strong>Help Center:</strong></p>
          <p>help.dooriq.ai</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">What information should I include?</h3>
          <p>When contacting support, please include:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Your account email address</li>
            <li>Detailed description of the issue</li>
            <li>What you were doing when the issue occurred</li>
            <li>Browser and version (find at: whatsmybrowser.org)</li>
            <li>Screenshots (if applicable)</li>
            <li>Any error messages you saw</li>
          </ul>
          <p className="mt-4">This helps us resolve your issue faster!</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Response times</h3>
          <p><strong>Email Support:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>General inquiries: 24 hours</li>
            <li>Technical issues: 12 hours</li>
            <li>Billing questions: 12 hours</li>
            <li>Urgent issues: 4 hours (paid plans)</li>
          </ul>
          <p className="mt-4"><strong>Live Chat:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Immediate response during business hours</li>
            <li>Available: Monday-Friday, 9am-5pm CT</li>
          </ul>
          <p className="mt-4"><strong>Phone Support:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>For paid customers only</li>
            <li>Urgent technical issues</li>
            <li>Available: Monday-Friday, 9am-6pm CT</li>
        </ul>
      </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">FEEDBACK & FEATURE REQUESTS</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">How can I suggest a new feature?</h3>
          <p>We love hearing from users!</p>
          <p className="mt-4"><strong>Submit feature requests:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Email feedback@dooriq.ai</li>
            <li>Include:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>What feature you'd like to see</li>
                <li>Why it would be useful</li>
                <li>How you'd use it</li>
              </ul>
            </li>
          </ul>
          <p className="mt-4">We review all suggestions monthly</p>
          <p>Popular requests get prioritized for development!</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I join the beta program?</h3>
          <p>Yes! Beta testers get:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Early access to new features</li>
            <li>Ability to shape product direction</li>
            <li>Direct line to product team</li>
            <li>Special beta badge</li>
          </ul>
          <p className="mt-4">Sign up: Email beta@dooriq.ai with "Join Beta Program"</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">RESOURCES</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Video Tutorials</h3>
          <p><strong>Getting Started:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Creating your first account (3 min)</li>
            <li>Your first training session (5 min)</li>
            <li>Understanding your scores (4 min)</li>
          </ul>
          <p className="mt-4"><strong>Advanced Training:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Handling price objections (8 min)</li>
            <li>Mastering the close (10 min)</li>
            <li>Using team analytics (6 min)</li>
          </ul>
          <p className="mt-4">Watch all tutorials: dooriq.ai/tutorials</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Best Practices</h3>
          <p><strong>For Individual Reps:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Practice 3-5 sessions per week</li>
            <li>Rotate between different personas</li>
            <li>Review your transcripts after each session</li>
            <li>Focus on one skill at a time (objections, closing, etc.)</li>
            <li>Track your progress over time</li>
          </ul>
          <p className="mt-4"><strong>For Managers:</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Set team training goals (e.g., 5 sessions/week)</li>
            <li>Review team analytics weekly</li>
            <li>Identify common weak points</li>
            <li>Use recordings in team meetings for coaching</li>
            <li>Recognize top performers publicly</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Industry-Specific Guides</h3>
          <p>We have specialized training guides for:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Pest Control</li>
            <li>Solar Sales</li>
            <li>Home Security</li>
            <li>Roofing</li>
            <li>HVAC</li>
            <li>General Home Services</li>
          </ul>
          <p className="mt-4">Access guides: dooriq.ai/resources</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">FREQUENTLY ASKED QUESTIONS</h2>
          
          <h3 className="text-xl font-semibold mt-6 mb-3">Is DoorIQ only for door-to-door sales?</h3>
          <p>While designed for D2D, it works for any sales role that involves handling objections and closing - phone sales, retail, B2B, etc.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can multiple people use one account?</h3>
          <p>No, each rep needs their own account for accurate tracking. Team plans make this affordable.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Do sessions count toward real sales metrics?</h3>
          <p>No, these are practice sessions only. They don't affect your real sales numbers.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Can I practice in languages other than English?</h3>
          <p>Currently English only. Spanish and other languages coming in 2026.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">How realistic are the AI homeowners?</h3>
          <p>Very realistic! They're trained on thousands of real D2D conversations and respond naturally to your pitch.</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Will this replace real door-knocking?</h3>
          <p>No - it supplements real training. Think of it like a pilot using a flight simulator before flying a real plane.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mt-8 mb-4">STILL NEED HELP?</h2>
          <p>Can't find what you're looking for?</p>
          <ul className="list-disc pl-6 space-y-2 mt-4">
            <li>📧 Email: support@dooriq.ai</li>
            <li>📞 Phone: (555) 123-4567 (M-F, 9am-6pm CT)</li>
            <li>💬 Live Chat: Click icon in bottom right</li>
            <li>🌐 Help Center: help.dooriq.ai</li>
          </ul>
          <p className="mt-4">We're here to help you succeed!</p>
        </section>

        <section className="mt-12 pt-8 border-t border-slate-700">
          <p className="text-slate-400">
            Last updated: November 20, 2025
          </p>
      </section>
      </div>
    </div>
  )
}
