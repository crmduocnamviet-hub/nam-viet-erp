# Báo cáo: VAT & Warehouse Tables Chưa Extract

## Ngày: 05/11/2024

## Tình Trạng Hiện Tại

Các màn hình VAT và một số warehouse screens vẫn có **table definitions inline** chưa được extract thành reusable components, khác với pattern đã áp dụng cho 6 screens khác.

---

## 🔴 Tables Cần Extract (5 tables)

### 1. **VATInvoiceInputTable** ❌

- **File**: `screens/warehouse/VATInvoiceInputPage.tsx` (line 610)
- **Độ phức tạp**: Medium
- **Columns**: 10 columns
  - Số hóa đơn
  - Ngày HĐ
  - Kho
  - Sản phẩm
  - Số lô
  - Số lượng
  - Đơn giá
  - Thành tiền
  - VAT
  - Nhà cung cấp
  - Thao tác (Edit, Delete)
- **Features**:
  - Edit/Delete actions
  - Currency formatting
  - Date formatting
  - Complex data relationships (warehouses, products, suppliers, lots)

---

### 2. **VATInvoicePOSTable** ❌

- **File**: `screens/warehouse/VATInvoicePOSPage.tsx` (line 138)
- **Độ phức tạp**: Medium
- **Columns**: ~8 columns
  - Số HĐ (with fallback tag)
  - Ngày xuất
  - Sản phẩm (name + SKU)
  - Kho
  - Số lượng
  - Thành tiền
  - VAT amount
  - Thao tác
- **Features**:
  - Nested product info display
  - Currency formatting
  - Date formatting
  - Conditional rendering (invoice number tag)

---

### 3. **VATInvoiceB2BTable** ❌

- **File**: `screens/warehouse/VATInvoiceB2BPage.tsx` (line 309)
- **Độ phức tạp**: Medium-High
- **Columns**: ~9 columns
  - Số HĐ (with fallback tag)
  - B2B Quote reference
  - Sản phẩm (name + SKU)
  - Kho
  - Số lượng
  - Thành tiền
  - VAT amount
  - Customer info
  - Thao tác
- **Features**:
  - B2B quote linking
  - Nested product info display
  - Currency formatting
  - Date formatting

---

### 4. **VATInventoryTable** ❌

- **File**: `screens/warehouse/VATInventoryDashboard.tsx` (line 116)
- **Độ phức tạp**: High
- **Columns**: 10+ columns with complex logic
  - Kho (with filters)
  - Sản phẩm (name, SKU, barcode)
  - Lô (lot number + expiry date)
  - SL trong VAT (quantity)
  - SL tồn kho thực
  - Chênh lệch
  - VAT In/Out statistics
  - Status indicators
  - Actions
- **Features**:
  - Built-in column filters
  - Complex nested rendering
  - Multiple data calculations
  - Conditional styling
  - Status tags with colors

---

### 5. **PurchaseOrderReceivingDetailTable** ❌

- **File**: `screens/warehouse/PurchaseOrderReceivingDetailPage.tsx` (line 1115)
- **Độ phức tạp**: **VERY HIGH** ⚠️
- **Columns**: 8 columns with extremely complex logic
  - Sản phẩm (fixed left)
  - Mã SKU
  - SL Đặt
  - Đã Nhận (with Tag)
  - Còn Lại (calculated)
  - Nhận Lần Này (calculated from receivingData state)
  - **Số Lô & Hạn SD** (COMPLEX - nested form inputs!)
    - Multiple lots per product
    - LotExpirationInput component
    - InputNumber for quantity
    - Add/Remove lot buttons
    - Conditional rendering based on enable_lot_management
  - Trạng Thái (calculated with icons)
- **Features**:
  - **Interactive nested components** (Forms inside table cells)
  - **State management** (receivingData)
  - Complex calculations
  - Conditional rendering
  - Multiple action buttons
  - Fixed columns
- **Challenge**: ⚠️ Table này có **interactive form inputs** trong cells, khó extract hơn các tables khác

---

## 📊 So Sánh với Tables Đã Extract

### ✅ Tables Đã Extract (6 tables)

1. B2BOrderListTable - **Simple display + actions**
2. InventoryB2BOrdersTable - **Display + custom action buttons**
3. UserManagementTable - **CRUD actions**
4. RoomManagementTable - **Display + delete confirmation**
5. PurchaseOrdersTable - **Status dropdown + actions**
6. ProductListTable - **Display with images**

**Pattern**: Display-focused, actions passed via props, no nested interactive components

### ❌ Tables Chưa Extract (5 tables)

**Challenges**:

- More complex data relationships
- Financial/VAT calculations
- Nested interactive components (PurchaseOrderReceivingDetailTable)
- Built-in filtering logic (VATInventoryTable)
- Multiple state dependencies

---

## 🎯 Đề Xuất Extraction Plan

### **Priority 1 - Simpler VAT Tables** (Extract first)

1. **VATInvoicePOSTable** (Medium complexity)
2. **VATInvoiceB2BTable** (Medium-High complexity)
3. **VATInvoiceInputTable** (Medium complexity)

**Time estimate**: 2-3 hours total

---

### **Priority 2 - Complex Dashboard** (Extract with care)

4. **VATInventoryTable** (High complexity with filters)

**Time estimate**: 1-2 hours
**Note**: Need to handle column filters properly

---

### **Priority 3 - Interactive Table** (Requires redesign)

5. **PurchaseOrderReceivingDetailTable** (VERY HIGH complexity)

**Time estimate**: 3-4 hours
**Note**:

- Requires special handling for nested form components
- May need to create sub-components for lot management
- Consider creating `ReceivingLotInput` component
- State management needs careful planning

---

## 📋 Extraction Guidelines

### For Simple VAT Tables (Priority 1):

```typescript
interface VATInvoiceTableProps {
  invoices: IVATInvoice[];
  loading: boolean;
  onEdit?: (invoice: IVATInvoice) => void;
  onDelete?: (invoiceId: number) => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
}

const VATInvoiceTable: React.FC<VATInvoiceTableProps> = ({
  invoices,
  loading,
  onEdit,
  onDelete,
  formatCurrency,
  formatDate,
}) => {
  const columns: ColumnsType<IVATInvoice> = [
    // Column definitions here
  ];

  return (
    <Table
      columns={columns}
      dataSource={invoices}
      loading={loading}
      rowKey="id"
      pagination={{ pageSize: 20 }}
    />
  );
};
```

---

### For Complex Interactive Table (Priority 3):

```typescript
// Consider creating sub-component
interface ReceivingLotInputProps {
  lots: LotData[];
  productId: number;
  showLotInput: boolean;
  onChange: (lots: LotData[]) => void;
}

const ReceivingLotInput: React.FC<ReceivingLotInputProps> = ({
  lots,
  productId,
  showLotInput,
  onChange,
}) => {
  // Handle lot management logic here
  return (
    <Space direction="vertical">
      {lots.map((lot, index) => (
        // Render lot input fields
      ))}
      <Button onClick={addLot}>Thêm Lô</Button>
    </Space>
  );
};

// Then use in table
interface PurchaseOrderReceivingTableProps {
  items: POItem[];
  receivingData: Record<number, LotData[]>;
  onReceivingDataChange: (data: Record<number, LotData[]>) => void;
  // ... other props
}
```

---

## ⚠️ Lưu Ý Quan Trọng

### 1. **State Management**

PurchaseOrderReceivingDetailTable có state `receivingData` được sử dụng trực tiếp trong table columns. Khi extract:

- ✅ Pass state và setState function qua props
- ✅ Hoặc sử dụng callbacks để update parent state
- ❌ Không nên move state vào table component

### 2. **Nested Components**

- LotExpirationInput, InputNumber, Button components trong cells
- Cân nhắc tạo sub-component `ReceivingLotInput` để encapsulate logic

### 3. **Type Safety**

Tất cả VAT tables sử dụng types từ `@nam-viet-erp/types`:

- IVATInvoiceInWithDetails
- IVATInvoiceOutWithDetails
- IVATInventorySummary
- Ensure proper type imports

---

## 📈 Expected Benefits

### After Extraction:

1. **Code Reduction**: ~800-1000 lines of table code moved to reusable components
2. **Maintainability**: Easier to update table logic in one place
3. **Consistency**: Same pattern across all screens
4. **Testing**: Easier to write unit tests for table components
5. **Reusability**: VAT table patterns can be reused in reports/exports

---

## 🚀 Next Steps

1. ✅ **Review this document** with team
2. Start with Priority 1 (Simple VAT tables)
3. Create PR for each batch
4. Update MIGRATION_REPORT.md after each extraction
5. Add unit tests for extracted components
6. Handle Priority 3 (PurchaseOrderReceivingDetailTable) last with careful planning

---

## Summary

**Current Status**:

- ✅ 6 tables extracted and integrated (17.6%)
- ❌ 5 VAT & warehouse tables still inline
- ⚠️ 1 very complex interactive table needs special handling

**Total Progress After VAT Extraction**: 11/34 screens (32.4%)

**Recommendation**: Extract in 3 phases (Priority 1 → 2 → 3) để đảm bảo quality và avoid breaking changes.
