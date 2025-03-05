-- SQL Script to create a super_admin user in Supabase using admin functions
-- This approach uses Supabase's built-in functions which are more reliable

-- Step 1: Create the user with the auth.admin_create_user function
-- Replace the values with your desired super admin details
SELECT auth.admin_create_user(
  'superadmin@example.com',      -- email (replace with desired email)
  'securepassword',              -- password (replace with desired password)
  '{
    "full_name": "Super Admin User",
    "user_type": "super_admin"
  }'::jsonb                      -- user metadata (replace Super Admin User with desired name)
);

-- Step 2: Get the UUID of the user you just created
-- Run this query to get the UUID:
-- SELECT id FROM auth.users WHERE email = 'superadmin@example.com';

-- Step 3: Create the profile in profiles table
-- Replace 'USER_UUID_HERE' with the UUID from Step 2
INSERT INTO public.profiles (
  id,
  full_name,
  email,
  phone,
  user_type,
  created_at,
  updated_at
) VALUES (
  'USER_UUID_HERE',              -- Replace with UUID from Step 2
  'Super Admin User',            -- Replace with desired name
  'superadmin@example.com',      -- Replace with desired email
  '555-123-4567',                -- Replace with desired phone
  'super_admin',
  NOW(),
  NOW()
);

-- Step 4: Confirm the email (so the user doesn't need to verify)
-- Replace 'USER_UUID_HERE' with the UUID from Step 2
SELECT auth.admin_confirm_email('USER_UUID_HERE'); 