# Sync Product Lots to Inventory

## Overview

When quantities are managed in `product_lots` table, you may need to sync them back to the `inventory` table for reporting or compatibility purposes.

## Functions Available

### 1. `syncLotQuantityToInventory` - Sync Single Warehouse

Syncs lot quantities for one specific product and warehouse.

```typescript
import { syncLotQuantityToInventory } from "@nam-viet-erp/services";

// Sync lots to inventory for a specific warehouse
const result = await syncLotQuantityToInventory({
  productId: 123,
  warehouseId: 1,
});

console.log(result);
// { totalQuantity: 150, error: null }
```

### 2. `syncAllLotsToInventory` - Sync All Warehouses

Syncs lot quantities for all warehouses of a product.

```typescript
import { syncAllLotsToInventory } from "@nam-viet-erp/services";

// Sync all lots to inventory for a product
const result = await syncAllLotsToInventory(123);

console.log(result);
// {
//   success: true,
//   warehousesSynced: 3,
//   error: null
// }
```

## Use Cases

### Use Case 1: After Adding/Updating Lot Quantities

When you modify lot quantities, sync them to inventory:

```typescript
import {
  updateProductLotQuantity,
  syncLotQuantityToInventory,
} from "@nam-viet-erp/services";

// Update lot quantity
await updateProductLotQuantity({
  lotId: 456,
  productId: 123,
  warehouseId: 1,
  newQuantityAvailable: 100,
});

// Sync to inventory
await syncLotQuantityToInventory({
  productId: 123,
  warehouseId: 1,
});
```

### Use Case 2: Bulk Sync After Import

After importing lots, sync all to inventory:

```typescript
import { syncAllLotsToInventory } from "@nam-viet-erp/services";

// After importing lots for products
const productIds = [123, 124, 125];

for (const productId of productIds) {
  const result = await syncAllLotsToInventory(productId);
  console.log(
    `Product ${productId}: Synced ${result.warehousesSynced} warehouses`,
  );
}
```

### Use Case 3: Sync in React Component

Use in a React component with notifications:

```typescript
import { syncAllLotsToInventory } from "@nam-viet-erp/services";
import { App } from "antd";

const MyComponent = () => {
  const { notification } = App.useApp();

  const handleSyncInventory = async (productId: number) => {
    try {
      const result = await syncAllLotsToInventory(productId);

      if (result.success) {
        notification.success({
          message: "Đồng bộ thành công!",
          description: `Đã đồng bộ ${result.warehousesSynced} kho`,
        });
      } else {
        throw result.error;
      }
    } catch (error) {
      notification.error({
        message: "Lỗi đồng bộ",
        description: error?.message,
      });
    }
  };

  return (
    <Button onClick={() => handleSyncInventory(123)}>
      Đồng bộ tồn kho
    </Button>
  );
};
```

## Database Function (SQL)

The migration also creates a PostgreSQL function you can call directly:

```sql
-- Sync lots to inventory for a product
SELECT sync_lots_to_inventory(123);

-- Result:
-- {
--   "success": true,
--   "warehouses_synced": 3,
--   "product_id": 123
-- }
```

## How It Works

1. **Reads product_lots**: Queries all lots for the product/warehouse
2. **Calculates total**: Sums up all `quantity` values
3. **Updates inventory**: Upserts the total to inventory table

### Example Data Flow:

**product_lots table:**

```
| id  | product_id | warehouse_id | lot_number    | quantity |
|-----|------------|--------------|---------------|----------|
| 1   | 123        | 1            | LOT-001       | 50       |
| 2   | 123        | 1            | LOT-002       | 30       |
| 3   | 123        | 1            | Lô mặc định   | 20       |
```

**After sync, inventory table:**

```
| product_id | warehouse_id | quantity |
|------------|--------------|----------|
| 123        | 1            | 100      |  ← Sum of all lots
```

## Best Practices

### 1. Sync After Batch Operations

```typescript
// After creating multiple lots
for (const lotData of lotsToCreate) {
  await createProductLotWithInventory(lotData);
}

// Sync once at the end
await syncAllLotsToInventory(productId);
```

### 2. Use in Background Jobs

```typescript
// Scheduled sync job (e.g., every hour)
const syncInventoryJob = async () => {
  const { data: products } = await supabase
    .from("products")
    .select("id")
    .eq("enable_lot_management", true);

  for (const product of products || []) {
    await syncAllLotsToInventory(product.id);
  }
};
```

### 3. Sync on Enable Lot Management

Already implemented in `enableLotManagement()`:

- Copies inventory → product_lots
- Inventory stays in sync automatically

## Troubleshooting

### Inventory showing wrong quantity

**Solution**: Run sync function

```typescript
await syncAllLotsToInventory(productId);
```

### Sync fails with permission error

**Solution**: Ensure migration was run with proper grants

```sql
GRANT EXECUTE ON FUNCTION sync_lots_to_inventory(INTEGER) TO authenticated;
```

### Negative quantities after sync

**Problem**: Lots have negative or incorrect quantities
**Solution**: Fix lot quantities first, then sync

```typescript
// Fix lot quantities
await updateProductLotQuantity({
  lotId: 456,
  productId: 123,
  warehouseId: 1,
  newQuantityAvailable: 50, // Correct value
});

// Then sync
await syncLotQuantityToInventory({
  productId: 123,
  warehouseId: 1,
});
```
