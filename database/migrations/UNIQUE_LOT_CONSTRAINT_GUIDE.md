# Unique Lot Number Constraint

## Problem

Multiple lots with the same `lot_number` could exist in the same warehouse for the same product, causing confusion and data integrity issues.

## Solution

Added a unique constraint to ensure `lot_number` is unique per product per warehouse.

## Migration

Run this SQL in Supabase SQL Editor:

```sql
ALTER TABLE product_lots
ADD CONSTRAINT unique_lot_number_per_warehouse_product
UNIQUE (product_id, warehouse_id, lot_number);

CREATE INDEX IF NOT EXISTS idx_product_lots_unique_check
ON product_lots(product_id, warehouse_id, lot_number);
```

## How to Apply

### Option 1: Using Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Run the migration file: `add_unique_lot_number_constraint.sql`
3. Verify constraint exists:

```sql
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'product_lots'::regclass
AND conname = 'unique_lot_number_per_warehouse_product';
```

### Option 2: Check Existing Data First

Before adding the constraint, check if you have any duplicates:

```sql
SELECT product_id, warehouse_id, lot_number, COUNT(*)
FROM product_lots
GROUP BY product_id, warehouse_id, lot_number
HAVING COUNT(*) > 1;
```

If duplicates exist, you need to clean them up first:

```sql
-- Find duplicates
WITH duplicates AS (
  SELECT
    product_id,
    warehouse_id,
    lot_number,
    array_agg(id ORDER BY created_at) as ids
  FROM product_lots
  GROUP BY product_id, warehouse_id, lot_number
  HAVING COUNT(*) > 1
)
SELECT
  product_id,
  warehouse_id,
  lot_number,
  ids[1] as keep_id,
  ids[2:] as delete_ids
FROM duplicates;

-- Manually review and delete duplicates
-- DELETE FROM product_lots WHERE id IN (...);
```

## Error Handling

### Backend (lotManagementService.ts)

The Supabase error for duplicate key violations:

- Error code: `23505`
- Error message contains: `"unique_lot_number_per_warehouse_product"` or `"duplicate key"`

### Frontend (AddLotModal.tsx)

Displays user-friendly error:

```typescript
catch (error: any) {
  const isDuplicate =
    error.message?.includes("unique_lot_number_per_warehouse_product") ||
    error.message?.includes("duplicate key") ||
    error.code === "23505";

  notification.error({
    message: isDuplicate ? "Số lô đã tồn tại" : "Lỗi tạo lô hàng",
    description: isDuplicate
      ? `Số lô "${values.lot_number}" đã tồn tại trong kho này. Vui lòng sử dụng số lô khác.`
      : error.message || "Không thể tạo lô hàng.",
  });
}
```

## User Experience

**Before:**

- User creates lot "LOT-001" in Warehouse A ✅
- User creates lot "LOT-001" in Warehouse A again ✅ (duplicate allowed)
- Confusion: Which lot is which?

**After:**

- User creates lot "LOT-001" in Warehouse A ✅
- User tries to create lot "LOT-001" in Warehouse A again ❌
- Error: "Số lô 'LOT-001' đã tồn tại trong kho này. Vui lòng sử dụng số lô khác."

**Valid scenarios:**

- ✅ LOT-001 in Warehouse A (Product 123)
- ✅ LOT-001 in Warehouse B (Product 123) - Different warehouse
- ✅ LOT-002 in Warehouse A (Product 123) - Different lot number
- ✅ LOT-001 in Warehouse A (Product 456) - Different product
- ❌ LOT-001 in Warehouse A (Product 123) - Duplicate!

## Benefits

✅ **Data integrity** - No duplicate lot numbers in same warehouse
✅ **Clear errors** - User-friendly error messages
✅ **Prevents confusion** - Each lot has unique identifier per warehouse
✅ **Database-level enforcement** - Cannot bypass validation

## Testing

### Test Case 1: Create duplicate in same warehouse

1. Create lot "LOT-001" in Warehouse A
2. Try to create lot "LOT-001" in Warehouse A again
3. ✅ Should show error: "Số lô đã tồn tại"

### Test Case 2: Create same lot number in different warehouse

1. Create lot "LOT-001" in Warehouse A
2. Create lot "LOT-001" in Warehouse B
3. ✅ Should succeed (different warehouses)

### Test Case 3: Create different lot numbers in same warehouse

1. Create lot "LOT-001" in Warehouse A
2. Create lot "LOT-002" in Warehouse A
3. ✅ Should succeed (different lot numbers)

## Rollback

If you need to remove the constraint:

```sql
ALTER TABLE product_lots
DROP CONSTRAINT IF EXISTS unique_lot_number_per_warehouse_product;

DROP INDEX IF EXISTS idx_product_lots_unique_check;
```

## Summary

✅ Added database constraint for lot number uniqueness
✅ Frontend error handling for duplicate detection
✅ User-friendly error messages in Vietnamese
✅ Prevents data integrity issues

Now lot numbers must be unique per warehouse per product!
