# Quick Start - Salary Management Migration

## Trước khi bắt đầu

Đảm bảo bạn đã có:

- ✅ Supabase project đã setup
- ✅ Database đã có bảng `employees` với cấu trúc:
  - `employee_id` (VARCHAR, primary key)
  - `user_id` (UUID, link với auth.uid())
  - `role_name` (VARCHAR)
  - `full_name`, `email`, `phone_number`, etc.

## Cách 1: Chạy qua Supabase Dashboard (Recommended)

### Bước 1: Chạy Migration chính

1. Mở Supabase Dashboard
2. Vào **SQL Editor**
3. Copy toàn bộ nội dung file `20250108_create_salary_management.sql`
4. Paste vào SQL Editor
5. Click **Run** hoặc `Cmd/Ctrl + Enter`
6. Kiểm tra output, phải thấy:
   ```
   ✓ Table salary_grades created successfully
   ✓ Table salary_grade_allowances created successfully
   Migration completed successfully!
   ```

### Bước 2: Liên kết với Employees

1. Copy toàn bộ nội dung file `20250108_link_employees_to_salary_grades.sql`
2. Paste vào SQL Editor
3. Click **Run**
4. Kiểm tra output:
   ```
   ✓ Column salary_grade_id added to employees table
   ✓ View employees_with_salary created
   ✓ Table employee_salary_history created
   Employee-salary linkage migration completed successfully!
   ```

### Bước 3: Verify Migration (Optional)

1. Copy toàn bộ nội dung file `TEST_SALARY_MIGRATION.sql`
2. Paste vào SQL Editor
3. Click **Run**
4. Xem kết quả test:
   ```
   SALARY MANAGEMENT MIGRATION TEST SUMMARY
   ========================================
   Salary Grades: 4
   Total Allowances: 7
   Employees with Salary Grade: 0
   ✓ Sample data created successfully
   ```

## Cách 2: Chạy qua Command Line

### Với Supabase CLI:

```bash
# Chạy migration
supabase db reset

# Hoặc apply từng file
supabase db push
```

### Với psql:

```bash
# Kết nối database
export PGPASSWORD='your-password'

# Chạy migration chính
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250108_create_salary_management.sql

# Chạy link employees
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/20250108_link_employees_to_salary_grades.sql

# Test (optional)
psql -h db.your-project.supabase.co \
     -U postgres \
     -d postgres \
     -f supabase/migrations/TEST_SALARY_MIGRATION.sql
```

## Kiểm tra sau khi Migration

### 1. Kiểm tra Tables

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'salary%';
```

Kết quả mong đợi:

```
tablename
---------------------------------
salary_grades
salary_grade_allowances
employee_salary_history (nếu chạy cả file link)
```

### 2. Kiểm tra Sample Data

```sql
SELECT * FROM salary_grades_with_allowances;
```

Phải thấy 4 ngạch lương:

- Ngạch A - Nhân viên cấp cao (18.5M)
- Ngạch B - Nhân viên trung cấp (12.1M)
- Ngạch C - Nhân viên (7.5M)
- Ngạch D - Thử việc (5M)

### 3. Kiểm tra Auto-calculation

```sql
-- Thêm một phụ cấp mới
INSERT INTO salary_grade_allowances (salary_grade_id, name, amount)
SELECT id, 'Phụ cấp test', 100000
FROM salary_grades
WHERE grade_name = 'Ngạch A - Nhân viên cấp cao';

-- Kiểm tra total_salary đã tự động cập nhật
SELECT grade_name, base_salary, total_salary
FROM salary_grades
WHERE grade_name = 'Ngạch A - Nhân viên cấp cao';
-- Phải thấy total_salary = 18,600,000 (tăng 100,000)
```

### 4. Test gán ngạch lương cho nhân viên

```sql
-- Lấy danh sách nhân viên
SELECT employee_id, full_name, role_name FROM employees LIMIT 5;

-- Gán ngạch lương cho 1 nhân viên
SELECT assign_salary_grade_to_employee(
    'employee-id-here',  -- Thay bằng employee_id thực tế
    (SELECT id FROM salary_grades WHERE grade_name LIKE 'Ngạch C%')
);

-- Kiểm tra
SELECT * FROM employees_with_salary
WHERE employee_id = 'employee-id-here';
```

## Troubleshooting

### Lỗi: column employees.id does not exist

**Nguyên nhân:** Bảng employees dùng `employee_id` thay vì `id`

**Giải pháp:** Đảm bảo dùng file migration mới nhất (đã fix)

### Lỗi: relation "salary_grades" already exists

**Nguyên nhân:** Đã chạy migration rồi

**Giải pháp:**

```sql
-- Option 1: Drop và tạo lại
\i supabase/migrations/20250108_rollback_salary_management.sql
\i supabase/migrations/20250108_create_salary_management.sql

-- Option 2: Bỏ qua lỗi và tiếp tục
```

### Total salary không tự động cập nhật

**Kiểm tra triggers:**

```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%salary%';
```

**Manually recalculate:**

```sql
UPDATE salary_grades
SET total_salary = calculate_total_salary(id);
```

### Không thể gán salary_grade_id cho employee

**Kiểm tra:**

1. Ngạch lương có tồn tại và `is_active = true`?

   ```sql
   SELECT id, grade_name, is_active FROM salary_grades;
   ```

2. Employee_id có đúng?

   ```sql
   SELECT employee_id, full_name FROM employees LIMIT 5;
   ```

3. Foreign key constraint?
   ```sql
   SELECT
       conname,
       contype,
       pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'employees'::regclass
   AND conname LIKE '%salary%';
   ```

## Rollback Migration

Nếu cần xóa toàn bộ:

```bash
psql -f supabase/migrations/20250108_rollback_salary_management.sql
```

Hoặc trong SQL Editor:

```sql
\i supabase/migrations/20250108_rollback_salary_management.sql
```

## Next Steps

Sau khi migration thành công:

1. **Gán ngạch lương cho nhân viên hiện có**

   ```sql
   -- Uncomment sample data trong file link
   -- Hoặc gán thủ công
   ```

2. **Tích hợp vào UI**
   - Component `SalaryGradeFormModal` đã sẵn sàng
   - View `employees_with_salary` để hiển thị lương của nhân viên

3. **Setup API endpoints**
   - GET /api/salary-grades
   - POST /api/salary-grades
   - PUT /api/salary-grades/:id
   - DELETE /api/salary-grades/:id

4. **Test RLS policies**
   - Đảm bảo only admin có thể sửa
   - Employees chỉ xem được

## Support

Nếu gặp vấn đề:

1. Check file `SALARY_SYSTEM_README.md` để hiểu schema
2. Run `TEST_SALARY_MIGRATION.sql` để verify
3. Check Supabase logs
