# Hướng Dẫn Quản Lý Chương Trình Khuyến Mại Nhà Cung Cấp

## 📋 Tổng Quan

Hệ thống quản lý chương trình khuyến mại và chiết khấu từ nhà cung cấp, giúp:

- Theo dõi các chương trình khuyến mại từ nhà cung cấp
- Tự động tính toán giá vốn cuối cùng khi nhập hàng
- Quản lý nhiều loại chương trình khuyến mại khác nhau
- Áp dụng tự động cho sản phẩm khi nhận hàng

---

## 🗂️ Database Schema

### Table: `supplier_promotions`

```sql
CREATE TABLE supplier_promotions (
  id BIGSERIAL PRIMARY KEY,
  supplier_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  promotion_type VARCHAR(50) NOT NULL, -- 4 loại
  promotion_config JSONB NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  applies_to_all_products BOOLEAN DEFAULT true,
  product_ids BIGINT[],
  min_order_quantity INTEGER DEFAULT 0,
  min_order_value DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🎯 4 Loại Chương Trình Khuyến Mại

### 1. **Mua X Tặng Y (buy_x_get_y)**

Mua một số lượng sản phẩm nhất định, được tặng thêm sản phẩm miễn phí.

**Config JSON:**

```json
{
  "buy_quantity": 10,
  "get_quantity": 1
}
```

**Ví dụ:**

- Tên: "Mua 10 tặng 1"
- Giải thích: Mua 10 chai dầu gội → Được tặng 1 chai
- Cách tính:
  - Giá gốc: 100,000đ/chai
  - Mua 10 chai = 1,000,000đ
  - Nhận về: 11 chai (10 + 1 tặng)
  - **Giá vốn hiệu quả: 90,909đ/chai** (1,000,000 / 11)

---

### 2. **Giảm Giá Theo % (percentage_discount)**

Giảm giá trực tiếp theo phần trăm.

**Config JSON:**

```json
{
  "discount_percent": 5
}
```

**Ví dụ:**

- Tên: "Giảm 5% toàn bộ đơn hàng"
- Giải thích: Giảm 5% cho tất cả sản phẩm
- Cách tính:
  - Giá gốc: 100,000đ
  - Giảm 5% = 5,000đ
  - **Giá vốn cuối: 95,000đ**

---

### 3. **Giảm Giá Cố Định (fixed_discount)**

Giảm một số tiền cố định cho mỗi sản phẩm hoặc đơn hàng.

**Config JSON:**

```json
{
  "discount_amount": 50000,
  "min_order_value": 1000000
}
```

**Ví dụ:**

- Tên: "Giảm 50,000đ cho đơn từ 1 triệu"
- Giải thích: Đơn hàng trên 1 triệu được giảm 50k
- Cách tính:
  - Giá gốc: 150,000đ
  - Giảm: 50,000đ
  - **Giá vốn cuối: 100,000đ**

---

### 4. **Chiết Khấu Trả Sau (post_payment_discount)**

Chiết khấu áp dụng khi thanh toán sớm trong số ngày quy định.

**Config JSON:**

```json
{
  "discount_percent": 3,
  "payment_days": 30
}
```

**Ví dụ:**

- Tên: "Chiết khấu 3% thanh toán trong 30 ngày"
- Giải thích: Thanh toán trong 30 ngày được giảm 3%
- Cách tính:
  - Giá gốc: 100,000đ
  - Giảm 3% = 3,000đ
  - **Giá vốn cuối: 97,000đ**

---

## 📱 Cách Sử Dụng

### 1. Truy Cập Trang Quản Lý

**Cách 1: Từ Danh Sách Nhà Cung Cấp**

1. Vào `/warehouse/suppliers`
2. Click vào nhà cung cấp → Mở trang chi tiết
3. Click nút **"Chương Trình Khuyến Mại"** (icon 🎁)
4. Mở trang `/warehouse/suppliers/:id/promotions`

**Cách 2: Trực Tiếp**

- Navigate to: `/warehouse/suppliers/:supplierId/promotions`

---

### 2. Tạo Chương Trình Mới

1. Click nút **"Thêm Chương Trình"**
2. Điền thông tin:

#### **Thông Tin Cơ Bản**

- **Tên chương trình**: VD: "Mua 10 tặng 1 - Tháng 12"
- **Loại chương trình**: Chọn 1 trong 4 loại
- **Mô tả**: Mô tả chi tiết (tùy chọn)

#### **Chi Tiết Khuyến Mại**

Tùy theo loại đã chọn, điền các thông tin:

- **Mua X Tặng Y**: Số lượng mua + Số lượng tặng
- **Giảm giá %**: Phần trăm giảm (0-100%)
- **Giảm cố định**: Số tiền giảm + Giá trị đơn tối thiểu
- **Chiết khấu trả sau**: % chiết khấu + Số ngày thanh toán

#### **Thời Gian & Điều Kiện**

- **Thời gian áp dụng**: Từ ngày - Đến ngày (hoặc vô thời hạn)
- **Độ ưu tiên**: Số càng cao càng ưu tiên (khi có nhiều chương trình)
- **Số lượng đơn tối thiểu**: 0 = không giới hạn
- **Giá trị đơn tối thiểu**: 0 = không giới hạn

#### **Phạm Vi Áp Dụng**

- **Áp dụng cho**: Toggle ON = Tất cả sản phẩm | OFF = Sản phẩm cụ thể
- **Ghi chú nội bộ**: Ghi chú cho team (không hiển thị ra ngoài)
- **Trạng thái**: ON = Kích hoạt | OFF = Tạm tắt

3. Click **"Tạo Mới"** → Hoàn tất!

---

### 3. Quản Lý Chương Trình

#### **Xem Danh Sách**

- Hiển thị tất cả chương trình của nhà cung cấp
- Có thể filter theo trạng thái
- Statistics: Tổng | Đang hoạt động | Đã tắt

#### **Chỉnh Sửa**

- Click icon ✏️ → Mở form chỉnh sửa
- Cập nhật thông tin → Click "Cập Nhật"

#### **Bật/Tắt**

- Toggle switch trên cột "Trạng Thái"
- ON/OFF ngay lập tức

#### **Xóa**

- Click icon 🗑️ → Confirm → Xóa vĩnh viễn

---

## 🔄 Tích Hợp Với Nhận Hàng

### Khi Nhận Hàng (PurchaseOrderReceivingDetailPage)

Hệ thống sẽ tự động:

1. **Load các chương trình đang hoạt động** của nhà cung cấp
2. **Hiển thị dropdown** để chọn chương trình áp dụng
3. **Tự động tính toán** giá vốn cuối dựa trên:
   - Giá gốc (chưa VAT)
   - VAT %
   - Chương trình khuyến mại (nếu có)
   - Chiết khấu trả sau (nếu có)

**Công Thức Tổng Hợp:**

```
Bước 1: Giá có VAT = Giá gốc × (1 + VAT%)

Bước 2: Áp dụng khuyến mại (tùy loại)
  - Mua X tặng Y: Giá hiệu quả = (Giá gốc × X) / (X + Y)
  - Giảm %: Giá hiệu quả = Giá gốc × (1 - Giảm%)
  - Giảm cố định: Giá hiệu quả = Giá gốc - Số tiền giảm

Bước 3: Chiết khấu trả sau
  Giá vốn cuối = Giá hiệu quả × (1 - CK trả sau %)
```

---

## 📊 Ví Dụ Thực Tế

### **Scenario 1: Kết Hợp Nhiều Chương Trình**

**Sản phẩm**: Chai dầu gội Clear

**Chương trình nhà cung cấp đang áp dụng:**

1. Mua 10 tặng 1
2. Chiết khấu trả sau 5% (thanh toán trong 30 ngày)

**Tính toán:**

```
Giá gốc (chưa VAT):        100,000đ
VAT 10%:                   +10,000đ = 110,000đ

Khuyến mại (Mua 10 tặng 1):
  - Mua 10 chai = 1,000,000đ
  - Nhận 11 chai
  - Giá hiệu quả = 1,000,000 / 11 = 90,909đ/chai

Chiết khấu trả sau 5%:
  - Giảm thêm: 90,909 × 5% = 4,545đ
  - Giá vốn cuối = 90,909 - 4,545 = 86,364đ/chai

✅ Kết quả: Giá vốn cuối = 86,364đ/chai
```

---

### **Scenario 2: Chương Trình Có Điều Kiện**

**Chương trình**: "Giảm 100,000đ cho đơn từ 5 triệu"

**Config:**

```json
{
  "promotion_type": "fixed_discount",
  "promotion_config": {
    "discount_amount": 100000,
    "min_order_value": 5000000
  }
}
```

**Áp dụng:**

- Đơn hàng 4,500,000đ → ❌ Không đủ điều kiện
- Đơn hàng 5,000,000đ → ✅ Được giảm 100,000đ
- Đơn hàng 10,000,000đ → ✅ Được giảm 100,000đ

---

## ⚙️ API / Services

### **Frontend Services**

```typescript
// Get promotions
getSupplierPromotions({ supplierId, isActive, promotionType });

// Get active promotions for date
getActiveSupplierPromotions(supplierId, date);

// Get applicable promotions for product
getApplicablePromotionsForProduct(supplierId, productId, date);

// CRUD operations
createSupplierPromotion(data);
updateSupplierPromotion(id, data);
deleteSupplierPromotion(id);
toggleSupplierPromotionStatus(id, isActive);

// Calculate discount
calculatePromotionDiscount(promotion, orderQuantity, unitPrice);
```

---

## 🚀 Migration

Để tạo bảng trong database:

```bash
# Run migration
psql -U your_user -d your_database -f database/migrations/create_supplier_promotions_table.sql
```

Hoặc copy SQL và chạy trong Supabase SQL Editor:

- File: `database/migrations/create_supplier_promotions_table.sql`

---

## 📝 Files Liên Quan

### **Backend**

- `database/migrations/create_supplier_promotions_table.sql` - Database schema
- `packages/services/src/supplierPromotionService.ts` - Services & types

### **Frontend**

- `packages/shared-components/src/screens/warehouse/SupplierPromotionsPage.tsx` - UI quản lý
- `packages/shared-components/src/screens/warehouse/SupplierFormPage.tsx` - Link đến promotions
- `packages/shared-components/src/screens/warehouse/PurchaseOrderReceivingDetailPage.tsx` - Áp dụng khi nhận hàng

### **Routes**

- `/warehouse/suppliers/:supplierId/promotions` - Quản lý chương trình

---

## ✅ Checklist Triển Khai

- [x] Database migration
- [x] Service layer (TypeScript interfaces + functions)
- [x] UI quản lý chương trình
- [x] Screen registry
- [x] Routes (sale app)
- [x] Integration với SupplierFormPage
- [ ] Integration với PurchaseOrderReceivingDetailPage (TODO)
- [ ] Auto-apply promotions khi nhận hàng (TODO)
- [ ] Reports & Analytics (TODO)

---

## 🎯 Next Steps

1. **Chạy migration** để tạo bảng `supplier_promotions`
2. **Test tạo chương trình** cho một nhà cung cấp
3. **Tích hợp với nhận hàng** - tự động áp dụng promotion khi nhập hàng
4. **Thêm reports** - Thống kê tiết kiệm được từ các chương trình

---

**Status**: ✅ Core features completed
**Risk**: Low
**Breaking Changes**: None

🎉 Hệ thống quản lý chương trình khuyến mại nhà cung cấp đã sẵn sàng!
