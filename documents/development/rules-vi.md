# Quy Tắc Phát Triển

Quy tắc và quy ước phát triển cốt lõi cho dự án Nam Việt ERP.

## 📋 Quy Tắc Cốt Lõi

### 1. **Yarn Workspace**

- ✅ **LUÔN LUÔN** sử dụng lệnh Yarn Workspace
- ✅ Cài đặt dependencies qua root: `yarn add package-name -W`
- ✅ Chạy scripts qua workspace: `yarn workspace @nam-viet-erp/cms dev`

```bash
# ✅ Đúng
yarn cms:dev
yarn sale:dev
yarn add lodash -W

# ❌ Sai
npm install
npm run dev
cd apps/cms && yarn dev
```

### 2. **Services Package**

- ✅ **TẤT CẢ** API calls phải đi qua `@nam-viet-erp/services`
- ✅ **KHÔNG** gọi Supabase trực tiếp trong components
- ✅ Sử dụng service functions để truy cập dữ liệu

```typescript
// ✅ Đúng
import { getProducts, createProduct } from "@nam-viet-erp/services";

const { data, error } = await getProducts({ status: "active" });

// ❌ Sai
import { supabase } from "../supabaseClient";

const { data } = await supabase.from("products").select("*");
```

### 3. **File SQL Query**

- ✅ SQL queries phức tạp phải nằm trong thư mục `packages/services/query/`
- ✅ Format: `query/<feature-name>.txt`
- ✅ Sử dụng query files cho tạo bảng mới, migrations, hoặc joins phức tạp

**Ví dụ**: `packages/services/query/product-lots.txt`

```sql
-- Tạo bảng product_lots
CREATE TABLE product_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(255) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  warehouse_id INTEGER REFERENCES warehouses(id),
  quantity INTEGER DEFAULT 0,
  expiry_date DATE,
  batch_code VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. **Cấu Trúc Ứng Dụng**

- ✅ **CMS App**: Tính năng quản lý và administration
- ✅ **Sale App**: Tính năng tập trung vào bán hàng (POS, B2B, Y tế)
- ✅ Phân tách rõ ràng mối quan tâm giữa các apps

**Tính năng CMS App**:

- Quản lý sản phẩm (CRUD)
- Kiểm soát tồn kho
- Quản lý người dùng & phân quyền
- Báo cáo và phân tích
- Cấu hình hệ thống

**Tính năng Sale App**:

- Point of Sale (POS)
- Quản lý đơn hàng B2B
- Quản lý Khách hàng/Bệnh nhân
- Đơn thuốc y tế
- Tra cứu tồn kho nhanh

## 🏗️ Quy Tắc Kiến Trúc

### 5. **Tổ Chức Component**

```typescript
// ✅ Shared components → shared-components package
import { ProductForm } from "@nam-viet-erp/shared-components";

// ✅ Components riêng cho app → thư mục components của app
import { CmsHeader } from "../components/CmsHeader";

// ❌ Không nhân bản components giữa các apps
```

### 6. **Quản Lý State**

```typescript
// ✅ Sử dụng Entity Store cho domain entities
import { useEntityProduct } from "@nam-viet-erp/store";

const product = useEntityProduct(productId);

// ✅ Sử dụng specialized stores cho tính năng cụ thể
import { usePosStore } from "@nam-viet-erp/store";

const { cart, addCartItem } = usePosStore();

// ❌ Không sử dụng local state cho dữ liệu dùng chung
const [product, setProduct] = useState(null); // Sai cho shared entities
```

### 7. **Cập Nhật Services**

```typescript
// ✅ Cập nhật Entity Store sau API mutations
const handleCreate = async (data) => {
  const { data: result, error } = await createProduct(data);

  if (result) {
    useEntityStore.getState().setProduct(result);
  }
};

// ❌ Đừng quên cập nhật store
const handleCreate = async (data) => {
  await createProduct(data); // Các màn hình khác sẽ không đồng bộ!
};
```

## 📁 Quy Tắc Tổ Chức File

### 8. **Import Paths**

```typescript
// ✅ Sử dụng workspace names cho cross-package imports
import { getProducts } from "@nam-viet-erp/services";
import { ProductForm } from "@nam-viet-erp/shared-components";
import { usePosStore } from "@nam-viet-erp/store";

// ❌ Không sử dụng đường dẫn tương đối giữa packages
import { getProducts } from "../../../packages/services/src/productService";
```

### 9. **Đặt Tên File**

```bash
# ✅ Components: PascalCase
ProductForm.tsx
LotSelectionModal.tsx
PosTabContent.tsx

# ✅ Services: camelCase + Service suffix
productService.ts
lotManagementService.ts
inventoryService.ts

# ✅ Stores: camelCase + Store suffix
posStore.ts
entityStore.ts
authStore.ts

# ✅ Utilities: camelCase
menuGenerator.ts
priceCalculator.ts

# ✅ Types: PascalCase + .d.ts hoặc interfaces
types.d.ts
IProduct.ts
```

### 10. **Query Files**

```bash
# ✅ Vị trí: packages/services/query/
packages/services/query/
├── products.txt          # Queries liên quan sản phẩm
├── product-lots.txt      # Queries quản lý lô
├── inventory.txt         # Queries tồn kho
└── orders.txt           # Queries đơn hàng

# ✅ Nội dung: SQL queries với comments
-- Tạo bảng product_lots
CREATE TABLE product_lots (...);

-- Index để tra cứu nhanh hơn
CREATE INDEX idx_lots_product ON product_lots(product_id);
```

## 🔧 Quy Tắc Quy Trình Phát Triển

### 11. **Chiến Lược Branch**

```bash
# ✅ Feature branches
git checkout -b feature/product-lot-management
git checkout -b fix/pos-cart-issue
git checkout -b refactor/entity-store

# ✅ Commits mô tả rõ ràng
git commit -m "Add product lot selection modal for POS"
git commit -m "Fix cart quantity validation for lot-managed products"

# ❌ Đừng commit trực tiếp vào main
git checkout main
git commit -m "changes" # Sai!
```

### 12. **Chất Lượng Code**

```bash
# ✅ Chạy linting trước khi commit
yarn lint

# ✅ Sửa lỗi linting
yarn workspace @nam-viet-erp/cms lint --fix
yarn workspace @nam-viet-erp/sale lint --fix

# ✅ Husky pre-commit hooks
# Tự động chạy lint-staged khi commit
```

### 13. **Testing**

```typescript
// ✅ Test services với mock data
import { getProducts } from '@nam-viet-erp/services';

describe('Product Service', () => {
  it('should fetch products', async () => {
    const { data, error } = await getProducts({ status: 'active' });
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

// ✅ Test components với React Testing Library
import { render, screen } from '@testing-library/react';
import { ProductForm } from '@nam-viet-erp/shared-components';

test('renders product form', () => {
  render(<ProductForm />);
  expect(screen.getByLabelText('Product Name')).toBeInTheDocument();
});
```

## 🎯 Quy Tắc TypeScript

### 14. **Type Safety**

```typescript
// ✅ Sử dụng types phù hợp từ @nam-viet-erp/types hoặc local types
import { IProduct, IProductLot } from "@nam-viet-erp/types";

const createProduct = (
  data: Omit<IProduct, "id">,
): Promise<{ data: IProduct | null; error: any }> => {
  // ...
};

// ❌ Không sử dụng 'any' trừ khi thực sự cần thiết
const createProduct = (data: any): Promise<any> => {
  // Sai!
  // ...
};
```

### 15. **Interface vs Type**

```typescript
// ✅ Sử dụng Interface cho object shapes
interface IProduct {
  id: number;
  name: string;
  price: number;
}

// ✅ Sử dụng Type cho unions, intersections, utilities
type ProductStatus = "active" | "inactive" | "discontinued";
type ProductWithLots = IProduct & { lots: IProductLot[] };
```

## 🔐 Quy Tắc Bảo Mật

### 16. **Environment Variables**

```bash
# ✅ Lưu trữ dữ liệu nhạy cảm trong .env
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key

# ✅ Không bao giờ commit file .env
# .gitignore nên bao gồm:
.env
.env.local
.env.production

# ❌ Không hardcode credentials
const supabaseUrl = 'https://xxxxx.supabase.co'; // Sai!
```

### 17. **Kiểm Tra Quyền**

```typescript
// ✅ Kiểm tra quyền trước khi render
import { Screen, useScreens } from '@nam-viet-erp/shared-components';

const { hasPermission } = useScreens();

if (!hasPermission('pos.access')) {
  return <AccessDenied />;
}

// ✅ Sử dụng Screen component với kiểm tra quyền tự động
<Screen screenKey="pos.main" fallback={<AccessDenied />} />

// ❌ Đừng bỏ qua kiểm tra quyền
return <PosPage />; // Sai! Không kiểm tra quyền
```

## 🚀 Quy Tắc Hiệu Suất

### 18. **Tối Ưu Re-renders**

```typescript
// ✅ Sử dụng selective subscriptions
const product = useEntityProduct(productId); // Chỉ re-render khi SẢN PHẨM NÀY thay đổi

// ✅ Sử dụng useMemo cho tính toán tốn kém
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.name.localeCompare(b.name)),
  [products],
);

// ❌ Đừng subscribe toàn bộ store không cần thiết
const { products } = useEntityStore(); // Re-render khi BẤT KỲ thay đổi nào
const product = products[productId]; // Không hiệu quả
```

### 19. **Tối Ưu API Call**

```typescript
// ✅ Sử dụng Entity Store để giảm API calls
const product = useEntityProduct(productId); // Được cache trong store

useEffect(() => {
  if (!product) {
    // Chỉ fetch nếu chưa có trong store
    const fetch = async () => {
      const { data } = await getProductById(productId);
      if (data) {
        useEntityStore.getState().setProduct(data);
      }
    };
    fetch();
  }
}, [productId, product]);

// ❌ Đừng fetch mỗi lần render
useEffect(() => {
  getProductById(productId); // Fetch mỗi lần!
}, [productId]);
```

## 📝 Quy Tắc Tài Liệu

### 20. **Code Comments**

```typescript
// ✅ Comment logic phức tạp
/**
 * Tính giá tốt nhất cho sản phẩm dựa trên khuyến mãi đang hoạt động.
 * Hỗ trợ cả giảm giá phần trăm và số tiền cố định.
 *
 * @param product - Sản phẩm để tính giá
 * @param promotions - Danh sách khuyến mãi đang hoạt động
 * @returns Thông tin giá với giá cuối cùng và khuyến mãi áp dụng
 */
const calculateBestPrice = (
  product: IProduct,
  promotions: IPromotion[],
): PriceInfo => {
  // ...
};

// ✅ Giải thích tại sao, không phải cái gì
// Sử dụng uppercase cho số lô để duy trì tính nhất quán với quét barcode
form.setFieldValue("lot_number", value.toUpperCase());

// ❌ Đừng nói điều hiển nhiên
// Đặt giá trị thành uppercase
form.setFieldValue("lot_number", value.toUpperCase());
```

### 21. **README Files**

```bash
# ✅ Mỗi package nên có README.md
packages/
├── services/
│   ├── README.md          # Hướng dẫn sử dụng service
│   └── src/
├── shared-components/
│   ├── README.md          # Hướng dẫn component library
│   └── src/
└── store/
    ├── README.md          # Hướng dẫn quản lý state
    ├── ENTITY_STORE_GUIDE.md
    ├── QUICK_START.md
    └── src/
```

## ⚠️ Lỗi Thường Gặp Cần Tránh

### ❌ Đừng:

1. **Cài đặt packages trong workspaces riêng lẻ**

   ```bash
   cd apps/cms
   yarn add package # Sai!
   ```

2. **Gọi Supabase trực tiếp**

   ```typescript
   import { supabase } from "./supabase";
   await supabase.from("products").select("*"); // Sai!
   ```

3. **Quên cập nhật Entity Store**

   ```typescript
   await createProduct(data);
   // Thiếu: useEntityStore.getState().setProduct(data);
   ```

4. **Sử dụng đường dẫn tương đối giữa packages**

   ```typescript
   import { ProductForm } from "../../../packages/shared-components"; // Sai!
   ```

5. **Commit dữ liệu nhạy cảm**
   ```bash
   git add .env # Sai!
   git commit -m "add config"
   ```

## ✅ Checklist Nhanh

Trước khi commit code:

- [ ] Đã sử dụng `@nam-viet-erp/services` cho tất cả API calls
- [ ] Đã thêm SQL queries vào `packages/services/query/` nếu cần
- [ ] Đã cập nhật Entity Store sau mutations
- [ ] Đã sử dụng TypeScript types phù hợp
- [ ] Đã thêm comments cần thiết cho logic phức tạp
- [ ] Đã chạy `yarn lint` và sửa các vấn đề
- [ ] Đã test trong cả CMS và Sale apps nếu là shared code
- [ ] Không có dữ liệu nhạy cảm trong commits
- [ ] Import workspace phù hợp (không có đường dẫn tương đối)
- [ ] Đã kiểm tra quyền cho các tính năng được bảo vệ

## 📚 Tài Liệu Liên Quan

- [Kiến Trúc Workspace](../architecture/workspace-architecture-vi.md)
- [Quản Lý State](../architecture/state-management-vi.md)
- [Chuẩn Coding](./coding-standards.md)
- [Git Workflow](./git-workflow.md)
