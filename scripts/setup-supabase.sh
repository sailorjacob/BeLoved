#!/bin/bash

# Check if environment is provided
if [ -z "$1" ]; then
  echo "Please provide environment (dev or prod)"
  exit 1
fi

ENV=$1
PROJECT_ID=""
PROJECT_URL=""

# Load environment variables
if [ "$ENV" = "dev" ]; then
  source .env.local
  PROJECT_URL=$NEXT_PUBLIC_SUPABASE_URL
elif [ "$ENV" = "prod" ]; then
  source .env.production
  PROJECT_URL=$NEXT_PUBLIC_SUPABASE_URL
else
  echo "Invalid environment. Use 'dev' or 'prod'"
  exit 1
fi

# Extract project ID from URL
PROJECT_ID=$(echo $PROJECT_URL | sed 's/.*\/\([^/]*\)\.supabase\.co/\1/')

# Configure Supabase CLI
echo "Configuring Supabase CLI..."
supabase link --project-ref $PROJECT_ID

# Apply database migrations
echo "Applying database migrations..."
supabase db push

# Configure authentication settings
echo "Configuring authentication settings..."
if [ "$ENV" = "dev" ]; then
  SITE_URL="http://localhost:3000"
else
  SITE_URL="https://your-domain.com"  # Replace with your production domain
fi

# Set up auth config using Supabase Management API
curl -X PUT "https://api.supabase.com/v1/projects/$PROJECT_ID/auth/config" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "site_url": "'$SITE_URL'",
    "additional_redirect_urls": ["'$SITE_URL'/auth/callback"],
    "jwt_exp": 3600,
    "enable_signup": true
  }'

# Configure CORS
echo "Configuring CORS..."
curl -X PUT "https://api.supabase.com/v1/projects/$PROJECT_ID/api-config" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cors_config": {
      "allowed_origins": ["'$SITE_URL'"]
    }
  }'

echo "Setup complete for $ENV environment!" 