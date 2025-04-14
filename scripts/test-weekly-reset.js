// This script manually triggers the weekly stars reset function
// Used for testing the reset functionality without waiting for Sunday

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testWeeklyReset() {
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Manually running weekly stars reset function...');
  
  try {
    // Call the reset_weekly_stars database function
    const { error } = await supabase.rpc('reset_weekly_stars');

    if (error) {
      console.error('Error running reset_weekly_stars function:', error);
      process.exit(1);
    }

    console.log('Weekly stars reset was successful!');
    
    // Fetch driver stats to confirm reset
    const { data, error: statsError } = await supabase
      .from('driver_profiles')
      .select('id, weekly_stars_count, total_stars')
      .order('total_stars', { ascending: false })
      .limit(5);
    
    if (statsError) {
      console.error('Error fetching driver stats:', statsError);
      process.exit(1);
    }
    
    console.log('Driver stats after reset:');
    console.table(data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

testWeeklyReset()
  .then(() => {
    console.log('Test complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  }); 