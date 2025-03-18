#!/bin/bash

# This script applies SQL fixes to your Supabase database
# Make sure you have the Supabase CLI installed and properly configured

# Exit on error
set -e

# Set colors for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Applying database fixes...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Apply the vehicle permissions fix
echo -e "${YELLOW}Applying fix for vehicle permissions...${NC}"
supabase db execute --file "$SCRIPT_DIR/fix_vehicle_permissions.sql"

echo -e "${GREEN}All database fixes have been applied successfully!${NC}"
echo ""
echo -e "${YELLOW}Note:${NC} If you're developing locally, you may need to restart your Supabase project."
echo -e "For a production environment, check the Supabase dashboard to verify the changes." 