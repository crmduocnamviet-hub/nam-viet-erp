# Table Components

Thư mục này chứa các table components đã được tách riêng để dễ dàng maintain và tái sử dụng.

## Cấu trúc

Mỗi table component:

- Nhận data qua props
- Nhận các callback functions cho actions (onEdit, onDelete, onView, etc.)
- Chỉ chịu trách nhiệm hiển thị, không xử lý business logic
- Có thể tái sử dụng ở nhiều màn hình khác nhau

## Các Table Components hiện có

### B2B Tables

1. **B2BOrderListTable** - Bảng danh sách đơn hàng B2B
   - Props: quotes, loading, selectedOrderIds, canViewQuotes, canEditQuotes, isInventoryStaff, isDeliveryStaff, onSelectOrder, onSelectAll, onViewOrder, onEditOrder, canEditOrderStatus, formatCurrency, getStageInfo, getPaymentStatusInfo
   - Features: Multi-select, sorting, custom status tags, action buttons

2. **InventoryB2BOrdersTable** - Bảng đơn hàng B2B cho nhân viên kho
   - Props: quotes, loading, onViewOrder, getActionButtons, getStageTitle
   - Features: Workflow-based actions, status badges

### Management Tables

3. **UserManagementTable** - Bảng quản lý tài khoản
   - Props: users, loading, onEdit, onDelete
   - Features: Email copyable, last login time, confirm delete

4. **RoomManagementTable** - Bảng quản lý phòng ban
   - Props: rooms, loading, onView, onDelete, getRoomTypeDisplay
   - Features: Equipment display, capacity, status badge

## Cách sử dụng

### Import

```typescript
import { B2BOrderListTable } from "@nam-viet-erp/shared-components";
```

### Sử dụng trong component

```typescript
const MyPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleViewOrder = (quote) => {
    // Xử lý logic xem đơn hàng
  };

  const handleEditOrder = (quote) => {
    // Xử lý logic sửa đơn hàng
  };

  return (
    <B2BOrderListTable
      quotes={quotes}
      loading={loading}
      selectedOrderIds={selectedOrderIds}
      canViewQuotes={true}
      canEditQuotes={true}
      isInventoryStaff={false}
      isDeliveryStaff={false}
      onSelectOrder={handleSelectOrder}
      onSelectAll={handleSelectAll}
      onViewOrder={handleViewOrder}
      onEditOrder={handleEditOrder}
      canEditOrderStatus={canEditOrderStatus}
      formatCurrency={formatCurrency}
      getStageInfo={getStageInfo}
      getPaymentStatusInfo={getPaymentStatusInfo}
    />
  );
};
```

## Nguyên tắc khi tạo Table Component mới

1. **Props Interface**: Định nghĩa rõ ràng interface cho props
2. **Callback Functions**: Tất cả actions phải được xử lý qua callbacks
3. **Display Logic Only**: Table chỉ hiển thị, không fetch data hay xử lý business logic
4. **Configurable**: Columns có thể được config qua props nếu cần
5. **TypeScript**: Sử dụng types đầy đủ cho data và props
6. **Consistent Naming**: Đặt tên theo pattern `<Feature><Purpose>Table`

## Danh sách Table Components cần extract

Xem file `TABLE_COMPONENTS_LIST.md` để biết danh sách đầy đủ các table components đã và chưa extract.

## Lợi ích

✅ **Dễ maintain**: Logic hiển thị tập trung ở một chỗ
✅ **Tái sử dụng**: Có thể dùng lại table ở nhiều màn hình
✅ **Testing**: Dễ dàng test riêng từng table component
✅ **Consistent UI**: Đảm bảo UI nhất quán giữa các màn hình
✅ **Separation of Concerns**: Tách rời logic hiển thị và business logic
