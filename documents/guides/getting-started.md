# Getting Started with Nam Việt ERP

This guide will help you set up and start developing with Nam Việt ERP system.

## 📋 Prerequisites

### Required Software

- **Node.js**: v18 or higher
- **Yarn**: v1.22 or higher
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Recommended VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- GitLens

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/your-org/nam-viet-erp.git
cd nam-viet-erp
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
yarn install
```

This will install dependencies for:

- Root workspace
- Both apps (cms, sale)
- All packages (services, shared-components, store, types)

### 3. Environment Setup

Create `.env` files in both app directories:

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

### 4. Start Development Servers

**Start CMS App**

```bash
yarn cms:dev
```

Open [http://localhost:5173](http://localhost:5173)

**Start Sale App**

```bash
yarn sale:dev
```

Open [http://localhost:5174](http://localhost:5174)

## 📁 Project Structure

```
nam-viet-erp/
├── apps/                    # Applications
│   ├── cms/                # Admin/Management App
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── components/
│   │   │   └── pages/
│   │   └── package.json
│   └── sale/               # Sales App (POS, B2B)
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
│   ├── store/            # State Management
│   │   ├── src/
│   │   │   ├── posStore.ts
│   │   │   ├── entityStore.ts
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── types/            # TypeScript Types
│       └── index.d.ts
│
├── documents/            # Documentation (you are here!)
├── types/               # Global Types
└── package.json        # Root Workspace Config
```

## 🔧 Development Workflow

### Adding a New Feature

1. **Determine Location**

   ```
   - UI Component? → packages/shared-components/src/components/
   - Screen/Page? → packages/shared-components/src/screens/
   - API Logic? → packages/services/src/
   - State? → packages/store/src/
   ```

2. **Create Files**

   ```bash
   # Example: New component
   touch packages/shared-components/src/components/MyComponent.tsx
   ```

3. **Export from Index**

   ```typescript
   // packages/shared-components/src/index.ts
   export { default as MyComponent } from "./components/MyComponent";
   ```

4. **Use in Apps**
   ```typescript
   import { MyComponent } from "@nam-viet-erp/shared-components";
   ```

### Making API Calls

1. **Create Service Function**

   ```typescript
   // packages/services/src/myService.ts
   import { supabase } from "./supabaseClient";

   export const getMyData = async () => {
     const { data, error } = await supabase.from("my_table").select("*");

     return { data, error };
   };
   ```

2. **Export from Index**

   ```typescript
   // packages/services/src/index.ts
   export * from "./myService";
   ```

3. **Use in Components**

   ```typescript
   import { getMyData } from "@nam-viet-erp/services";

   const fetchData = async () => {
     const { data, error } = await getMyData();
     // Handle data
   };
   ```

### Adding State Management

1. **Create Store**

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

2. **Export from Index**

   ```typescript
   // packages/store/src/index.ts
   export * from "./myStore";
   ```

3. **Use in Components**

   ```typescript
   import { useMyStore } from "@nam-viet-erp/store";

   function MyComponent() {
     const { data, setData } = useMyStore();
     // Use data
   }
   ```

## 🛠️ Common Tasks

### Run Linting

```bash
# Lint all code
yarn lint

# Lint specific app
yarn cms:lint
yarn sale:lint
```

### Build for Production

```bash
# Build CMS
yarn cms:build

# Build Sale
yarn sale:build

# Output in:
# - apps/cms/dist/
# - apps/sale/dist/
```

### Add Dependencies

**Add to workspace root** (for all packages):

```bash
yarn add lodash -W
```

**Add to specific package**:

```bash
yarn workspace @nam-viet-erp/services add axios
yarn workspace @nam-viet-erp/cms add some-package
```

**Add dev dependency**:

```bash
yarn add -D typescript -W
```

### Create Database Migration

1. **Write SQL Query**

   ```sql
   -- packages/services/query/my-feature.txt
   CREATE TABLE my_table (
     id SERIAL PRIMARY KEY,
     name VARCHAR(255) NOT NULL
   );
   ```

2. **Run via Supabase CLI or Dashboard**

   ```bash
   supabase db push
   ```

3. **Update TypeScript Types**
   ```typescript
   // types/index.d.ts
   interface IMyTable {
     id: number;
     name: string;
   }
   ```

## 📝 Code Examples

### Example 1: Create a Product Form Component

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
        message: 'Error',
        description: error.message
      });
      return;
    }

    // Update Entity Store
    if (data) {
      useEntityStore.getState().setProduct(data);
    }

    notification.success({ message: 'Product created!' });
    form.resetFields();
    onSuccess?.();
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="name"
        label="Product Name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Create Product
        </Button>
      </Form.Item>
    </Form>
  );
};

export default MyProductForm;
```

### Example 2: Create a Service

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

### Example 3: Use Entity Store

```typescript
// Component using Entity Store
import React, { useEffect } from 'react';
import { useEntityProduct, useEntityStore } from '@nam-viet-erp/store';
import { getProductById } from '@nam-viet-erp/services';

function ProductDetail({ productId }: { productId: number }) {
  // Subscribe to product
  const product = useEntityProduct(productId);

  // Fetch if not in store
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{product.name}</h1>
      <p>Price: {product.price}</p>
    </div>
  );
}
```

## 🐛 Troubleshooting

### Issue: "Cannot find module '@nam-viet-erp/...'"

**Solution**:

```bash
# Re-install dependencies
yarn install

# Clear cache
rm -rf node_modules
rm yarn.lock
yarn install
```

### Issue: Port already in use

**Solution**:

```bash
# Find process using port
lsof -ti:5173

# Kill process
kill -9 <PID>

# Or use different port
yarn cms:dev --port 5175
```

### Issue: TypeScript errors after adding new package

**Solution**:

```bash
# Rebuild TypeScript
yarn workspace @nam-viet-erp/shared-components build
yarn workspace @nam-viet-erp/services build
```

### Issue: Supabase connection error

**Solution**:

- Check `.env` files have correct values
- Verify Supabase project is running
- Check network connection
- Verify Supabase URL and keys are correct

## 📚 Next Steps

1. **Read Core Documentation**
   - [Development Rules](../development/rules.md)
   - [Workspace Architecture](../architecture/workspace-architecture.md)
   - [State Management](../architecture/state-management.md)

2. **Explore Features**
   - [POS System](../features/pos-system.md)
   - [Product Lot Management](../features/product-lot-management.md)
   - [Inventory Management](../features/inventory-management.md)

3. **Learn Advanced Topics**
   - [Shared Screens](../architecture/shared-screens.md)
   - [Services Overview](../api/services-overview.md)
   - [Database Schema](../database/schema-overview.md)

4. **Try Building Something**
   - Start with a simple component
   - Create a new service function
   - Add a new screen to the registry
   - Implement a new feature

## 🤝 Getting Help

- **Documentation**: Check `/documents` folder
- **Code Examples**: Look at existing components
- **Team**: Ask in team chat or create an issue

## ✅ Checklist for New Developers

- [ ] Installed Node.js v18+
- [ ] Installed Yarn
- [ ] Cloned repository
- [ ] Ran `yarn install`
- [ ] Created `.env` files
- [ ] Started CMS app successfully
- [ ] Started Sale app successfully
- [ ] Read [Development Rules](../development/rules.md)
- [ ] Understood [Workspace Architecture](../architecture/workspace-architecture.md)
- [ ] Explored existing components
- [ ] Created first test component

Welcome to Nam Việt ERP! 🎉
