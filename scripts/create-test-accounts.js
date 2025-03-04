// This script creates test driver and admin accounts in Supabase
// Run with: node scripts/create-test-accounts.js

const { createClient } = require('@supabase/supabase-js');

// Replace these with your actual Supabase URL and service role key
// You can find these in your Supabase dashboard under Project Settings > API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase URL or service role key');
  console.log('Make sure to set the following environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAccounts() {
  console.log('Creating test accounts...');

  // Create test driver account
  const driverEmail = 'testdriver@example.com';
  const driverPassword = 'testdriver123';
  
  try {
    // 1. Create auth user for driver
    const { data: driverAuthData, error: driverAuthError } = await supabase.auth.admin.createUser({
      email: driverEmail,
      password: driverPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Driver',
        user_type: 'driver'
      }
    });

    if (driverAuthError) throw driverAuthError;
    console.log('Driver auth account created:', driverAuthData.user.id);

    // 2. Create profile record for driver
    const { error: driverProfileError } = await supabase
      .from('profiles')
      .insert({
        id: driverAuthData.user.id,
        full_name: 'Test Driver',
        email: driverEmail,
        phone: '555-123-4567',
        username: 'testdriver',
        user_type: 'driver'
      });

    if (driverProfileError) throw driverProfileError;
    console.log('Driver profile created');

    // 3. Create driver profile record
    const { error: driverSpecificProfileError } = await supabase
      .from('driver_profiles')
      .insert({
        id: driverAuthData.user.id,
        status: 'active',
        completed_rides: 0,
        total_miles: 0
      });

    if (driverSpecificProfileError) throw driverSpecificProfileError;
    console.log('Driver specific profile created');
    console.log('Driver account created successfully!');
    console.log('Email:', driverEmail);
    console.log('Password:', driverPassword);
    console.log('-----------------------------------');

    // Create test admin account
    const adminEmail = 'testadmin@example.com';
    const adminPassword = 'testadmin123';

    // 1. Create auth user for admin
    const { data: adminAuthData, error: adminAuthError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
        user_type: 'admin'
      }
    });

    if (adminAuthError) throw adminAuthError;
    console.log('Admin auth account created:', adminAuthData.user.id);

    // 2. Create profile record for admin
    const { error: adminProfileError } = await supabase
      .from('profiles')
      .insert({
        id: adminAuthData.user.id,
        full_name: 'Test Admin',
        email: adminEmail,
        phone: '555-987-6543',
        username: 'testadmin',
        user_type: 'admin'
      });

    if (adminProfileError) throw adminProfileError;
    console.log('Admin profile created');
    console.log('Admin account created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);

    console.log('\nAll test accounts created successfully!');
    console.log('\nTest Driver Account:');
    console.log('Email: testdriver@example.com');
    console.log('Password: testdriver123');
    console.log('\nTest Admin Account:');
    console.log('Email: testadmin@example.com');
    console.log('Password: testadmin123');

  } catch (error) {
    console.error('Error creating test accounts:', error);
  }
}

createTestAccounts(); 