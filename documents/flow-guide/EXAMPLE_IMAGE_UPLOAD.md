# Ví dụ Upload Ảnh - Copy & Paste

## 🎯 Lấy thông tin ảnh trong PurchaseOrderReceivingDetailPage

### 1. Lấy File Objects và Thông tin

```typescript
// Trong component, bạn có sẵn:
// - selectedImages: File[] - Array chứa File objects
// - imagePreviewUrls: string[] - Array preview URLs

// Lấy thông tin ảnh đầu tiên
const firstImage = selectedImages[0];
console.log({
  name: firstImage.name, // "IMG_001.jpg"
  size: firstImage.size, // 524288 (bytes)
  type: firstImage.type, // "image/jpeg"
  lastModified: firstImage.lastModified, // 1698345600000
  file: firstImage, // ← File object đầy đủ để upload
});

// Lấy tất cả thông tin
const allImages = getImageInfo();
console.log("Total images:", allImages.length);
allImages.forEach((img) => {
  console.log("File:", img.file); // ← Dùng này để upload
  console.log("Name:", img.name);
  console.log("Size:", img.size, "bytes");
});
```

### 2. Upload với FormData (Recommended)

```typescript
// Sử dụng function có sẵn
const formData = prepareFormDataForUpload();

// Upload lên server
const uploadToServer = async () => {
  try {
    const response = await fetch("https://your-api.com/api/upload-images", {
      method: "POST",
      headers: {
        // Không cần set Content-Type, browser tự động set cho FormData
        Authorization: `Bearer ${yourToken}`,
      },
      body: formData,
    });

    const result = await response.json();
    console.log("Upload result:", result);

    if (result.success) {
      notification.success({
        message: "Upload thành công",
        description: `Đã upload ${result.files.length} ảnh`,
      });

      // Lưu URLs vào database
      const imageUrls = result.files.map((f) => f.url);
      console.log("Image URLs:", imageUrls);
    }
  } catch (error) {
    console.error("Upload error:", error);
  }
};
```

### 3. Upload lên Supabase Storage

```typescript
import { supabase } from "@nam-viet-erp/services";

// Upload một ảnh
const uploadSingleImage = async (file: File, poId: number) => {
  try {
    // Tạo path unique
    const timestamp = Date.now();
    const fileExt = file.name.split(".").pop();
    const filePath = `po-${poId}/${timestamp}.${fileExt}`;

    // Upload
    const { data, error } = await supabase.storage
      .from("purchase-orders") // Tên bucket
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Lấy public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("purchase-orders").getPublicUrl(filePath);

    console.log("Uploaded:", {
      fileName: file.name,
      storagePath: filePath,
      publicUrl: publicUrl,
    });

    return {
      success: true,
      path: filePath,
      url: publicUrl,
    };
  } catch (error: any) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Upload tất cả ảnh
const uploadAllImages = async () => {
  if (!selectedPO || selectedImages.length === 0) return;

  notification.info({
    message: "Đang upload...",
    description: `Đang upload ${selectedImages.length} ảnh`,
  });

  const results = [];

  for (const file of selectedImages) {
    const result = await uploadSingleImage(file, selectedPO.id);
    results.push(result);

    if (result.success) {
      console.log(`✅ Uploaded: ${file.name} → ${result.url}`);
    } else {
      console.log(`❌ Failed: ${file.name} → ${result.error}`);
    }
  }

  const successCount = results.filter((r) => r.success).length;

  notification.success({
    message: "Hoàn tất",
    description: `Đã upload ${successCount}/${selectedImages.length} ảnh`,
  });

  return results;
};
```

### 4. Convert sang Base64 (Alternative)

```typescript
// Sử dụng function có sẵn
const base64Images = await getImagesAsBase64();

// Gửi lên server
const uploadBase64 = async () => {
  try {
    const response = await fetch("https://your-api.com/api/upload-base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        po_id: selectedPO.id,
        images: base64Images,
      }),
    });

    const result = await response.json();
    console.log("Upload result:", result);
  } catch (error) {
    console.error("Upload error:", error);
  }
};
```

## 🔧 Code sử dụng thực tế

### Trong `confirmReceiving()` function:

```typescript
const confirmReceiving = async () => {
  setConfirming(true);

  try {
    // 1. Nhận hàng như bình thường
    const receivingItems = Object.entries(receivingData)
      .filter(([_, lots]) => lots.length > 0)
      .flatMap(([itemId, lots]) =>
        lots.map((lot) => ({
          itemId: parseInt(itemId),
          quantityToReceive: lot.quantityToReceive,
          lotNumber: lot.lotNumber,
          expirationDate: lot.expirationDate,
          shelfLocation: lot.shelfLocation,
        })),
      );

    const result = await receivePOItems(
      selectedPO.id,
      receivingItems,
      user?.id || null,
    );

    if (!result.success) {
      throw new Error("Không thể xác nhận nhận hàng");
    }

    // 2. Upload ảnh nếu có
    if (selectedImages.length > 0) {
      notification.info({
        message: "Đang upload ảnh...",
        description: `Đang xử lý ${selectedImages.length} ảnh`,
        key: "upload-images",
      });

      // Upload tất cả ảnh
      const uploadResults = [];
      for (const file of selectedImages) {
        const result = await uploadSingleImage(file, selectedPO.id);
        uploadResults.push(result);
      }

      const successCount = uploadResults.filter((r) => r.success).length;

      notification.success({
        message: "Upload ảnh hoàn tất",
        description: `Đã upload ${successCount}/${uploadResults.length} ảnh`,
        key: "upload-images",
      });

      // 3. Lưu URLs vào database
      const imageUrls = uploadResults
        .filter((r) => r.success)
        .map((r) => ({
          url: r.url,
          path: r.path,
        }));

      console.log("Uploaded images:", imageUrls);

      // TODO: Save to purchase_order_images table
      // await savePurchaseOrderImages(selectedPO.id, imageUrls, user?.id);
    }

    notification.success({
      message: "Thành công",
      description: "Đã xác nhận nhận hàng",
    });

    navigate("/warehouse/receiving");
  } catch (error: any) {
    notification.error({
      message: "Lỗi",
      description: error.message,
    });
  } finally {
    setConfirming(false);
  }
};
```

## 📝 Backend API Example

### Node.js + Express + Multer:

```javascript
const express = require("express");
const multer = require("multer");
const path = require("path");

const app = express();

// Cấu hình storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/purchase-orders/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép ảnh
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ chấp nhận file ảnh"));
    }
  },
});

// Endpoint upload nhiều ảnh
app.post("/api/upload-images", upload.array("images", 10), (req, res) => {
  try {
    const { po_id, metadata } = req.body;

    const uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path, // ← Absolute path trên server
      size: file.size,
      mimeType: file.mimetype,
      url: `${req.protocol}://${req.get("host")}/uploads/purchase-orders/${file.filename}`,
    }));

    console.log("Uploaded files:", uploadedFiles);

    res.json({
      success: true,
      po_id: po_id,
      files: uploadedFiles,
      metadata: metadata ? JSON.parse(metadata) : null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## 🎯 Tổng kết

**Trong browser web, bạn KHÔNG CÓ absolute path, nhưng:**

✅ **Bạn có `File` object** - Chứa đầy đủ dữ liệu file
✅ **Có thể upload trực tiếp** - Qua FormData hoặc Base64
✅ **Server sẽ lưu với absolute path** - Sau khi nhận được file

**Sử dụng:**

```typescript
// Lấy File objects
const files = selectedImages; // Array<File>

// Method 1: Upload qua FormData (recommended)
const formData = prepareFormDataForUpload();
await fetch("/api/upload", { method: "POST", body: formData });

// Method 2: Upload lên Supabase
for (const file of files) {
  await uploadSingleImage(file, poId);
}

// Method 3: Convert sang Base64
const base64Images = await getImagesAsBase64();
```

**Khi test:**

1. Click "Chọn Ảnh" hoặc "Chụp Ảnh"
2. Click "Xem thông tin trong Console"
3. Mở Console (F12) để xem File objects
4. Click "Upload Ảnh" để test upload function
