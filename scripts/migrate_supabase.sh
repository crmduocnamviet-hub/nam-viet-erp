#!/bin/bash

# ============================================
# Supabase Migration Script
# ============================================
# This script will duplicate your Supabase database
# from one project to another
# ============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (fill these in)
OLD_PROJECT_REF=""      # e.g., "abcdefghijklmnop"
OLD_DB_PASSWORD=""      # Database password from old project
NEW_PROJECT_REF=""      # New project ref (after creating new project)
NEW_DB_PASSWORD=""      # Database password for new project

# Backup configuration
BACKUP_DIR="./supabase_backup_$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="full_backup.sql"

# ============================================
# Helper Functions
# ============================================

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

check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 is not installed!"
        echo "Please install $1 first:"
        echo "  brew install $2"
        exit 1
    fi
}

# URL encode password for connection string
url_encode() {
    local string="${1}"
    local strlen=${#string}
    local encoded=""
    local pos c o

    for (( pos=0 ; pos<strlen ; pos++ )); do
        c=${string:$pos:1}
        case "$c" in
            [-_.~a-zA-Z0-9] ) o="${c}" ;;
            * ) printf -v o '%%%02x' "'$c"
        esac
        encoded+="${o}"
    done
    echo "${encoded}"
}

# ============================================
# Pre-flight Checks
# ============================================

print_header "Pre-flight Checks"

# Check if required commands are installed
check_command "pg_dump" "postgresql"
check_command "psql" "postgresql"

# Check if configuration is filled
if [ -z "$OLD_PROJECT_REF" ] || [ -z "$OLD_DB_PASSWORD" ]; then
    print_error "Please fill in OLD_PROJECT_REF and OLD_DB_PASSWORD in the script!"
    exit 1
fi

print_success "All pre-flight checks passed"

# ============================================
# Step 1: Create Backup Directory
# ============================================

print_header "Step 1: Create Backup Directory"

mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"
print_success "Created backup directory: $BACKUP_DIR"

# ============================================
# Step 2: Export Old Database
# ============================================

print_header "Step 2: Export Old Database"

# Use PGPASSWORD to avoid special character issues in connection string
export PGPASSWORD="${OLD_DB_PASSWORD}"
OLD_DB_HOST="db.${OLD_PROJECT_REF}.supabase.co"

print_info "Starting database export..."
print_info "This may take several minutes depending on database size..."

# Export full database using -h flag instead of connection string
pg_dump -h "$OLD_DB_HOST" \
    -U postgres \
    -d postgres \
    -p 5432 \
    --no-owner \
    --no-privileges \
    --no-acl \
    -F p \
    -f "$BACKUP_FILE" \
    2>&1 | tee export_log.txt

if [ $? -eq 0 ]; then
    print_success "Database exported successfully"
else
    print_error "Failed to export database"
    exit 1
fi

# Check backup file
if [ ! -s "$BACKUP_FILE" ]; then
    print_error "Backup file is empty!"
    exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
print_success "Backup size: $BACKUP_SIZE"

# Count lines in backup
LINE_COUNT=$(wc -l < "$BACKUP_FILE")
print_info "Backup contains $LINE_COUNT lines"

# ============================================
# Step 3: Export Specific Schemas
# ============================================

print_header "Step 3: Export Specific Schemas"

# Export public schema only
print_info "Exporting public schema..."
pg_dump -h "$OLD_DB_HOST" -U postgres -d postgres -p 5432 \
    --schema=public \
    --no-owner \
    --no-privileges \
    -f "public_schema.sql"
print_success "Public schema exported"

# Export auth schema (if needed)
print_info "Exporting auth schema..."
pg_dump -h "$OLD_DB_HOST" -U postgres -d postgres -p 5432 \
    --schema=auth \
    --no-owner \
    --no-privileges \
    -f "auth_schema.sql" 2>/dev/null || print_warning "Auth schema export skipped (may not have access)"

# Export storage schema (if needed)
print_info "Exporting storage schema..."
pg_dump -h "$OLD_DB_HOST" -U postgres -d postgres -p 5432 \
    --schema=storage \
    --no-owner \
    --no-privileges \
    -f "storage_schema.sql" 2>/dev/null || print_warning "Storage schema export skipped (may not have access)"

# ============================================
# Step 4: Export Data Only
# ============================================

print_header "Step 4: Export Data Only"

print_info "Exporting data without schema..."
pg_dump -h "$OLD_DB_HOST" -U postgres -d postgres -p 5432 \
    --data-only \
    --no-owner \
    --no-privileges \
    -f "data_only.sql"
print_success "Data exported"

# ============================================
# Step 5: Create Statistics
# ============================================

print_header "Step 5: Create Migration Statistics"

# Count tables
TABLE_COUNT=$(psql -h "$OLD_DB_HOST" -U postgres -d postgres -p 5432 -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
print_info "Total tables in public schema: $(echo $TABLE_COUNT | xargs)"

# Get table sizes
print_info "Generating table statistics..."
psql -h "$OLD_DB_HOST" -U postgres -d postgres -p 5432 -c "
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
" > table_stats.txt

cat table_stats.txt
print_success "Statistics saved to table_stats.txt"

# ============================================
# Step 6: Wait for New Project
# ============================================

print_header "Step 6: Create New Supabase Project"

echo ""
print_warning "Please create a new Supabase project now:"
echo ""
echo "1. Go to https://app.supabase.com"
echo "2. Click 'New Project'"
echo "3. Fill in project details:"
echo "   - Name: nam-viet-erp-new (or your choice)"
echo "   - Database Password: (generate a strong password)"
echo "   - Region: Southeast Asia (Singapore) - recommended"
echo "   - Pricing Plan: Free or Pro"
echo "4. Click 'Create new project'"
echo "5. Wait ~2 minutes for provisioning"
echo "6. Go to Settings > Database to get:"
echo "   - Project Ref (from URL or Connection info)"
echo "   - Database Password (you just created)"
echo ""
read -p "Press Enter when new project is ready and you have the credentials..."

# Get new project credentials
echo ""
read -p "Enter NEW Project Ref: " NEW_PROJECT_REF
read -s -p "Enter NEW Database Password: " NEW_DB_PASSWORD
echo ""

if [ -z "$NEW_PROJECT_REF" ] || [ -z "$NEW_DB_PASSWORD" ]; then
    print_error "New project credentials are required!"
    exit 1
fi

print_success "New project credentials saved"

# Unset old password and set new password
unset PGPASSWORD
export PGPASSWORD="${NEW_DB_PASSWORD}"
NEW_DB_HOST="db.${NEW_PROJECT_REF}.supabase.co"

# ============================================
# Step 7: Test New Database Connection
# ============================================

print_header "Step 7: Test New Database Connection"

print_info "Testing connection to new database..."
if psql -h "$NEW_DB_HOST" -U postgres -d postgres -p 5432 -c "SELECT version();" > /dev/null 2>&1; then
    print_success "Connection to new database successful"
else
    print_error "Cannot connect to new database!"
    print_error "Please check your credentials and try again"
    exit 1
fi

# ============================================
# Step 8: Import to New Database
# ============================================

print_header "Step 8: Import to New Database"

print_warning "This will import all data to the new database"
read -p "Continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Import cancelled"
    exit 0
fi

print_info "Starting import..."
print_info "This may take several minutes..."

# Import full backup
psql -h "$NEW_DB_HOST" -U postgres -d postgres -p 5432 -f "$BACKUP_FILE" 2>&1 | tee import_log.txt

if [ $? -eq 0 ]; then
    print_success "Import completed successfully"
else
    print_error "Import failed! Check import_log.txt for details"
    exit 1
fi

# ============================================
# Step 9: Verify Import
# ============================================

print_header "Step 9: Verify Import"

# Count tables in new database
NEW_TABLE_COUNT=$(psql -h "$NEW_DB_HOST" -U postgres -d postgres -p 5432 -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
print_info "Tables in new database: $(echo $NEW_TABLE_COUNT | xargs)"

# Compare table counts
if [ "$(echo $TABLE_COUNT | xargs)" == "$(echo $NEW_TABLE_COUNT | xargs)" ]; then
    print_success "Table count matches!"
else
    print_warning "Table count mismatch! Old: $TABLE_COUNT, New: $NEW_TABLE_COUNT"
fi

# Get row counts
print_info "Comparing row counts..."
psql -h "$NEW_DB_HOST" -U postgres -d postgres -p 5432 -c "
SELECT
    schemaname,
    tablename,
    n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC
LIMIT 20;
" > new_table_stats.txt

print_success "Verification complete. Check new_table_stats.txt for details"

# Cleanup PGPASSWORD
unset PGPASSWORD

# ============================================
# Step 10: Generate Migration Report
# ============================================

print_header "Step 10: Generate Migration Report"

REPORT_FILE="migration_report.txt"

cat > "$REPORT_FILE" << EOF
========================================
SUPABASE MIGRATION REPORT
========================================
Date: $(date)
Migration ID: $(basename $BACKUP_DIR)

OLD PROJECT
-----------
Project Ref: $OLD_PROJECT_REF
Database Host: $OLD_DB_HOST
Tables: $(echo $TABLE_COUNT | xargs)
Backup Size: $BACKUP_SIZE

NEW PROJECT
-----------
Project Ref: $NEW_PROJECT_REF
Database Host: $NEW_DB_HOST
Tables: $(echo $NEW_TABLE_COUNT | xargs)

FILES CREATED
-------------
- $BACKUP_FILE (Full backup)
- public_schema.sql (Public schema only)
- data_only.sql (Data only)
- export_log.txt (Export logs)
- import_log.txt (Import logs)
- table_stats.txt (Old database stats)
- new_table_stats.txt (New database stats)

NEXT STEPS
----------
1. Update environment variables:
   NEXT_PUBLIC_SUPABASE_URL=https://${NEW_PROJECT_REF}.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=(get from Supabase dashboard)
   SUPABASE_SERVICE_ROLE_KEY=(get from Supabase dashboard)

2. Get API keys from:
   https://app.supabase.com/project/${NEW_PROJECT_REF}/settings/api

3. Update supabase client configuration

4. Test the application thoroughly

5. Keep old project active for at least 1 week as backup

6. Monitor new database performance

========================================
EOF

cat "$REPORT_FILE"
print_success "Migration report saved to $REPORT_FILE"

# ============================================
# Final Summary
# ============================================

print_header "Migration Complete! 🎉"

echo ""
print_success "All steps completed successfully!"
echo ""
print_info "Summary:"
echo "  • Old Project: $OLD_PROJECT_REF"
echo "  • New Project: $NEW_PROJECT_REF"
echo "  • Backup Location: $BACKUP_DIR"
echo "  • Tables Migrated: $(echo $TABLE_COUNT | xargs)"
echo ""
print_warning "IMPORTANT: Don't forget to:"
echo "  1. Update environment variables (.env file)"
echo "  2. Get new API keys from Supabase dashboard"
echo "  3. Test your application"
echo "  4. Keep old project as backup (don't delete yet!)"
echo ""
print_info "For detailed instructions, see: SUPABASE_MIGRATION_GUIDE.md"
echo ""
