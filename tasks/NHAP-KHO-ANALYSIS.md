# Phân tích Tính năng "Nhập Kho" (Warehouse Receiving)

## 📋 Tổng quan

Dựa trên file `QUAN-LY-KHO-Van.txt`, tính năng "Nhập Kho" là phần quan trọng trong vòng đời sản phẩm:
**Lên Kế hoạch mua => **NHẬP HÀNG VÀO KHO** => Thực hiện hành động Bán Hàng => Giao tới Khách Hàng**

## 🎯 Mục tiêu

Hỗ trợ Nhân Viên Kho nhận và kiểm tra hàng hóa một cách nhanh chóng, chính xác, giảm thiểu thao tác thủ công.

## 📝 Yêu cầu chức năng (Từ B3 trong spec)

### 1. **Nhận và Kiểm tra Thông tin**

Khi hàng về đến kho, Nhân viên kho cần:

- ✅ Kiểm tra **Số Lượng** thực nhận so với đơn đặt hàng
- ✅ Nhập **Số Lô** (Lot Number)
- ✅ Nhập **Hạn Sử Dụng** (Expiration Date) - **TỰ ĐỘNG**

### 2. **NÚT 2: Nhập Lô và Hạn Tự Động**

**Vấn đề hiện tại:**

- Nhân viên phải cầm từng sản phẩm, đọc và nhập thủ công
- Với ~150 hộp, mất rất nhiều thời gian

**Giải pháp đề xuất:**

#### **Option A: OCR qua Camera điện thoại**

- Quét trực tiếp qua camera
- Đọc chữ số trên vỏ hộp
- Tự động nhập vào hệ thống

#### **Option B: Chụp ảnh từng sản phẩm**

- Chụp ảnh phần Lô và Hạn
- AI/OCR đọc và trả về kết quả

#### **Option C: Upload hóa đơn/PDF từ NCC** (Recommended)

- Upload file hóa đơn hoặc phiếu xuất kho từ nhà cung cấp
- AI đọc hàng loạt Lô - Hạn
- Sử dụng "Ánh Xạ Sản Phẩm" (Product Mapping) từ Quản lý NCC
- Tự động match: Sản phẩm A của NCC → Sản phẩm AA trong hệ thống

### 3. **NÚT 3: Quét Mã Vạch**

- Quét Barcode/QR trên vỏ hộp
- Tự động đối chiếu với Barcode đã nhập sẵn
- Xác nhận sản phẩm có trong danh sách đơn nhập hàng

### 4. **Cập nhật Kho**

- Nhập hàng vào kho
- Cập nhật số lượng tồn kho thực tế
- Xếp lên kệ (có thể cần thêm chức năng quản lý vị trí kệ)

---

## 🏗️ Kiến trúc Hệ thống

### **Current Status (Đã có)**

```
PurchaseOrderReceivingPage.tsx
├── UI cơ bản cho nhận hàng
├── Danh sách đơn hàng chờ nhận
├── Bảng sản phẩm với input số lượng
├── Placeholder cho quét barcode
└── ⚠️ Dùng mock data, chưa có API thật
```

### **What's Missing (Cần thêm)**

1. ❌ Chức năng nhập Số Lô và Hạn Sử Dụng
2. ❌ OCR/Camera integration để đọc Lô-Hạn tự động
3. ❌ Upload và xử lý PDF/hóa đơn từ NCC
4. ❌ Barcode scanner thực tế (đã có QRScanner component)
5. ❌ Service functions để lưu receiving data
6. ❌ Cập nhật inventory khi nhận hàng
7. ❌ Xử lý nhận từng phần (partial receiving)
8. ❌ Lot management integration

---

## 🛠️ Implementation Plan

### **Phase 1: Core Receiving Functionality** ✅ CƠ BẢN

- [ ] Integrate real API để load purchase orders
- [ ] Add Lot Number và Expiration Date fields
- [ ] Create `receivePurchaseOrder` service function
- [ ] Update inventory when receiving
- [ ] Handle partial receiving
- [ ] Add receiving history/logs

### **Phase 2: Barcode Scanning** 🔍 QUAN TRỌNG

- [ ] Integrate QRScanner component (đã có)
- [ ] Auto-fill products when scanning barcode
- [ ] Validate scanned product against PO items
- [ ] Show warnings if product not in PO

### **Phase 3: Auto Lot/Expiration Input** 🤖 NÚT 2

#### **Option A: Real-time Camera OCR**

- [ ] Integrate OCR library (Tesseract.js, ML Kit, etc.)
- [ ] Camera interface for scanning lot/exp on box
- [ ] Parse and extract lot number and date
- [ ] Validate format and auto-fill

#### **Option B: Photo Upload**

- [ ] Upload photo of lot/exp section
- [ ] Send to OCR service (Google Vision API, Azure Computer Vision)
- [ ] Parse results and fill form

#### **Option C: Invoice/PDF Processing** 📄 RECOMMENDED

- [ ] Upload invoice/delivery note PDF from supplier
- [ ] Use Product Mapping from Supplier Management
- [ ] AI/OCR reads lot/exp in bulk
- [ ] Match supplier product names to internal products
- [ ] Batch update all products in PO

### **Phase 4: Enhanced Features** ⭐

- [ ] Shelf location management (Quản lý vị trí kệ)
- [ ] Mobile-friendly receiving interface
- [ ] Photo documentation (chụp ảnh hàng hóa khi nhận)
- [ ] Quality check checklist
- [ ] Email/notification to purchasing team when receiving complete

---

## 📊 Database Schema Requirements

### **Existing Tables to Use:**

- `purchase_orders` - Đơn đặt hàng
- `purchase_order_items` - Items trong đơn
- `inventory` - Tồn kho
- `products` - Sản phẩm

### **New/Modified Tables Needed:**

#### **`purchase_order_items` table modifications:**

```sql
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS lot_number VARCHAR(100);
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS expiration_date DATE;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS received_quantity INTEGER DEFAULT 0;
ALTER TABLE purchase_order_items ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(50);
```

#### **New table: `receiving_logs`** (Optional but recommended)

```sql
CREATE TABLE receiving_logs (
  id SERIAL PRIMARY KEY,
  po_id INTEGER REFERENCES purchase_orders(id),
  po_item_id INTEGER REFERENCES purchase_order_items(id),
  product_id INTEGER REFERENCES products(id),
  quantity_received INTEGER NOT NULL,
  lot_number VARCHAR(100),
  expiration_date DATE,
  received_by VARCHAR(255),
  received_at TIMESTAMP DEFAULT NOW(),
  notes TEXT,
  photo_url TEXT
);
```

---

## 🔧 Service Functions Needed

### **1. Get Pending Purchase Orders**

```typescript
export const getPendingPurchaseOrders = async () => {
  // Get POs with status 'ordered' or 'sent' or 'partially_received'
};
```

### **2. Receive Purchase Order Items**

```typescript
export const receivePurchaseOrderItems = async (
  poId: number,
  items: Array<{
    itemId: number;
    quantityReceived: number;
    lotNumber?: string;
    expirationDate?: string;
    shelfLocation?: string;
  }>,
  receivedBy: string,
) => {
  // Update received_quantity in purchase_order_items
  // Update inventory quantities
  // Create receiving_logs entries
  // Update PO status if fully received
};
```

### **3. OCR/AI Processing**

```typescript
export const processInvoiceOCR = async (file: File, supplierId: number) => {
  // Upload file to storage
  // Send to OCR service
  // Parse lot numbers and expiration dates
  // Use product mapping to match products
  // Return structured data
};
```

---

## 🎨 UI Components Needed

### **1. Lot & Expiration Input Component**

```tsx
<LotExpirationInput
  value={{ lot: "", expiration: null }}
  onChange={(value) => {}}
  onOCRScan={() => {}}
  allowOCR={true}
/>
```

### **2. Invoice Upload Modal**

```tsx
<InvoiceUploadModal
  visible={open}
  supplierId={selectedPO.supplier_id}
  onSuccess={(parsedData) => {}}
/>
```

### **3. Receiving Summary**

```tsx
<ReceivingSummary
  totalItems={10}
  receivedItems={8}
  pendingItems={2}
  totalQuantity={100}
  receivedQuantity={85}
/>
```

---

## 📱 Mobile Considerations

Since warehouse staff will likely use mobile devices:

- ✅ Responsive design
- ✅ Large touch-friendly buttons
- ✅ Camera access for barcode/OCR
- ✅ Offline capability (optional)
- ✅ Quick number pad for quantity input

---

## 🔐 Permissions Required

```typescript
"warehouse.receiving.access";
"warehouse.receiving.confirm";
"warehouse.receiving.ocr"; // For OCR features
```

---

## 📈 Success Metrics

- ⏱️ **Time Reduction**: Giảm thời gian nhập liệu từ 150 sản phẩm
- ✅ **Accuracy**: Giảm sai sót khi nhập Lô-Hạn
- 📊 **Efficiency**: Số lượng đơn nhận được/ngày tăng
- 😊 **User Satisfaction**: Feedback từ nhân viên kho

---

## 🚀 Recommended Implementation Order

### **Sprint 1: Core Functionality** (1-2 weeks)

1. Integrate real purchase orders API
2. Add lot & expiration fields
3. Implement basic receiving service
4. Update inventory on receive

### **Sprint 2: Barcode Integration** (1 week)

1. Integrate existing QRScanner
2. Auto-fill on scan
3. Validation logic

### **Sprint 3: OCR Features** (2-3 weeks)

1. Start with Invoice Upload (Option C) - highest ROI
2. Implement product mapping logic
3. AI/OCR integration (Google Vision API or similar)
4. Batch update interface

### **Sprint 4: Polish & Mobile** (1 week)

1. Mobile optimization
2. User testing with warehouse staff
3. Bug fixes and improvements

---

## 💡 Technology Recommendations

### **For OCR:**

- **Tesseract.js** - Client-side OCR (free, works offline)
- **Google Cloud Vision API** - High accuracy, paid
- **Azure Computer Vision** - Good for documents
- **AWS Textract** - Excellent for invoices/PDFs

### **For Barcode:**

- ✅ Already have QRScanner component
- Can use native BarcodeDetector API (already implemented)

### **For File Upload:**

- Supabase Storage (already integrated)

---

## ⚠️ Risks & Challenges

1. **OCR Accuracy**: Lot numbers và dates có thể có format khác nhau
   - **Solution**: Train AI với samples, có manual override

2. **Product Mapping**: Tên sản phẩm của NCC khác tên internal
   - **Solution**: Sử dụng mapping table trong supplier management

3. **Mobile Camera Access**: HTTPS requirement
   - **Solution**: Đảm bảo app chạy trên HTTPS

4. **Partial Receiving**: Logic phức tạp khi nhận từng phần
   - **Solution**: Track received_quantity carefully, test thoroughly

---

## 📞 Next Steps

1. **Review** this analysis with the team
2. **Prioritize** features based on business value
3. **Start** with Phase 1 (Core Functionality)
4. **Prototype** OCR with sample invoices from suppliers
5. **Get feedback** from warehouse staff early and often

---

**Created:** 2025-10-13
**Status:** Analysis Complete - Ready for Implementation
**Priority:** HIGH - Critical for warehouse operations
