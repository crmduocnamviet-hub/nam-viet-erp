# Giải thích về Absolute Path và Cách Upload Ảnh

## ⚠️ Vấn đề với Absolute Path

### Tại sao không lấy được Absolute Path?

**Browser không cho phép truy cập absolute path của file vì lý do bảo mật:**

1. **Bảo mật người dùng**: Nếu website có thể đọc absolute path, nó có thể biết cấu trúc thư mục của người dùng
2. **Ngăn chặn malware**: Tránh việc website đọc thông tin nhạy cảm từ đường dẫn
3. **Cross-platform**: Absolute path khác nhau giữa Windows, Mac, Linux

### Ví dụ:

```
❌ KHÔNG THỂ LẤY:
- Windows: C:\Users\Username\Pictures\IMG_001.jpg
- Mac: /Users/username/Pictures/IMG_001.jpg
- Linux: /home/username/Pictures/IMG_001.jpg

✅ CÓ THỂ LẤY:
- File object (chứa toàn bộ file data)
- File name: IMG_001.jpg
- File size: 524288 bytes
- File type: image/jpeg
- webkitRelativePath (nếu chọn folder)
```

## ✅ Giải pháp: 3 Cách Upload Ảnh

### 1. **FormData (Recommended)** ⭐

Upload file trực tiếp mà không cần absolute path:

```typescript
// Lấy File objects
const images = selectedImages; // Array<File>

// Tạo FormData
const formData = new FormData();
formData.append("po_id", "123");

images.forEach((file) => {
  formData.append("images", file);
});

// Upload
const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});
```

**Backend (Node.js + Express + Multer):**

```javascript
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

app.post("/api/upload", upload.array("images"), (req, res) => {
  // req.files chứa tất cả files
  const uploadedFiles = req.files.map((file) => ({
    filename: file.filename,
    originalName: file.originalname,
    path: file.path, // ← Absolute path trên server
    size: file.size,
  }));

  res.json({ success: true, files: uploadedFiles });
});
```

### 2. **Supabase Storage** ⭐

Upload trực tiếp lên Supabase Storage:

```typescript
import { supabase } from "@nam-viet-erp/services";

const uploadToSupabase = async (file: File, poId: number) => {
  // Tạo tên file unique
  const fileExt = file.name.split(".").pop();
  const fileName = `${poId}/${Date.now()}.${fileExt}`;

  // Upload
  const { data, error } = await supabase.storage
    .from("purchase-orders")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  // Lấy public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("purchase-orders").getPublicUrl(fileName);

  return {
    path: fileName, // ← Path trong storage
    publicUrl, // ← URL public để truy cập
  };
};

// Sử dụng
const file = selectedImages[0];
const result = await uploadToSupabase(file, 123);
console.log("Uploaded to:", result.publicUrl);
```

### 3. **Base64 Encoding**

Convert file sang Base64 để gửi qua JSON:

```typescript
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Sử dụng
const base64 = await fileToBase64(selectedImages[0]);
console.log(base64);
// Output: data:image/jpeg;base64,/9j/4AAQSkZJRg...

// Gửi lên server
await fetch("/api/upload-base64", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    image: base64,
    filename: "IMG_001.jpg",
  }),
});
```

**Backend xử lý Base64:**

```javascript
app.post("/api/upload-base64", async (req, res) => {
  const { image, filename } = req.body;

  // Decode base64
  const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  // Lưu file
  const filepath = path.join(__dirname, "uploads", filename);
  await fs.promises.writeFile(filepath, buffer);

  res.json({ success: true, path: filepath });
});
```

## 📱 Mobile: Lấy được "Path" không?

Trên **React Native** hoặc **Electron**, bạn CÓ THỂ lấy absolute path:

### React Native:

```javascript
import { launchImageLibrary } from "react-native-image-picker";

launchImageLibrary({}, (response) => {
  if (response.assets) {
    const file = response.assets[0];
    console.log("URI:", file.uri); // ← Có path!
    // iOS: file:///Users/.../IMG_001.jpg
    // Android: content://media/external/...
  }
});
```

### Electron:

```javascript
const { dialog } = require("electron");

dialog.showOpenDialog({ properties: ["openFile"] }).then((result) => {
  console.log("File paths:", result.filePaths);
  // Output: ['C:\\Users\\...\\IMG_001.jpg']
});
```

## 🔍 Code trong PurchaseOrderReceivingDetailPage

### Functions có sẵn:

```typescript
// 1. Lấy thông tin file
const images = getImageInfo();
console.log(images[0].file); // File object
console.log(images[0].name); // IMG_001.jpg
console.log(images[0].size); // 524288

// 2. Chuẩn bị FormData
const formData = prepareFormDataForUpload();
// Có thể gửi trực tiếp qua fetch()

// 3. Convert sang Base64
const base64Images = await getImagesAsBase64();
console.log(base64Images[0].base64); // data:image/jpeg;base64,...

// 4. Upload (TODO: implement actual upload service)
await uploadImages();
```

### Sử dụng trong code:

```typescript
// Lấy File objects
const files = selectedImages;

// Upload từng file
for (const file of files) {
  console.log("Uploading:", file.name);

  // Method 1: Supabase
  const result = await uploadToSupabase(file, selectedPO.id);
  console.log("Uploaded URL:", result.publicUrl);

  // Method 2: API endpoint
  const formData = new FormData();
  formData.append("file", file);
  await fetch("/api/upload", { method: "POST", body: formData });
}
```

## 📊 So sánh các phương pháp

| Phương pháp  | Ưu điểm                      | Nhược điểm                   | Khi nào dùng        |
| ------------ | ---------------------------- | ---------------------------- | ------------------- |
| **FormData** | - Đơn giản<br>- Hiệu quả     | - Cần backend hỗ trợ         | Upload nhiều file   |
| **Supabase** | - Serverless<br>- Public URL | - Phụ thuộc Supabase         | Lưu trữ file public |
| **Base64**   | - Không cần multer<br>- JSON | - File lớn → slow<br>- 33% ↑ | File nhỏ, preview   |

## 🎯 Kết luận

**Browser KHÔNG THỂ lấy absolute path**, nhưng:

1. ✅ **Có File object** - Chứa toàn bộ dữ liệu file
2. ✅ **Có thể upload trực tiếp** - Qua FormData hoặc FileReader
3. ✅ **Server sẽ có absolute path** - Sau khi upload xong
4. ✅ **Mobile/Desktop app có thể lấy path** - React Native, Electron

**Khuyến nghị:**

- Dùng **FormData + Supabase Storage** cho web app
- Dùng **React Native Image Picker** cho mobile app nếu cần absolute path

## 📝 Next Steps

1. Tạo service upload trong `packages/services/src/supabase/storageService.ts`
2. Tạo bảng `purchase_order_images` để lưu URLs
3. Integrate vào flow nhận hàng
4. Test upload và hiển thị ảnh đã upload

Xem thêm: `IMAGE_UPLOAD_GUIDE.md`
