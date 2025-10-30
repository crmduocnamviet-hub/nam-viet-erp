# Hướng Dẫn Đối Chiếu Tự Động với AI

## Tổng Quan

Tính năng đối chiếu tự động giúp điền số lượng nhập hàng từ kết quả phân tích AI (ảnh và PDF) vào form nhập hàng một cách tự động dựa trên việc khớp tên sản phẩm.

## Quy Trình Sử Dụng

### 1. Chụp/Chọn Ảnh hoặc PDF

- **Chọn Ảnh**: Click nút "Chọn Ảnh" để tải ảnh của phiếu nhập hàng
- **Chụp Ảnh**: Sử dụng camera điện thoại để chụp trực tiếp
- **Chọn PDF**: Click nút "Chọn PDF" để tải file PDF đơn hàng

### 2. Chờ AI Phân Tích

- Hệ thống tự động phân tích ảnh/PDF với Gemini AI
- Trích xuất thông tin: tên sản phẩm, số lượng, đơn giá (nếu có)
- Kết quả phân tích hiển thị ngay bên dưới

### 3. Áp Dụng Kết Quả AI

- Sau khi có kết quả phân tích, nút **"Áp dụng AI → Điền số lượng"** sẽ xuất hiện
- Click nút này để tự động đối chiếu và điền số lượng
- Modal hiển thị kết quả matching với bảng chi tiết

### 4. Kiểm Tra và Điều Chỉnh

- Xem lại các sản phẩm đã được điền tự động
- Điều chỉnh nếu cần (số lượng, số lô, hạn sử dụng)
- Click "Xác Nhận Nhận Hàng" khi hoàn tất

## Chi Tiết Thuật Toán Matching

### String Similarity Algorithm

Hệ thống sử dụng thuật toán **Levenshtein Distance** để tính độ tương đồng giữa tên sản phẩm:

```typescript
// Ví dụ matching
"Dầu gội Clear Men 650ml"  ↔  "Dầu gội Clear Men"  → 85% khớp
"Sữa rửa mặt Pond's"       ↔  "Pond's Face Wash"   → 65% khớp
"Coca Cola 330ml"          ↔  "Nước ngọt Coca"     → 55% khớp (không khớp)
```

### Ngưỡng Matching

- **≥ 60%**: Được chấp nhận (có thể điều chỉnh trong code)
- **≥ 90%**: Khớp hoàn hảo (màu xanh lá)
- **70-89%**: Khớp tốt (màu xanh dương)
- **60-69%**: Khớp chấp nhận được (màu cam)
- **< 60%**: Không khớp (bị loại bỏ)

### Quy Tắc Matching

1. **Exact Match** (100%):
   - Tên sản phẩm giống hệt nhau (không phân biệt hoa/thường)

2. **Contains Match** (80%):
   - Một tên chứa tên kia
   - Ví dụ: "Dầu gội Clear" chứa "Clear"

3. **Levenshtein Distance**:
   - Tính số thay đổi ký tự tối thiểu để biến chuỗi này thành chuỗi kia
   - Càng ít thay đổi = càng giống

4. **Best Match Priority**:
   - Nếu nhiều sản phẩm AI khớp với 1 sản phẩm PO → chọn match tốt nhất
   - Nếu 1 sản phẩm AI khớp với nhiều sản phẩm PO → mỗi PO có match riêng

## Logic Điền Số Lượng

### Trường Hợp 1: Chưa Có Lot

```typescript
// Tạo lot mới với số lượng từ AI
newLot = {
  id: unique_id,
  quantityToReceive: quantity_from_AI,
  unitPrice: price_from_AI (nếu có)
}
```

### Trường Hợp 2: Đã Có Lot Trống

```typescript
// Cập nhật lot đầu tiên nếu quantity = 0
existingLot.quantityToReceive = quantity_from_AI;
existingLot.unitPrice = price_from_AI (nếu có);
```

### Trường Hợp 3: Đã Có Lot Có Số Lượng

```typescript
// Cộng thêm vào số lượng hiện tại
existingLot.quantityToReceive += quantity_from_AI;
```

## Kết Quả Đối Chiếu

### Modal Hiển Thị

Sau khi đối chiếu, modal hiển thị bảng với các cột:

| Sản phẩm trong đơn      | Phát hiện từ AI   | Số lượng | Độ khớp |
| ----------------------- | ----------------- | -------- | ------- |
| Dầu gội Clear Men 650ml | Dầu gội Clear Men | 10       | 92% ✅  |
| Sữa tắm Dove 200ml      | Dove Body Wash    | 15       | 78% 🔵  |
| Nước ngọt Coca 330ml    | Coca Cola         | 24       | 68% 🟠  |

### Màu Sắc Badge

- **Xanh lá (≥90%)**: Khớp rất tốt, có thể tin tưởng 100%
- **Xanh dương (70-89%)**: Khớp tốt, nên kiểm tra lại
- **Cam (60-69%)**: Khớp chấp nhận, cần xác nhận cẩn thận

## Ví Dụ Thực Tế

### Ví Dụ 1: Nhập Hàng từ PDF

1. **Upload PDF**: Chọn file "DonHang_NCC_ABC_20250126.pdf"

2. **AI Phân Tích**:

   ```
   Nhà cung cấp: Công ty ABC
   Số đơn: DH-2025-001
   Sản phẩm:
   - Dầu gội Clear Men 650ml: 50 chai
   - Sữa tắm Dove 200ml: 30 chai
   - Nước rửa chén Sunlight: 20 chai
   ```

3. **Matching**:
   - "Dầu gội Clear Men 650ml" (PO) ↔ "Dầu gội Clear Men 650ml" (AI) = 100% ✅
   - "Sữa tắm Dove" (PO) ↔ "Sữa tắm Dove 200ml" (AI) = 90% ✅
   - "Sunlight 500ml" (PO) ↔ "Nước rửa chén Sunlight" (AI) = 72% 🔵

4. **Kết quả**: Tự động điền:
   - Dầu gội Clear: 50 chai
   - Sữa tắm Dove: 30 chai
   - Sunlight: 20 chai

### Ví Dụ 2: Nhập Hàng từ Ảnh Chụp

1. **Chụp Ảnh**: Chụp ảnh thùng hàng với tem nhãn

2. **AI Phân Tích**:

   ```
   Phát hiện:
   - Clear Men (không rõ số lượng)
   - Dove Body Wash 15 pcs
   - Pantene Shampoo 25 bottles
   ```

3. **Matching**:
   - "Dầu gội Clear Men" ↔ "Clear Men" = 80% ✅
   - "Sữa tắm Dove" ↔ "Dove Body Wash" = 75% 🔵
   - "Dầu gội Pantene" ↔ "Pantene Shampoo" = 88% ✅

4. **Kết quả**:
   - Clear Men: 0 (không có số lượng) - cần điền thủ công
   - Dove: 15
   - Pantene: 25

## Lưu Ý Quan Trọng

### ✅ Nên

- Upload ảnh/PDF rõ nét, đầy đủ thông tin
- Kiểm tra lại kết quả matching trước khi xác nhận
- Điều chỉnh số lượng nếu thấy không chính xác
- Sử dụng cả ảnh và PDF để có kết quả tốt nhất

### ❌ Không Nên

- Tin tưởng 100% vào AI mà không kiểm tra
- Upload ảnh mờ, tối, bị che khuất
- Bỏ qua các match có độ khớp thấp (<70%)
- Quên điền số lô và hạn sử dụng sau khi áp dụng AI

## Xử Lý Lỗi

### Lỗi: "Không tìm thấy khớp"

**Nguyên nhân**:

- Tên sản phẩm trong AI và PO quá khác biệt
- Ngưỡng matching (60%) quá cao

**Giải pháp**:

- Kiểm tra lại kết quả phân tích AI
- Điền thủ công nếu cần
- Cải thiện chất lượng ảnh/PDF

### Lỗi: "Không có sản phẩm"

**Nguyên nhân**:

- AI không phát hiện được sản phẩm nào trong ảnh/PDF
- File bị lỗi hoặc không đọc được

**Giải pháp**:

- Upload lại file rõ hơn
- Thử với file khác
- Kiểm tra kết quả phân tích AI

### Lỗi: Match Sai Sản Phẩm

**Nguyên nhân**:

- Tên sản phẩm tương tự nhau (VD: Coca 330ml vs Coca 500ml)
- Thuật toán matching không đủ thông minh

**Giải pháp**:

- Kiểm tra bảng matching trước khi áp dụng
- Điều chỉnh thủ công sau khi áp dụng
- Cung cấp feedback để cải thiện thuật toán

## Cải Tiến Trong Tương Lai

### Đang Phát Triển

- [ ] Matching dựa trên mã SKU/barcode
- [ ] Machine Learning để cải thiện độ chính xác
- [ ] Hỗ trợ nhiều ngôn ngữ (English, Chinese)
- [ ] Tự động điền số lô từ ảnh
- [ ] Tự động điền hạn sử dụng từ PDF

### Đề Xuất

- Cho phép user điều chỉnh ngưỡng matching
- Lưu lịch sử matching để học tập
- Hỗ trợ manual correction và feedback
- Export kết quả matching để review

## Câu Hỏi Thường Gặp (FAQ)

**Q: Tại sao một số sản phẩm không được điền tự động?**
A: Có thể do:

- Độ khớp < 60%
- AI không phát hiện được số lượng
- Tên sản phẩm quá khác biệt

**Q: Tôi có thể điều chỉnh ngưỡng matching không?**
A: Hiện tại ngưỡng mặc định là 60%. Để thay đổi, liên hệ dev team để cập nhật code.

**Q: Có giới hạn số lượng file không?**
A: Không giới hạn số file, nhưng mỗi file PDF phải < 20MB.

**Q: Kết quả matching có được lưu lại không?**
A: Hiện tại chưa lưu. Sau khi áp dụng, dữ liệu được merge vào receiving data.

**Q: Tôi có thể undo sau khi áp dụng AI không?**
A: Hiện tại chưa có chức năng undo. Hãy kiểm tra kỹ trước khi áp dụng.

## Technical Details (Dành cho Developers)

### Function: `calculateSimilarity()`

- **Input**: 2 strings
- **Output**: Similarity score (0.0 - 1.0)
- **Algorithm**: Levenshtein Distance + Special rules

### Function: `matchAndFillFromAnalysis()`

- **Input**: None (uses component state)
- **Process**:
  1. Collect all products from AI results
  2. Match with PO items using similarity
  3. Filter by threshold (60%)
  4. Remove duplicates (keep best match)
  5. Apply to receivingData
- **Output**: Updated receivingData state + Modal display

### State Management

```typescript
imageAnalysisResults: Array<{
  fileName: string;
  products?: Array<{ name; quantity }>;
}>;

pdfAnalysisResults: Array<{
  fileName: string;
  products?: Array<{ name; quantity; unitPrice; sku }>;
}>;

receivingData: Record<productId, LotData[]>;
```

## Support

Nếu gặp vấn đề hoặc có câu hỏi, vui lòng:

- Kiểm tra console log để xem chi tiết lỗi
- Chụp screenshot kết quả matching
- Liên hệ dev team với thông tin chi tiết

---

**Phiên bản**: 1.0
**Cập nhật**: 2025-01-26
**Tác giả**: Nam Việt ERP Development Team
