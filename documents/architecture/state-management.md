# State Management Architecture

Nam Việt ERP uses **Zustand** for state management with a hybrid approach combining **traditional stores** and **Entity Store pattern** for normalized data.

## 🏗️ Overview

### State Management Layers

```
┌─────────────────────────────────────┐
│         UI Components               │
│  (Subscribe to specific data)       │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│         Custom Hooks                │
│  (useProduct, useCart, etc.)        │
└─────────────────────────────────────┘
                 ↕
┌─────────────────────────────────────┐
│         Zustand Stores              │
│  • Entity Store (normalized)        │
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

## 📦 Store Architecture

### 1. Entity Store (Normalized Data)

**Purpose**: Centralized, normalized storage for domain entities

**File**: `packages/store/src/entityStore.ts`

**Entities**:

- Products
- Product Lots
- Inventory

**Structure**:

```typescript
{
  products: {
    1: { id: 1, name: "Product A", ... },
    2: { id: 2, name: "Product B", ... }
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

**Benefits**:

- ✅ **Single source of truth** for entities
- ✅ **Automatic cross-screen sync** when data changes
- ✅ **Efficient updates** - O(1) lookups by ID
- ✅ **Reduced API calls** - data cached in memory
- ✅ **Persistent** - saved to localStorage

**Example Usage**:

```typescript
import { useEntityProduct, useEntityStore } from '@nam-viet-erp/store';

// Subscribe to specific product
function ProductDetail({ productId }) {
  const product = useEntityProduct(productId);

  const handleUpdate = async (updates) => {
    // Update via API
    const { data, error } = await updateProduct(productId, updates);

    if (data) {
      // Update entity store - ALL components re-render automatically
      useEntityStore.getState().updateProduct(productId, updates);
    }
  };

  return <div>{product?.name}</div>;
}
```

### 2. POS Store

**Purpose**: Point of Sale state management

**File**: `packages/store/src/posStore.ts`

**Features**:

- Multi-tab cart management
- Customer selection
- Warehouse selection
- Payment processing

**State Shape**:

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

**Key Actions**:

```typescript
const {
  // Tab management
  createTab,
  closeTab,
  switchTab,
  updateTabTitle,

  // Cart management
  addCartItem,
  removeCartItem,
  updateCartItem,
  clearCart,

  // Customer/Warehouse
  setSelectedCustomer,
  setSelectedWarehouse,

  // Payment
  processPayment,
} = usePosStore();
```

**Multi-Tab Example**:

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

**Purpose**: Authentication and user session management

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

**Purpose**: Employee data and initialization

**File**: `packages/store/src/employeeStore.ts`

**State**:

```typescript
{
  employee: IEmployee | null,
  isLoading: boolean,
  error: string | null
}
```

**Initialization Hook**:

```typescript
// Auto-loads employee data on app start
useInitializeEmployee();

// In component
const employee = useEmployee();
```

### 5. Inventory Store

**Purpose**: Warehouse inventory data

**File**: `packages/store/src/inventoryStore.ts`

**State**:

```typescript
{
  inventory: IInventory[],
  isLoading: boolean,
  error: string | null
}
```

**Usage**:

```typescript
// Auto-loads inventory for employees with inventory permissions
useInitializeInventory();

// In component
const inventory = useInventory();
```

### 6. Combo Store

**Purpose**: Product combo management

**File**: `packages/store/src/comboStore.ts`

**State**:

```typescript
{
  combos: IComboWithItems[]
}
```

**Usage**:

```typescript
const combos = useCombos();
const { fetchCombos } = useComboStore();

useEffect(() => {
  fetchCombos();
}, []);
```

## 🔄 Data Flow Patterns

### Pattern 1: Entity Store Auto-Sync

**Use Case**: Product management across multiple screens

```typescript
// Screen 1: Product List
function ProductList() {
  const products = useEntityAllProducts();

  return (
    <Table dataSource={products} />
  );
}

// Screen 2: Product Detail
function ProductDetail({ productId }) {
  const product = useEntityProduct(productId);

  const handleUpdate = async (updates) => {
    const { data } = await updateProduct(productId, updates);
    if (data) {
      // Update entity store
      useEntityStore.getState().updateProduct(productId, updates);
      // ✅ ProductList re-renders automatically!
    }
  };

  return <ProductForm product={product} onUpdate={handleUpdate} />;
}
```

### Pattern 2: Service Auto-Update

**Use Case**: Services automatically update entity store

```typescript
// In lotManagementService.ts
export const createProductLotWithInventory = async (params) => {
  const { data, error } = await createProductLot(params);

  if (data) {
    // ✅ Auto-update entity store
    useEntityStore.getState().setProductLot(data);
  }

  return { data, error };
};

// In component - just call service
const handleCreate = async (lotData) => {
  await createProductLotWithInventory(lotData);
  // ✅ All lot lists update automatically!
};
```

### Pattern 3: Tab-Scoped State

**Use Case**: Independent carts per POS tab

```typescript
// Each tab has isolated state
const cart = useCart(); // Current tab's cart
const selectedCustomer = usePosSelectedCustomer(); // Current tab's customer

// Actions affect only active tab
addCartItem(item); // Adds to current tab
setSelectedCustomer(customer); // Sets for current tab
```

## 🎯 Store Selection Guide

| Use Case                    | Store                  | Pattern    |
| --------------------------- | ---------------------- | ---------- |
| Product CRUD across screens | Entity Store           | Normalized |
| Product lot management      | Entity Store           | Normalized |
| Inventory data              | Entity/Inventory Store | Hybrid     |
| POS cart                    | POS Store              | Tab-scoped |
| User authentication         | Auth Store             | Global     |
| Employee data               | Employee Store         | Global     |
| Combos                      | Combo Store            | Global     |

## 📊 Entity Store API

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
// Fetch single lot
const { data, isLoading, error, refetch } = useProductLot(lotId);

// Fetch lots with filter
const { data, isLoading, refetch } = useFilterProductLot(
  productId,
  warehouseId,
);

// Update lot quantity
const { submit, isLoading } = useUpdateQuantityByLot({
  lotId,
  onSuccess: () => console.log("Updated!"),
  onError: (e) => console.error(e),
});

// Usage
submit({
  lotId,
  productId,
  warehouseId,
  newQuantityAvailable: 100,
});
```

### Initialization Hooks

```typescript
// Initialize employee data
useInitializeEmployee(); // Auto-fetches employee info

// Initialize inventory
useInitializeInventory(); // Auto-fetches inventory for warehouse
```

## 🎨 Best Practices

### 1. **Use Entity Store for Domain Entities**

```typescript
// ✅ Good - Normalized storage
useEntityProduct(productId);
useEntityProductLotsByProduct(productId);

// ❌ Bad - Local state for shared data
const [product, setProduct] = useState(null);
useEffect(() => {
  fetchProduct(productId).then(setProduct);
}, [productId]);
```

### 2. **Update Store After API Calls**

```typescript
// ✅ Good - Update store for auto-sync
const handleCreate = async (data) => {
  const result = await createProduct(data);
  if (result.data) {
    useEntityStore.getState().setProduct(result.data);
  }
};

// ❌ Bad - Only local update
const handleCreate = async (data) => {
  const result = await createProduct(data);
  setLocalProduct(result.data); // Other screens won't update
};
```

### 3. **Selective Subscriptions**

```typescript
// ✅ Good - Subscribe to specific data
const product = useEntityProduct(productId); // Only re-renders if THIS product changes

// ❌ Bad - Subscribe to all products
const allProducts = useEntityAllProducts();
const product = allProducts.find((p) => p.id === productId); // Re-renders on ANY product change
```

### 4. **Persist Important State**

Entity Store automatically persists to localStorage:

```typescript
// Configured in entityStore.ts
persist(
  (set, get) => ({...}),
  {
    name: 'entity-store',
    storage: createJSONStorage(() => localStorage)
  }
)
```

## 🚀 Performance Optimization

### 1. **Normalized Data Structure**

- O(1) lookups by ID
- Efficient updates without array iteration
- Automatic deduplication

### 2. **Selective Re-renders**

```typescript
// Only re-renders when specific product changes
const product = useEntityProduct(productId);

// Only re-renders when lots for specific product change
const lots = useEntityProductLotsByProduct(productId);
```

### 3. **Cache Invalidation**

```typescript
// Disable cache for fresh data
useQuery({
  key: ["product-lots", productId],
  queryFn: fetchLots,
  gcTime: 0, // Don't cache
  disableCache: true,
});
```

## 📚 Related Documentation

- [Workspace Architecture](./workspace-architecture.md)
- [Services Overview](../api/services-overview.md)
- [Entity Store Guide](../../packages/store/ENTITY_STORE_GUIDE.md)
- [Quick Start Guide](../../packages/store/QUICK_START.md)
