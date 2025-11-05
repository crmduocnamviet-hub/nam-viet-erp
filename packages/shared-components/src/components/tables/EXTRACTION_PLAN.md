# Kế hoạch Extract Table Components

## Tổng quan

Tìm thấy **34 screens** sử dụng Table component. Cần extract tất cả để dễ quản lý.

## Screens đã có Table Component (✅ = Done, 📋 = Todo)

### B2B (2 files)

1. ✅ B2BOrderListPage.tsx → B2BOrderListTable
2. ✅ InventoryB2BOrdersPage.tsx → InventoryB2BOrdersTable

### Financial (2 files)

3. 📋 FinancialTransactionsPage.tsx → FinancialTransactionsTable
4. 📋 FundManagementPage.tsx → FundManagementTable

### Inventory (4 files)

5. 📋 ComboListPage.tsx → ComboListTable
6. 📋 ProductListPage.tsx → ProductListTable
7. 📋 ProductsPage.tsx → ProductsTable
8. 📋 PurchaseOrdersPage.tsx → PurchaseOrdersTable

### Management (3 files)

9. 📋 EmployeesPage.tsx → EmployeesTable
10. ✅ RoomManagementPage.tsx → RoomManagementTable
11. ✅ UserManagementPage.tsx → UserManagementTable

### Marketing (5 files)

12. 📋 CampaignsPage.tsx → CampaignsTable
13. 📋 ContentLibraryPage.tsx → ContentLibraryTable
14. 📋 CustomerSegmentsPage.tsx → CustomerSegmentsTable
15. 📋 PromotionsPage.tsx → PromotionsTable
16. 📋 VouchersPage.tsx → VouchersTable

### Medical (2 files)

17. 📋 MedicalRecordsPage.tsx → MedicalRecordsTable
18. 📋 PatientsPage.tsx → PatientsTable

### Staff (1 file)

19. 📋 SalesStaffDashboardPage.tsx → SalesOrdersTable (hoặc tên phù hợp)

### Warehouse (14 files)

20. 📋 CreatePurchaseImportPage.tsx → PurchaseImportItemsTable
21. 📋 CreateWarehouseTransferPage.tsx → CreateWarehouseTransferTable
22. 📋 EditPurchaseOrderPage.tsx → PurchaseOrderItemsTable
23. 📋 PurchaseOrderReceivingDetailPage.tsx → ReceivingDetailTable
24. 📋 PurchaseOrderReceivingPage.tsx → PurchaseOrderReceivingTable
25. 📋 SalesOrderPickingPage.tsx → SalesOrderPickingTable
26. 📋 SupplierPromotionsPage.tsx → SupplierPromotionsTable
27. 📋 SuppliersPage.tsx → SuppliersTable
28. 📋 VATInventoryDashboard.tsx → VATInventoryTable
29. 📋 VATInvoiceB2BPage.tsx → VATInvoiceB2BTable
30. 📋 VATInvoiceInputPage.tsx → VATInvoiceInputTable
31. 📋 VATInvoicePOSPage.tsx → VATInvoicePOSTable
32. 📋 VATReconciliationPage.tsx → VATReconciliationTable
33. 📋 WarehouseTransferDetailPage.tsx → WarehouseTransferDetailTable
34. 📋 WarehouseTransfersListPage.tsx → WarehouseTransfersTable

## Thống kê

- **Tổng số screens có Table**: 34
- **Đã extract**: 4 (11.8%)
- **Cần extract**: 30 (88.2%)

## Ưu tiên Extract

### Priority 1 - Critical (Sử dụng nhiều, logic phức tạp)

1. FinancialTransactionsTable (Financial management)
2. EmployeesTable (HR management)
3. ProductsTable / ProductListTable (Inventory core)
4. PatientsTable (Medical core)
5. WarehouseTransfersTable (Warehouse operations)

### Priority 2 - High (Features quan trọng)

6. CampaignsTable (Marketing)
7. PromotionsTable (Marketing)
8. VouchersTable (Discount codes)
9. SuppliersTable (Supplier management)
10. VATInvoiceInputTable (Accounting)
11. VATInvoicePOSTable (Accounting)
12. VATInvoiceB2BTable (Accounting)

### Priority 3 - Medium (Features phụ trợ)

13. ComboListTable
14. PurchaseOrdersTable
15. ContentLibraryTable
16. CustomerSegmentsTable
17. MedicalRecordsTable
18. VATInventoryTable
19. VATReconciliationTable

### Priority 4 - Low (Specialized/Less used)

20. FundManagementTable
21. SalesStaffDashboardPage tables
22. CreatePurchaseImportTable
23. CreateWarehouseTransferTable
24. PurchaseOrderItemsTable
25. ReceivingDetailTable
26. PurchaseOrderReceivingTable
27. SalesOrderPickingTable
28. SupplierPromotionsTable
29. WarehouseTransferDetailTable
30. Các tables còn lại

## Gợi ý Extract theo Batch

### Batch 1: Financial & HR (2 tables)

- FinancialTransactionsTable
- EmployeesTable

### Batch 2: Inventory Core (3 tables)

- ProductsTable
- ProductListTable
- PurchaseOrdersTable

### Batch 3: Marketing (4 tables)

- CampaignsTable
- PromotionsTable
- VouchersTable
- ContentLibraryTable

### Batch 4: Medical (2 tables)

- PatientsTable
- MedicalRecordsTable

### Batch 5: Warehouse Core (5 tables)

- WarehouseTransfersTable
- SuppliersTable
- VATInvoiceInputTable
- VATInvoicePOSTable
- VATInvoiceB2BTable

### Batch 6: Specialized Warehouse (7 tables)

- CreatePurchaseImportTable
- CreateWarehouseTransferTable
- PurchaseOrderItemsTable
- ReceivingDetailTable
- PurchaseOrderReceivingTable
- SalesOrderPickingTable
- SupplierPromotionsTable

### Batch 7: Remaining (7 tables)

- FundManagementTable
- ComboListTable
- CustomerSegmentsTable
- VATInventoryTable
- VATReconciliationTable
- WarehouseTransferDetailTable
- Sales dashboard tables

## Template cho Extract

```typescript
// File: components/tables/[TableName].tsx
import React from "react";
import { Table, Button, Space, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

interface [TableName]Props {
  data: Type[];
  loading: boolean;
  on[Action]: (item: Type) => void;
  // ... other props
}

const [TableName]: React.FC<[TableName]Props> = ({
  data,
  loading,
  on[Action],
}) => {
  const columns: ColumnsType<Type> = [
    // Column definitions
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="[key_field]"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Tổng ${total} [items]`,
      }}
    />
  );
};

export default [TableName];
```

## Checklist khi Extract

- [ ] Tạo file table component mới
- [ ] Extract columns definition
- [ ] Extract render functions
- [ ] Định nghĩa Props interface
- [ ] Update index.ts
- [ ] Test TypeScript compilation
- [ ] Document trong README.md
