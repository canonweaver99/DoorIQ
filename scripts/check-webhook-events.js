/**
 * Check Stripe webhook events for a specific email
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey);

async function checkWebhookEvents(email) {
  console.log(`\n🔍 Checking webhook events for: ${email}\n`);

  try {
    // List recent events
    const events = await stripe.events.list({
      limit: 100,
    });

    console.log(`Found ${events.data.length} recent events\n`);

    // Filter for checkout and subscription events
    const relevantEvents = events.data.filter(event => 
      event.type.includes('checkout') || 
      event.type.includes('subscription') ||
      event.type.includes('customer')
    );

    console.log(`Found ${relevantEvents.length} relevant events:\n`);

    for (const event of relevantEvents) {
      const data = event.data.object;
      const eventEmail = data.customer_email || 
                        data.email || 
                        data.metadata?.user_email ||
                        (data.customer && typeof data.customer === 'object' ? data.customer.email : null);

      if (eventEmail && eventEmail.toLowerCase().includes(email.toLowerCase().split('@')[0])) {
        console.log(`✅ Event: ${event.type}`);
        console.log(`   ID: ${event.id}`);
        console.log(`   Created: ${new Date(event.created * 1000).toLocaleString()}`);
        console.log(`   Email: ${eventEmail}`);
        
        if (data.id) {
          console.log(`   Object ID: ${data.id}`);
        }
        if (data.status) {
          console.log(`   Status: ${data.status}`);
        }
        console.log('');
      }
    }

    // Also check for any events that might be related
    const possibleMatches = events.data.filter(event => {
      const data = event.data.object;
      const metadata = data.metadata || {};
      return JSON.stringify(metadata).toLowerCase().includes(email.toLowerCase().split('@')[0]);
    });

    if (possibleMatches.length > 0) {
      console.log(`\n🎯 Possible matches by metadata (${possibleMatches.length}):\n`);
      possibleMatches.forEach(event => {
        console.log(`Event: ${event.type}`);
        console.log(`ID: ${event.id}`);
        console.log(`Metadata:`, JSON.stringify(event.data.object.metadata || {}, null, 2));
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const email = process.argv[2] || 'test12345@dooriq.ai';
checkWebhookEvents(email).then(() => process.exit(0));

