# Kiến Trúc Quản Lý State

Nam Việt ERP sử dụng **Zustand** để quản lý state với cách tiếp cận kết hợp giữa **traditional stores** và **Entity Store pattern** cho dữ liệu chuẩn hóa.

## 🏗️ Tổng Quan

### Các Tầng Quản Lý State

```
┌─────────────────────────────────────┐
│         UI Components               │
│  (Đăng ký nhận dữ liệu cụ thể)     │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│         Custom Hooks                │
│  (useProduct, useCart, etc.)        │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│         Zustand Stores              │
│  • Entity Store (chuẩn hóa)         │
│  • POS Store                        │
│  • Auth Store                       │
│  • Employee Store                   │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│         Services Layer              │
│  (API calls, data fetching)         │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│         Supabase                    │
└─────────────────────────────────────┘
```

## 📦 Kiến Trúc Store

### 1. Entity Store (Dữ Liệu Chuẩn Hóa)

**Mục đích**: Lưu trữ tập trung, chuẩn hóa cho domain entities

**File**: `packages/store/src/entityStore.ts`

**Entities**:

- Products (Sản phẩm)
- Product Lots (Lô hàng)
- Inventory (Tồn kho)

**Cấu trúc**:

```typescript
{
  products: {
    1: { id: 1, name: "Sản phẩm A", ... },
    2: { id: 2, name: "Sản phẩm B", ... }
  },
  productLots: {
    10: { id: 10, product_id: 1, lot_number: "LOT001", ... },
    11: { id: 11, product_id: 1, lot_number: "LOT002", ... }
  },
  inventory: {
    "1_1": { product_id: 1, warehouse_id: 1, quantity: 100, ... },
    "1_2": { product_id: 1, warehouse_id: 2, quantity: 50, ... }
  }
}
```

**Lợi ích**:

- ✅ **Single source of truth** cho entities
- ✅ **Tự động đồng bộ giữa các màn hình** khi dữ liệu thay đổi
- ✅ **Cập nhật hiệu quả** - O(1) lookups theo ID
- ✅ **Giảm API calls** - dữ liệu được cache trong memory
- ✅ **Persistent** - lưu vào localStorage

**Ví dụ sử dụng**:

```typescript
import { useEntityProduct, useEntityStore } from '@nam-viet-erp/store';

// Đăng ký nhận sản phẩm cụ thể
function ProductDetail({ productId }) {
  const product = useEntityProduct(productId);

  const handleUpdate = async (updates) => {
    // Cập nhật qua API
    const { data, error } = await updateProduct(productId, updates);

    if (data) {
      // Cập nhật entity store - TẤT CẢ components tự động re-render
      useEntityStore.getState().updateProduct(productId, updates);
    }
  };

  return <div>{product?.name}</div>;
}
```

### 2. POS Store

**Mục đích**: Quản lý state Point of Sale

**File**: `packages/store/src/posStore.ts`

**Tính năng**:

- Quản lý giỏ hàng đa tab
- Chọn khách hàng
- Chọn kho hàng
- Xử lý thanh toán

**Cấu trúc State**:

```typescript
{
  tabs: [
    {
      id: 'tab-1',
      title: 'Đơn hàng #1',
      cart: [...],
      selectedCustomer: {...},
      selectedWarehouse: {...}
    }
  ],
  activeTabId: 'tab-1',
  isProcessingPayment: false
}
```

**Actions Chính**:

```typescript
const {
  // Quản lý tab
  createTab,
  closeTab,
  switchTab,
  updateTabTitle,

  // Quản lý giỏ hàng
  addCartItem,
  removeCartItem,
  updateCartItem,
  clearCart,

  // Khách hàng/Kho hàng
  setSelectedCustomer,
  setSelectedWarehouse,

  // Thanh toán
  processPayment,
} = usePosStore();
```

**Ví dụ Đa Tab**:

```typescript
function PosPage() {
  const tabs = usePosTabs();
  const activeTabId = usePosActiveTabId();
  const { createTab, closeTab, switchTab } = usePosStore();

  return (
    <Tabs
      activeKey={activeTabId}
      onChange={switchTab}
      onEdit={(key, action) => {
        if (action === 'add') createTab();
        else if (action === 'remove') closeTab(key);
      }}
      items={tabs.map(tab => ({
        key: tab.id,
        label: tab.title,
        children: <PosTabContent />
      }))}
    />
  );
}
```

### 3. Auth Store

**Mục đích**: Xác thực và quản lý session người dùng

**File**: `packages/store/src/authStore.ts`

**State**:

```typescript
{
  user: IUser | null,
  session: Session | null,
  isLoading: boolean
}
```

**Actions**:

```typescript
const { user, session, setUser, setSession, clearAuth } = useAuthStore();
```

### 4. Employee Store

**Mục đích**: Dữ liệu nhân viên và khởi tạo

**File**: `packages/store/src/employeeStore.ts`

**State**:

```typescript
{
  employee: IEmployee | null,
  isLoading: boolean,
  error: string | null
}
```

**Hook Khởi Tạo**:

```typescript
// Tự động tải dữ liệu nhân viên khi app khởi động
useInitializeEmployee();

// Trong component
const employee = useEmployee();
```

### 5. Inventory Store

**Mục đích**: Dữ liệu tồn kho kho hàng

**File**: `packages/store/src/inventoryStore.ts`

**State**:

```typescript
{
  inventory: IInventory[],
  isLoading: boolean,
  error: string | null
}
```

**Sử dụng**:

```typescript
// Tự động tải tồn kho cho nhân viên có quyền inventory
useInitializeInventory();

// Trong component
const inventory = useInventory();
```

### 6. Combo Store

**Mục đích**: Quản lý combo sản phẩm

**File**: `packages/store/src/comboStore.ts`

**State**:

```typescript
{
  combos: IComboWithItems[]
}
```

**Sử dụng**:

```typescript
const combos = useCombos();
const { fetchCombos } = useComboStore();

useEffect(() => {
  fetchCombos();
}, []);
```

## 🔄 Mẫu Luồng Dữ Liệu

### Mẫu 1: Entity Store Tự Động Đồng Bộ

**Use Case**: Quản lý sản phẩm giữa nhiều màn hình

```typescript
// Màn hình 1: Danh sách sản phẩm
function ProductList() {
  const products = useEntityAllProducts();

  return (
    <Table dataSource={products} />
  );
}

// Màn hình 2: Chi tiết sản phẩm
function ProductDetail({ productId }) {
  const product = useEntityProduct(productId);

  const handleUpdate = async (updates) => {
    const { data } = await updateProduct(productId, updates);
    if (data) {
      // Cập nhật entity store
      useEntityStore.getState().updateProduct(productId, updates);
      // ✅ ProductList tự động re-render!
    }
  };

  return <ProductForm product={product} onUpdate={handleUpdate} />;
}
```

### Mẫu 2: Service Tự Động Cập Nhật

**Use Case**: Services tự động cập nhật entity store

```typescript
// Trong lotManagementService.ts
export const createProductLotWithInventory = async (params) => {
  const { data, error } = await createProductLot(params);

  if (data) {
    // ✅ Tự động cập nhật entity store
    useEntityStore.getState().setProductLot(data);
  }

  return { data, error };
};

// Trong component - chỉ cần gọi service
const handleCreate = async (lotData) => {
  await createProductLotWithInventory(lotData);
  // ✅ Tất cả danh sách lô tự động cập nhật!
};
```

### Mẫu 3: State Theo Phạm Vi Tab

**Use Case**: Giỏ hàng độc lập cho mỗi tab POS

```typescript
// Mỗi tab có state riêng biệt
const cart = useCart(); // Giỏ hàng của tab hiện tại
const selectedCustomer = usePosSelectedCustomer(); // Khách hàng của tab hiện tại

// Actions chỉ ảnh hưởng tab đang hoạt động
addCartItem(item); // Thêm vào tab hiện tại
setSelectedCustomer(customer); // Đặt cho tab hiện tại
```

## 🎯 Hướng Dẫn Chọn Store

| Use Case                       | Store                  | Pattern    |
| ------------------------------ | ---------------------- | ---------- |
| Product CRUD giữa các màn hình | Entity Store           | Normalized |
| Quản lý lô sản phẩm            | Entity Store           | Normalized |
| Dữ liệu tồn kho                | Entity/Inventory Store | Hybrid     |
| Giỏ hàng POS                   | POS Store              | Tab-scoped |
| Xác thực người dùng            | Auth Store             | Global     |
| Dữ liệu nhân viên              | Employee Store         | Global     |
| Combos                         | Combo Store            | Global     |

## 📊 API Entity Store

### Products

```typescript
// Actions
useEntityStore.getState().setProduct(product);
useEntityStore.getState().setProducts(products);
useEntityStore.getState().updateProduct(id, updates);
useEntityStore.getState().deleteProduct(id);

// Selectors
const product = useEntityProduct(productId);
const products = useEntityAllProducts();
```

### Product Lots

```typescript
// Actions
useEntityStore.getState().setProductLot(lot);
useEntityStore.getState().setProductLots(lots);
useEntityStore.getState().updateProductLot(lotId, updates);
useEntityStore.getState().deleteProductLot(lotId);

// Selectors
const lot = useEntityProductLot(lotId);
const lots = useEntityProductLotsByProduct(productId);
const lots = useEntityProductLotsByWarehouse(productId, warehouseId);
```

### Inventory

```typescript
// Actions
useEntityStore.getState().setInventory(inventory);
useEntityStore.getState().setInventories(inventories);
useEntityStore.getState().updateInventory(productId, warehouseId, updates);

// Selectors
const inventory = useEntityInventoryItem(productId, warehouseId);
const inventories = useEntityInventoriesByProduct(productId);
const inventories = useEntityInventoriesByWarehouse(warehouseId);
```

## 🔧 Custom Hooks

### Query Hooks (React Query Integration)

**File**: `packages/store/src/hooks/useProductLot.ts`

```typescript
// Lấy một lô
const { data, isLoading, error, refetch } = useProductLot(lotId);

// Lấy lô với filter
const { data, isLoading, refetch } = useFilterProductLot(
  productId,
  warehouseId,
);

// Cập nhật số lượng lô
const { submit, isLoading } = useUpdateQuantityByLot({
  lotId,
  onSuccess: () => console.log("Đã cập nhật!"),
  onError: (e) => console.error(e),
});

// Sử dụng
submit({
  lotId,
  productId,
  warehouseId,
  newQuantityAvailable: 100,
});
```

### Initialization Hooks

```typescript
// Khởi tạo dữ liệu nhân viên
useInitializeEmployee(); // Tự động fetch thông tin nhân viên

// Khởi tạo tồn kho
useInitializeInventory(); // Tự động fetch tồn kho cho kho hàng
```

## 🎨 Best Practices

### 1. **Sử Dụng Entity Store cho Domain Entities**

```typescript
// ✅ Đúng - Lưu trữ chuẩn hóa
useEntityProduct(productId);
useEntityProductLotsByProduct(productId);

// ❌ Sai - Local state cho dữ liệu dùng chung
const [product, setProduct] = useState(null);
useEffect(() => {
  fetchProduct(productId).then(setProduct);
}, [productId]);
```

### 2. **Cập Nhật Store Sau API Calls**

```typescript
// ✅ Đúng - Cập nhật store để tự động đồng bộ
const handleCreate = async (data) => {
  const result = await createProduct(data);
  if (result.data) {
    useEntityStore.getState().setProduct(result.data);
  }
};

// ❌ Sai - Chỉ cập nhật local
const handleCreate = async (data) => {
  const result = await createProduct(data);
  setLocalProduct(result.data); // Các màn hình khác sẽ không cập nhật
};
```

### 3. **Đăng Ký Có Chọn Lọc**

```typescript
// ✅ Đúng - Đăng ký nhận dữ liệu cụ thể
const product = useEntityProduct(productId); // Chỉ re-render khi SẢN PHẨM NÀY thay đổi

// ❌ Sai - Đăng ký nhận tất cả sản phẩm
const allProducts = useEntityAllProducts();
const product = allProducts.find((p) => p.id === productId); // Re-render khi BẤT KỲ sản phẩm nào thay đổi
```

### 4. **Persist State Quan Trọng**

Entity Store tự động persist vào localStorage:

```typescript
// Cấu hình trong entityStore.ts
persist(
  (set, get) => ({...}),
  {
    name: 'entity-store',
    storage: createJSONStorage(() => localStorage)
  }
)
```

## 🚀 Tối Ưu Hiệu Suất

### 1. **Cấu Trúc Dữ Liệu Chuẩn Hóa**

- Tra cứu O(1) theo ID
- Cập nhật hiệu quả không cần vòng lặp array
- Tự động loại bỏ trùng lặp

### 2. **Re-render Có Chọn Lọc**

```typescript
// Chỉ re-render khi sản phẩm cụ thể thay đổi
const product = useEntityProduct(productId);

// Chỉ re-render khi lô của sản phẩm cụ thể thay đổi
const lots = useEntityProductLotsByProduct(productId);
```

### 3. **Cache Invalidation**

```typescript
// Vô hiệu hóa cache cho dữ liệu mới
useQuery({
  key: ["product-lots", productId],
  queryFn: fetchLots,
  gcTime: 0, // Không cache
  disableCache: true,
});
```

## 📚 Tài Liệu Liên Quan

- [Kiến Trúc Workspace](./workspace-architecture-vi.md)
- [Tổng Quan Services](../api/services-overview.md)
- [Hướng Dẫn Entity Store](../../packages/store/ENTITY_STORE_GUIDE.md)
- [Hướng Dẫn Bắt Đầu Nhanh](../../packages/store/QUICK_START.md)
