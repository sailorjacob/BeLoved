#!/bin/bash

# Make script exit when any command fails
set -e

# Deploy the Edge Function
echo "Deploying reset-weekly-stars Edge Function..."
npx supabase functions deploy reset-weekly-stars

# Set up the cron job to run at midnight on Sundays (CRON: 0 0 * * 0)
echo "Setting up cron job to run at midnight on Sundays..."
npx supabase functions schedule reset-weekly-stars --cron "0 0 * * 0"

echo "Deployment completed successfully!" 