/**
 * Manually create a free trial for a user
 * This simulates what the webhook should have done
 * Usage: node scripts/create-manual-trial.js test12345@dooriq.ai
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

async function createManualTrial(email) {
  console.log(`\n🔧 Creating manual trial for: ${email}\n`);

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

    console.log('✅ User found:', user.id, `(${user.full_name || user.email})`);

    // Check if user already has a subscription
    if (user.stripe_customer_id && user.subscription_status) {
      console.log('\n⚠️  User already has subscription:');
      console.log(`   Customer ID: ${user.stripe_customer_id}`);
      console.log(`   Status: ${user.subscription_status}`);
      console.log(`   Trial Ends: ${user.trial_ends_at || 'N/A'}`);
      return;
    }

    // Get individual plan price ID from config
    // Production: price_1SpC081fQ6MPQdN0Oi42IDV0 (from lib/stripe/config.ts)
    const isTestMode = stripeKey.startsWith('sk_test');
    
    if (isTestMode) {
      console.error('\n❌ ERROR: You are using TEST mode Stripe keys!');
      console.error('   Current key starts with: sk_test_');
      console.error('\n   To switch to PRODUCTION mode:');
      console.error('   1. Get production keys from Stripe Dashboard (Live Mode)');
      console.error('   2. Update .env.local with:');
      console.error('      STRIPE_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY');
      console.error('      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY');
      console.error('   3. Update STRIPE_WEBHOOK_SECRET with production webhook secret');
      console.error('   4. Redeploy your application');
      console.error('\n   ⚠️  The test subscription created earlier will NOT work in production!');
      return;
    }
    
    // Use production price ID from config
    const { STRIPE_CONFIG } = require('../lib/stripe/config');
    const individualMonthlyPriceId = STRIPE_CONFIG.starter.priceId; // Production: price_1SpC081fQ6MPQdN0Oi42IDV0
    
    console.log(`\n📋 Using PRODUCTION price ID: ${individualMonthlyPriceId}`);

    console.log('\n📦 Creating Stripe customer...');
    
    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log(`✅ Found existing customer: ${customer.id}`);
    } else {
      customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name: user.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      console.log(`✅ Created new customer: ${customer.id}`);
    }

    // Update customer metadata
    await stripe.customers.update(customer.id, {
      metadata: {
        ...customer.metadata,
        supabase_user_id: user.id,
      },
    });

    console.log('\n📦 Creating subscription with 7-day trial...');
    
    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: individualMonthlyPriceId,
      }],
      trial_period_days: 7,
      metadata: {
        supabase_user_id: user.id,
        plan_type: 'individual',
        billing_period: 'monthly',
        manually_created: 'true',
      },
    });

    console.log(`✅ Subscription created: ${subscription.id}`);
    console.log(`   Status: ${subscription.status}`);
    console.log(`   Trial End: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleString() : 'N/A'}`);

    // Update user in database
    const trialEndsAt = subscription.trial_end 
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null;

    const updateData = {
      stripe_customer_id: customer.id,
      subscription_id: subscription.id,
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt,
    };

    console.log('\n🔧 Updating user in database...');
    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Error updating user:', updateError);
      return;
    }

    console.log('✅ User updated successfully!');
    console.log(`   Subscription Status: ${updateData.subscription_status}`);
    console.log(`   Trial Ends At: ${updateData.trial_ends_at}`);

    // Create subscription event
    const { error: eventError } = await supabase
      .from('subscription_events')
      .insert({
        user_id: user.id,
        event_type: 'trial_started',
        event_data: {
          subscription_id: subscription.id,
          customer_id: customer.id,
          trial_ends_at: trialEndsAt,
          manually_created: true,
        },
        notification_sent: false,
      });

    if (eventError) {
      console.error('⚠️  Error creating subscription event:', eventError);
    } else {
      console.log('✅ Subscription event created');
    }

    console.log('\n✅ Free trial created successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   User: ${user.email}`);
    console.log(`   Stripe Customer: ${customer.id}`);
    console.log(`   Subscription: ${subscription.id}`);
    console.log(`   Status: trialing`);
    console.log(`   Trial Ends: ${trialEndsAt ? new Date(trialEndsAt).toLocaleString() : 'N/A'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/create-manual-trial.js <email>');
  process.exit(1);
}

createManualTrial(email).then(() => {
  process.exit(0);
});

