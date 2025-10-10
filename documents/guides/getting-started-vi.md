# Bắt Đầu với Nam Việt ERP

Hướng dẫn này sẽ giúp bạn thiết lập và bắt đầu phát triển với hệ thống Nam Việt ERP.

## 📋 Yêu Cầu

### Phần Mềm Bắt Buộc

- **Node.js**: v18 trở lên
- **Yarn**: v1.22 trở lên
- **Git**: Phiên bản mới nhất
- **Code Editor**: Khuyến nghị VS Code

### Extensions VS Code Khuyến Nghị

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens

## 🚀 Bắt Đầu Nhanh

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nam-viet-erp.git
cd nam-viet-erp
```

### 2. Cài Đặt Dependencies

```bash
# Cài đặt tất cả workspace dependencies
yarn install
```

Lệnh này sẽ cài đặt dependencies cho:

- Root workspace
- Cả hai apps (cms, sale)
- Tất cả packages (services, shared-components, store, types)

### 3. Thiết Lập Môi Trường

Tạo file `.env` trong cả hai thư mục app:

**apps/cms/.env**

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**apps/sale/.env**

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Khởi Động Development Servers

**Chạy CMS App**

```bash
yarn cms:dev
```

Mở [http://localhost:5173](http://localhost:5173)

**Chạy Sale App**

```bash
yarn sale:dev
```

Mở [http://localhost:5174](http://localhost:5174)

## 📁 Cấu Trúc Dự Án

```
nam-viet-erp/
├── apps/                    # Ứng dụng
│   ├── cms/                # App Quản Trị/Quản Lý
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── package.json
│   └── sale/               # App Bán Hàng (POS, B2B)
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   └── components/
│       └── package.json
│
├── packages/               # Shared Packages
│   ├── services/          # API & Business Logic
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── productService.ts
│   │   │   ├── inventoryService.ts
│   │   │   └── ...
│   │   └── query/         # SQL Queries
│   │
│   ├── shared-components/ # UI Components & Screens
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   └── providers/
│   │   └── package.json
│   │
│   ├── store/            # Quản Lý State
│   │   ├── src/
│   │   │   ├── posStore.ts
│   │   │   ├── entityStore.ts
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── types/            # TypeScript Types
│       └── index.d.ts
│
├── documents/            # Tài liệu (bạn đang ở đây!)
├── types/               # Global Types
└── package.json        # Root Workspace Config
```

## 🔧 Quy Trình Phát Triển

### Thêm Tính Năng Mới

1. **Xác Định Vị Trí**

   ```
   - UI Component? → packages/shared-components/src/components/
   - Screen/Page? → packages/shared-components/src/screens/
   - API Logic? → packages/services/src/
   - State? → packages/store/src/
   ```

2. **Tạo Files**

   ```bash
   # Ví dụ: Component mới
   touch packages/shared-components/src/components/MyComponent.tsx
   ```

3. **Export từ Index**

   ```typescript
   // packages/shared-components/src/index.ts
   export { default as MyComponent } from "./components/MyComponent";
   ```

4. **Sử Dụng trong Apps**
   ```typescript
   import { MyComponent } from "@nam-viet-erp/shared-components";
   ```

### Gọi API

1. **Tạo Service Function**

   ```typescript
   // packages/services/src/myService.ts
   import { supabase } from "./supabaseClient";

   export const getMyData = async () => {
     const { data, error } = await supabase.from("my_table").select("*");

     return { data, error };
   };
   ```

2. **Export từ Index**

   ```typescript
   // packages/services/src/index.ts
   export * from "./myService";
   ```

3. **Sử Dụng trong Components**

   ```typescript
   import { getMyData } from "@nam-viet-erp/services";

   const fetchData = async () => {
     const { data, error } = await getMyData();
     // Xử lý dữ liệu
   };
   ```

### Thêm Quản Lý State

1. **Tạo Store**

   ```typescript
   // packages/store/src/myStore.ts
   import { create } from "zustand";

   interface MyStore {
     data: any[];
     setData: (data: any[]) => void;
   }

   export const useMyStore = create<MyStore>((set) => ({
     data: [],
     setData: (data) => set({ data }),
   }));
   ```

2. **Export từ Index**

   ```typescript
   // packages/store/src/index.ts
   export * from "./myStore";
   ```

3. **Sử Dụng trong Components**

   ```typescript
   import { useMyStore } from "@nam-viet-erp/store";

   function MyComponent() {
     const { data, setData } = useMyStore();
     // Sử dụng data
   }
   ```

## 🛠️ Tác Vụ Thường Gặp

### Chạy Linting

```bash
# Lint tất cả code
yarn lint

# Lint app cụ thể
yarn cms:lint
yarn sale:lint
```

### Build cho Production

```bash
# Build CMS
yarn cms:build

# Build Sale
yarn sale:build

# Output tại:
# - apps/cms/dist/
# - apps/sale/dist/
```

### Thêm Dependencies

**Thêm vào workspace root** (cho tất cả packages):

```bash
yarn add lodash -W
```

**Thêm vào package cụ thể**:

```bash
yarn workspace @nam-viet-erp/services add axios
yarn workspace @nam-viet-erp/cms add some-package
```

**Thêm dev dependency**:

```bash
yarn add -D typescript -W
```

### Tạo Database Migration

1. **Viết SQL Query**

   ```sql
   -- packages/services/query/my-feature.txt
   CREATE TABLE my_table (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL
   );
   ```

2. **Chạy qua Supabase CLI hoặc Dashboard**

   ```bash
   supabase db push
   ```

3. **Cập Nhật TypeScript Types**
   ```typescript
   // types/index.d.ts
   interface IMyTable {
     id: number;
     name: string;
   }
   ```

## 📝 Ví Dụ Code

### Ví Dụ 1: Tạo Component Product Form

```typescript
// packages/shared-components/src/components/MyProductForm.tsx
import React from 'react';
import { Form, Input, Button, App } from 'antd';
import { createProduct } from '@nam-viet-erp/services';
import { useEntityStore } from '@nam-viet-erp/store';

interface MyProductFormProps {
  onSuccess?: () => void;
}

const MyProductForm: React.FC<MyProductFormProps> = ({ onSuccess }) => {
  const { notification } = App.useApp();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    const { data, error } = await createProduct(values);

    if (error) {
      notification.error({
        message: 'Lỗi',
        description: error.message
      });
      return;
    }

    // Cập nhật Entity Store
    if (data) {
      useEntityStore.getState().setProduct(data);
    }

    notification.success({ message: 'Sản phẩm đã được tạo!' });
    form.resetFields();
    onSuccess?.();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="name"
        label="Tên Sản Phẩm"
        rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Tạo Sản Phẩm
        </Button>
      </Form.Item>
    </Form>
  );
};

export default MyProductForm;
```

### Ví Dụ 2: Tạo Service

```typescript
// packages/services/src/myProductService.ts
import { supabase } from "./supabaseClient";

export const getProducts = async (filters?: {
  status?: string;
  category?: string;
}) => {
  let query = supabase.from("products").select("*");

  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  if (filters?.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query;
  return { data, error };
};

export const createProduct = async (productData: {
  name: string;
  price: number;
  category?: string;
}) => {
  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  return { data, error };
};
```

### Ví Dụ 3: Sử Dụng Entity Store

```typescript
// Component sử dụng Entity Store
import React, { useEffect } from 'react';
import { useEntityProduct, useEntityStore } from '@nam-viet-erp/store';
import { getProductById } from '@nam-viet-erp/services';

function ProductDetail({ productId }: { productId: number }) {
  // Đăng ký nhận sản phẩm
  const product = useEntityProduct(productId);

  // Fetch nếu chưa có trong store
  useEffect(() => {
    if (!product) {
      const fetch = async () => {
        const { data } = await getProductById(productId);
        if (data) {
          useEntityStore.getState().setProduct(data);
        }
      };
      fetch();
    }
  }, [productId, product]);

  if (!product) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Giá: {product.price}</p>
    </div>
  );
}
```

## 🐛 Xử Lý Sự Cố

### Lỗi: "Cannot find module '@nam-viet-erp/...'"

**Giải pháp**:

```bash
# Cài lại dependencies
yarn install

# Xóa cache
rm -rf node_modules
rm yarn.lock
yarn install
```

### Lỗi: Port đã được sử dụng

**Giải pháp**:

```bash
# Tìm process đang sử dụng port
lsof -ti:5173

# Kill process
kill -9 <PID>

# Hoặc sử dụng port khác
yarn cms:dev --port 5175
```

### Lỗi: Lỗi TypeScript sau khi thêm package mới

**Giải pháp**:

```bash
# Rebuild TypeScript
yarn workspace @nam-viet-erp/shared-components build
yarn workspace @nam-viet-erp/services build
```

### Lỗi: Lỗi kết nối Supabase

**Giải pháp**:

- Kiểm tra file `.env` có giá trị đúng
- Xác minh Supabase project đang chạy
- Kiểm tra kết nối mạng
- Xác minh Supabase URL và keys đúng

## 📚 Bước Tiếp Theo

1. **Đọc Tài Liệu Cốt Lõi**
   - [Quy Tắc Phát Triển](../development/rules-vi.md)
   - [Kiến Trúc Workspace](../architecture/workspace-architecture-vi.md)
   - [Quản Lý State](../architecture/state-management-vi.md)

2. **Khám Phá Tính Năng**
   - [Hệ Thống POS](../features/pos-system-vi.md)
   - [Quản Lý Lô Sản Phẩm](../features/product-lot-management-vi.md)
   - [Quản Lý Tồn Kho](../features/inventory-management.md)

3. **Học Chủ Đề Nâng Cao**
   - [Shared Screens](../architecture/shared-screens.md)
   - [Tổng Quan Services](../api/services-overview.md)
   - [Database Schema](../database/schema-overview.md)

4. **Thử Xây Dựng Gì Đó**
   - Bắt đầu với component đơn giản
   - Tạo service function mới
   - Thêm screen mới vào registry
   - Triển khai tính năng mới

## 🤝 Nhận Trợ Giúp

- **Tài liệu**: Kiểm tra thư mục `/documents`
- **Ví dụ Code**: Xem các components hiện có
- **Team**: Hỏi trong team chat hoặc tạo issue

## ✅ Checklist cho Developer Mới

- [ ] Đã cài đặt Node.js v18+
- [ ] Đã cài đặt Yarn
- [ ] Đã clone repository
- [ ] Đã chạy `yarn install`
- [ ] Đã tạo file `.env`
- [ ] Đã chạy CMS app thành công
- [ ] Đã chạy Sale app thành công
- [ ] Đã đọc [Quy Tắc Phát Triển](../development/rules-vi.md)
- [ ] Đã hiểu [Kiến Trúc Workspace](../architecture/workspace-architecture-vi.md)
- [ ] Đã khám phá các components hiện có
- [ ] Đã tạo component test đầu tiên

Chào mừng đến với Nam Việt ERP! 🎉
