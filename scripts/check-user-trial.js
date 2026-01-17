/**
 * Check if a user successfully started a free trial via Stripe
 * Usage: node scripts/check-user-trial.js test12345@dooriq.ai
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserTrial(email) {
  console.log(`\n🔍 Checking trial status for: ${email}\n`);

  try {
    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      console.error('❌ User not found:', userError?.message || 'No user found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.full_name || 'N/A'}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role || 'N/A'}`);
    console.log(`\n📊 Subscription Status:`);
    console.log(`   Subscription Status: ${user.subscription_status || 'null'}`);
    console.log(`   Stripe Customer ID: ${user.stripe_customer_id || 'null'}`);
    console.log(`   Subscription ID: ${user.subscription_id || 'null'}`);
    console.log(`   Trial Ends At: ${user.trial_ends_at || 'null'}`);
    
    if (user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      console.log(`   Days Remaining: ${daysRemaining > 0 ? daysRemaining : 'Trial expired'}`);
    }

    // Check subscription events
    const { data: events, error: eventsError } = await supabase
      .from('subscription_events')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!eventsError && events && events.length > 0) {
      console.log(`\n📧 Subscription Events (${events.length}):`);
      events.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.event_type} - ${new Date(event.created_at).toLocaleString()}`);
        if (event.notification_sent) {
          console.log(`      ✅ Notification sent: ${new Date(event.notification_sent_at).toLocaleString()}`);
        }
      });
    } else {
      console.log('\n📧 No subscription events found');
    }

    // Check if trial started
    const isTrialing = user.subscription_status === 'trialing';
    const hasTrialEndDate = !!user.trial_ends_at;
    
    console.log(`\n🎯 Trial Status Summary:`);
    if (isTrialing && hasTrialEndDate) {
      console.log(`   ✅ FREE TRIAL ACTIVE`);
      console.log(`   Trial ends: ${new Date(user.trial_ends_at).toLocaleString()}`);
    } else if (user.subscription_status === 'active') {
      console.log(`   ✅ SUBSCRIPTION ACTIVE (trial completed)`);
    } else if (hasTrialEndDate && new Date(user.trial_ends_at) < new Date()) {
      console.log(`   ⚠️  TRIAL EXPIRED`);
      console.log(`   Trial ended: ${new Date(user.trial_ends_at).toLocaleString()}`);
    } else {
      console.log(`   ❌ NO TRIAL FOUND`);
      console.log(`   Status: ${user.subscription_status || 'null'}`);
    }

  } catch (error) {
    console.error('❌ Error checking user trial:', error);
  }
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/check-user-trial.js <email>');
  process.exit(1);
}

checkUserTrial(email).then(() => {
  process.exit(0);
});

