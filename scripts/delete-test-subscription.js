/**
 * Delete test subscription (run in TEST mode before switching to production)
 * Usage: node scripts/delete-test-subscription.js test12345@dooriq.ai
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

async function deleteTestSubscription(email) {
  console.log(`\n🗑️  Deleting test subscription for: ${email}\n`);

  const isTestMode = stripeKey.startsWith('sk_test');
  if (!isTestMode) {
    console.error('❌ ERROR: This script should be run in TEST mode!');
    console.error('   Current key starts with:', stripeKey.substring(0, 10));
    return;
  }

  try {
    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message);
      return;
    }

    console.log('✅ User found:', user.id);

    if (!user.stripe_customer_id) {
      console.log('⚠️  User has no Stripe customer ID');
      return;
    }

    // Get subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      console.log('⚠️  No subscriptions found');
      return;
    }

    for (const subscription of subscriptions.data) {
      console.log(`\n🗑️  Canceling subscription: ${subscription.id}`);
      console.log(`   Status: ${subscription.status}`);
      
      await stripe.subscriptions.cancel(subscription.id);
      console.log(`   ✅ Canceled`);
    }

    // Clear subscription info from database
    console.log('\n🔧 Clearing subscription info from database...');
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: null,
        subscription_id: null,
        subscription_status: null,
        trial_ends_at: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('⚠️  Error updating database:', updateError);
    } else {
      console.log('✅ Database cleared');
    }

    console.log('\n✅ Test subscription deleted successfully!');
    console.log('   User can now go through checkout again with production keys');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/delete-test-subscription.js <email>');
  process.exit(1);
}

deleteTestSubscription(email).then(() => {
  process.exit(0);
});

