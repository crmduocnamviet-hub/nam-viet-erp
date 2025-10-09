# Entity Store - Centralized State Management Guide

## Overview

The Entity Store provides **normalized data storage** for products, product lots, and inventory. This ensures all screens stay in sync automatically when data changes anywhere in the app.

## Benefits

✅ **Auto-sync across screens** - Update data once, all components re-render
✅ **Efficient updates** - Only update changed items, not entire lists
✅ **Normalized storage** - Data stored by ID for fast lookups
✅ **Persistent** - Data persisted to localStorage
✅ **Type-safe** - Full TypeScript support

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    ENTITY STORE                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Products   │  │ Product Lots│  │  Inventory  │    │
│  │  by ID      │  │  by ID      │  │  by Key     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    API LAYER                            │
│  After successful API calls, update the Entity Store    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   UI COMPONENTS                         │
│  Components subscribe to specific entities by ID        │
│  Auto re-render when that entity changes                │
└─────────────────────────────────────────────────────────┘
```

## How It Works

### 1. Data Normalization

Instead of storing arrays:

```typescript
// ❌ Old way - array storage
products: [
  { id: 1, name: "Product A" },
  { id: 2, name: "Product B" },
];
```

We store by ID:

```typescript
// ✅ New way - normalized storage
products: {
  1: { id: 1, name: "Product A" },
  2: { id: 2, name: "Product B" }
}
```

**Why?** Updating a single product is O(1) instead of O(n).

### 2. Auto-Update After API Calls

Whenever you call an API, immediately update the store:

```typescript
// Create product
const { data, error } = await createProduct(productData);
if (data) {
  useEntityStore.getState().setProduct(data); // ← Update store
}

// Update product
const { data, error } = await updateProduct(id, updates);
if (data) {
  useEntityStore.getState().updateProduct(id, updates); // ← Update store
}

// Delete product
const { error } = await deleteProduct(id);
if (!error) {
  useEntityStore.getState().deleteProduct(id); // ← Update store
}
```

### 3. Components Subscribe to Specific Data

Components only re-render when their specific data changes:

```typescript
// ✅ Only re-renders when product #123 changes
function ProductDetail({ productId }: { productId: number }) {
  const product = useEntityProduct(productId); // Subscribe to product #123

  return <div>{product?.name}</div>;
}

// ✅ Only re-renders when lots for product #123 change
function ProductLotsList({ productId }: { productId: number }) {
  const lots = useEntityProductLotsByProduct(productId);

  return <Table dataSource={lots} />;
}
```

## Usage Examples

### Example 1: Product Detail Page

```typescript
import { useEntityProduct, useEntityStore } from "@nam-viet-erp/store";
import { updateProduct } from "@nam-viet-erp/services";

function ProductDetailPage({ productId }: { productId: number }) {
  // Subscribe to product - auto re-renders when product changes
  const product = useEntityProduct(productId);

  const handleUpdate = async (updates: any) => {
    // Call API
    const { data, error } = await updateProduct(productId, updates);

    if (data) {
      // Update store - all components using this product will re-render
      useEntityStore.getState().updateProduct(productId, updates);

      notification.success({ message: "Product updated!" });
    }
  };

  return (
    <div>
      <h1>{product?.name}</h1>
      <Button onClick={() => handleUpdate({ name: "New Name" })}>
        Update
      </Button>
    </div>
  );
}
```

### Example 2: Product List

```typescript
import { useEntityAllProducts, useEntityStore } from "@nam-viet-erp/store";
import { getProducts } from "@nam-viet-erp/services";

function ProductListPage() {
  // Subscribe to all products
  const products = useEntityAllProducts();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await getProducts();
      if (data) {
        // Store all products - indexed by ID
        useEntityStore.getState().setProducts(data);
      }
    };

    fetchProducts();
  }, []);

  return (
    <Table dataSource={products} />
  );
}
```

### Example 3: Product Lot Management (Your Use Case)

```typescript
import {
  useEntityProductLotsByProduct,
  useEntityStore
} from "@nam-viet-erp/store";
import {
  getProductLots,
  createProductLotWithInventory,
  deleteProductLot
} from "@nam-viet-erp/services";

function ProductLotManagement({ productId }: { productId: number }) {
  // Subscribe to lots for this product - auto updates when lots change
  const lots = useEntityProductLotsByProduct(productId);

  // Initial fetch
  useEffect(() => {
    const fetchLots = async () => {
      const { data } = await getProductLots({ productId });
      if (data) {
        // Store all lots - indexed by ID
        useEntityStore.getState().setProductLots(data);
      }
    };

    fetchLots();
  }, [productId]);

  // Create lot
  const handleCreateLot = async (lotData: any) => {
    const { data, error } = await createProductLotWithInventory({
      ...lotData,
      product_id: productId,
    });

    if (data) {
      // Add to store - table auto-updates!
      useEntityStore.getState().setProductLot(data);

      // Also update inventory
      const inventoryData = {
        id: Date.now(), // Temp ID
        product_id: productId,
        warehouse_id: lotData.warehouse_id,
        quantity: lotData.quantity,
      };
      useEntityStore.getState().setInventory(inventoryData);

      notification.success({ message: "Lot created!" });
    }
  };

  // Delete lot
  const handleDeleteLot = async (lotId: number) => {
    const { error } = await deleteProductLot({
      lotId,
      productId,
      warehouseId: lots.find(l => l.id === lotId)?.warehouse_id!,
    });

    if (!error) {
      // Remove from store - table auto-updates!
      useEntityStore.getState().deleteProductLot(lotId);

      notification.success({ message: "Lot deleted!" });
    }
  };

  // Update lot quantity
  const handleUpdateQuantity = async (lotId: number, newQuantity: number) => {
    // Optimistically update UI immediately
    useEntityStore.getState().updateProductLot(lotId, {
      quantity: newQuantity
    });

    // Then sync with server
    const { error } = await updateProductLotQuantity({
      lotId,
      productId,
      warehouseId: lots.find(l => l.id === lotId)?.warehouse_id!,
      newQuantityAvailable: newQuantity,
    });

    if (error) {
      // Revert on error
      const lot = lots.find(l => l.id === lotId);
      if (lot) {
        useEntityStore.getState().updateProductLot(lotId, {
          quantity: lot.quantity
        });
      }
      notification.error({ message: "Update failed!" });
    }
  };

  return (
    <div>
      <Button onClick={() => setModalOpen(true)}>Add Lot</Button>

      <Table
        dataSource={lots}
        rowKey="id"
        columns={[
          {
            title: "Lot Number",
            dataIndex: "lot_number",
          },
          {
            title: "Quantity",
            dataIndex: "quantity",
            render: (qty, record) => (
              <InputNumber
                value={qty}
                onChange={(val) => handleUpdateQuantity(record.id, val)}
              />
            ),
          },
          {
            title: "Action",
            render: (_, record) => (
              <Button
                danger
                onClick={() => handleDeleteLot(record.id)}
              >
                Delete
              </Button>
            ),
          },
        ]}
      />

      <AddLotModal
        onSuccess={handleCreateLot}
      />
    </div>
  );
}
```

## Integration with Existing Code

### Step 1: Update Service Calls

Modify your services to update the entity store after successful operations:

```typescript
// packages/services/src/productService.ts
import { useEntityStore } from "@nam-viet-erp/store";

export const createProduct = async (productData: any) => {
  const { data, error } = await supabase
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (data) {
    // ✅ Update entity store
    useEntityStore.getState().setProduct(data);
  }

  return { data, error };
};

export const updateProduct = async (productId: number, updates: any) => {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", productId)
    .select()
    .single();

  if (data) {
    // ✅ Update entity store
    useEntityStore.getState().updateProduct(productId, updates);
  }

  return { data, error };
};

export const deleteProduct = async (productId: number) => {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (!error) {
    // ✅ Update entity store
    useEntityStore.getState().deleteProduct(productId);
  }

  return { error };
};
```

### Step 2: Update Components to Use Selectors

Replace direct API calls with store selectors:

```typescript
// ❌ Old way - fetch on every mount
function ProductDetail({ productId }) {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await getProductById(productId);
      setProduct(data);
    };
    fetch();
  }, [productId]);

  return <div>{product?.name}</div>;
}

// ✅ New way - subscribe to store
import { useEntityProduct } from "@nam-viet-erp/store";

function ProductDetail({ productId }) {
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

  return <div>{product?.name}</div>;
}
```

### Step 3: Update Hook to Auto-Populate Store

```typescript
// packages/store/src/hooks/useProductLot.ts
import { useEntityStore, useEntityProductLotsByProduct } from "../entityStore";

export const useFilterProductLot = (
  productId: number,
  filterWarehoused?: string | number,
) => {
  // Subscribe to store
  const lotsFromStore = useEntityProductLotsByProduct(productId);

  // Fetch if not in store
  const { data, isLoading, error, refetch } = useQuery({
    key: [FETCH_QUERY_KEY.PRODUCT_LOT, productId, filterWarehoused],
    queryFn: async () => {
      const result = await getProductLots({
        productId,
        warehouseId: filterWarehoused === "all" ? undefined : filterWarehoused,
      });

      // ✅ Update entity store
      if (result.data) {
        useEntityStore.getState().setProductLots(result.data);
      }

      return result.data;
    },
    gcTime: 0,
  });

  // Filter from store if needed
  const filteredLots =
    filterWarehoused === "all"
      ? lotsFromStore
      : lotsFromStore.filter((lot) => lot.warehouse_id === filterWarehoused);

  return { data: filteredLots, isLoading, error, refetch };
};
```

## Real-World Scenario

**Scenario:** User updates product name in Product Form

```
1. User clicks "Save" in ProductForm
2. ProductForm calls updateProduct(id, { name: "New Name" })
3. updateProduct() calls Supabase API
4. On success, updateProduct() calls:
   useEntityStore.getState().updateProduct(id, { name: "New Name" })
5. ALL components using useProduct(id) automatically re-render:
   - ProductDetail page
   - ProductList table row
   - ProductForm showing same product
   - Any other component subscribed to this product
6. User sees changes everywhere instantly!
```

## Performance Benefits

### Without Entity Store

```typescript
// Component A
const { data } = await getProduct(123); // API call

// Component B (same product!)
const { data } = await getProduct(123); // Duplicate API call

// Component C (same product again!)
const { data } = await getProduct(123); // Another duplicate!
```

**Result:** 3 API calls for same data 😞

### With Entity Store

```typescript
// Component A
const product = useEntityProduct(123); // From store (instant!)

// Component B
const product = useEntityProduct(123); // From store (instant!)

// Component C
const product = useEntityProduct(123); // From store (instant!)
```

**Result:** 0 API calls (after initial fetch) 🎉

## API Reference

### Product Actions

```typescript
useEntityStore.getState().setProduct(product);
useEntityStore.getState().setProducts(products);
useEntityStore.getState().updateProduct(productId, updates);
useEntityStore.getState().deleteProduct(productId);
useEntityStore.getState().getProduct(productId);
useEntityStore.getState().getAllProducts();
```

### Product Lot Actions

```typescript
useEntityStore.getState().setProductLot(lot);
useEntityStore.getState().setProductLots(lots);
useEntityStore.getState().updateProductLot(lotId, updates);
useEntityStore.getState().deleteProductLot(lotId);
useEntityStore.getState().getProductLot(lotId);
useEntityStore.getState().getProductLotsByProduct(productId);
useEntityStore.getState().getProductLotsByWarehouse(productId, warehouseId);
```

### Inventory Actions

```typescript
useEntityStore.getState().setInventory(inventory);
useEntityStore.getState().setInventories(inventories);
useEntityStore.getState().updateInventory(productId, warehouseId, updates);
useEntityStore.getState().deleteInventory(productId, warehouseId);
useEntityStore.getState().getInventory(productId, warehouseId);
useEntityStore.getState().getInventoriesByProduct(productId);
useEntityStore.getState().getInventoriesByWarehouse(warehouseId);
```

### Selectors (Hooks)

```typescript
const product = useEntityProduct(productId);
const products = useEntityAllProducts();
const lot = useEntityProductLot(lotId);
const lots = useEntityProductLotsByProduct(productId);
const lots = useEntityProductLotsByWarehouse(productId, warehouseId);
const inventory = useEntityInventoryItem(productId, warehouseId);
const inventories = useEntityInventoriesByProduct(productId);
const inventories = useEntityInventoriesByWarehouse(warehouseId);
```

## Migration Path

### Phase 1: Add Entity Store

✅ Create entityStore.ts
✅ Export from index.ts

### Phase 2: Update Services

✅ Modify product services to update store
✅ Modify lot services to update store
✅ Modify inventory services to update store

### Phase 3: Update Components Gradually

✅ Start with ProductLotManagement
✅ Then ProductForm
✅ Then ProductList
✅ Then other components

### Phase 4: Remove Redundant API Calls

✅ Keep only initial fetches
✅ Use store for subsequent reads
✅ Update store after mutations

## Summary

✅ **Centralized state** - Single source of truth
✅ **Auto-sync** - Change data once, update everywhere
✅ **Normalized storage** - Efficient updates by ID
✅ **Type-safe** - Full TypeScript support
✅ **Persistent** - Data survives page refreshes
✅ **Performance** - Reduce duplicate API calls

Your app will feel faster and more responsive! 🚀
