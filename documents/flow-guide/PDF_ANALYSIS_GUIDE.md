# Hướng Dẫn Sử Dụng PDF Analysis với Gemini AI

## Tổng Quan

Hệ thống cung cấp 3 hàm chính để phân tích file PDF sử dụng Gemini AI:

1. **`analyticPdfFromFile`** - Phân tích PDF tổng quát
2. **`analyticPurchaseOrderPdf`** - Phân tích đơn hàng PDF
3. **`analyticInvoicePdf`** - Phân tích hóa đơn PDF

## Import

```typescript
import {
  analyticPdfFromFile,
  analyticPurchaseOrderPdf,
  analyticInvoicePdf,
} from "@nam-viet-erp/services";
```

## 1. analyticPdfFromFile - Phân Tích PDF Tổng Quát

### Mô tả

Phân tích bất kỳ file PDF nào với prompt tùy chỉnh.

### Cú pháp

```typescript
const result = await analyticPdfFromFile(file: File, prompt?: string);
```

### Tham số

- `file` (File): File PDF từ browser (từ input file hoặc drag & drop)
- `prompt` (string, optional): Câu hỏi hoặc yêu cầu phân tích. Mặc định: "Analyze this PDF document and provide detailed information about its contents."

### Kết quả trả về

```typescript
{
  text: string; // Văn bản phân tích từ AI
  data: any; // Dữ liệu thô từ Gemini API
}
```

### Ví dụ

```typescript
const handlePdfSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (!files || files.length === 0) return;

  const pdfFile = files[0];

  try {
    const result = await analyticPdfFromFile(
      pdfFile,
      "Tóm tắt nội dung chính của tài liệu này",
    );

    console.log("Phân tích:", result.text);
    notification.success({
      message: "Phân tích hoàn tất",
      description: result.text.substring(0, 100) + "...",
    });
  } catch (error) {
    notification.error({
      message: "Lỗi phân tích",
      description: error.message,
    });
  }
};
```

## 2. analyticPurchaseOrderPdf - Phân Tích Đơn Hàng

### Mô tả

Phân tích PDF đơn hàng và tự động trích xuất thông tin có cấu trúc.

### Cú pháp

```typescript
const result = await analyticPurchaseOrderPdf(file: File);
```

### Kết quả trả về

```typescript
{
  text: string;              // Văn bản phân tích đầy đủ
  products?: Array<{         // Danh sách sản phẩm
    name: string;
    quantity?: number;
    unitPrice?: number;
    sku?: string;
  }>;
  supplier?: string;         // Tên nhà cung cấp
  orderNumber?: string;      // Số đơn hàng
  orderDate?: string;        // Ngày đặt hàng (YYYY-MM-DD)
  totalAmount?: number;      // Tổng giá trị đơn hàng
  data: any;                 // Dữ liệu thô
}
```

### Ví dụ

```typescript
const analyzePurchaseOrder = async (pdfFile: File) => {
  try {
    const result = await analyticPurchaseOrderPdf(pdfFile);

    console.log("Nhà cung cấp:", result.supplier);
    console.log("Số đơn hàng:", result.orderNumber);
    console.log("Ngày đặt:", result.orderDate);
    console.log("Tổng giá trị:", result.totalAmount);

    // Hiển thị sản phẩm
    if (result.products && result.products.length > 0) {
      result.products.forEach((product, index) => {
        console.log(`Sản phẩm ${index + 1}:`, {
          tên: product.name,
          số_lượng: product.quantity,
          đơn_giá: product.unitPrice,
          mã_SKU: product.sku,
        });
      });
    }

    // Tự động điền vào form
    form.setFieldsValue({
      supplier_id: result.supplier,
      po_number: result.orderNumber,
      order_date: result.orderDate ? dayjs(result.orderDate) : undefined,
    });

    return result;
  } catch (error) {
    console.error("Error analyzing purchase order:", error);
    throw error;
  }
};
```

## 3. analyticInvoicePdf - Phân Tích Hóa Đơn

### Mô tả

Phân tích hóa đơn PDF (VAT invoice) và trích xuất thông tin chi tiết.

### Cú pháp

```typescript
const result = await analyticInvoicePdf(file: File);
```

### Kết quả trả về

```typescript
{
  text: string;                    // Văn bản phân tích đầy đủ
  invoiceNumber?: string;          // Số hóa đơn
  invoiceDate?: string;            // Ngày hóa đơn (YYYY-MM-DD)
  supplier?: string;               // Nhà cung cấp/Người bán
  customer?: string;               // Khách hàng/Người mua
  items?: Array<{                  // Danh sách hàng hóa
    name: string;
    quantity?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  subtotal?: number;               // Tổng tiền trước thuế
  taxAmount?: number;              // Tiền thuế VAT
  totalAmount?: number;            // Tổng thanh toán
  data: any;                       // Dữ liệu thô
}
```

### Ví dụ

```typescript
const analyzeInvoice = async (pdfFile: File) => {
  try {
    const result = await analyticInvoicePdf(pdfFile);

    // Hiển thị thông tin hóa đơn
    Modal.info({
      title: `Hóa đơn: ${result.invoiceNumber}`,
      width: 600,
      content: (
        <div>
          <p><strong>Ngày:</strong> {result.invoiceDate}</p>
          <p><strong>Nhà cung cấp:</strong> {result.supplier}</p>
          <p><strong>Khách hàng:</strong> {result.customer}</p>
          <Divider />
          <p><strong>Tổng trước thuế:</strong> {formatCurrency(result.subtotal)}</p>
          <p><strong>Thuế VAT:</strong> {formatCurrency(result.taxAmount)}</p>
          <p><strong>Tổng thanh toán:</strong> {formatCurrency(result.totalAmount)}</p>

          {result.items && result.items.length > 0 && (
            <>
              <Divider />
              <p><strong>Danh sách hàng hóa:</strong></p>
              <ul>
                {result.items.map((item, index) => (
                  <li key={index}>
                    {item.name} - SL: {item.quantity} -
                    Đơn giá: {formatCurrency(item.unitPrice)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ),
    });

    return result;
  } catch (error) {
    console.error("Error analyzing invoice:", error);
    throw error;
  }
};
```

## UI Component Example - PDF Upload với Analysis

```typescript
import React, { useState } from "react";
import { Button, Card, Upload, Space, notification, Spin } from "antd";
import { FilePdfOutlined, UploadOutlined } from "@ant-design/icons";
import { analyticPurchaseOrderPdf } from "@nam-viet-erp/services";

const PdfAnalysisComponent: React.FC = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePdfUpload = async (file: File) => {
    setAnalyzing(true);

    try {
      const analysisResult = await analyticPurchaseOrderPdf(file);
      setResult(analysisResult);

      notification.success({
        message: "Phân tích thành công",
        description: `Đã phát hiện ${analysisResult.products?.length || 0} sản phẩm`,
      });
    } catch (error: any) {
      notification.error({
        message: "Lỗi phân tích PDF",
        description: error.message,
      });
    } finally {
      setAnalyzing(false);
    }

    // Prevent default upload
    return false;
  };

  return (
    <Card title="Phân Tích PDF Đơn Hàng">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Upload
          accept=".pdf"
          showUploadList={false}
          beforeUpload={handlePdfUpload}
        >
          <Button
            icon={<UploadOutlined />}
            loading={analyzing}
            size="large"
          >
            {analyzing ? "Đang phân tích..." : "Chọn PDF"}
          </Button>
        </Upload>

        {analyzing && (
          <div style={{ textAlign: "center", padding: 20 }}>
            <Spin size="large" />
            <p style={{ marginTop: 10 }}>Đang phân tích PDF với Gemini AI...</p>
          </div>
        )}

        {result && !analyzing && (
          <Card size="small" title="Kết quả phân tích">
            <p><strong>Nhà cung cấp:</strong> {result.supplier}</p>
            <p><strong>Số đơn hàng:</strong> {result.orderNumber}</p>
            <p><strong>Số sản phẩm:</strong> {result.products?.length || 0}</p>
            <p><strong>Tổng giá trị:</strong> {result.totalAmount?.toLocaleString()} VNĐ</p>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default PdfAnalysisComponent;
```

## File Input với PDF

```typescript
// HTML Input
<input
  type="file"
  accept=".pdf,application/pdf"
  onChange={handlePdfSelect}
  style={{ display: "none" }}
  id="pdf-upload-input"
/>
<label htmlFor="pdf-upload-input">
  <Button
    icon={<FilePdfOutlined />}
    onClick={() => document.getElementById("pdf-upload-input")?.click()}
  >
    Chọn PDF
  </Button>
</label>
```

## Lưu Ý Quan Trọng

### 1. File Size Limits

- Gemini API có giới hạn kích thước file (thường là 20MB cho inline data)
- Nên kiểm tra kích thước file trước khi upload

```typescript
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

if (file.size > MAX_FILE_SIZE) {
  notification.error({
    message: "File quá lớn",
    description: "Vui lòng chọn file PDF nhỏ hơn 20MB",
  });
  return;
}
```

### 2. Error Handling

Luôn wrap trong try-catch để xử lý lỗi:

```typescript
try {
  const result = await analyticPurchaseOrderPdf(file);
  // Process result
} catch (error: any) {
  console.error("PDF Analysis Error:", error);
  notification.error({
    message: "Không thể phân tích PDF",
    description: error.message || "Vui lòng thử lại",
  });
}
```

### 3. Loading States

Phân tích PDF có thể mất vài giây, nên hiển thị loading indicator:

```typescript
const [isAnalyzing, setIsAnalyzing] = useState(false);

// Show loading
setIsAnalyzing(true);
const result = await analyticPurchaseOrderPdf(file);
setIsAnalyzing(false);
```

### 4. MIME Type

Đảm bảo file có đúng MIME type:

```typescript
if (file.type !== "application/pdf") {
  notification.warning({
    message: "File không hợp lệ",
    description: "Vui lòng chọn file PDF",
  });
  return;
}
```

## Tips & Best Practices

1. **Validate trước khi phân tích**: Kiểm tra file type và size
2. **Cache results**: Lưu kết quả phân tích để tránh gọi API nhiều lần
3. **Progressive disclosure**: Hiển thị kết quả từng phần khi có
4. **Fallback**: Có phương án dự phòng nếu AI không parse được JSON
5. **User feedback**: Luôn thông báo progress cho user

## Tích Hợp Với Existing Features

### Tích hợp với Purchase Order Receiving

```typescript
// Trong PurchaseOrderReceivingDetailPage.tsx
const handlePdfAnalysis = async (file: File) => {
  const result = await analyticPurchaseOrderPdf(file);

  // Auto-fill receiving data based on PDF analysis
  if (result.products && selectedPO) {
    result.products.forEach((analyzedProduct) => {
      const poItem = selectedPO.items.find((item: any) =>
        item.product_name
          .toLowerCase()
          .includes(analyzedProduct.name.toLowerCase()),
      );

      if (poItem && analyzedProduct.quantity) {
        setReceivingData((prev) => ({
          ...prev,
          [poItem.product_id]: [
            {
              id: Date.now(),
              quantityToReceive: analyzedProduct.quantity,
              unitPrice: analyzedProduct.unitPrice,
            },
          ],
        }));
      }
    });
  }
};
```

## API Documentation

### Gemini Model

- Model: `gemini-2.0-flash-exp`
- Supports: PDF (application/pdf), Images (image/\*), Text
- Max file size: ~20MB for inline data

### Response Format

AI được yêu cầu trả về JSON format, nhưng có thể fallback về plain text nếu không parse được.

## Troubleshooting

### Lỗi thường gặp:

1. **"Failed to analyze PDF"**
   - Kiểm tra API key
   - Kiểm tra network connection
   - File có thể bị corrupt

2. **Không parse được JSON**
   - AI trả về plain text thay vì JSON
   - Vẫn có thể đọc được trong `result.text`

3. **File too large**
   - Giảm kích thước PDF
   - Nén PDF trước khi upload

4. **Kết quả không chính xác**
   - Cải thiện prompt
   - Thử với model khác
   - Check chất lượng PDF (scanned vs text-based)
