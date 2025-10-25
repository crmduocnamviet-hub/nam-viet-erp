# Supplier SKU Fix Summary

## 🐛 The Problem

You got the error:

```
Could not find the 'supplier_product_code' column of 'products' in the schema cache
```

**Root Cause**: The code was trying to save `supplier_product_code` to the `products` table, but this column should be in the `product_supplier_mapping` table instead.

---

## ✅ The Fix

I've made the following changes to fix this:

### 1. **ProductForm.tsx** - Fixed Data Structure

**Before**: Sent `supplier_product_code` directly with product data
**After**: Sends `supplier_mapping` object separately

```typescript
const finalValues = {
  ...productData,
  image_url: finalImageUrl,
  inventory_settings: inventory_settings || {},
  // Supplier mapping data (separate from product)
  supplier_mapping: supplier_id
    ? {
        supplier_id: supplier_id,
        supplier_product_code: supplierSku,
        is_primary: true,
      }
    : null,
};
```

### 2. **useProduct.ts** - Updated Backend Handler

Added logic to handle supplier mapping separately:

```typescript
// Handle supplier mapping
if (supplier_mapping) {
  // Get existing supplier mappings
  const { data: existingMappings } =
    await getProductSupplierMappings(productId);

  if (existingMappings && existingMappings.length > 0) {
    // Update existing mapping
    const existingMapping = existingMappings[0];
    await updateProductSupplierMapping(existingMapping.id, {
      supplier_id: supplier_mapping.supplier_id,
      supplier_product_code: supplier_mapping.supplier_product_code,
      is_primary: true,
    });
  } else {
    // Create new mapping
    await createProductSupplierMapping({
      product_id: productId,
      supplier_id: supplier_mapping.supplier_id,
      supplier_product_code: supplier_mapping.supplier_product_code,
      is_primary: true,
    });
  }
}
```

**What this does**:

1. Extracts `supplier_mapping` from form values
2. Updates the product (without supplier data)
3. Separately handles supplier mapping:
   - If mapping exists → updates it
   - If no mapping → creates it

---

## 🔧 Required: Database Migration

**IMPORTANT**: You need to run the migration to add the `supplier_product_code` column to the `product_supplier_mapping` table.

### Step 1: Check if column exists

Run this in Supabase SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_supplier_mapping'
AND column_name = 'supplier_product_code';
```

### Step 2: If no results, run the migration

```sql
-- Add supplier_product_code column
ALTER TABLE product_supplier_mapping
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100);

-- Add comment
COMMENT ON COLUMN product_supplier_mapping.supplier_product_code IS
  'Supplier-specific SKU/product code for this product';

-- Add index for fast searches
CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_supplier_code
ON product_supplier_mapping(supplier_product_code);
```

---

## 📋 Files Modified

### Frontend

- ✅ `packages/shared-components/src/components/ProductForm.tsx`
  - Changed supplier select to single-select
  - Sends `supplier_mapping` separately

### Backend

- ✅ `packages/store/src/hooks/useProduct.ts`
  - Added imports for supplier services
  - Added supplier mapping handling in `useUpdateProductHandler`

### Database

- ⏳ **ACTION REQUIRED**: Run migration (see above)

---

## 🧪 Testing

After running the migration, test:

1. **Edit a product**:
   - Select a supplier
   - Enter supplier SKU
   - Save
   - ✅ Should save without errors

2. **Verify database**:

   ```sql
   SELECT
     p.name as product_name,
     p.sku as internal_sku,
     s.name as supplier_name,
     psm.supplier_product_code
   FROM products p
   JOIN product_supplier_mapping psm ON p.id = psm.product_id
   JOIN suppliers s ON psm.supplier_id = s.id
   WHERE p.id = YOUR_PRODUCT_ID;
   ```

3. **Edit again**:
   - Product loads with supplier and SKU
   - Can update and save again

---

## 🎯 How It Works Now

```
┌─────────────────────────────────────────────────┐
│ User edits product in ProductForm               │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ ProductForm sends:                              │
│ - Product data (name, SKU, price, etc.)         │
│ - Inventory settings                            │
│ - Supplier mapping (supplier_id + SKU)          │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│ useUpdateProductHandler receives data           │
└─────────────────────┬───────────────────────────┘
                      │
                      ├──► Update products table
                      │    (without supplier data)
                      │
                      ├──► Update inventory table
                      │    (inventory settings)
                      │
                      └──► Update product_supplier_mapping
                           (supplier_id + supplier_product_code)
```

---

## ✅ Summary

**What was wrong**: Code tried to save `supplier_product_code` to `products` table

**What's fixed**:

- Frontend sends supplier data separately
- Backend saves it to `product_supplier_mapping` table
- Clean separation of concerns

**What you need to do**:

- ✅ Run the database migration (see above)
- ✅ Test editing a product

---

**Status**: ✅ Code fixed, migration required
**Risk**: Low
**Breaking Changes**: None
