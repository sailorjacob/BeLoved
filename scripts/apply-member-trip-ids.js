// Script to prepare the member_id and trip_id migration SQL
// This generates a SQL file that can be run in the Supabase SQL Editor
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// These are the SQL statements we need to run
const SQL_STATEMENTS = [
  // Add member_id column if it doesn't exist
  `-- Add member_id column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'member_id'
    ) THEN
        ALTER TABLE profiles ADD COLUMN member_id VARCHAR(7) UNIQUE;
        
        -- Add an index on member_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_member_id ON profiles(member_id);
    END IF;
END $$;`,

  // Create function to generate member IDs
  `-- Create function to generate the next member ID
CREATE OR REPLACE FUNCTION generate_member_id() 
RETURNS VARCHAR AS $$
DECLARE
    next_id INTEGER;
    formatted_id VARCHAR;
BEGIN
    -- Get the current max numeric part, safely handling NULL or invalid values
    SELECT COALESCE(MAX(NULLIF(regexp_replace(member_id, '[^0-9]', '', 'g'), '')::INTEGER), 0) + 1 
    INTO next_id 
    FROM profiles 
    WHERE member_id IS NOT NULL;
    
    -- If somehow we got a NULL or zero, start with 1
    IF next_id IS NULL OR next_id < 1 THEN
        next_id := 1;
    END IF;
    
    -- Format with leading zeros to ensure 7 digits
    formatted_id := LPAD(next_id::TEXT, 7, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;`,

  // Create trigger function for member_id
  `-- Create the trigger function for member_id
CREATE OR REPLACE FUNCTION set_member_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.member_id IS NULL THEN
        NEW.member_id := generate_member_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,

  // Create trigger for member_id
  `-- Create a trigger to auto-assign member_id on insert
DO $$ 
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS before_insert_profiles ON profiles;
    
    -- Create the trigger
    CREATE TRIGGER before_insert_profiles
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION set_member_id();
END $$;`,

  // Update existing profiles with member_id
  `-- Update existing profiles with a member_id
UPDATE profiles 
SET member_id = generate_member_id() 
WHERE member_id IS NULL OR member_id = '';`,

  // Add trip_id column if it doesn't exist
  `-- Add trip_id column to rides table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'rides' AND column_name = 'trip_id'
    ) THEN
        ALTER TABLE rides ADD COLUMN trip_id VARCHAR(7) UNIQUE;
        
        -- Add an index on trip_id for faster lookups
        CREATE INDEX IF NOT EXISTS idx_rides_trip_id ON rides(trip_id);
    END IF;
END $$;`,

  // Create function to generate trip IDs
  `-- Create function to generate the next trip ID
CREATE OR REPLACE FUNCTION generate_trip_id() 
RETURNS VARCHAR AS $$
DECLARE
    next_id INTEGER;
    formatted_id VARCHAR;
BEGIN
    -- Get the current max numeric part, safely handling NULL or invalid values
    SELECT COALESCE(MAX(NULLIF(regexp_replace(trip_id, '[^0-9]', '', 'g'), '')::INTEGER), 0) + 1 
    INTO next_id 
    FROM rides 
    WHERE trip_id IS NOT NULL;
    
    -- If somehow we got a NULL or zero, start with 1
    IF next_id IS NULL OR next_id < 1 THEN
        next_id := 1;
    END IF;
    
    -- Format with leading zeros to ensure 7 digits
    formatted_id := LPAD(next_id::TEXT, 7, '0');
    
    RETURN formatted_id;
END;
$$ LANGUAGE plpgsql;`,

  // Create trigger function for trip_id
  `-- Create the trigger function for trip_id
CREATE OR REPLACE FUNCTION set_trip_id() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trip_id IS NULL THEN
        NEW.trip_id := generate_trip_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`,

  // Create trigger for trip_id
  `-- Create a trigger to auto-assign trip_id on insert
DO $$ 
BEGIN
    -- Drop the trigger if it exists
    DROP TRIGGER IF EXISTS before_insert_rides ON rides;
    
    -- Create the trigger
    CREATE TRIGGER before_insert_rides
    BEFORE INSERT ON rides
    FOR EACH ROW
    EXECUTE FUNCTION set_trip_id();
END $$;`,

  // Update existing rides with trip_id
  `-- Update existing rides with a trip_id
UPDATE rides 
SET trip_id = generate_trip_id() 
WHERE trip_id IS NULL OR trip_id = '';`,

  // Verification
  `-- Verify that the migration worked
DO $$
DECLARE
    profile_count INTEGER;
    ride_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE member_id IS NOT NULL;
    SELECT COUNT(*) INTO ride_count FROM rides WHERE trip_id IS NOT NULL;
    
    RAISE NOTICE 'Migration complete. % profiles have member_id and % rides have trip_id.', 
        profile_count, ride_count;
END $$;`
];

// Function to prompt for confirmation
function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(`${question} (y/n) `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Write SQL to file
function writeToFile(filename) {
  const content = SQL_STATEMENTS.join('\n\n');
  fs.writeFileSync(filename, content);
  console.log(`\nSQL written to ${filename}`);
}

// Main function
async function main() {
  console.log('===== Member ID and Trip ID Migration Helper =====');
  console.log('This script will generate SQL that you can run in the Supabase SQL Editor.');
  console.log('It will add member_id to profiles and trip_id to rides tables.');
  
  // Confirm destination file
  const sqlFilePath = path.join(__dirname, '../member_trip_ids_migration.sql');
  console.log(`\nSQL file will be created at: ${sqlFilePath}`);
  
  // Get confirmation
  const shouldContinue = await confirm('\nDo you want to generate this SQL file?');
  if (!shouldContinue) {
    console.log('Operation cancelled.');
    return;
  }
  
  // Write the file
  writeToFile(sqlFilePath);
  
  console.log('\n✅ SQL file generated successfully!');
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Open the Supabase Dashboard: https://supabase.com/dashboard');
  console.log('2. Navigate to your project and select the SQL Editor');
  console.log('3. Create a new query and paste the contents of the generated SQL file');
  console.log('4. Run the query to apply the migration');
  console.log('\nOnce completed, your database will have:');
  console.log('- profiles.member_id: A unique 7-digit ID for each member');
  console.log('- rides.trip_id: A unique 7-digit ID for each ride');
  console.log('- Automatic ID generation for new records');
}

// Run the script
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
}); 