# Hướng Dẫn Duplicate Supabase

## Tổng Quan

Hướng dẫn này sẽ giúp bạn sao chép toàn bộ database và cấu hình từ Supabase hiện tại sang một Supabase instance mới.

## Phương Pháp 1: Sử Dụng Supabase CLI (Khuyến Nghị)

### Bước 1: Cài Đặt Supabase CLI

```bash
# MacOS
brew install supabase/tap/supabase

# Hoặc dùng npm
npm install -g supabase

# Kiểm tra version
supabase --version
```

### Bước 2: Login Supabase

```bash
# Login với access token
supabase login

# Hoặc set token trực tiếp
export SUPABASE_ACCESS_TOKEN=your_access_token
```

### Bước 3: Link Project Hiện Tại

```bash
# Di chuyển vào project directory
cd /Users/macbook/Documents/personal-work/nam-viet-erp

# Link với project hiện tại
supabase link --project-ref YOUR_PROJECT_REF

# Lấy project ref từ URL: https://app.supabase.com/project/[PROJECT_REF]
```

### Bước 4: Export Database Schema

```bash
# Export toàn bộ schema
supabase db dump --schema public --schema auth --schema storage -f schema.sql

# Hoặc export từng schema riêng
supabase db dump --schema public -f public_schema.sql

password: Namviet@123

supabase db dump --schema auth -f auth_schema.sql
supabase db dump --schema storage -f storage_schema.sql

# Export với data
supabase db dump --data-only -f data.sql

# Export schema + data
supabase db dump -f full_dump.sql
```

### Bước 5: Tạo Project Mới Trên Supabase

1. Truy cập https://app.supabase.com
2. Click "New Project"
3. Điền thông tin:
   - Name: nam-viet-erp-new
   - Database Password: (lưu lại password này)
   - Region: Southeast Asia (Singapore) - khuyến nghị
   - Pricing Plan: Free hoặc Pro
4. Click "Create new project"
5. Đợi ~2 phút để project được provision

### Bước 6: Link Project Mới

```bash
# Unlink project cũ
supabase unlink

# Link với project mới
supabase link --project-ref NEW_PROJECT_REF
```

### Bước 7: Import Schema và Data

```bash
# Import schema trước
supabase db push --dry-run  # Test trước
supabase db push            # Import thật

# Hoặc dùng psql
psql "postgresql://postgres.mtomtomlpwgyaxprnekw:Namviet%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" -f schema.sql

# Import data
psql "postgresql://postgres.mtomtomlpwgyaxprnekw:Namviet%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" -f data.sql

# psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f data.sql

# Hoặc import full dump

psql "postgresql://postgres.mtomtomlpwgyaxprnekw:Namviet%40123@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres" -f full_dump.sql

# psql "postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres" -f full_dump.sql
```

## Phương Pháp 2: Sử Dụng pg_dump và psql

### Bước 1: Export Database Từ Supabase Cũ

```bash
# Lấy connection string từ Supabase Dashboard
# Settings > Database > Connection string > URI

# Export schema + data
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_PROJECT_REF].supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  -F p \
  -f supabase_backup_$(date +%Y%m%d_%H%M%S).sql

# Export chỉ schema
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_PROJECT_REF].supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f schema_only.sql

# Export chỉ data
pg_dump "postgresql://postgres:[OLD_PASSWORD]@db.[OLD_PROJECT_REF].supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-privileges \
  -f data_only.sql
```

### Bước 2: Import Vào Supabase Mới

```bash
# Import full backup
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres" \
  -f supabase_backup_20250126_103000.sql

# Hoặc import từng phần
# 1. Import schema trước
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres" \
  -f schema_only.sql

# 2. Import data sau
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres" \
  -f data_only.sql
```

## Phương Pháp 3: Sử Dụng Supabase Studio (UI)

### Export Data

1. Mở Supabase Studio của project cũ
2. Vào Table Editor
3. Chọn từng table
4. Click "..." menu → "Export to CSV"
5. Lưu file CSV cho từng table

### Import Data

1. Mở Supabase Studio của project mới
2. Chạy migrations để tạo schema (nếu có)
3. Vào Table Editor
4. Chọn table
5. Click "Insert" → "Import from CSV"
6. Upload file CSV tương ứng

**Lưu ý**: Phương pháp này chỉ phù hợp cho database nhỏ và không migrate được stored procedures, functions, triggers.

## Script Tự Động Hóa

### migrate_supabase.sh

```bash
#!/bin/bash

# Supabase Migration Script
# Usage: ./migrate_supabase.sh

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./supabase_backup_$(date +%Y%m%d_%H%M%S)"
OLD_PROJECT_REF=""  # Fill this
OLD_PASSWORD=""     # Fill this
NEW_PROJECT_REF=""  # Fill this
NEW_PASSWORD=""     # Fill this

echo -e "${YELLOW}=== Supabase Migration Script ===${NC}"

# Step 1: Create backup directory
echo -e "${GREEN}[1/6] Creating backup directory...${NC}"
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

# Step 2: Export old database
echo -e "${GREEN}[2/6] Exporting old database...${NC}"
pg_dump "postgresql://postgres:${OLD_PASSWORD}@db.${OLD_PROJECT_REF}.supabase.co:5432/postgres" \
  --no-owner \
  --no-privileges \
  -F p \
  -f full_backup.sql

echo -e "${GREEN}Backup saved to: ${BACKUP_DIR}/full_backup.sql${NC}"

# Step 3: Verify backup
echo -e "${GREEN}[3/6] Verifying backup...${NC}"
if [ ! -s full_backup.sql ]; then
  echo -e "${RED}Error: Backup file is empty!${NC}"
  exit 1
fi

BACKUP_SIZE=$(du -h full_backup.sql | cut -f1)
echo -e "${GREEN}Backup size: ${BACKUP_SIZE}${NC}"

# Step 4: Create new project (manual step)
echo -e "${YELLOW}[4/6] Please create new Supabase project manually:${NC}"
echo "1. Go to https://app.supabase.com"
echo "2. Click 'New Project'"
echo "3. Fill in project details"
echo "4. Copy the new project ref and password"
echo ""
read -p "Press Enter when new project is ready..."

# Step 5: Import to new database
echo -e "${GREEN}[5/6] Importing to new database...${NC}"
echo "This may take several minutes depending on database size..."

psql "postgresql://postgres:${NEW_PASSWORD}@db.${NEW_PROJECT_REF}.supabase.co:5432/postgres" \
  -f full_backup.sql \
  2>&1 | tee import_log.txt

# Step 6: Verify import
echo -e "${GREEN}[6/6] Verifying import...${NC}"

# Count tables in new database
TABLE_COUNT=$(psql "postgresql://postgres:${NEW_PASSWORD}@db.${NEW_PROJECT_REF}.supabase.co:5432/postgres" \
  -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")

echo -e "${GREEN}Tables imported: ${TABLE_COUNT}${NC}"

echo -e "${GREEN}Migration completed successfully!${NC}"
echo -e "${YELLOW}Don't forget to:${NC}"
echo "1. Update environment variables"
echo "2. Test the new database"
echo "3. Update Supabase client configuration"
```

## Sau Khi Migration

### 1. Cập Nhật Environment Variables

**File: `.env` hoặc `.env.local`**

```bash
# Old values (backup)
# NEXT_PUBLIC_SUPABASE_URL=https://[OLD_PROJECT_REF].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=old_anon_key
# SUPABASE_SERVICE_ROLE_KEY=old_service_role_key

# New values
NEXT_PUBLIC_SUPABASE_URL=https://[NEW_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=new_anon_key
SUPABASE_SERVICE_ROLE_KEY=new_service_role_key
```

Lấy keys từ: Settings > API

### 2. Cập Nhật Supabase Client

**File: `packages/services/src/supabase/supabase.ts`**

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 3. Test Connection

```bash
# Test với curl
curl https://[NEW_PROJECT_REF].supabase.co/rest/v1/ \
  -H "apikey: [NEW_ANON_KEY]" \
  -H "Authorization: Bearer [NEW_ANON_KEY]"

# Test với psql
psql "postgresql://postgres:[NEW_PASSWORD]@db.[NEW_PROJECT_REF].supabase.co:5432/postgres" \
  -c "SELECT count(*) FROM products;"
```

### 4. Migrate Storage Files (Nếu Có)

```bash
# Export storage từ project cũ
supabase storage download --project-ref OLD_PROJECT_REF --bucket-name avatars --output ./storage_backup/

# Import vào project mới
supabase storage upload --project-ref NEW_PROJECT_REF --bucket-name avatars --directory ./storage_backup/
```

### 5. Migrate Auth Users (Nếu Cần)

**Lưu ý**: Auth users có mã hóa password, cần xử lý cẩn thận

```sql
-- Export users từ database cũ
COPY (
  SELECT * FROM auth.users
) TO '/tmp/users.csv' WITH CSV HEADER;

-- Import vào database mới (cần cẩn thận với password hash)
-- Hoặc yêu cầu users reset password
```

## Kiểm Tra Sau Migration

### Checklist

- [ ] Tất cả tables đã được import
- [ ] Row counts khớp với database cũ
- [ ] Functions và stored procedures hoạt động
- [ ] Triggers đang active
- [ ] RLS policies đã được copy
- [ ] Indexes đã được tạo
- [ ] Foreign keys intact
- [ ] Storage buckets và files (nếu có)
- [ ] Auth users (nếu migrate)
- [ ] Application connect được database mới
- [ ] Chạy test suite thành công

### SQL Queries Để Verify

```sql
-- Count tables
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Count total rows
SELECT
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- List functions
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public';

-- List triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

## Rollback Plan

Nếu có vấn đề, bạn có thể rollback:

1. Giữ nguyên project cũ (đừng xóa)
2. Revert environment variables về project cũ
3. Deploy lại code với config cũ

## Lưu Ý Quan Trọng

### ⚠️ Trước Khi Migration

1. **Backup toàn bộ**: Không bao giờ migration mà không có backup
2. **Test trên staging**: Test migration process trên môi trường test trước
3. **Downtime planning**: Plan cho downtime nếu cần
4. **Thông báo users**: Nếu có downtime, thông báo trước

### ⚠️ Trong Quá Trình Migration

1. **Không xóa project cũ**: Giữ lại ít nhất 1 tuần
2. **Monitor logs**: Theo dõi import logs để catch errors
3. **Check data integrity**: Verify row counts sau mỗi table import

### ⚠️ Sau Migration

1. **Test thoroughly**: Test tất cả features
2. **Monitor performance**: Database mới có thể cần tune
3. **Update documentation**: Cập nhật docs với thông tin mới
4. **Backup new database**: Tạo backup cho database mới ngay lập tức

## Troubleshooting

### Lỗi: "permission denied"

```sql
-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
```

### Lỗi: "relation already exists"

```bash
# Import với --clean flag
pg_dump ... --clean -f backup.sql
```

### Lỗi: "out of memory"

```bash
# Import từng table riêng biệt
pg_dump -t table_name ...
```

### Import Quá Lâu

- Tắt indexes trước khi import, tạo lại sau
- Import data-only trước, constraints sau
- Tăng connection timeout

## Cost Estimation

| Database Size | Time        | Downtime                 |
| ------------- | ----------- | ------------------------ |
| < 1GB         | 5-10 mins   | < 5 mins                 |
| 1-10GB        | 10-30 mins  | 10-15 mins               |
| 10-50GB       | 30-120 mins | 30-60 mins               |
| > 50GB        | Hours       | Contact Supabase support |

## Support

Nếu gặp vấn đề:

1. Check Supabase docs: https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects
2. Supabase Discord: https://discord.supabase.com
3. GitHub Issues: https://github.com/supabase/supabase/issues

---

**Version**: 1.0
**Created**: 2025-01-26
**Author**: Nam Việt ERP Team
