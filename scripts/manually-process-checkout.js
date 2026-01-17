/**
 * Manually process a checkout session to fix missing trial
 * Usage: node scripts/manually-process-checkout.js <checkout_session_id>
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripeKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeKey || !supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const stripe = new Stripe(stripeKey);
const supabase = createClient(supabaseUrl, supabaseKey);

async function manuallyProcessCheckout(sessionId) {
  console.log(`\n🔧 Manually processing checkout session: ${sessionId}\n`);

  try {
    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    console.log('✅ Checkout session retrieved');
    console.log(`   Status: ${session.status}`);
    console.log(`   Payment Status: ${session.payment_status}`);
    console.log(`   Customer Email: ${session.customer_email || 'N/A'}`);
    console.log(`   Subscription: ${session.subscription || 'N/A'}`);

    if (session.status !== 'complete') {
      console.log('\n❌ Checkout session is not complete. Cannot process.');
      return;
    }

    if (!session.subscription) {
      console.log('\n❌ No subscription found in checkout session.');
      return;
    }

    // Get subscription details
    const subscriptionId = typeof session.subscription === 'string' 
      ? session.subscription 
      : session.subscription.id;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log(`\n📦 Subscription: ${subscriptionId}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Trial End: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleString() : 'No trial'}`);

    // Get customer
    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    if (!customerId) {
      console.log('\n❌ No customer ID found');
      return;
    }

    const customer = await stripe.customers.retrieve(customerId);
    const customerEmail = customer.email || session.customer_email || session.metadata?.user_email;

    if (!customerEmail) {
      console.log('\n❌ No email found for customer');
      return;
    }

    console.log(`\n👤 Customer Email: ${customerEmail}`);

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', customerEmail.toLowerCase())
      .single();

    if (userError || !user) {
      console.log('\n❌ User not found in database');
      console.log('   Error:', userError?.message);
      return;
    }

    console.log(`\n✅ User found: ${user.id} (${user.full_name || user.email})`);

    // Update Stripe customer metadata with user ID
    await stripe.customers.update(customerId, {
      metadata: {
        ...customer.metadata,
        supabase_user_id: user.id,
      },
    });
    console.log('✅ Updated Stripe customer metadata');

    // Get trial end date
    const trialEndsAt = subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;

    // Update user subscription info
    const updateData = {
      stripe_customer_id: customerId,
      subscription_id: subscriptionId,
      subscription_status: subscription.status === 'trialing' ? 'trialing' : subscription.status,
      trial_ends_at: trialEndsAt,
    };

    console.log('\n🔧 Updating user subscription...');
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ User subscription updated!');
    console.log(`   Subscription Status: ${updateData.subscription_status}`);
    console.log(`   Trial Ends At: ${updateData.trial_ends_at || 'N/A'}`);

    // Create subscription event if trialing
    if (subscription.status === 'trialing') {
      const { error: eventError } = await supabase
        .from('subscription_events')
        .insert({
          user_id: user.id,
          event_type: 'trial_started',
          event_data: {
            subscription_id: subscriptionId,
            customer_id: customerId,
            trial_ends_at: trialEndsAt,
            manually_fixed: true,
          },
          notification_sent: false,
        });

      if (eventError) {
        console.error('⚠️  Error creating subscription event:', eventError);
      } else {
        console.log('✅ Subscription event created');
      }
    }

    console.log('\n✅ Trial fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: node scripts/manually-process-checkout.js <checkout_session_id>');
  console.error('\nTo find checkout session ID:');
  console.error('1. Go to Stripe Dashboard > Checkout Sessions');
  console.error('2. Find the session for test12345@dooriq.ai');
  console.error('3. Copy the session ID (starts with cs_test_ or cs_live_)');
  process.exit(1);
}

manuallyProcessCheckout(sessionId).then(() => {
  process.exit(0);
});

