# Hướng dẫn Role Kế Toán (Accountant Role Guide)

## Tổng quan

Role **Kế Toán** (KeToan) đã được thêm vào hệ thống để quản lý các nhân viên kế toán.

## Thông tin Role

- **Tên role**: `KeToan`
- **Mô tả**: Kế toán
- **Ngày thêm**: 2025-10-26

## Các Role hiện có trong hệ thống

1. **BacSi** - Bác sĩ
2. **DuocSi** - Dược sĩ
3. **LeTan** - Lễ tân
4. **KeToan** - Kế toán (mới)

## Cách sử dụng

### 1. Tạo nhân viên Kế toán

Khi tạo nhân viên mới, chọn `role_name = 'KeToan'`:

```typescript
import { createEmployee } from "@nam-viet-erp/services";

await createEmployee({
  full_name: "Nguyễn Thị Lan",
  employee_code: "KT001",
  role_name: "KeToan", // Role kế toán
  is_active: true,
});
```

### 2. Lấy danh sách nhân viên Kế toán

Sử dụng function helper `getAccountants()`:

```typescript
import { getAccountants } from "@nam-viet-erp/services";

const { data: accountants, error } = await getAccountants();

if (error) {
  console.error("Error loading accountants:", error);
} else {
  console.log("Accountants:", accountants);
}
```

### 3. Lọc nhân viên theo role

```typescript
import { getEmployees } from "@nam-viet-erp/services";

const { data: accountants, error } = await getEmployees({
  roleName: "KeToan",
  isActive: true,
});
```

## Permissions đề xuất cho Kế toán

Dưới đây là các permissions nên cấp cho nhân viên Kế toán:

### Quản lý Tài chính

- `finance.view` - Xem báo cáo tài chính
- `finance.manage` - Quản lý tài chính
- `transactions.create` - Tạo giao dịch tài chính
- `transactions.approve` - Duyệt giao dịch
- `transactions.view` - Xem lịch sử giao dịch

### Báo cáo

- `reports.financial` - Truy cập báo cáo tài chính
- `reports.sales` - Xem báo cáo bán hàng
- `reports.inventory` - Xem báo cáo tồn kho

### Hóa đơn & VAT

- `invoices.manage` - Quản lý hóa đơn
- `invoices.create` - Tạo hóa đơn
- `vat.manage` - Quản lý VAT
- `vat.reconcile` - Đối soát VAT

### Đơn hàng B2B

- `b2b.view` - Xem đơn hàng B2B
- `b2b.financial` - Quản lý tài chính B2B
- `quotes.financial` - Xem thông tin tài chính báo giá

### Quỹ tiền mặt

- `funds.view` - Xem quỹ tiền
- `funds.manage` - Quản lý quỹ
- `cash-ledger.view` - Xem sổ quỹ
- `cash-ledger.reconcile` - Đối soát sổ quỹ

## Interface TypeScript

```typescript
interface IEmployee {
  employee_id: string;
  full_name: string;
  employee_code: string | null;
  role_name: string; // 'BacSi', 'DuocSi', 'LeTan', 'KeToan'
  is_active: boolean;
  user_id?: string;
  permissions?: string[];
  warehouse_id?: number;
}
```

## Migration

File migration: `/database/migrations/add_accountant_role_documentation.sql`

Bảng `employees` đã hỗ trợ role này thông qua cột `role_name` (kiểu TEXT).

## Functions có sẵn

### employeeService.ts

```typescript
// Get all accountants
export const getAccountants = async () => {
  return getEmployeesByRole("KeToan");
};

// Get employees by specific role
export const getEmployeesByRole = async (roleName: string) => {
  const response = await supabase
    .from("employees")
    .select("*")
    .eq("role_name", roleName)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return response;
};
```

## Ví dụ sử dụng trong UI

### Component để hiển thị dropdown chọn nhân viên kế toán

```tsx
import React, { useEffect, useState } from "react";
import { Select } from "antd";
import { getAccountants } from "@nam-viet-erp/services";

const AccountantSelector: React.FC = () => {
  const [accountants, setAccountants] = useState<IEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAccountants = async () => {
      setLoading(true);
      const { data, error } = await getAccountants();
      if (!error && data) {
        setAccountants(data);
      }
      setLoading(false);
    };
    loadAccountants();
  }, []);

  return (
    <Select
      placeholder="Chọn kế toán"
      loading={loading}
      options={accountants.map((emp) => ({
        value: emp.employee_id,
        label: `${emp.full_name}${emp.employee_code ? ` (${emp.employee_code})` : ""}`,
      }))}
    />
  );
};
```

## Ghi chú

- Role name phải chính xác là `KeToan` (viết hoa chữ cái đầu K và T)
- Không cần migration đặc biệt vì `role_name` là TEXT field
- Để tạo nhân viên kế toán mẫu, xem file migration và uncomment phần INSERT
