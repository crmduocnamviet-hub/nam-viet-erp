#!/bin/bash

# ============================================
# Update Supabase Configuration Script
# ============================================
# This script helps update environment variables
# after migrating to a new Supabase project
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================
# Get New Project Information
# ============================================

print_header "Supabase Configuration Update"

echo "Please provide your new Supabase project information:"
echo ""

read -p "New Project Ref: " NEW_PROJECT_REF
read -p "New Anon Key: " NEW_ANON_KEY
read -p "New Service Role Key: " NEW_SERVICE_ROLE_KEY

if [ -z "$NEW_PROJECT_REF" ] || [ -z "$NEW_ANON_KEY" ] || [ -z "$NEW_SERVICE_ROLE_KEY" ]; then
    print_error "All fields are required!"
    exit 1
fi

NEW_URL="https://${NEW_PROJECT_REF}.supabase.co"

# ============================================
# Backup Existing .env Files
# ============================================

print_header "Backup Existing Configuration"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)

for env_file in .env .env.local .env.production; do
    if [ -f "$env_file" ]; then
        backup_file="${env_file}.backup_${TIMESTAMP}"
        cp "$env_file" "$backup_file"
        print_success "Backed up $env_file to $backup_file"
    fi
done

# ============================================
# Update .env File
# ============================================

print_header "Update Environment Variables"

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    print_warning "$ENV_FILE not found. Creating new file..."
    touch "$ENV_FILE"
fi

# Function to update or add env variable
update_env_var() {
    local key=$1
    local value=$2
    local file=$3

    if grep -q "^${key}=" "$file" 2>/dev/null; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${value}|" "$file"
        else
            sed -i "s|^${key}=.*|${key}=${value}|" "$file"
        fi
        print_info "Updated $key in $file"
    else
        # Add new
        echo "${key}=${value}" >> "$file"
        print_info "Added $key to $file"
    fi
}

# Update variables
update_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEW_URL" "$ENV_FILE"
update_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEW_ANON_KEY" "$ENV_FILE"
update_env_var "SUPABASE_SERVICE_ROLE_KEY" "$NEW_SERVICE_ROLE_KEY" "$ENV_FILE"

print_success "Environment variables updated in $ENV_FILE"

# ============================================
# Update .env.local (if exists)
# ============================================

if [ -f ".env.local" ]; then
    print_info "Updating .env.local..."
    update_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEW_URL" ".env.local"
    update_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEW_ANON_KEY" ".env.local"
    update_env_var "SUPABASE_SERVICE_ROLE_KEY" "$NEW_SERVICE_ROLE_KEY" ".env.local"
    print_success "Updated .env.local"
fi

# ============================================
# Generate Configuration Summary
# ============================================

print_header "Configuration Summary"

cat << EOF
New Supabase Configuration:
---------------------------
URL: $NEW_URL
Anon Key: ${NEW_ANON_KEY:0:20}...
Service Role Key: ${NEW_SERVICE_ROLE_KEY:0:20}...

Files Updated:
--------------
$([ -f ".env" ] && echo "✓ .env")
$([ -f ".env.local" ] && echo "✓ .env.local")

Backups Created:
----------------
$(ls -1 *.backup_${TIMESTAMP} 2>/dev/null || echo "None")
EOF

# ============================================
# Verify Supabase Client
# ============================================

print_header "Verify Supabase Client Configuration"

SUPABASE_CLIENT_FILE="packages/services/src/supabase/supabase.ts"

if [ -f "$SUPABASE_CLIENT_FILE" ]; then
    print_info "Checking $SUPABASE_CLIENT_FILE..."

    if grep -q "process.env.NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_CLIENT_FILE"; then
        print_success "Supabase client is using environment variables ✓"
    else
        print_warning "Supabase client may have hardcoded values!"
        print_warning "Please check: $SUPABASE_CLIENT_FILE"
    fi
else
    print_warning "Supabase client file not found: $SUPABASE_CLIENT_FILE"
fi

# ============================================
# Test Connection
# ============================================

print_header "Test Connection"

print_info "Testing connection to new Supabase..."

# Simple curl test
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $NEW_ANON_KEY" \
    -H "Authorization: Bearer $NEW_ANON_KEY" \
    "$NEW_URL/rest/v1/")

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "401" ]; then
    print_success "Connection test passed! (HTTP $HTTP_CODE)"
else
    print_error "Connection test failed! (HTTP $HTTP_CODE)"
    print_warning "Please verify your keys and URL"
fi

# ============================================
# Next Steps
# ============================================

print_header "Next Steps"

cat << EOF
Configuration update complete! 🎉

Next steps:
-----------
1. ✓ Environment variables updated
2. ✓ Backup files created
3. ⏭ Restart your development server:
   $ yarn dev
   # or
   $ npm run dev

4. ⏭ Test the application:
   - Login/authentication
   - Data fetching
   - CRUD operations
   - File uploads (if any)

5. ⏭ Deploy to production:
   - Update environment variables on hosting platform
   - Deploy new version
   - Monitor for errors

6. ⏭ Verify database:
   - Check row counts
   - Test complex queries
   - Verify relationships

7. ⏭ Keep old project as backup for at least 1 week

Troubleshooting:
----------------
If you encounter issues:
- Clear browser cache and localStorage
- Check browser console for errors
- Verify API keys are correct
- Check Supabase dashboard for errors

For more information:
---------------------
See SUPABASE_MIGRATION_GUIDE.md

EOF

print_success "Configuration update script completed!"
