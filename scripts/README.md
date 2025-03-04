# Test Account Creation Scripts

This directory contains scripts for creating test accounts in the BeLoved application.

## Create Test Accounts

The `create-test-accounts.js` script creates test driver and admin accounts in Supabase for testing purposes.

### Prerequisites

Before running the script, you need to have the following environment variables set:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (found in Project Settings > API)

### Running the Script

You can run the script using npm:

```bash
npm run create-test-accounts
```

Or directly with Node.js:

```bash
node scripts/create-test-accounts.js
```

### Created Accounts

The script will create the following test accounts:

1. **Test Driver Account**
   - Email: testdriver@example.com
   - Password: testdriver123
   - Role: driver

2. **Test Admin Account**
   - Email: testadmin@example.com
   - Password: testadmin123
   - Role: admin

### Notes

- These accounts are created with email confirmation already completed
- The accounts have basic profile information pre-filled
- For the driver account, a driver_profile record is also created
- You can modify the script to create accounts with different credentials if needed 