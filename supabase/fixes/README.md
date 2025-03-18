# Supabase Database Fixes

This directory contains SQL fixes for various issues that might occur with the Supabase database setup, especially around permissions and Row Level Security (RLS) policies.

## Available Fixes

| Fix | Description |
|-----|-------------|
| `fix_vehicle_permissions.sql` | Fixes RLS policies for the vehicles table to allow admins and super_admins to properly manage vehicles |

## How to Apply Fixes

### Option 1: Using the Supabase CLI (for local development)

If you have the Supabase CLI installed and configured, you can use the provided script:

```bash
# Make the script executable (if needed)
chmod +x apply_fixes.sh

# Run the script
./apply_fixes.sh
```

### Option 2: Using the Supabase Dashboard (for production)

1. Log in to the [Supabase Dashboard](https://app.supabase.io)
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy the contents of the SQL file you want to apply (e.g., `fix_vehicle_permissions.sql`)
6. Paste it into the SQL Editor
7. Run the query

### Option 3: Using Migrations (recommended for production)

For proper versioning, we've also added these fixes as regular migrations in the `../migrations/` directory. 
You should apply these through your regular migration process:

```bash
supabase migration up
```

## Troubleshooting

If you encounter any issues after applying these fixes:

1. Check the Supabase logs for any SQL errors
2. Restart the Supabase service if necessary
3. Test the affected functionality to ensure it's working correctly

If problems persist, you might need to:

1. Look at the specific RLS policies in the SQL editor
2. Verify that the correct roles have the necessary permissions
3. Test queries directly in the SQL editor to isolate the issue 