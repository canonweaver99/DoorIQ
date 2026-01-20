/**
 * Create a user account with email and password
 * Usage: node scripts/create-user-account.js bittergregory@gmail.com GREG123456!
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createUserAccount(email, password) {
  console.log(`\n🔧 Creating account for: ${email}\n`);

  try {
    // Check if user already exists
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const existingAuthUser = usersData?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingAuthUser) {
      console.log('⚠️  User already exists:');
      console.log(`   User ID: ${existingAuthUser.id}`);
      console.log(`   Email: ${existingAuthUser.email}`);
      console.log(`   Created: ${new Date(existingAuthUser.created_at).toLocaleString()}`);
      
      // Check if user profile exists
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', existingAuthUser.id)
        .single();
      
      if (profile) {
        console.log('\n✅ User profile exists in database');
        console.log(`   Name: ${profile.full_name || 'N/A'}`);
        console.log(`   Role: ${profile.role || 'N/A'}`);
      } else {
        console.log('\n⚠️  User profile missing - creating now...');
        // Create user profile
        const repId = `REP-${Date.now().toString().slice(-6)}`;
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: existingAuthUser.id,
            email: email.toLowerCase(),
            full_name: email.split('@')[0],
            rep_id: repId,
            role: 'rep',
            virtual_earnings: 0,
          });
        
        if (profileError) {
          console.error('❌ Error creating profile:', profileError);
        } else {
          console.log('✅ User profile created');
        }
      }
      
      // Update password if needed
      console.log('\n🔐 Updating password...');
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingAuthUser.id, {
        password: password,
      });
      
      if (updateError) {
        console.error('⚠️  Error updating password:', updateError);
      } else {
        console.log('✅ Password updated');
      }
      
      return;
    }

    // Create new user
    console.log('Creating new user account...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: email.split('@')[0],
        source: 'manual_creation',
      },
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    if (!authData?.user) {
      console.error('❌ Failed to create user');
      return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user created: ${userId}`);

    // Create user profile
    const repId = `REP-${Date.now().toString().slice(-6)}`;
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: email.toLowerCase(),
        full_name: email.split('@')[0],
        rep_id: repId,
        role: 'rep',
        virtual_earnings: 0,
      });

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError);
      // Try to clean up auth user
      await supabase.auth.admin.deleteUser(userId);
      return;
    }

    console.log('✅ User profile created');

    // Create session limits record
    const today = new Date().toISOString().split('T')[0];
    const { error: limitsError } = await supabase
      .from('user_session_limits')
      .insert({
        user_id: userId,
        sessions_this_month: 0,
        sessions_limit: 75,
        last_reset_date: today,
      });

    if (limitsError) {
      console.error('⚠️  Error creating session limits:', limitsError);
    } else {
      console.log('✅ Session limits created');
    }

    console.log('\n✅ Account created successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Email: ${email.toLowerCase()}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Rep ID: ${repId}`);
    console.log(`   Role: rep`);
    console.log(`\n🔗 Login at: https://dooriq.ai/auth/login`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/create-user-account.js <email> <password>');
  process.exit(1);
}

createUserAccount(email, password).then(() => {
  process.exit(0);
});

