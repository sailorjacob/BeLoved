# Supabase Setup Instructions

## Fix for 404 Error on Transportation Providers Table

The application is experiencing a 404 error when trying to access the `transportation_providers` table. This is because the table doesn't exist in your Supabase database yet. Follow these steps to create the necessary tables:

### Step 1: Access the Supabase SQL Editor

1. Go to the [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (the one with the URL shown in the error: `twejikjgxkzmphocbvpt.supabase.co`)
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the SQL Script

1. Create a new SQL query
2. Copy and paste the contents of the `create_transportation_providers.sql` file into the SQL editor
3. Click "Run" to execute the script

The script will:
- Create the `transportation_providers` table
- Add necessary columns to the `profiles` table
- Create the `driver_profiles` table
- Set up Row Level Security policies
- Insert a sample transportation provider for testing

### Step 3: Verify the Tables

After running the script, you can verify that the tables were created:

1. Go to the "Table Editor" in the left sidebar
2. You should see the `transportation_providers` table in the list
3. Click on it to view its contents

### Step 4: Test the Application

Once the tables are created, try using the application again. The 404 error should be resolved, and you should be able to navigate through the application without issues.

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that the SQL script ran without errors
3. Make sure the TypeScript type definitions in `types/supabase.ts` match the actual database schema

If you continue to experience issues, you may need to check the RLS policies to ensure they're correctly configured for your user roles. 