# Hướng dẫn Chọn/Chụp Ảnh trong PurchaseOrderReceivingDetailPage

## Tổng quan

Đã thêm chức năng chọn ảnh và chụp ảnh vào màn hình **Xác Nhận Nhận Hàng** (PurchaseOrderReceivingDetailPage).

## Tính năng đã thêm

### 1. **Button "Chọn Ảnh"**

- Cho phép chọn nhiều ảnh từ thiết bị
- Hiển thị số lượng ảnh đã chọn
- Hỗ trợ nhiều định dạng ảnh (jpg, png, gif, etc.)

### 2. **Button "Chụp Ảnh"**

- Mở camera trên thiết bị di động
- Cho phép chụp ảnh trực tiếp
- Sử dụng camera sau (environment) mặc định

### 3. **Preview Ảnh**

- Hiển thị thumbnail các ảnh đã chọn
- Cho phép xóa từng ảnh
- Hiển thị tên file

### 4. **Xem Thông tin Ảnh**

- Button để log thông tin ảnh vào console
- Hiển thị tên file, kích thước, loại file, ngày sửa đổi

## Cách sử dụng

### Trong Component

```typescript
// State để lưu ảnh
const [selectedImages, setSelectedImages] = useState<File[]>([]);
const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

// Lấy thông tin ảnh
const getImageInfo = () => {
  return selectedImages.map((file, index) => ({
    file: file,
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    previewUrl: imagePreviewUrls[index],
  }));
};

// Log thông tin ảnh
const images = logImagePaths();
```

## Upload Ảnh lên Supabase Storage

### Bước 1: Tạo bucket trong Supabase

```sql
-- Tạo bucket cho purchase order images
INSERT INTO storage.buckets (id, name, public)
VALUES ('purchase-orders', 'purchase-orders', true);

-- Thiết lập policy
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'purchase-orders');

CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'purchase-orders');
```

### Bước 2: Tạo Service Upload

Tạo file `packages/services/src/supabase/storageService.ts`:

```typescript
import { supabase } from "./supabase";

export interface UploadImageResult {
  success: boolean;
  publicUrl?: string;
  path?: string;
  error?: string;
}

/**
 * Upload ảnh lên Supabase Storage
 */
export const uploadPurchaseOrderImage = async (
  poId: number,
  file: File,
): Promise<UploadImageResult> => {
  try {
    // Tạo tên file unique
    const fileExt = file.name.split(".").pop();
    const fileName = `${poId}/${Date.now()}.${fileExt}`;
    const filePath = `purchase-orders/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from("purchase-orders")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return { success: false, error: error.message };
    }

    // Lấy public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("purchase-orders").getPublicUrl(filePath);

    return {
      success: true,
      publicUrl,
      path: filePath,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
};

/**
 * Upload nhiều ảnh
 */
export const uploadMultiplePurchaseOrderImages = async (
  poId: number,
  files: File[],
): Promise<UploadImageResult[]> => {
  const uploadPromises = files.map((file) =>
    uploadPurchaseOrderImage(poId, file),
  );
  return await Promise.all(uploadPromises);
};

/**
 * Xóa ảnh từ Storage
 */
export const deletePurchaseOrderImage = async (
  path: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from("purchase-orders")
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
```

### Bước 3: Tích hợp vào Component

Update `PurchaseOrderReceivingDetailPage.tsx`:

```typescript
import { uploadMultiplePurchaseOrderImages } from "@nam-viet-erp/services";

// Trong hàm confirmReceiving, thêm upload ảnh
const confirmReceiving = async () => {
  try {
    setConfirming(true);

    // ... existing receiving logic ...

    // Upload ảnh nếu có
    if (selectedImages.length > 0) {
      notification.info({
        message: "Đang upload ảnh...",
        description: `Đang upload ${selectedImages.length} ảnh`,
      });

      const uploadResults = await uploadMultiplePurchaseOrderImages(
        selectedPO.id,
        selectedImages,
      );

      const successCount = uploadResults.filter((r) => r.success).length;
      const failCount = uploadResults.length - successCount;

      if (failCount > 0) {
        notification.warning({
          message: "Upload ảnh một phần",
          description: `Đã upload ${successCount}/${uploadResults.length} ảnh`,
        });
      } else {
        notification.success({
          message: "Upload ảnh thành công",
          description: `Đã upload ${successCount} ảnh`,
        });
      }

      // Lưu URLs vào database nếu cần
      const imageUrls = uploadResults
        .filter((r) => r.success)
        .map((r) => r.publicUrl);

      console.log("Uploaded image URLs:", imageUrls);
      // TODO: Save imageUrls to purchase_order_images table
    }

    // ... rest of logic ...
  } catch (error) {
    // ... error handling ...
  } finally {
    setConfirming(false);
  }
};
```

## Lưu URL ảnh vào Database

### Tạo bảng purchase_order_images

```sql
CREATE TABLE purchase_order_images (
  id BIGSERIAL PRIMARY KEY,
  po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_po_images_po_id ON purchase_order_images(po_id);

COMMENT ON TABLE purchase_order_images IS 'Ảnh đính kèm cho đơn đặt hàng';
```

### Service để lưu image records

```typescript
// packages/services/src/supabase/purchaseOrderImageService.ts
import { supabase } from "./supabase";

export interface PurchaseOrderImage {
  id?: number;
  po_id: number;
  image_url: string;
  image_path: string;
  file_name?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at?: string;
}

export const savePurchaseOrderImages = async (
  poId: number,
  images: Array<{
    url: string;
    path: string;
    fileName: string;
    fileSize: number;
  }>,
  uploadedBy?: string,
) => {
  const records = images.map((img) => ({
    po_id: poId,
    image_url: img.url,
    image_path: img.path,
    file_name: img.fileName,
    file_size: img.fileSize,
    uploaded_by: uploadedBy,
  }));

  const { data, error } = await supabase
    .from("purchase_order_images")
    .insert(records)
    .select();

  return { data, error };
};

export const getPurchaseOrderImages = async (poId: number) => {
  const { data, error } = await supabase
    .from("purchase_order_images")
    .select("*")
    .eq("po_id", poId)
    .order("created_at", { ascending: false });

  return { data, error };
};
```

## Thông tin File được trả về

Khi gọi `getImageInfo()`, bạn sẽ nhận được array chứa:

```typescript
[
  {
    file: File, // File object gốc
    name: "IMG_001.jpg", // Tên file
    size: 524288, // Kích thước (bytes)
    type: "image/jpeg", // MIME type
    lastModified: 1698345600000, // Timestamp
    previewUrl: "blob:http://...", // URL để preview
  },
  // ...
];
```

## Sử dụng với FormData (Alternative)

Nếu upload qua API thay vì Supabase Storage:

```typescript
const uploadImagesToAPI = async (poId: number, files: File[]) => {
  const formData = new FormData();
  formData.append("po_id", poId.toString());

  files.forEach((file, index) => {
    formData.append(`images[${index}]`, file);
  });

  const response = await fetch("/api/upload-po-images", {
    method: "POST",
    body: formData,
  });

  return await response.json();
};
```

## Ghi chú

1. **Memory Management**: Preview URLs được tự động cleanup khi component unmount
2. **Mobile Camera**: Button "Chụp Ảnh" sẽ tự động mở camera trên mobile
3. **File Size**: Nên thêm validation cho kích thước file (ví dụ: max 5MB)
4. **Image Compression**: Có thể cân nhắc compress ảnh trước khi upload
5. **Security**: Đảm bảo validate file type và size trên server

## Ví dụ đầy đủ

Xem file: `packages/shared-components/src/screens/warehouse/PurchaseOrderReceivingDetailPage.tsx`

Các function quan trọng:

- `handleImageSelect()` - Xử lý khi chọn ảnh
- `handleRemoveImage()` - Xóa ảnh
- `getImageInfo()` - Lấy thông tin ảnh
- `logImagePaths()` - Log chi tiết vào console
