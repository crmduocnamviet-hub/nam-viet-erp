# Auto-Sync Inventory Summary

## Overview

All product lot operations now **automatically sync** quantities to the inventory table. No manual sync calls needed!

## Updated Functions

### ✅ Auto-Sync Enabled:

1. **`createProductLotWithInventory()`**
   - Creates lot in `product_lots` table
   - ✨ **Auto-syncs** to inventory

2. **`updateProductLotQuantity()`**
   - Updates lot quantity in `product_lots` table
   - ✨ **Auto-syncs** to inventory

3. **`deleteProductLot()`**
   - Deletes lot from `product_lots` table
   - ✨ **Auto-syncs** to inventory (recalculates total)

4. **`enableLotManagement()`**
   - Copies inventory → product_lots
   - ✨ **Auto-syncs** back to inventory (ensures consistency)

## How It Works

### Before (Manual Sync):

```typescript
// Create lot
await createProductLotWithInventory({...});

// Manual sync required ❌
await syncLotQuantityToInventory({
  productId: 123,
  warehouseId: 1
});
```

### After (Auto Sync):

```typescript
// Create lot - syncs automatically ✅
await createProductLotWithInventory({...});

// Inventory is already synced! 🎉
```

## Data Flow

```
┌─────────────────────────┐
│  Update/Create Lot      │
│  in product_lots        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Calculate Total        │
│  SUM(quantity)          │
│  per warehouse          │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Update inventory       │
│  table automatically    │
└─────────────────────────┘
```

## Examples

### Creating a Lot

```typescript
import { createProductLotWithInventory } from "@nam-viet-erp/services";

// Create lot - inventory auto-syncs
const { data, error } = await createProductLotWithInventory({
  lot_number: "LOT-001",
  product_id: 123,
  warehouse_id: 1,
  quantity: 100,
  expiry_date: "2025-12-31",
  received_date: "2025-01-15",
});

// Inventory table now shows: { product_id: 123, warehouse_id: 1, quantity: 100 }
```

### Updating Lot Quantity

```typescript
import { updateProductLotQuantity } from "@nam-viet-erp/services";

// Update lot - inventory auto-syncs
await updateProductLotQuantity({
  lotId: 456,
  productId: 123,
  warehouseId: 1,
  newQuantityAvailable: 150,
});

// Inventory automatically updated to 150
```

### Deleting a Lot

```typescript
import { deleteProductLot } from "@nam-viet-erp/services";

// Delete lot - inventory auto-syncs
await deleteProductLot({
  lotId: 456,
  productId: 123,
  warehouseId: 1,
});

// Inventory recalculated: SUM of remaining lots
```

### Using in React Component

```typescript
import { useUpdateQuantityByLot } from "@nam-viet-erp/store";

const MyComponent = () => {
  const { submit: updateQuantity } = useUpdateQuantityByLot({
    lotId: 456,
    onSuccess: () => {
      notification.success({ message: "Updated!" });
      // Inventory is already synced - no extra calls needed!
    }
  });

  const handleUpdate = () => {
    updateQuantity({
      lotId: 456,
      productId: 123,
      warehouseId: 1,
      newQuantityAvailable: 200,
    });
    // Done! Inventory auto-synced ✅
  };

  return <Button onClick={handleUpdate}>Update Quantity</Button>;
};
```

## Schema Changes

### product_lots Table (New):

```sql
CREATE TABLE product_lots (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  lot_number VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,  -- Stored per warehouse
  received_date DATE,
  expiry_date DATE,
  batch_code VARCHAR(100),
  ...
);
```

### inventory Table (Auto-Synced):

```sql
CREATE TABLE inventory (
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  quantity INTEGER,  -- Auto-synced from product_lots
  PRIMARY KEY (product_id, warehouse_id)
);
```

## Benefits

✅ **No manual sync calls** - happens automatically  
✅ **Always in sync** - inventory reflects real-time lot totals  
✅ **Simpler code** - less boilerplate  
✅ **Fewer bugs** - no forgotten sync calls  
✅ **Better UX** - immediate consistency

## Migration Impact

### Old Code (Still Works):

```typescript
// Manual sync still works if needed
await syncLotQuantityToInventory({ productId, warehouseId });
await syncAllLotsToInventory(productId);
```

### New Code (Recommended):

```typescript
// Just use the CRUD functions - they auto-sync
await createProductLotWithInventory({...});
await updateProductLotQuantity({...});
await deleteProductLot({...});
```

## Troubleshooting

### Inventory showing wrong quantity?

**Rare case** - Run manual sync:

```typescript
await syncAllLotsToInventory(productId);
```

### Need to sync multiple products?

```typescript
const productIds = [123, 124, 125];
for (const id of productIds) {
  await syncAllLotsToInventory(id);
}
```

## Summary

🎉 **All lot operations now auto-sync to inventory!**

- Create lot → Auto-sync ✅
- Update lot → Auto-sync ✅
- Delete lot → Auto-sync ✅
- Enable lot management → Auto-sync ✅

No manual sync calls needed in your components!
