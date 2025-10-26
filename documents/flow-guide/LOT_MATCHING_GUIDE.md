# Hướng Dẫn Đối Chiếu Lô (Lot Matching) với AI

## Tổng Quan

Tính năng đối chiếu lô tự động giúp trích xuất và điền thông tin chi tiết về từng lô hàng từ ảnh/PDF vào form nhập hàng, bao gồm:

- **Số lô** (Lot Number, Batch Number)
- **Hạn sử dụng** (Expiry Date, HSD)
- **Số lượng từng lô**
- **Đơn giá** (nếu có)

## Quy Trình Hoạt Động

### 1. AI Trích Xuất Thông Tin

Khi phân tích ảnh hoặc PDF, Gemini AI sẽ tìm kiếm:

**Từ Ảnh**:

- Nhãn sản phẩm với số lô
- Tem HSD trên bao bì
- Phiếu nhập kho với thông tin chi tiết

**Từ PDF**:

- Bảng sản phẩm với cột Lot Number
- Cột Expiry Date
- Thông tin lô trong phần chi tiết

### 2. Format Dữ Liệu AI

#### Single Lot (1 lô cho 1 sản phẩm)

```json
{
  "san_pham": [
    {
      "ten": "Dầu gội Clear Men 650ml",
      "so_luong": 50,
      "so_lo": "LOT20250115",
      "han_su_dung": "2025-12-31"
    }
  ]
}
```

#### Multiple Lots (nhiều lô cho 1 sản phẩm)

```json
{
  "san_pham": [
    {
      "ten": "Dầu gội Clear Men 650ml",
      "so_luong": 50,
      "cac_lo": [
        {
          "so_lo": "LOT20250115",
          "so_luong": 30,
          "han_su_dung": "2025-12-31"
        },
        {
          "so_lo": "LOT20250120",
          "so_luong": 20,
          "han_su_dung": "2026-01-15"
        }
      ]
    }
  ]
}
```

### 3. Logic Đối Chiếu

#### Trường Hợp 1: Nhiều Lô Cho Cùng Sản Phẩm

```typescript
// AI phát hiện 2 lô của cùng 1 sản phẩm
Product: "Clear Men 650ml"
Lot 1: LOT-A, Qty: 30, EXP: 2025-12-31
Lot 2: LOT-B, Qty: 20, EXP: 2026-01-15

// Hệ thống tạo 2 lots riêng biệt
receivingData[productId] = [
  {
    id: 1,
    quantityToReceive: 30,
    lotNumber: "LOT-A",
    expirationDate: "2025-12-31"
  },
  {
    id: 2,
    quantityToReceive: 20,
    lotNumber: "LOT-B",
    expirationDate: "2026-01-15"
  }
]
```

#### Trường Hợp 2: Single Lot Info

```typescript
// AI phát hiện 1 lô duy nhất
Product: "Dove Body Wash"
Qty: 15, Lot: "LOT-123", EXP: "2025-10-30"

// Tạo hoặc cập nhật lot
receivingData[productId] = [
  {
    id: 1,
    quantityToReceive: 15,
    lotNumber: "LOT-123",
    expirationDate: "2025-10-30"
  }
]
```

#### Trường Hợp 3: Chỉ Có Số Lượng (Không Có Lot Info)

```typescript
// AI chỉ phát hiện số lượng
Product: "Pantene Shampoo";
Qty: 25;

// Tạo lot với thông tin cơ bản
receivingData[productId] = [
  {
    id: 1,
    quantityToReceive: 25,
    lotNumber: undefined,
    expirationDate: undefined,
  },
];
// User cần điền thủ công lot number và HSD
```

## Ví Dụ Thực Tế

### Ví Dụ 1: Phiếu Nhập Với Nhiều Lô

**Input**: PDF phiếu nhập hàng

| Sản phẩm        | Số lô      | Số lượng | HSD        |
| --------------- | ---------- | -------- | ---------- |
| Clear Men 650ml | LOT-2501-A | 30       | 2025-12-31 |
| Clear Men 650ml | LOT-2501-B | 20       | 2026-01-15 |
| Dove Body Wash  | LOT-2501-C | 40       | 2025-11-30 |

**AI Analysis**:

```json
{
  "san_pham": [
    {
      "ten": "Clear Men 650ml",
      "so_luong": 50,
      "cac_lo": [
        {
          "so_lo": "LOT-2501-A",
          "so_luong": 30,
          "han_su_dung": "2025-12-31"
        },
        {
          "so_lo": "LOT-2501-B",
          "so_luong": 20,
          "han_su_dung": "2026-01-15"
        }
      ]
    },
    {
      "ten": "Dove Body Wash",
      "so_luong": 40,
      "so_lo": "LOT-2501-C",
      "han_su_dung": "2025-11-30"
    }
  ]
}
```

**Kết Quả Đối Chiếu**:

- **Clear Men**: Tạo 2 lots riêng biệt với đầy đủ thông tin
- **Dove**: Tạo 1 lot với thông tin đầy đủ
- Tổng: **3 lots** được tạo tự động

### Ví Dụ 2: Ảnh Chụp Thùng Hàng

**Input**: Ảnh chụp thùng hàng có tem nhãn

Tem nhãn hiển thị:

```
Product: CLEAR MEN SHAMPOO 650ML
Lot No: ABC-20250126
Quantity: 48 bottles
EXP Date: 31/12/2025
```

**AI Analysis**:

```json
{
  "san_pham": [
    {
      "ten": "Clear Men Shampoo 650ml",
      "so_luong": 48,
      "so_lo": "ABC-20250126",
      "han_su_dung": "2025-12-31"
    }
  ]
}
```

**Kết Quả**: 1 lot được tạo với đầy đủ thông tin số lô và HSD

### Ví Dụ 3: PDF Đơn Hàng (Không Có Lot Info)

**Input**: PDF đơn đặt hàng (chưa có thông tin lô)

| Sản phẩm        | Số lượng | Đơn giá |
| --------------- | -------- | ------- |
| Clear Men 650ml | 100      | 150,000 |
| Dove Body Wash  | 80       | 120,000 |

**AI Analysis**:

```json
{
  "san_pham": [
    {
      "ten": "Clear Men 650ml",
      "so_luong": 100,
      "don_gia": 150000
    },
    {
      "ten": "Dove Body Wash",
      "so_luong": 80,
      "don_gia": 120000
    }
  ]
}
```

**Kết Quả**:

- Tạo lots với số lượng và đơn giá
- Lot number và HSD để trống → **User cần điền thủ công**

## Modal Kết Quả Đối Chiếu

### Thông Tin Hiển Thị

Modal sau khi đối chiếu sẽ hiển thị bảng với các cột:

| Cột                    | Mô tả              | Ví dụ             |
| ---------------------- | ------------------ | ----------------- |
| **Sản phẩm trong đơn** | Tên sản phẩm từ PO | Clear Men 650ml   |
| **Phát hiện từ AI**    | Tên từ AI analysis | Dầu gội Clear Men |
| **SL**                 | Số lượng           | 50                |
| **Số lô**              | Lot number         | LOT-2501-A 🟣     |
| **HSD**                | Expiry date        | 2025-12-31        |
| **Độ khớp**            | Similarity %       | 92% 🟢            |

### Màu Sắc

- **🟣 Purple badge**: Số lô được phát hiện
- **🟢 Green**: Độ khớp ≥90%
- **🔵 Blue**: Độ khớp 70-89%
- **🟠 Orange**: Độ khớp 60-69%

## Xử Lý Edge Cases

### Case 1: AI Phát Hiện Sai Số Lô

**Vấn đề**: AI nhầm lẫn giữa mã SKU và số lô

**Giải pháp**:

- Kiểm tra bảng kết quả trong modal
- Sửa thủ công trong form nếu cần
- Cung cấp feedback để cải thiện AI

### Case 2: Format HSD Không Chuẩn

**AI phát hiện**: "31/12/2025" hoặc "12-2025" hoặc "EXP 2025"

**Xử lý**:

- AI cố gắng convert về format YYYY-MM-DD
- Nếu không parse được → giữ nguyên text
- User cần điều chỉnh thủ công

### Case 3: Nhiều Lô Cùng HSD

**Input**:

```
Lot A: Qty 30, EXP: 2025-12-31
Lot B: Qty 20, EXP: 2025-12-31
```

**Kết quả**: Vẫn tạo 2 lots riêng vì có số lô khác nhau

### Case 4: Không Có Thông Tin Lô

**Xử lý**:

- Vẫn tạo lot với số lượng
- Lot number và HSD để `undefined`
- Hiển thị "-" trong bảng
- User điền thủ công sau khi áp dụng

## Cải Thiện Độ Chính Xác AI

### Tips Cho Ảnh Tốt

✅ **Nên**:

- Chụp thẳng góc, không bị nghiêng
- Đủ ánh sáng, không bị mờ
- Focus vào phần có thông tin lô
- Chụp gần để chữ rõ nét
- Chụp riêng từng tem nhãn nếu có nhiều lô

❌ **Không nên**:

- Ảnh mờ, tối, bóng nhiều
- Chụp xa, chữ nhỏ không đọc được
- Góc chụp xiên, biến dạng
- Che khuất thông tin quan trọng

### Tips Cho PDF Tốt

✅ **Nên**:

- PDF text-based (có thể select text)
- Bảng rõ ràng với cột Lot Number, Expiry Date
- Font chữ chuẩn, không bị lỗi encoding
- File size hợp lý (<20MB)

❌ **Không nên**:

- PDF scan với độ phân giải thấp
- Bảng không có header rõ ràng
- Font chữ đặc biệt, khó đọc
- File quá lớn, load lâu

## Workflow Khuyến Nghị

### Bước 1: Upload Files

```
1. Chụp/Chọn ảnh tem nhãn từng thùng hàng
2. Hoặc chọn PDF phiếu nhập từ NCC
3. Chờ AI phân tích (5-15 giây)
```

### Bước 2: Review Kết Quả AI

```
1. Xem kết quả phân tích hiển thị dưới file
2. Kiểm tra số lô, HSD có đúng không
3. Check số lượng từng lô
```

### Bước 3: Áp Dụng Đối Chiếu

```
1. Click button "Áp dụng AI → Điền số lượng"
2. Xem modal kết quả
3. Kiểm tra độ khớp của từng sản phẩm
4. Click OK
```

### Bước 4: Kiểm Tra & Điều Chỉnh

```
1. Scroll xuống bảng sản phẩm
2. Kiểm tra từng lot đã được tạo
3. Điền thêm thông tin còn thiếu (nếu có)
4. Sửa nếu AI điền sai
```

### Bước 5: Xác Nhận Nhận Hàng

```
1. Đảm bảo tất cả lots có đủ thông tin
2. Click "Xác Nhận Nhận Hàng"
3. Done!
```

## API & Data Structure

### LotData Interface

```typescript
interface LotData {
  id: number; // Unique ID for UI
  quantityToReceive: number; // Số lượng nhập
  lotNumber?: string; // Số lô
  expirationDate?: string; // HSD (YYYY-MM-DD)
  shelfLocation?: string; // Vị trí kệ
  unitPrice?: number; // Đơn giá
  vatPercent?: number; // % VAT
  promotionBuyQty?: number; // KM: mua X
  promotionGetQty?: number; // KM: tặng Y
  postPaymentDiscountPercent?: number; // CK trả sau %
}
```

### AI Response Format

```typescript
// Image analysis
{
  products?: Array<{
    name: string;
    quantity?: number;
    lotNumber?: string;
    expirationDate?: string;
    lots?: Array<{
      lotNumber?: string;
      quantity?: number;
      expirationDate?: string;
    }>;
  }>;
}

// PDF analysis (similar + unitPrice, sku)
{
  products?: Array<{
    name: string;
    quantity?: number;
    unitPrice?: number;
    sku?: string;
    lotNumber?: string;
    expirationDate?: string;
    lots?: Array<{
      lotNumber?: string;
      quantity?: number;
      expirationDate?: string;
    }>;
  }>;
}
```

## Troubleshooting

### Lỗi: "AI không phát hiện số lô"

**Nguyên nhân**:

- Ảnh/PDF không có thông tin lô
- Chữ quá nhỏ/mờ
- Format không chuẩn

**Giải pháp**:

- Upload ảnh rõ hơn
- Điền thủ công
- Liên hệ NCC cung cấp phiếu nhập đầy đủ

### Lỗi: "Tạo nhiều lots cho 1 sản phẩm"

**Nguyên nhân**: AI phát hiện nhiều lô khác nhau

**Giải pháp**:

- Kiểm tra lại ảnh/PDF
- Nếu đúng → giữ nguyên
- Nếu sai → xóa lots thừa

### Lỗi: "HSD không đúng format"

**Nguyên nhân**: AI parse date không chính xác

**Giải pháp**:

- Sửa thủ công trong form
- Format chuẩn: YYYY-MM-DD (2025-12-31)

### Lỗi: "Số lô bị nhầm với mã SKU"

**Nguyên nhân**: AI confuse giữa lot number và SKU

**Giải pháp**:

- Xem chi tiết trong modal
- Điều chỉnh thủ công
- Cung cấp ảnh rõ hơn lần sau

## Metrics & Performance

### Success Rate

- Phát hiện tên sản phẩm: ~90%
- Phát hiện số lượng: ~85%
- Phát hiện số lô: ~70% (phụ thuộc chất lượng ảnh/PDF)
- Phát hiện HSD: ~75%

### Processing Time

- Ảnh: 5-10 giây/file
- PDF: 10-15 giây/file
- Matching: <1 giây

### Best Practices

- Upload nhiều file cùng lúc để tiết kiệm thời gian
- Review kết quả trước khi áp dụng
- Luôn kiểm tra lại sau khi áp dụng AI

## Future Improvements

- [ ] OCR tốt hơn cho ảnh chất lượng thấp
- [ ] Auto-detect date format và convert
- [ ] Machine learning để học pattern từ data
- [ ] Barcode scanning cho số lô
- [ ] Voice input cho lot number

---

**Version**: 1.0
**Updated**: 2025-01-26
**Author**: Nam Việt ERP Development Team
