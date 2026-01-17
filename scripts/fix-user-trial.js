/**
 * Fix user trial by checking Stripe and updating database
 * Usage: node scripts/fix-user-trial.js test12345@dooriq.ai
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey || !stripeKey) {
  console.error('❌ Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey);

async function fixUserTrial(email) {
  console.log(`\n🔧 Fixing trial for: ${email}\n`);

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

    // Search for Stripe customers by email
    const customers = await stripe.customers.list({
      email: email.toLowerCase(),
      limit: 10,
    });

    if (customers.data.length === 0) {
      console.log('\n❌ No Stripe customer found');
      console.log('💡 This suggests the checkout was never completed or webhook failed');
      return;
    }

    console.log(`\n✅ Found ${customers.data.length} Stripe customer(s)`);

    for (const customer of customers.data) {
      console.log(`\n📊 Customer: ${customer.id}`);
      
      // Get subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 10,
      });

      if (subscriptions.data.length === 0) {
        console.log('   ⚠️  No subscriptions found');
        continue;
      }

      for (const subscription of subscriptions.data) {
        console.log(`\n   📦 Subscription: ${subscription.id}`);
        console.log(`      Status: ${subscription.status}`);
        console.log(`      Created: ${new Date(subscription.created * 1000).toLocaleString()}`);
        
        const trialEndsAt = subscription.trial_end 
          ? new Date(subscription.trial_end * 1000).toISOString()
          : null;
        
        console.log(`      Trial End: ${trialEndsAt ? new Date(trialEndsAt).toLocaleString() : 'No trial'}`);

        // Update user in database
        const updateData = {
          stripe_customer_id: customer.id,
          subscription_id: subscription.id,
          subscription_status: subscription.status === 'trialing' ? 'trialing' : subscription.status,
          trial_ends_at: trialEndsAt,
        };

        console.log('\n   🔧 Updating user in database...');
        const { error: updateError } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (updateError) {
          console.error('   ❌ Error updating user:', updateError);
        } else {
          console.log('   ✅ User updated successfully!');
          console.log(`      Subscription Status: ${updateData.subscription_status}`);
          console.log(`      Trial Ends At: ${updateData.trial_ends_at || 'N/A'}`);
          
          // Create subscription event
          if (subscription.status === 'trialing') {
            const { error: eventError } = await supabase
              .from('subscription_events')
              .insert({
                user_id: user.id,
                event_type: 'trial_started',
                event_data: {
                  subscription_id: subscription.id,
                  customer_id: customer.id,
                  trial_ends_at: trialEndsAt,
                },
                notification_sent: false,
              });

            if (eventError) {
              console.error('   ⚠️  Error creating subscription event:', eventError);
            } else {
              console.log('   ✅ Subscription event created');
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/fix-user-trial.js <email>');
  process.exit(1);
}

fixUserTrial(email).then(() => {
  process.exit(0);
});

