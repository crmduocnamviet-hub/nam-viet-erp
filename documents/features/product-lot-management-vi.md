# Quản Lý Lô Sản Phẩm

Hệ thống Quản lý Lô Sản phẩm cho phép theo dõi sản phẩm theo số lô với mã batch, ngày hết hạn, và số lượng theo kho cụ thể. Điều này rất quan trọng đối với dược phẩm, thực phẩm, và các sản phẩm được quản lý chặt chẽ.

## 🎯 Tổng Quan

**Mục đích**: Theo dõi và quản lý sản phẩm theo từng lô để quản lý hạn sử dụng, thu hồi batch, và kiểm soát tồn kho FIFO/FEFO.

**Thành Phần Chính**:

- Thao tác CRUD cho lô sản phẩm
- Theo dõi tồn kho theo lô
- Quản lý ngày hết hạn
- Theo dõi mã batch
- Số lượng lô theo kho cụ thể

## ✨ Tính Năng Chính

### 1. **Theo Dõi Lô**

- Số lô duy nhất cho mỗi sản phẩm
- Liên kết mã batch
- Theo dõi ngày hết hạn
- Ghi nhận ngày nhập
- Số lượng theo kho cụ thể

### 2. **Giao Diện Quản Lý Lô**

- Tạo lô mới với hỗ trợ speech-to-text
- Chỉnh sửa chi tiết lô
- Xóa lô với đồng bộ tồn kho
- Xem chi tiết và lịch sử lô
- Lọc lô theo kho

### 3. **Đồng Bộ Tồn Kho**

- Tự động cập nhật tồn kho khi lô thay đổi
- Theo dõi số lượng theo kho cụ thể
- Đồng bộ real-time trên tất cả màn hình
- Tích hợp Entity Store để cập nhật tức thì

### 4. **Quản Lý Hạn Sử Dụng**

- Cảnh báo hết hạn trực quan
- Tính toán số ngày đến hạn sử dụng
- Chỉ báo trạng thái:
  - **Xanh**: >30 ngày đến hạn
  - **Cam**: <30 ngày đến hạn
  - **Đỏ**: Đã hết hạn
- Tự động kiểm tra ngày hết hạn

### 5. **Tích Hợp POS**

- Chọn lô khi bán sản phẩm
- Thông tin lô trực quan trong giỏ hàng
- Các lô khác nhau là các mục riêng biệt
- Cảnh báo hết hạn khi chọn

## 🏗️ Database Schema

### Bảng product_lots

```sql
CREATE TABLE product_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
  batch_code VARCHAR(255),
  expiry_date DATE,
  received_date DATE,
  quantity INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Ràng buộc
  CONSTRAINT unique_lot_per_product_warehouse
    UNIQUE(lot_number, product_id, warehouse_id)
);

-- Indexes
CREATE INDEX idx_product_lots_product ON product_lots(product_id);
CREATE INDEX idx_product_lots_warehouse ON product_lots(warehouse_id);
CREATE INDEX idx_product_lots_expiry ON product_lots(expiry_date);
```

### Bảng products (Cờ Quản Lý Lô)

```sql
ALTER TABLE products
ADD COLUMN enable_lot_management BOOLEAN DEFAULT FALSE;
```

## 🔄 Luồng Người Dùng

### Luồng 1: Kích Hoạt Quản Lý Lô cho Sản Phẩm

1. **Điều Hướng đến Form Sản Phẩm** (Tạo/Sửa)
2. **Kích Hoạt Quản Lý Lô**
   - Bật switch "Kích hoạt quản lý theo lô"
   - Hệ thống tạo lô mặc định nếu cần
3. **Lưu Sản Phẩm**
   - Sản phẩm được đánh dấu là quản lý theo lô
   - Lô mặc định được tạo với số lượng ban đầu

### Luồng 2: Tạo Lô Sản Phẩm Mới

1. **Mở Trang Chi Tiết Sản Phẩm**
   - Xem phần "Quản lý lô hàng"
   - Click "Thêm lô hàng mới"

2. **Điền Thông Tin Lô**
   - **Số Lô** (Bắt buộc)
     - Nhập thủ công hoặc speech-to-text
     - Tự động chuyển thành chữ hoa
     - Kiểm tra tính duy nhất
   - **Kho Hàng** (Bắt buộc)
   - **Mã Batch** (Tùy chọn)
   - **Ngày Hết Hạn** (Tùy chọn)
   - **Ngày Nhập** (Tùy chọn)
   - **Số Lượng Ban Đầu** (Bắt buộc)

3. **Gửi**
   - Lô được tạo trong database
   - Tồn kho tự động đồng bộ
   - Entity Store được cập nhật
   - Tất cả màn hình refresh ngay lập tức

### Luồng 3: Cập Nhật Số Lượng Lô

1. **Điều Hướng đến Trang Chi Tiết Lô**
   - Click số lô trong bảng quản lý lô
   - Hoặc dùng URL trực tiếp `/lots/:lotId`

2. **Chỉnh Sửa Số Lượng**
   - Click "Chỉnh sửa" trên trường số lượng
   - Nhập số lượng mới
   - Click "Lưu"

3. **Tự Động Đồng Bộ**
   - Số lượng lô được cập nhật
   - Tồn kho kho hàng được tính lại
   - Tổng tồn kho sản phẩm được cập nhật
   - Entity Store được đồng bộ
   - Tất cả màn hình cập nhật ngay lập tức

### Luồng 4: Xóa Lô Sản Phẩm

1. **Tìm Lô trong Bảng Quản Lý**
2. **Click Nút Xóa**
3. **Xác Nhận Xóa**
   - Dialog cảnh báo xuất hiện
   - Hiển thị số lô và ảnh hưởng

4. **Tự Động Dọn Dẹp**
   - Lô bị xóa khỏi database
   - Tồn kho kho hàng giảm
   - Tồn kho sản phẩm được tính lại
   - Entity Store được cập nhật
   - Thông báo thành công hiển thị

### Luồng 5: Chọn Lô trong POS

1. **Tìm Sản Phẩm trong POS**
   - Sản phẩm với `enable_lot_management: true`

2. **Click Card Sản Phẩm**
   - Modal Chọn Lô tự động mở ra
   - Hiển thị các lô có sẵn cho kho hiện tại

3. **Chọn Lô**
   - Xem chi tiết lô:
     - Số lô
     - Mã batch
     - Ngày hết hạn (với cảnh báo)
     - Số lượng có sẵn
   - Chọn lô mong muốn
   - Chọn số lượng

4. **Thêm Vào Giỏ Hàng**
   - Sản phẩm được thêm với thông tin lô
   - Giỏ hàng hiển thị: Sản Phẩm + Số Lô (Mã Batch)
   - Các lô khác nhau = các mục giỏ hàng riêng biệt

## 🎨 UI Components

### AddLotModal Component

**Vị trí**: `packages/shared-components/src/components/AddLotModal.tsx`

**Tính năng**:

- Form với validation
- Speech-to-text cho số lô
  - Tự động xóa khoảng trắng
  - Chuyển thành chữ hoa
  - Hỗ trợ nhập bằng giọng nói
- Date pickers cho ngày hết hạn/nhập
- Chọn kho hàng
- Nhập số lượng ban đầu
- Validation real-time

**Sử dụng**:

```typescript
<AddLotModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSuccess={handleSuccess}
  productId={productId}
  warehouses={warehouses}
/>
```

### ProductLotManagement Component

**Vị trí**: `packages/shared-components/src/components/ProductLotManagement.tsx`

**Tính năng**:

- Bảng danh sách lô với Ant Design Table
- Dropdown lọc theo kho
- Nút thêm lô mới
- Hành động xóa lô
- Điều hướng đến chi tiết lô
- Tích hợp Entity Store
- Cập nhật real-time

**Sử dụng**:

```typescript
<ProductLotManagement
  productId={productId}
  isEnabled={product.enable_lot_management}
  warehouses={warehouses}
/>
```

### LotSelectionModal Component

**Vị trí**: `packages/shared-components/src/components/LotSelectionModal.tsx`

**Tính năng**:

- Danh sách lô có sẵn
- Chỉ báo trạng thái hết hạn
- Bộ chọn số lượng
- Tự động chọn lô duy nhất
- Validation so với số lượng có sẵn

**Sử dụng**:

```typescript
<LotSelectionModal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(lot, quantity) => handleLotSelect(lot, quantity)}
  product={selectedProduct}
  warehouseId={warehouseId}
/>
```

### ProductLotDetailPage

**Vị trí**: `packages/shared-components/src/screens/inventory/ProductLotDetailPage.tsx`

**Tính năng**:

- Hiển thị thông tin lô
- Trường số lượng có thể chỉnh sửa
- Badge trạng thái hết hạn
- Tính toán số ngày đến hạn
- Xử lý ngày không hợp lệ
- Điều hướng quay lại sản phẩm

## 🔧 Triển Khai Kỹ Thuật

### Tích Hợp Entity Store

Hệ thống quản lý lô được tích hợp đầy đủ với Entity Store để tự động đồng bộ giữa các màn hình.

**Store Actions**:

```typescript
// Thêm/Cập nhật lô
useEntityStore.getState().setProductLot(lot);
useEntityStore.getState().setProductLots(lots);
useEntityStore.getState().updateProductLot(lotId, updates);
useEntityStore.getState().deleteProductLot(lotId);

// Đăng ký nhận lô
const lot = useEntityProductLot(lotId);
const lots = useEntityProductLotsByProduct(productId);
const lots = useEntityProductLotsByWarehouse(productId, warehouseId);
```

**Ví dụ: Tạo Lô**

```typescript
const handleCreateLot = async (lotData) => {
  const { data, error } = await createProductLotWithInventory({
    ...lotData,
    product_id: productId,
  });

  if (data) {
    // ✅ Cập nhật Entity Store - tất cả màn hình đồng bộ ngay lập tức!
    useEntityStore.getState().setProductLot(data);

    notification.success({
      message: "Lô hàng đã được tạo",
    });
  }
};
```

**Ví dụ: Cập Nhật Số Lượng**

```typescript
const handleUpdateQuantity = async (lotId, newQuantity) => {
  // Optimistic update - UI cập nhật ngay lập tức
  useEntityStore.getState().updateProductLot(lotId, {
    quantity: newQuantity,
  });

  // Đồng bộ với server
  const { error } = await updateProductLotQuantity({
    lotId,
    productId,
    warehouseId,
    newQuantityAvailable: newQuantity,
  });

  if (error) {
    // Rollback khi có lỗi
    const originalLot = await fetchProductLot(lotId);
    useEntityStore.getState().setProductLot(originalLot);

    notification.error({ message: "Cập nhật thất bại" });
  }
};
```

### Service Layer

**Vị trí**: `packages/services/src/lotManagementService.ts`

**Functions Chính**:

```typescript
// Tạo lô với đồng bộ tồn kho
export const createProductLotWithInventory = async (params: {
  lot_number: string;
  product_id: number;
  warehouse_id: number;
  batch_code?: string;
  expiry_date?: string;
  received_date?: string;
  quantity: number;
}) => {
  // 1. Tạo lô
  const { data: lot, error } = await createProductLot(params);

  if (lot) {
    // 2. Tự động cập nhật entity store
    useEntityStore.getState().setProductLot(lot);

    // 3. Đồng bộ vào tồn kho
    await syncLotQuantityToInventory({
      productId: params.product_id,
      warehouseId: params.warehouse_id,
    });
  }

  return { data: lot, error };
};

// Xóa lô với đồng bộ tồn kho
export const deleteProductLot = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
}) => {
  // 1. Xóa lô
  await supabase.from("product_lots").delete().eq("id", params.lotId);

  // 2. Tự động cập nhật entity store
  useEntityStore.getState().deleteProductLot(params.lotId);

  // 3. Đồng bộ vào tồn kho
  await syncLotQuantityToInventory({
    productId: params.productId,
    warehouseId: params.warehouseId,
  });

  return { error: null };
};

// Cập nhật số lượng lô với đồng bộ tồn kho
export const updateProductLotQuantity = async (params: {
  lotId: number;
  productId: number;
  warehouseId: number;
  newQuantityAvailable: number;
}) => {
  // 1. Cập nhật số lượng lô
  const { data, error } = await supabase
    .from("product_lots")
    .update({ quantity: params.newQuantityAvailable })
    .eq("id", params.lotId)
    .select()
    .single();

  if (data) {
    // 2. Tự động cập nhật entity store
    useEntityStore.getState().updateProductLot(params.lotId, {
      quantity: params.newQuantityAvailable,
    });

    // 3. Đồng bộ vào tồn kho
    await syncLotQuantityToInventory({
      productId: params.productId,
      warehouseId: params.warehouseId,
    });
  }

  return { error };
};
```

### Đồng Bộ Tồn Kho

```typescript
// Đồng bộ số lượng lô vào bảng tồn kho
export const syncLotQuantityToInventory = async (params: {
  productId: number;
  warehouseId: number;
}) => {
  // 1. Tính tổng từ tất cả lô
  const { data: lots } = await supabase
    .from("product_lots")
    .select("quantity")
    .eq("product_id", params.productId)
    .eq("warehouse_id", params.warehouseId);

  const totalQuantity =
    lots?.reduce((sum, lot) => sum + (lot.quantity || 0), 0) || 0;

  // 2. Cập nhật bảng tồn kho
  const { data: inventory } = await supabase
    .from("inventory")
    .upsert({
      product_id: params.productId,
      warehouse_id: params.warehouseId,
      quantity: totalQuantity,
    })
    .select()
    .single();

  // 3. Cập nhật entity store
  if (inventory) {
    useEntityStore.getState().setInventory(inventory);
  }

  return { totalQuantity, inventory };
};
```

## 📊 Luồng Dữ Liệu

### Luồng Tạo Lô

```
Người Dùng Tạo Lô
        ↓
AddLotModal Submit
        ↓
createProductLotWithInventory()
        ↓
1. Insert vào bảng product_lots
        ↓
2. Cập nhật Entity Store (setProductLot)
        ↓
3. Tính tổng từ tất cả lô
        ↓
4. Upsert bảng inventory
        ↓
5. Cập nhật Entity Store (setInventory)
        ↓
Tất Cả Màn Hình Re-render (Tự động đồng bộ)
```

### Luồng Cập Nhật Số Lượng

```
Người Dùng Chỉnh Sửa Số Lượng
        ↓
ProductLotDetailPage
        ↓
updateProductLotQuantity()
        ↓
1. Cập nhật số lượng lô trong DB
        ↓
2. Cập nhật Entity Store (updateProductLot)
        ↓
3. Tính lại tồn kho kho hàng
        ↓
4. Upsert bảng inventory
        ↓
5. Cập nhật Entity Store (setInventory)
        ↓
Tất Cả Màn Hình Re-render (Tự động đồng bộ)
```

### Luồng Chọn Lô trong POS

```
Người Dùng Click Sản Phẩm Quản Lý Theo Lô
        ↓
Kiểm Tra enable_lot_management = true
        ↓
Mở LotSelectionModal
        ↓
Fetch Các Lô Có Sẵn (theo kho)
        ↓
Hiển Thị Lô với Trạng Thái Hết Hạn
        ↓
Người Dùng Chọn Lô + Số Lượng
        ↓
Kiểm Tra Số Lượng ≤ Số Lượng Lô
        ↓
Thêm Vào Giỏ với Thông Tin Lô
        ↓
Giỏ Hàng Hiển Thị: Sản Phẩm + Số Lô (Batch)
```

## 🎯 Best Practices

### 1. **Format Số Lô**

```typescript
// ✅ Chữ hoa, không khoảng trắng
lot_number: "LOT001";
lot_number: "BATCH-2024-001";

// ❌ Tránh chữ thường, khoảng trắng
lot_number: "lot 001"; // Sai
lot_number: "batch-2024-001"; // Sai (chữ thường)
```

### 2. **Validation Ngày Hết Hạn**

```typescript
// ✅ Kiểm tra trước khi set vào form
const expiryDate =
  data?.expiry_date && dayjs(data.expiry_date).isValid()
    ? dayjs(data.expiry_date)
    : null;

form.setFieldsValue({ expiry_date: expiryDate });

// ✅ Kiểm tra tính hợp lệ trước khi tính toán
const daysUntilExpiry =
  data?.expiry_date && dayjs(data.expiry_date).isValid()
    ? dayjs(data.expiry_date).diff(dayjs(), "day")
    : null;
```

### 3. **Cập Nhật Entity Store**

```typescript
// ✅ Luôn cập nhật Entity Store sau mutations
const result = await createProductLot(data);
if (result.data) {
  useEntityStore.getState().setProductLot(result.data);
}

// ❌ Đừng quên cập nhật Entity Store
const result = await createProductLot(data);
// Thiếu cập nhật store - các màn hình khác sẽ không đồng bộ!
```

### 4. **Đồng Bộ Tồn Kho**

```typescript
// ✅ Luôn đồng bộ tồn kho sau khi thay đổi lô
await syncLotQuantityToInventory({
  productId,
  warehouseId,
});

// ❌ Đừng bỏ qua đồng bộ tồn kho
// Tồn kho sẽ không khớp với số lượng lô!
```

## 🔒 Validation Dữ Liệu

### 1. **Số Lô Duy Nhất**

- Theo tổ hợp sản phẩm + kho
- Ràng buộc database đảm bảo tính duy nhất
- Validation UI trước khi gửi

### 2. **Validation Số Lượng**

- Phải không âm
- POS kiểm tra so với số lượng lô có sẵn
- Đồng bộ tồn kho đảm bảo tính nhất quán

### 3. **Validation Ngày**

- Ngày hết hạn phải hợp lệ hoặc null
- Ngày nhập phải hợp lệ hoặc null
- UI xử lý ngày không hợp lệ một cách nhẹ nhàng

### 4. **Phân Công Kho Hàng**

- Lô phải thuộc về một kho
- Nhân viên chỉ có thể tạo lô trong kho được phân công
- POS chỉ hiển thị lô từ kho hiện tại

## 📈 Báo Cáo & Phân Tích

### Báo Cáo Có Sẵn

1. **Sản Phẩm Sắp Hết Hạn**
   - Sản phẩm hết hạn trong vòng 30 ngày
   - Nhóm theo kho
   - Sắp xếp theo ngày hết hạn

2. **Lưu Chuyển Lô**
   - Lịch sử tạo lô
   - Thay đổi số lượng theo thời gian
   - Bán hàng theo lô

3. **Thu Hồi Batch**
   - Tìm tất cả đơn bán cho batch cụ thể
   - Danh sách thông báo khách hàng
   - Tồn kho còn lại theo batch

4. **Tồn Kho Theo Lô**
   - Tồn kho hiện tại mỗi lô
   - Trạng thái hết hạn
   - Phân bổ theo kho

## 📚 Tài Liệu Liên Quan

- [Hệ Thống POS](./pos-system-vi.md) - Chọn lô trong POS
- [Quản Lý Tồn Kho](./inventory-management.md) - Tổng quan tồn kho
- [Hướng Dẫn Entity Store](../../packages/store/ENTITY_STORE_GUIDE.md) - Sử dụng store
- [Bắt Đầu Nhanh](../../packages/store/QUICK_START.md) - Hướng dẫn triển khai
- [Tổng Quan Services](../api/services-overview.md) - API layer
