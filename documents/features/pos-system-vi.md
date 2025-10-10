# Hệ Thống POS (Point of Sale)

Hệ thống POS là giải pháp point-of-sale toàn diện được thiết kế cho hoạt động bán lẻ với hỗ trợ quản lý lô sản phẩm, theo dõi khách hàng, combo khuyến mãi, và quản lý đơn hàng đa tab.

## 🎯 Tổng Quan

**Vị trí**: `packages/shared-components/src/screens/pos/PosPage.tsx`

**Mục đích**: Cho phép nhân viên bán hàng xử lý giao dịch bán lẻ hiệu quả với các tính năng nâng cao như chọn lô, phát hiện combo, và quản lý khách hàng.

**Quyền truy cập**: Yêu cầu quyền `pos.access` và `sales.create`

## ✨ Tính Năng Chính

### 1. **Quản Lý Đơn Hàng Đa Tab**

- Tạo nhiều tab đơn hàng đồng thời
- Chuyển đổi giữa các đơn hàng liền mạch
- Đổi tên tab đơn hàng bằng double-click
- Badge hiển thị số lượng sản phẩm mỗi tab
- Giỏ hàng, khách hàng, và kho hàng độc lập cho mỗi tab

### 2. **Tìm Kiếm & Chọn Sản Phẩm**

- Tìm kiếm sản phẩm theo tên, barcode, hoặc mã sản phẩm real-time
- Lọc theo danh mục với tabs
- Hiển thị dạng lưới với hình ảnh sản phẩm
- Chỉ báo số lượng tồn kho
- Tích hợp quét QR/Barcode
- Thêm vào giỏ hàng nhanh chóng với click

### 3. **Quản Lý Lô Sản Phẩm**

- Tự động chọn lô cho sản phẩm quản lý theo lô
- Hiển thị các lô có sẵn với số lượng
- Cảnh báo hạn sử dụng (cam <30 ngày, đỏ hết hạn)
- Các lô khác nhau của cùng sản phẩm là các mục giỏ hàng riêng biệt
- Thông tin lô hiển thị trong giỏ hàng (số lô, mã batch)

### 4. **Giỏ Hàng**

- Tính giá real-time
- Điều chỉnh số lượng với validation
- Kiểm tra tồn kho
- Phát hiện combo/khuyến mãi
- Hỗ trợ cả sản phẩm thường và quản lý theo lô
- Mục riêng biệt cho các lô khác nhau

### 5. **Quản Lý Khách Hàng**

- Tìm kiếm khách hàng theo số điện thoại hoặc tên
- Tạo khách hàng nhanh từ POS
- Hiển thị chi tiết khách hàng và điểm thưởng
- Liên kết khách hàng với đơn hàng
- Theo dõi lịch sử khách hàng

### 6. **Phát Hiện & Gợi Ý Combo**

- Tự động phát hiện combo dựa trên sản phẩm trong giỏ
- Gợi ý combo trực quan với số tiền tiết kiệm
- Áp dụng combo chỉ với một click
- Tự động điều chỉnh giá
- So sánh giá gốc vs giá combo

### 7. **Xử Lý Thanh Toán**

- Thanh toán tiền mặt
- Thanh toán thẻ/chuyển khoản
- Hỗ trợ nhiều phương thức thanh toán
- Modal thanh toán với xem trước hóa đơn
- Kiểm tra tồn kho trước thanh toán
- Tự động cập nhật tồn kho

### 8. **Tích Hợp Kho Hàng**

- Kho hàng được phân công cho nhân viên
- Tồn kho riêng theo kho
- Kiểm tra tồn kho theo kho
- Theo dõi tồn kho theo lô

## 🏗️ Kiến Trúc

### Cấu Trúc Component

```
PosPage (Container chính)
├── Multi-Tab Interface (Ant Design Tabs)
│   └── PosTabContent (Mỗi Tab)
│       ├── Thanh Trên Cùng
│       │   ├── Hiển thị Kho hàng
│       │   └── Tìm kiếm Khách hàng
│       ├── Lưới Sản Phẩm (Panel bên trái)
│       │   ├── Thanh Tìm kiếm
│       │   ├── Tabs Danh mục
│       │   └── Cards Sản phẩm
│       └── Giỏ hàng & Thanh toán (Panel bên phải)
│           ├── Danh sách Sản phẩm trong Giỏ
│           ├── Gợi ý Combo
│           ├── Tổng kết Giá
│           └── Nút Thanh toán
├── PaymentModal
├── LotSelectionModal
├── CreateCustomerModal
└── QRScannerModal
```

### Quản Lý State

```typescript
// POS Store (State đa tab)
usePosStore() {
  tabs: [
    {
      id: string,
      title: string,
      cart: CartItem[],
      selectedCustomer: IPatient | null,
      selectedWarehouse: IWarehouse | null
    }
  ],
  activeTabId: string,
  isProcessingPayment: boolean
}

// Entity Store (Dữ liệu sản phẩm)
useEntityProduct(productId)
useEntityProductLotsByProduct(productId)

// Inventory Store (Dữ liệu tồn kho)
useInventory()
```

## 🔄 Luồng Người Dùng

### Luồng 1: Bán Hàng Cơ Bản (Sản Phẩm Không Theo Lô)

1. **Tìm Sản Phẩm**
   - Nhập tên/barcode sản phẩm trong tìm kiếm
   - Hoặc click tab danh mục để duyệt
   - Hoặc sử dụng quét QR

2. **Thêm Vào Giỏ Hàng**
   - Click card sản phẩm
   - Sản phẩm được thêm với số lượng 1
   - Kiểm tra tồn kho được thực hiện

3. **Điều Chỉnh Số Lượng** (Tùy chọn)
   - Sử dụng InputNumber trong giỏ
   - Kiểm tra tồn kho real-time
   - Cập nhật tổng giá

4. **Chọn Khách Hàng** (Tùy chọn)
   - Tìm theo số điện thoại/tên
   - Chọn từ dropdown
   - Hoặc tạo khách hàng mới

5. **Xử Lý Thanh Toán**
   - Click "Thanh toán - Tiền mặt" hoặc "Thẻ / Chuyển khoản"
   - Xem lại đơn hàng trong modal thanh toán
   - Xác nhận thanh toán
   - Tồn kho tự động cập nhật

### Luồng 2: Bán Hàng với Sản Phẩm Quản Lý Theo Lô

1. **Tìm Sản Phẩm Quản Lý Theo Lô**
   - Sản phẩm có `enable_lot_management: true`

2. **Chọn Lô**
   - Click sản phẩm → Modal Chọn Lô mở ra
   - Xem các lô có sẵn với:
     - Số lô
     - Mã batch
     - Ngày hết hạn (với cảnh báo)
     - Số lượng có sẵn
   - Chọn lô
   - Chọn số lượng (max = số lượng lô)
   - Xác nhận lựa chọn

3. **Giỏ Hàng Hiển Thị Thông Tin Lô**
   - Tên sản phẩm
   - Số lô và mã batch
   - Số lượng
   - Giá

4. **Xử Lý Thanh Toán**
   - Giống sản phẩm không theo lô
   - Tồn kho riêng theo lô được cập nhật

### Luồng 3: Mua Combo

1. **Thêm Sản Phẩm Combo**
   - Thêm nhiều sản phẩm vào giỏ
   - Ví dụ: Sản phẩm A + Sản phẩm B

2. **Phát Hiện Combo**
   - Hệ thống phát hiện combo phù hợp
   - Gợi ý combo xuất hiện với:
     - Tên combo
     - Số tiền tiết kiệm
     - Nút áp dụng một click

3. **Áp Dụng Combo**
   - Click nút combo
   - Các sản phẩm riêng lẻ bị xóa
   - Mục combo được thêm vào
   - Giá cập nhật thành giá combo

4. **Xử Lý Thanh Toán**
   - Combo hiển thị là một mục đơn
   - Các sản phẩm riêng lẻ được trừ khỏi tồn kho

### Luồng 4: Đơn Hàng Đa Tab

1. **Tạo Tab Mới**
   - Click "+" trên thanh tab
   - Tab mới được tạo với giỏ hàng trống

2. **Làm Việc Trên Nhiều Đơn Hàng**
   - Chuyển tab để làm việc trên các đơn hàng khác nhau
   - Mỗi tab duy trì độc lập:
     - Sản phẩm trong giỏ
     - Lựa chọn khách hàng
     - Kho hàng

3. **Đổi Tên Tab**
   - Double-click tiêu đề tab
   - Nhập tên mới
   - Giúp tổ chức nhiều đơn hàng

4. **Hoàn Thành Đơn Hàng**
   - Xử lý thanh toán cho tab đang hoạt động
   - Giỏ hàng của tab được xóa sau thanh toán thành công
   - Tab vẫn còn cho đơn hàng mới

5. **Đóng Tab**
   - Click X trên tab
   - Xác nhận nếu giỏ hàng không trống
   - Yêu cầu tối thiểu 1 tab

## 🎨 Tính Năng UI/UX

### Giao Diện Desktop

```
┌─────────────────────────────────────────────────────────┐
│  Kho: Kho 1          |    Tìm kiếm Khách hàng          │
├─────────────────────────┬───────────────────────────────┤
│                         │  🛒 Giỏ hàng (3 sản phẩm)     │
│   Lưới Sản Phẩm         │  ────────────────────         │
│                         │  • Sản phẩm A (Lô: LOT001)    │
│  ┌────┐ ┌────┐ ┌────┐  │    50,000đ x 2 = 100,000đ     │
│  │ SP1│ │ SP2│ │ SP3│  │                               │
│  └────┘ └────┘ └────┘  │  • Sản phẩm B                 │
│                         │    30,000đ x 1 = 30,000đ      │
│  ┌────┐ ┌────┐ ┌────┐  │                               │
│  │ SP4│ │ SP5│ │ SP6│  │  🎁 Combo khuyến mãi!        │
│  └────┘ └────┘ └────┘  │  ✅ Combo A+B - Tiết kiệm    │
│                         │     20,000đ                   │
│                         │  ────────────────────         │
│                         │  Tổng: 130,000đ              │
│                         │  [Thanh toán - Tiền mặt]     │
│                         │  [Thẻ / Chuyển khoản]        │
└─────────────────────────┴───────────────────────────────┘
```

### Giao Diện Mobile

- Lưới sản phẩm thu gọn thành 2 cột
- Giỏ hàng ẩn, truy cập qua nút floating
- Modal giỏ hàng toàn màn hình khi mở
- Điều khiển tối ưu cho cảm ứng

### Chế Độ Toàn Màn Hình

- Không có menu trên hoặc sidebar
- Tối đa không gian màn hình cho POS
- Route: `/pos` hiển thị toàn màn hình
- Tối ưu cho thiết lập kiosk bán lẻ

## 🔧 Triển Khai Kỹ Thuật

### Logic Thêm Sản Phẩm

```typescript
const handleAddToCart = (product: IProduct) => {
  // Kiểm tra tồn kho
  if (!product.stock_quantity || product.stock_quantity <= 0) {
    notification.error({ message: "Hết hàng" });
    return;
  }

  // Kiểm tra quản lý theo lô
  if (product.enable_lot_management && employeeWarehouse) {
    setSelectedProductForLot(product);
    setIsLotSelectionModalOpen(true);
    return;
  }

  // Kiểm tra sản phẩm đã có
  const existingItem = cart.find(
    (item) => item.id === product.id && !item.lot_id,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + 1;

    // Kiểm tra tồn kho
    if (newQuantity > product.stock_quantity) {
      notification.error({ message: "Vượt quá tồn kho" });
      return;
    }

    updateCartItem(existingItem.key, {
      quantity: newQuantity,
      total: existingItem.price * newQuantity,
    });
  } else {
    // Thêm mục mới
    const priceInfo = calculateBestPrice(product, promotions);
    const cartItem = {
      key: `${product.id}_${Date.now()}`,
      id: product.id,
      quantity: 1,
      price: priceInfo.finalPrice,
      total: priceInfo.finalPrice,
      ...priceInfo,
      stock_quantity: product.stock_quantity,
    };

    addCartItem(cartItem);
  }
};
```

### Logic Chọn Lô

```typescript
const handleLotSelect = (lot: IProductLot, quantity: number) => {
  const existingItem = cart.find(
    (item) => item.id === selectedProductForLot.id && item.lot_id === lot.id,
  );

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity;

    if (lot.quantity && newQuantity > lot.quantity) {
      notification.error({ message: "Vượt quá tồn kho lô" });
      return;
    }

    updateCartItem(existingItem.key, {
      quantity: newQuantity,
      total: existingItem.price * newQuantity,
    });
  } else {
    const cartItem = {
      key: `${selectedProductForLot.id}_${lot.id}_${Date.now()}`,
      id: selectedProductForLot.id,
      quantity: quantity,
      lot_id: lot.id,
      lot_number: lot.lot_number,
      batch_code: lot.batch_code,
      expiry_date: lot.expiry_date,
      stock_quantity: lot.quantity,
    };

    addCartItem(cartItem, true);
  }
};
```

### Logic Phát Hiện Combo

```typescript
const detectedCombos = useMemo(() => {
  if (cart.length === 0 || storedCombos.length === 0) {
    return [];
  }

  const regularItems = cart
    .filter((item) => !item.isCombo)
    .map((item) => ({ id: item.id, quantity: item.quantity }));

  const matchedCombos = [];

  for (const combo of storedCombos) {
    let isMatch = true;

    for (const comboItem of combo.combo_items) {
      const cartItem = regularItems.find(
        (ci) => ci.id === comboItem.product_id,
      );

      if (!cartItem || cartItem.quantity < comboItem.quantity) {
        isMatch = false;
        break;
      }
    }

    if (isMatch && combo.combo_items.length > 0) {
      matchedCombos.push(combo);
    }
  }

  return matchedCombos;
}, [cart, storedCombos]);
```

## 🎯 Components Chính

### LotSelectionModal

**Vị trí**: `packages/shared-components/src/components/LotSelectionModal.tsx`

**Mục đích**: Cho phép người dùng chọn lô sản phẩm cụ thể

**Tính năng**:

- Hiển thị các lô có sẵn với chi tiết
- Cảnh báo hết hạn trực quan
- Bộ chọn số lượng với validation
- Tự động chọn nếu chỉ có một lô

### PosTabContent

**Vị trí**: `packages/shared-components/src/components/PosTabContent.tsx`

**Mục đích**: Giao diện POS chính cho mỗi tab

**Tính năng**:

- Lưới sản phẩm với tìm kiếm
- Lọc theo danh mục
- Hiển thị giỏ hàng
- Gợi ý combo
- Hành động thanh toán

### PaymentModal

**Vị trí**: `packages/shared-components/src/components/PaymentModal.tsx`

**Mục đích**: Xử lý thanh toán và tạo hóa đơn

**Tính năng**:

- Chọn phương thức thanh toán
- Nhập số tiền
- Tính tiền thừa
- Xem trước hóa đơn
- Kiểm tra tồn kho

## 📊 Luồng Dữ Liệu

```
Hành Động Người Dùng (Thêm Sản Phẩm)
        ↓
Tra Cứu Sản Phẩm (Inventory Store)
        ↓
Kiểm Tra Lô (enable_lot_management?)
    ↙         ↘
  Có          Không
   ↓            ↓
Hiển Thị      Thêm vào Giỏ
Modal Lô      (POS Store)
   ↓
Chọn Lô
   ↓
Thêm vào Giỏ với Thông Tin Lô
        ↓
Cập Nhật Giỏ → Phát Hiện Combo
        ↓
Người Dùng Xác Nhận Thanh Toán
        ↓
Kiểm Tra Tồn Kho (Số Lượng Toàn Cục)
        ↓
Xử Lý Thanh Toán (API)
        ↓
Cập Nhật Tồn Kho (Entity Store)
        ↓
Xóa Giỏ → Thông Báo Thành Công
```

## 🔒 Quyền & Bảo Mật

### Quyền Yêu Cầu

- `pos.access` - Truy cập hệ thống POS
- `sales.create` - Tạo đơn hàng bán

### Validation Dữ Liệu

- Kiểm tra số lượng tồn kho trước khi thêm vào giỏ
- Kiểm tra số lượng toàn cục (bao gồm combos) trước thanh toán
- Kiểm tra số lượng lô cho sản phẩm quản lý theo lô
- Validation dữ liệu khách hàng khi tạo

### Bảo Vệ Tồn Kho

- Kiểm tra tồn kho real-time
- Ngăn bán quá số lượng
- Tự động cập nhật tồn kho
- Ghi log giao dịch

## 🚀 Tối Ưu Hiệu Suất

1. **Inventory Store Caching**
   - Pre-load tồn kho kho hàng khi app khởi động
   - Tìm kiếm local thay vì API calls
   - Tra cứu sản phẩm nhanh hơn

2. **Entity Store Integration**
   - Sản phẩm được cache trong normalized store
   - Giảm API calls trùng lặp
   - Truy cập dữ liệu tức thì

3. **Selective Re-renders**
   - State theo phạm vi tab ngăn cập nhật không cần thiết
   - Chỉ tab đang hoạt động re-render khi thay đổi
   - Phát hiện combo được memo-ized

4. **Optimistic UI Updates**
   - Cập nhật giỏ hàng tức thì
   - Đồng bộ tồn kho background
   - Rollback khi có lỗi

## 📚 Tài Liệu Liên Quan

- [Quản Lý Lô Sản Phẩm](./product-lot-management-vi.md)
- [Quản Lý Tồn Kho](./inventory-management.md)
- [Quản Lý Khách Hàng](./customer-management.md)
- [Hướng Dẫn Người Dùng POS](../guides/pos-user-guide.md)
- [Quản Lý State](../architecture/state-management-vi.md)
