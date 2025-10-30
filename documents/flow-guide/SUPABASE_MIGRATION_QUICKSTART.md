# Supabase Migration - Quick Start Guide

## Tóm Tắt 5 Bước

### 1️⃣ Chuẩn Bị (5 phút)

```bash
# Cài đặt PostgreSQL
brew install postgresql

# Verify
pg_dump --version
psql --version
```

### 2️⃣ Chạy Script Migration (30-60 phút)

```bash
# Di chuyển vào project directory
cd /Users/macbook/Documents/personal-work/nam-viet-erp

# Edit script và điền credentials cũ
nano scripts/migrate_supabase.sh
# Hoặc
code scripts/migrate_supabase.sh

# Fill in:
OLD_PROJECT_REF="your-old-project-ref"
OLD_DB_PASSWORD="your-old-db-password"

# Chạy script
./scripts/migrate_supabase.sh
```

Script sẽ:

- ✅ Export database cũ
- ✅ Tạo backup files
- ⏸️ Dừng lại và yêu cầu bạn tạo project mới
- ✅ Import vào database mới
- ✅ Verify data

### 3️⃣ Tạo Project Mới (2 phút)

Khi script dừng lại:

1. Mở https://app.supabase.com
2. Click "New Project"
3. Điền:
   - Name: `nam-viet-erp-new`
   - Password: (generate)
   - Region: **Southeast Asia (Singapore)**
4. Click "Create"
5. Copy **Project Ref** và **Password**
6. Quay lại terminal và paste vào

### 4️⃣ Update Configuration (5 phút)

```bash
# Chạy script update config
./scripts/update_supabase_config.sh

# Nhập thông tin khi được hỏi:
# - New Project Ref
# - New Anon Key (from Supabase Settings > API)
# - New Service Role Key (from Supabase Settings > API)
```

### 5️⃣ Test (10 phút)

```bash
# Start dev server
yarn dev

# Test trong browser
# - Login
# - Xem danh sách sản phẩm
# - Tạo/sửa/xóa data
# - Check console không có lỗi
```

## Nếu Có Lỗi

### Lỗi: "pg_dump: command not found"

```bash
# MacOS
brew install postgresql

# Ubuntu/Debian
sudo apt install postgresql-client
```

### Lỗi: "Cannot connect to database"

- Check password đúng chưa
- Check project không bị paused
- Verify project ref từ URL Supabase

### Lỗi: "Table already exists"

```bash
# Drop và import lại
psql "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Rồi import lại
psql "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  -f full_backup.sql
```

### Lỗi: "No data after import"

```bash
# Check data file tồn tại
ls -lh data_only.sql

# Import riêng data
psql "postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres" \
  -f data_only.sql
```

## Checklist Nhanh

- [ ] Cài PostgreSQL
- [ ] Fill credentials trong script
- [ ] Chạy `./scripts/migrate_supabase.sh`
- [ ] Tạo project mới khi script yêu cầu
- [ ] Hoàn tất import
- [ ] Chạy `./scripts/update_supabase_config.sh`
- [ ] Test application
- [ ] ✅ Done!

## Lấy Credentials Ở Đâu?

### Old Project

1. Go to https://app.supabase.com
2. Select your current project
3. Settings > Database
4. Copy:
   - Project Ref (from URL or Connection info)
   - Database Password (you set when creating project)

### New Project

1. After creating new project
2. Settings > API
3. Copy:
   - Project URL
   - Anon/Public key
   - Service Role key

## Timeline

| Bước            | Thời Gian      | Tự Động |
| --------------- | -------------- | ------- |
| Cài đặt tools   | 5 min          | ❌      |
| Export database | 5-30 min       | ✅      |
| Tạo project mới | 2 min          | ❌      |
| Import database | 5-60 min       | ✅      |
| Update config   | 5 min          | ✅      |
| Test            | 10-30 min      | ❌      |
| **Total**       | **30-120 min** |         |

## Sau Khi Migration

✅ **Cần Làm:**

- Update production environment variables
- Test thoroughly
- Monitor for 1 week
- Keep old project as backup

❌ **Không Nên:**

- Xóa project cũ ngay
- Skip testing
- Quên backup
- Không monitor

## Hỗ Trợ

📚 Xem thêm:

- `SUPABASE_MIGRATION_GUIDE.md` - Chi tiết đầy đủ
- `SUPABASE_MIGRATION_CHECKLIST.md` - Checklist từng bước

❓ Cần trợ giúp:

- Check migration logs trong backup directory
- Supabase Discord: https://discord.supabase.com
- Supabase Docs: https://supabase.com/docs

---

**Pro Tip**: Nên chạy migration vào cuối tuần hoặc ngoài giờ cao điểm để tránh ảnh hưởng users!
