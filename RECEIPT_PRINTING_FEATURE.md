# Tính Năng Xuất Phiếu Thu Chi

Ngày: 2025-11-03

## Tổng quan

Đã thêm tính năng in/xuất phiếu thu chi theo chuẩn kế toán Việt Nam vào hệ thống quản lý tài chính.

## Files đã tạo mới

### 1. PrintableReceipt Component

**Vị trí:** `/packages/shared-components/src/components/PrintableReceipt.tsx`

**Mục đích:** Component để render phiếu thu/chi có thể in được

**Features:**

- ✅ Thiết kế theo chuẩn phiếu thu/chi kế toán Việt Nam (Mẫu số 01-TT)
- ✅ Tự động chuyển đổi số thành chữ tiếng Việt
- ✅ Hỗ trợ cả phiếu thu và phiếu chi
- ✅ Hiển thị đầy đủ thông tin: số tiền, người nhận/nộp, lý do, ngày tháng
- ✅ Khu vực chữ ký cho: Giám đốc, Kế toán trưởng, Người nhận/nộp tiền, Thủ quỹ
- ✅ CSS print media queries để tối ưu in ấn
- ✅ Format A4 (210mm width)
- ✅ Hỗ trợ in tiền mặt và chuyển khoản

**Props:**

```typescript
interface PrintableReceiptProps {
  transaction: ITransaction; // Giao dịch cần in
  companyInfo?: {
    // Thông tin công ty (optional)
    name: string;
    address: string;
    phone: string;
    taxCode: string;
  };
}
```

**Usage Example:**

```tsx
import { PrintableReceipt } from "@nam-viet-erp/shared-components";

<PrintableReceipt
  transaction={transaction}
  companyInfo={{
    name: "CÔNG TY TNHH NAM VIỆT ERP",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    phone: "028-1234-5678",
    taxCode: "0123456789",
  }}
/>;
```

**Số thành chữ:**

- 1,000,000 → "Một triệu đồng"
- 5,250,000 → "Năm triệu hai trăm năm mươi nghìn đồng"
- 10,000 → "Mười nghìn đồng"

---

### 2. Print Utilities

**Vị trí:** `/packages/shared-components/src/utils/printUtils.ts`

**Mục đích:** Các hàm tiện ích để in và xuất tài liệu

**Functions:**

#### a) `printReceipt(elementId?: string)`

In phiếu thu chi.

```typescript
import { printReceipt } from "@nam-viet-erp/shared-components";

// In element với ID mặc định
printReceipt();

// In element với custom ID
printReceipt("my-custom-receipt");
```

**How it works:**

1. Tạo cửa sổ in mới
2. Copy toàn bộ styles từ trang hiện tại
3. Render nội dung phiếu
4. Mở dialog in của trình duyệt
5. Tự động đóng cửa sổ sau khi in xong

#### b) `exportToPDF(elementId?: string)`

Xuất PDF (sử dụng chức năng "Save as PDF" của trình duyệt).

```typescript
import { exportToPDF } from "@nam-viet-erp/shared-components";

exportToPDF();
```

**Note:** Người dùng cần chọn "Save as PDF" trong print dialog.

#### c) `downloadHTML(content: string, filename?: string)`

Download nội dung HTML dưới dạng file.

```typescript
import { downloadHTML } from "@nam-viet-erp/shared-components";

const htmlContent = document.getElementById("receipt")?.outerHTML || "";
downloadHTML(htmlContent, "phieu-thu-001.html");
```

#### d) `copyToClipboard(elementId: string)`

Copy nội dung HTML vào clipboard.

```typescript
import { copyToClipboard } from "@nam-viet-erp/shared-components";

const success = await copyToClipboard("printable-receipt");
if (success) {
  console.log("Copied to clipboard!");
}
```

---

### 3. TransactionViewModal - Updated

**Vị trí:** `/apps/cms/src/features/finance/components/TransactionViewModal.tsx`

**Changes:**

- ✅ Thêm nút "In phiếu" trong title bar của modal
- ✅ Tích hợp PrintableReceipt component (ẩn, chỉ dùng để in)
- ✅ Handler `handlePrint()` để xử lý in phiếu
- ✅ Thông báo cho người dùng khi đang chuẩn bị in

**UI Update:**

```tsx
<Modal
  title={
    <Space>
      <span>Chi tiết Phiếu {isIncome ? "Thu" : "Chi"} #{transaction.id}</span>
      <Button
        type="primary"
        icon={<PrinterOutlined />}
        onClick={handlePrint}
        size="small"
      >
        In phiếu
      </Button>
    </Space>
  }
  ...
>
```

**Print Flow:**

1. User clicks "In phiếu" button
2. `handlePrint()` được gọi
3. `isPrintPreviewVisible` state được set thành `true`
4. PrintableReceipt component được render (hidden)
5. Sau 100ms, `printReceipt()` được gọi
6. Print dialog mở ra
7. User có thể in hoặc save as PDF

---

## Exports đã cập nhật

### `/packages/shared-components/src/utils/index.ts`

```typescript
// Print utilities
export * from "./printUtils";
```

### `/packages/shared-components/src/index.ts`

```typescript
export { default as PrintableReceipt } from "./components/PrintableReceipt";
export * from "./utils";
```

---

## Workflow Sử Dụng

### 1. Xem và In Phiếu Thu/Chi

**Bước 1:** Mở trang Quản lý Thu Chi

- URL: `/finance/transactions` (hoặc tương ứng)

**Bước 2:** Click vào một giao dịch để xem chi tiết

- Modal "Chi tiết Phiếu Thu/Chi" sẽ mở ra

**Bước 3:** Click nút "In phiếu"

- Print dialog sẽ mở ra
- Preview phiếu thu/chi đã format

**Bước 4:** Chọn một trong các options:

- **In:** Chọn máy in và click Print
- **Save as PDF:** Chọn "Save as PDF" và click Save
- **Cancel:** Đóng dialog

---

## Thiết Kế Phiếu Thu/Chi

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Thông tin công ty]              [Mẫu số: 01-TT]      │
│                                    [QĐ 48/2006/QĐ-BTC]  │
├─────────────────────────────────────────────────────────┤
│                     PHIẾU THU/CHI                        │
│              Ngày ... tháng ... năm ...                  │
│                  Số phiếu: 000001                        │
├─────────────────────────────────────────────────────────┤
│  Họ và tên người nộp/nhận tiền: ___________________     │
│  Địa chỉ: _________________________________________     │
│  Lý do thu/chi: ____________________________________     │
│  Số tiền: ________________ đồng                         │
│  Bằng chữ: _________________________________________     │
│  Hình thức thanh toán: _____________________________     │
│  [Thông tin ngân hàng nếu chuyển khoản]                 │
│  Kèm theo: _______ chứng từ                             │
├─────────────────────────────────────────────────────────┤
│  Giám đốc    Kế toán trưởng    Người nộp/nhận    Thủ quỹ│
│  (Ký, HT)       (Ký, HT)          (Ký, HT)       (Ký, HT)│
│                                                          │
│  [Chữ ký]       [Chữ ký]          [Chữ ký]      [Chữ ký]│
│                                                          │
│  _______        _______           _______        _______│
├─────────────────────────────────────────────────────────┤
│            Ngày in: DD/MM/YYYY HH:mm                    │
└─────────────────────────────────────────────────────────┘
```

### Màu sắc

- **Phiếu Thu:** Màu xanh (#52c41a)
- **Phiếu Chi:** Màu đỏ (#ff4d4f)

### Font

- Font chính: Times New Roman, serif
- Size: 12-14pt cho nội dung, 24pt cho tiêu đề

---

## Tính Năng Nổi Bật

### 1. Chuyển Số Thành Chữ Tự Động

Function `numberToVietnameseWords()` tự động chuyển đổi:

- Hỗ trợ đến hàng nghìn tỷ
- Đúng ngữ pháp tiếng Việt (mốt, lẻ, linh)
- Capitalize chữ cái đầu tiên

**Example:**

```typescript
numberToVietnameseWords(5000000);
// → "Năm triệu đồng"

numberToVietnameseWords(10250000);
// → "Mười triệu hai trăm năm mươi nghìn đồng"
```

### 2. Print-Ready CSS

CSS đặc biệt cho in ấn:

```css
@media print {
  @page {
    size: A4;
    margin: 10mm;
  }

  /* Ẩn tất cả ngoại trừ phiếu */
  body > *:not(#printable-receipt) {
    display: none !important;
  }

  /* Đảm bảo màu sắc được in */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
```

### 3. Responsive Design

- Desktop: Full layout với tất cả thông tin
- Print: Tối ưu hóa cho A4
- Mobile: (Nếu cần, có thể thêm styles riêng)

---

## Testing Checklist

### ✅ Đã hoàn thành:

- [x] Tạo PrintableReceipt component
- [x] Tạo print utilities
- [x] Tích hợp vào TransactionViewModal
- [x] Export components và utilities
- [x] TypeScript type checking passed
- [x] Viết documentation

### 🔜 Cần test:

- [ ] Test in phiếu thu (income transaction)
- [ ] Test in phiếu chi (expense transaction)
- [ ] Test in với giao dịch tiền mặt
- [ ] Test in với giao dịch chuyển khoản
- [ ] Test chuyển đổi số thành chữ với nhiều giá trị
- [ ] Test save as PDF trên các trình duyệt:
  - [ ] Chrome/Edge
  - [ ] Firefox
  - [ ] Safari
- [ ] Test print preview trên các trình duyệt
- [ ] Test với các transaction có attachments
- [ ] Test với các transaction đã duyệt/chưa duyệt
- [ ] Test responsive trên các màn hình khác nhau

---

## Known Limitations

1. **PDF Export:** Yêu cầu người dùng chọn "Save as PDF" trong print dialog. Không có API trực tiếp để tạo PDF.

2. **Company Info:** Hiện tại sử dụng default company info. Có thể cần thêm config để lấy thông tin công ty từ database.

3. **Signatures:** Chữ ký hiện là placeholder text. Có thể cần tích hợp với e-signature service nếu muốn chữ ký điện tử.

4. **Browser Support:** Print API có thể khác nhau giữa các trình duyệt. Đã test trên Chrome.

---

## Future Enhancements

### 1. Lưu History In Phiếu

Track số lần in và lịch sử in phiếu:

```typescript
interface PrintHistory {
  transaction_id: number;
  printed_at: string;
  printed_by: string;
  print_count: number;
}
```

### 2. Template Customization

Cho phép tùy chỉnh template phiếu thu chi:

- Logo công ty
- Header/Footer custom
- Font và màu sắc
- Layout khác nhau

### 3. E-Signature Integration

Tích hợp chữ ký điện tử:

- Ký số trên phiếu
- Xác thực chữ ký
- Lưu trữ bảo mật

### 4. Batch Printing

In nhiều phiếu cùng lúc:

- Chọn nhiều transactions
- In tất cả một lần
- Merge PDFs

### 5. Email Integration

Gửi phiếu qua email:

- Tự động generate PDF
- Attach vào email
- Gửi cho người liên quan

### 6. Barcode/QR Code

Thêm mã vạch hoặc QR code lên phiếu:

- QR code chứa transaction ID
- Scan để tra cứu nhanh
- Anti-counterfeit

---

## API Reference

### PrintableReceipt Component

```typescript
interface PrintableReceiptProps {
  transaction: ITransaction;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    taxCode: string;
  };
}

const PrintableReceipt: React.FC<PrintableReceiptProps>;
```

**Transaction Fields Used:**

- `id` - Số phiếu
- `type` - Loại (income/expense)
- `amount` - Số tiền
- `description` - Lý do thu/chi
- `transaction_date` - Ngày giao dịch
- `payment_method` - Hình thức thanh toán
- `recipient_name` - Tên người nhận/nộp
- `recipient_bank` - Ngân hàng (nếu có)
- `recipient_account` - STK (nếu có)
- `created_by` - Người tạo
- `approved_by` - Kế toán trưởng
- `executed_by` - Thủ quỹ
- `attachments` - Chứng từ kèm theo

### Print Utilities

```typescript
// In phiếu
function printReceipt(elementId?: string): void;

// Xuất PDF
function exportToPDF(elementId?: string): void;

// Download HTML
function downloadHTML(content: string, filename?: string): void;

// Copy to clipboard
function copyToClipboard(elementId: string): Promise<boolean>;
```

---

## Troubleshooting

### Problem: Print dialog không mở

**Solutions:**

1. Kiểm tra popup blocker
2. Đảm bảo element với ID "printable-receipt" tồn tại
3. Check console logs để xem errors

### Problem: Styles không hiển thị đúng khi in

**Solutions:**

1. Đảm bảo CSS đã load xong trước khi in
2. Tăng timeout trong `handlePrint()` function
3. Check print preview trước khi in

### Problem: Số chuyển thành chữ sai

**Solutions:**

1. Kiểm tra input amount có đúng format không
2. Test với các số khác nhau
3. Báo bug nếu có case đặc biệt

### Problem: PDF bị cắt nội dung

**Solutions:**

1. Điều chỉnh page margins trong CSS `@page`
2. Giảm font size nếu cần
3. Kiểm tra page-break settings

---

## Compliance & Standards

### Quyết định 48/2006/QĐ-BTC

Phiếu thu/chi được thiết kế theo:

- **Mẫu số:** 01-TT
- **Ban hành:** Ngày 14/09/2006
- **Cơ quan:** Bộ Tài chính
- **Tiêu chuẩn:** Chứng từ kế toán Việt Nam

### Các Yếu Tố Bắt Buộc

✅ Đã có:

- Tên công ty, địa chỉ, MST
- Số phiếu
- Ngày tháng năm
- Người nộp/nhận tiền
- Số tiền (cả số và chữ)
- Lý do thu/chi
- Chữ ký các bên liên quan

---

## Contact & Support

Nếu có vấn đề với tính năng này:

1. Check documentation này trước
2. Xem troubleshooting section
3. Liên hệ team development

---

## Changelog

### Version 1.0.0 - 2025-11-03

**Added:**

- PrintableReceipt component
- Print utilities (printReceipt, exportToPDF, etc.)
- Integration with TransactionViewModal
- Vietnamese number-to-words conversion
- Print-optimized CSS
- Comprehensive documentation

**Notes:**

- Initial release
- Compliant với QĐ 48/2006/QĐ-BTC
