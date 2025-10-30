# PostgreSQL Password với Ký Tự Đặc Biệt

## Vấn Đề

Connection string PostgreSQL có format:

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

Nếu password chứa ký tự đặc biệt như `@`, `#`, `/`, sẽ bị parse sai.

**Ví dụ lỗi:**

```bash
# Password: Namviet@123
psql "postgresql://postgres:Namviet@123@db.xxx.supabase.co:5432/postgres"
# Error: could not translate host name "123@db.xxx.supabase.co"
```

## Giải Pháp

### 1. URL Encoding (Nhanh)

Encode các ký tự đặc biệt:

| Ký tự | Encoded |
| ----- | ------- |
| @     | %40     |
| #     | %23     |
| %     | %25     |
| /     | %2F     |
| ?     | %3F     |
| &     | %26     |
| :     | %3A     |
| =     | %3D     |
| space | %20     |

**Ví dụ:**

```bash
# Password: Namviet@123
# Encoded: Namviet%40123
psql "postgresql://postgres:Namviet%40123@db.xxx.supabase.co:5432/postgres" -f schema.sql
```

**Công cụ encode online:**

- https://www.urlencoder.org/
- Or use bash:

```bash
python3 -c "import urllib.parse; print(urllib.parse.quote('Namviet@123', safe=''))"
# Output: Namviet%40123
```

### 2. PGPASSWORD Environment Variable (Khuyến Nghị)

```bash
# Set password
export PGPASSWORD="Namviet@123"

# Connect (không cần password trong URL)
psql -h db.xxx.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f schema.sql

# Unset sau khi dùng xong (bảo mật)
unset PGPASSWORD
```

**Ưu điểm:**

- Không cần encode
- An toàn hơn (không hiển thị trong history)
- Dễ dùng với script

### 3. .pgpass File (Cho multiple connections)

```bash
# Tạo file .pgpass
echo "db.xxx.supabase.co:5432:postgres:postgres:Namviet@123" > ~/.pgpass

# Set quyền (bắt buộc)
chmod 600 ~/.pgpass

# Connect (tự động lấy password từ file)
psql -h db.xxx.supabase.co -U postgres -d postgres -p 5432 -f schema.sql
```

**Format ~/.pgpass:**

```
hostname:port:database:username:password
```

**Wildcard support:**

```
# Cho tất cả databases
db.xxx.supabase.co:5432:*:postgres:Namviet@123

# Cho tất cả hosts
*:5432:postgres:postgres:Namviet@123
```

### 4. Interactive Prompt

```bash
# psql sẽ hỏi password
psql -h db.xxx.supabase.co -U postgres -d postgres -p 5432 -f schema.sql
# Enter password: Namviet@123
```

## Best Practices

### ✅ Nên

1. **Dùng PGPASSWORD cho scripts**

   ```bash
   export PGPASSWORD="$PASSWORD"
   psql -h "$HOST" -U postgres ...
   unset PGPASSWORD
   ```

2. **Dùng .pgpass cho regular access**

   ```bash
   chmod 600 ~/.pgpass
   ```

3. **Encode password trong URL nếu bắt buộc**
   ```bash
   ENCODED_PASS=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$PASSWORD', safe=''))")
   psql "postgresql://postgres:$ENCODED_PASS@$HOST:5432/postgres"
   ```

### ❌ Không Nên

1. Hardcode password trong script
2. Commit password vào git
3. Dùng password đơn giản (không special chars)
4. Để PGPASSWORD set mãi mãi

## Migration Scripts

Scripts đã được update để xử lý special characters:

**`migrate_supabase.sh`:**

```bash
# Auto-handles special characters
OLD_DB_PASSWORD="Namviet@123"  # Works!

# Script internally uses PGPASSWORD
export PGPASSWORD="${OLD_DB_PASSWORD}"
pg_dump -h "$HOST" -U postgres ...
```

## Troubleshooting

### Lỗi: "could not translate host name"

**Nguyên nhân:** Password chứa `@` và không được encode

**Giải pháp:**

```bash
# Option 1: URL encode
psql "postgresql://postgres:Namviet%40123@host:5432/db"

# Option 2: PGPASSWORD
export PGPASSWORD="Namviet@123"
psql -h host -U postgres -d db -p 5432
```

### Lỗi: "password authentication failed"

**Nguyên nhân:** Password sai hoặc encode sai

**Giải pháp:**

```bash
# Test password trực tiếp
export PGPASSWORD="Namviet@123"
psql -h host -U postgres -d postgres -c "SELECT 1"

# Nếu vẫn lỗi => password thật sự sai
```

### Lỗi: ".pgpass has group or world access"

**Nguyên nhân:** File permission không đúng

**Giải pháp:**

```bash
chmod 600 ~/.pgpass
```

## Examples

### Export Database

```bash
# Method 1: PGPASSWORD
export PGPASSWORD="Namviet@123"
pg_dump -h db.xxx.supabase.co -U postgres -d postgres -p 5432 > backup.sql
unset PGPASSWORD

# Method 2: URL encoded
pg_dump "postgresql://postgres:Namviet%40123@db.xxx.supabase.co:5432/postgres" > backup.sql
```

### Import Database

```bash
# Method 1: PGPASSWORD
export PGPASSWORD="Namviet@123"
psql -h db.xxx.supabase.co -U postgres -d postgres -p 5432 -f backup.sql
unset PGPASSWORD

# Method 2: URL encoded
psql "postgresql://postgres:Namviet%40123@db.xxx.supabase.co:5432/postgres" -f backup.sql
```

### Run SQL Query

```bash
# PGPASSWORD method
export PGPASSWORD="Namviet@123"
psql -h db.xxx.supabase.co -U postgres -d postgres -p 5432 -c "SELECT count(*) FROM products"
unset PGPASSWORD
```

## Security Tips

1. **Never echo password:**

   ```bash
   # Bad
   echo "Password: $PASSWORD"

   # Good
   export PGPASSWORD="$PASSWORD"
   # No output
   ```

2. **Clear history:**

   ```bash
   # After entering password in command
   history -d $(history 1 | awk '{print $1}')
   ```

3. **Use read -s for prompts:**

   ```bash
   read -s -p "Enter password: " PASSWORD
   echo ""
   export PGPASSWORD="$PASSWORD"
   ```

4. **Unset after use:**
   ```bash
   export PGPASSWORD="$PASSWORD"
   # ... do work ...
   unset PGPASSWORD
   ```

## Quick Reference

```bash
# Connection methods ranked by security:
# 1. .pgpass file (most secure, persistent)
# 2. PGPASSWORD env var (secure, temporary)
# 3. URL encoded (visible in ps/history)
# 4. Interactive prompt (manual but secure)

# For scripts: Use PGPASSWORD
# For regular use: Use .pgpass
# For one-off: Use interactive prompt
# For URLs: URL encode if must
```

---

**Updated**: 2025-01-26
**Related**: SUPABASE_MIGRATION_GUIDE.md
