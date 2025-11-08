# Hệ thống Quản lý Lương & Phụ Cấp - Database Schema

## Tổng quan

Hệ thống quản lý lương dựa trên **Ngạch lương** (Salary Grade), mỗi nhân viên được gán vào một ngạch lương cụ thể.

## Cấu trúc Database

### 1. Bảng `salary_grades` - Ngạch lương

Quản lý các ngạch lương trong công ty.

```sql
CREATE TABLE salary_grades (
    id UUID PRIMARY KEY,
    grade_name VARCHAR(255) UNIQUE NOT NULL,  -- Tên ngạch lương
    base_salary BIGINT NOT NULL,              -- Lương cơ bản (VNĐ)
    description TEXT,                         -- Mô tả
    total_salary BIGINT,                      -- Tự động tính = base + allowances
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Ví dụ:**

- Ngạch A - Nhân viên cấp cao: 15.000.000 VNĐ
- Ngạch B - Nhân viên trung cấp: 10.000.000 VNĐ
- Ngạch C - Nhân viên: 7.000.000 VNĐ
- Ngạch D - Thử việc: 5.000.000 VNĐ

### 2. Bảng `salary_grade_allowances` - Phụ cấp

Quản lý các khoản phụ cấp cho từng ngạch lương.

```sql
CREATE TABLE salary_grade_allowances (
    id UUID PRIMARY KEY,
    salary_grade_id UUID REFERENCES salary_grades(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,               -- Tên phụ cấp
    amount BIGINT NOT NULL,                   -- Số tiền (VNĐ)
    description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(salary_grade_id, name)
);
```

**Ví dụ phụ cấp cho Ngạch A:**

- Phụ cấp xăng xe: 2.000.000 VNĐ
- Phụ cấp điện thoại: 500.000 VNĐ
- Phụ cấp ăn trưa: 1.000.000 VNĐ

**Tổng lương Ngạch A:** 15.000.000 + 3.500.000 = 18.500.000 VNĐ

### 3. Bảng `employees` - Liên kết với Ngạch lương

Thêm column `salary_grade_id` vào bảng employees.

```sql
ALTER TABLE employees
ADD COLUMN salary_grade_id UUID REFERENCES salary_grades(id);
```

### 4. Bảng `employee_salary_history` - Lịch sử thay đổi

Tự động lưu lịch sử khi nhân viên đổi ngạch lương.

```sql
CREATE TABLE employee_salary_history (
    id UUID PRIMARY KEY,
    employee_id UUID REFERENCES employees(id),
    old_salary_grade_id UUID,
    new_salary_grade_id UUID,
    old_total_salary BIGINT,
    new_total_salary BIGINT,
    change_reason TEXT,
    changed_by UUID,
    changed_at TIMESTAMP DEFAULT NOW()
);
```

## Tự động tính toán

### Total Salary tự động

Khi thêm/sửa/xóa phụ cấp, `total_salary` tự động được cập nhật:

```
total_salary = base_salary + SUM(allowances.amount)
```

**Triggers:**

- `trigger_update_total_salary_on_grade` - Khi base_salary thay đổi
- `trigger_update_total_salary_on_allowance` - Khi allowances thay đổi

### Lịch sử lương tự động

Khi `salary_grade_id` của employee thay đổi, tự động ghi log vào `employee_salary_history`.

## Views hữu ích

### 1. `salary_grades_with_allowances`

Xem ngạch lương kèm danh sách phụ cấp (JSON).

```sql
SELECT * FROM salary_grades_with_allowances;
```

**Kết quả:**

```json
{
  "id": "uuid",
  "grade_name": "Ngạch A - Nhân viên cấp cao",
  "base_salary": 15000000,
  "total_salary": 18500000,
  "allowances": [
    { "id": "uuid", "name": "Phụ cấp xăng xe", "amount": 2000000 },
    { "id": "uuid", "name": "Phụ cấp điện thoại", "amount": 500000 },
    { "id": "uuid", "name": "Phụ cấp ăn trưa", "amount": 1000000 }
  ],
  "allowances_count": 3,
  "allowances_total": 3500000
}
```

### 2. `employees_with_salary`

Xem nhân viên kèm thông tin lương.

```sql
SELECT * FROM employees_with_salary WHERE full_name = 'Nguyễn Văn A';
```

### 3. `salary_grade_statistics`

Thống kê số nhân viên và chi phí theo ngạch.

```sql
SELECT * FROM salary_grade_statistics ORDER BY base_salary DESC;
```

**Kết quả:**

```
grade_name                    | employee_count | total_payroll_cost
------------------------------|----------------|-------------------
Ngạch A - Nhân viên cấp cao   | 5              | 92,500,000
Ngạch B - Nhân viên trung cấp | 10             | 121,000,000
Ngạch C - Nhân viên           | 15             | 112,500,000
```

## Functions

### 1. `calculate_total_salary(grade_id UUID)`

Tính tổng lương của một ngạch.

```sql
SELECT calculate_total_salary('grade-uuid');
-- Returns: 18500000
```

### 2. `assign_salary_grade_to_employee(employee_id, salary_grade_id)`

Gán ngạch lương cho nhân viên.

```sql
SELECT assign_salary_grade_to_employee(
    'employee-uuid',
    'salary-grade-uuid'
);
```

## Cách sử dụng

### 1. Tạo ngạch lương mới

```sql
INSERT INTO salary_grades (grade_name, base_salary, description)
VALUES (
    'Ngạch E - Thực tập sinh',
    4000000,
    'Dành cho sinh viên thực tập'
);
```

### 2. Thêm phụ cấp cho ngạch lương

```sql
-- Lấy ID của ngạch vừa tạo
WITH grade AS (
    SELECT id FROM salary_grades
    WHERE grade_name = 'Ngạch E - Thực tập sinh'
)
INSERT INTO salary_grade_allowances (salary_grade_id, name, amount)
SELECT id, 'Phụ cấp ăn trưa', 300000 FROM grade;

-- total_salary tự động cập nhật thành 4,300,000
```

### 3. Gán ngạch lương cho nhân viên

```sql
-- Cách 1: Direct UPDATE
UPDATE employees
SET salary_grade_id = (
    SELECT id FROM salary_grades
    WHERE grade_name = 'Ngạch C - Nhân viên'
)
WHERE full_name = 'Nguyễn Văn B';

-- Cách 2: Dùng function
SELECT assign_salary_grade_to_employee(
    (SELECT id FROM employees WHERE full_name = 'Nguyễn Văn B'),
    (SELECT id FROM salary_grades WHERE grade_name = 'Ngạch C - Nhân viên')
);
```

### 4. Xem lịch sử thay đổi lương của nhân viên

```sql
SELECT
    esh.*,
    e.full_name,
    old_sg.grade_name as old_grade,
    new_sg.grade_name as new_grade
FROM employee_salary_history esh
JOIN employees e ON esh.employee_id = e.id
LEFT JOIN salary_grades old_sg ON esh.old_salary_grade_id = old_sg.id
LEFT JOIN salary_grades new_sg ON esh.new_salary_grade_id = new_sg.id
WHERE e.full_name = 'Nguyễn Văn A'
ORDER BY esh.changed_at DESC;
```

## Queries thường dùng

### Tổng chi phí lương của công ty

```sql
SELECT
    SUM(sg.total_salary) as total_monthly_payroll
FROM employees e
JOIN salary_grades sg ON e.salary_grade_id = sg.id
WHERE e.is_active = true;
```

### Danh sách nhân viên theo ngạch lương

```sql
SELECT
    sg.grade_name,
    COUNT(e.id) as employee_count,
    sg.total_salary,
    sg.total_salary * COUNT(e.id) as grade_payroll_cost
FROM salary_grades sg
LEFT JOIN employees e ON sg.id = e.salary_grade_id AND e.is_active = true
GROUP BY sg.id, sg.grade_name, sg.total_salary
ORDER BY sg.base_salary DESC;
```

### Top 10 nhân viên có lương cao nhất

```sql
SELECT
    e.full_name,
    e.role,
    sg.grade_name,
    sg.base_salary,
    sg.total_salary
FROM employees e
JOIN salary_grades sg ON e.salary_grade_id = sg.id
WHERE e.is_active = true
ORDER BY sg.total_salary DESC
LIMIT 10;
```

## RLS (Row Level Security)

### Policies cho salary_grades

- **Admin**: Full access (SELECT, INSERT, UPDATE, DELETE)
- **Employees**: Read-only (SELECT)

### Policies cho employee_salary_history

- **Admin**: Xem tất cả lịch sử
- **Employees**: Chỉ xem lịch sử lương của chính mình

## Chạy Migration

### 1. Tạo các bảng và functions

```bash
# Chạy migration đầu tiên
supabase db reset --db-url <your-supabase-url>

# Hoặc apply riêng từng file
psql -h <host> -U postgres -d postgres -f 20250108_create_salary_management.sql
psql -h <host> -U postgres -d postgres -f 20250108_link_employees_to_salary_grades.sql
```

### 2. Verify migration

Kiểm tra các bảng đã được tạo:

```sql
-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'salary%';

-- Check sample data
SELECT * FROM salary_grades_with_allowances;
SELECT * FROM salary_grade_statistics;
```

## Backup & Restore

### Backup schema và data

```bash
pg_dump -h <host> -U postgres \
    -t salary_grades \
    -t salary_grade_allowances \
    -t employee_salary_history \
    --data-only \
    > salary_backup.sql
```

### Restore

```bash
psql -h <host> -U postgres -d postgres < salary_backup.sql
```

## Best Practices

1. **Không xóa ngạch lương đang được sử dụng**
   - Thay vì xóa, set `is_active = false`

2. **Luôn log khi thay đổi lương**
   - Trigger tự động log, nhưng có thể thêm `change_reason`

3. **Review trước khi thay đổi base_salary**
   - Ảnh hưởng đến tất cả nhân viên trong ngạch đó

4. **Sử dụng Views để query**
   - Tránh JOIN phức tạp, dùng views đã có sẵn

5. **Backup định kỳ**
   - Salary data là dữ liệu nhạy cảm, cần backup thường xuyên

## Troubleshooting

### Total salary không tự động cập nhật?

Kiểm tra triggers:

```sql
SELECT * FROM pg_trigger
WHERE tgname LIKE '%salary%';
```

Manually recalculate:

```sql
UPDATE salary_grades
SET total_salary = calculate_total_salary(id);
```

### Không thể gán ngạch lương cho nhân viên?

Kiểm tra:

1. Ngạch lương có `is_active = true`?
2. User có permission?
3. Foreign key constraint?

```sql
-- Check grade exists và active
SELECT id, grade_name, is_active
FROM salary_grades
WHERE id = 'your-grade-id';
```
