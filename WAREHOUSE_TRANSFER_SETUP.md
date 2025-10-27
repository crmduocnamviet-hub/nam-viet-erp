# Hướng Dẫn Cài Đặt Tính Năng Chuyển Kho

## Bước 1: Chạy Migration

### Sử dụng psql

```bash
# Set password để tránh lỗi với special characters
export PGPASSWORD="your_password_here"

# Chạy migration
psql -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f database/migrations/create_warehouse_transfers.sql

# Unset password
unset PGPASSWORD
```

### Hoặc sử dụng Supabase Dashboard

1. Đăng nhập vào [Supabase Dashboard](https://app.supabase.com)
2. Chọn project của bạn
3. Vào **SQL Editor**
4. Copy toàn bộ nội dung file `database/migrations/create_warehouse_transfers.sql`
5. Paste vào SQL Editor
6. Click **Run** để thực thi

## Bước 2: Kiểm Tra Migration

```bash
export PGPASSWORD="your_password_here"

# Kiểm tra bảng đã tạo
psql -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -c "\dt warehouse_transfer*"

# Kết quả mong đợi:
#  Schema |            Name             | Type  |  Owner
# --------+-----------------------------+-------+----------
#  public | warehouse_transfer_items    | table | postgres
#  public | warehouse_transfers         | table | postgres

unset PGPASSWORD
```

## Bước 3: Kiểm Tra Functions

```bash
export PGPASSWORD="your_password_here"

psql -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -c "\df generate_transfer_number"

# Kết quả mong đợi:
#  Schema |         Name            | Result data type
# --------+-------------------------+------------------
#  public | generate_transfer_number| text

unset PGPASSWORD
```

## Bước 4: Test Migration

### Test tạo phiếu chuyển kho

```sql
-- Insert test transfer
INSERT INTO warehouse_transfers (
    from_warehouse_id,
    to_warehouse_id,
    notes
)
VALUES (1, 2, 'Test transfer')
RETURNING id, transfer_number;

-- Kết quả mong đợi:
-- id | transfer_number
-- ---+-----------------
--  1 | WT-2025-001
```

### Test thêm items

```sql
-- Insert test items (thay [transfer_id] bằng id từ bước trên)
INSERT INTO warehouse_transfer_items (
    transfer_id,
    product_id,
    quantity_requested,
    unit_price
)
VALUES
    ([transfer_id], 1, 100, 50000),
    ([transfer_id], 2, 50, 30000);
```

### Test function xử lý inventory

```sql
-- Test send
SELECT process_warehouse_transfer_inventory([transfer_id], 'send');

-- Kiểm tra inventory đã giảm
SELECT * FROM inventory WHERE warehouse_id = 1;
```

### Cleanup test data

```sql
-- Xóa test data
DELETE FROM warehouse_transfers WHERE notes = 'Test transfer';
```

## Bước 5: Cấu Hình Permissions

### Thêm permissions cho roles trong Supabase

Permissions đã được định nghĩa trong code, nhưng cần đảm bảo RLS policies đã được enable:

```sql
-- Kiểm tra RLS đã enable
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('warehouse_transfers', 'warehouse_transfer_items');

-- Kết quả mong đợi: rowsecurity = true cho cả 2 bảng
```

### Cấu hình permissions cho employees

Trong bảng `employees`, thêm permissions vào trường `permissions`:

```sql
-- Ví dụ: Thêm permissions cho warehouse manager
UPDATE employees
SET permissions = permissions || ARRAY[
    'warehouse.transfers.view',
    'warehouse.transfers.create',
    'warehouse.transfers.edit',
    'warehouse.transfers.delete',
    'warehouse.transfers.approve',
    'warehouse.transfers.send',
    'warehouse.transfers.receive',
    'warehouse.transfers.cancel'
]
WHERE role = 'warehouse-manager';
```

## Bước 6: Cấu Hình Routes (Frontend)

### Thêm routes vào routing configuration

Routes đã được thêm vào `SCREEN_REGISTRY`, bạn cần thêm vào router:

```typescript
// Trong file routes configuration
{
  path: "/warehouse/transfers",
  element: <WarehouseTransfersListPage />,
  permission: "warehouse.transfers.view"
},
{
  path: "/warehouse/transfers/create",
  element: <CreateWarehouseTransferPage />,
  permission: "warehouse.transfers.create"
},
{
  path: "/warehouse/transfers/:id",
  element: <WarehouseTransferDetailPage />,
  permission: "warehouse.transfers.view"
}
```

### Thêm menu item

```typescript
// Trong menu configuration
{
  key: "warehouse-transfers",
  label: "Chuyển kho",
  icon: <SwapOutlined />,
  path: "/warehouse/transfers",
  permission: "warehouse.transfers.view"
}
```

## Bước 7: Test Frontend

1. **Đăng nhập** với tài khoản có quyền `warehouse.transfers.view`
2. **Truy cập** `/warehouse/transfers`
3. **Tạo phiếu** chuyển kho mới
4. **Kiểm tra** các chức năng:
   - Tạo phiếu
   - Thêm sản phẩm
   - Gửi duyệt
   - Duyệt (nếu có quyền)
   - Xuất kho
   - Nhận hàng

## Rollback Migration (Nếu Cần)

```bash
export PGPASSWORD="your_password_here"

psql -h db.your-project-ref.supabase.co \
     -U postgres \
     -d postgres \
     -p 5432 \
     -f database/migrations/rollback_warehouse_transfers.sql

unset PGPASSWORD
```

## Troubleshooting

### Lỗi: "relation already exists"

Migration đã chạy trước đó. Có 2 cách xử lý:

**Cách 1: Rollback và chạy lại**

```bash
# Chạy rollback
psql ... -f database/migrations/rollback_warehouse_transfers.sql

# Chạy lại migration
psql ... -f database/migrations/create_warehouse_transfers.sql
```

**Cách 2: Bỏ qua lỗi (nếu chắc chắn đã có đầy đủ)**

- Kiểm tra các bảng và functions đã tồn tại
- Tiếp tục các bước tiếp theo

### Lỗi: "permission denied"

**Nguyên nhân:** User không có quyền tạo bảng

**Giải pháp:** Sử dụng user `postgres` hoặc user có quyền admin

### Lỗi: "password authentication failed"

**Nguyên nhân:** Password sai hoặc có ký tự đặc biệt

**Giải pháp:** Xem hướng dẫn trong `POSTGRES_PASSWORD_SPECIAL_CHARS.md`

### Lỗi: Component không tìm thấy

**Nguyên nhân:** Chưa build lại packages

**Giải pháp:**

```bash
# Build lại shared-components
cd packages/shared-components
yarn build

# Hoặc build toàn bộ
yarn build
```

## Checklist Hoàn Thành

- [ ] Migration đã chạy thành công
- [ ] Bảng `warehouse_transfers` đã tồn tại
- [ ] Bảng `warehouse_transfer_items` đã tồn tại
- [ ] Function `generate_transfer_number` hoạt động
- [ ] Function `process_warehouse_transfer_inventory` hoạt động
- [ ] RLS policies đã được enable
- [ ] Test data có thể tạo và xóa thành công
- [ ] Permissions đã được cấu hình cho roles
- [ ] Routes đã được thêm vào router
- [ ] Menu item đã được thêm
- [ ] Frontend có thể truy cập trang danh sách
- [ ] Có thể tạo phiếu chuyển kho mới
- [ ] Có thể xem chi tiết phiếu
- [ ] Workflow hoàn chỉnh hoạt động (tạo → duyệt → xuất → nhận)

## Hỗ Trợ

Xem thêm tài liệu chi tiết tại:

- `WAREHOUSE_TRANSFER_GUIDE.md` - Hướng dẫn sử dụng chi tiết
- `POSTGRES_PASSWORD_SPECIAL_CHARS.md` - Xử lý password có ký tự đặc biệt

---

**Ngày tạo:** 2025-01-27
**Phiên bản:** 1.0.0
