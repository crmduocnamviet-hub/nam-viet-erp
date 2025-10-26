# Quick Guide: Apply Supplier SKU Migration

## ⚡ Quick Start (Supabase Dashboard)

1. **Go to your Supabase project**: https://supabase.com/dashboard
2. **Click "SQL Editor"** in the left sidebar
3. **Click "New Query"**
4. **Copy and paste this SQL**:

```sql
-- Migration: Add supplier_product_code to product_supplier_mapping table
-- Purpose: Store supplier-specific SKU for each product-supplier relationship
-- Date: 2025-10-25

-- Add supplier_product_code column
ALTER TABLE product_supplier_mapping
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN product_supplier_mapping.supplier_product_code IS
  'Supplier-specific SKU/product code for this product';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_supplier_code
ON product_supplier_mapping(supplier_product_code);
```

5. **Click "Run"** (or press `Ctrl/Cmd + Enter`)
6. **Done!** ✅

## 🔍 Verify It Worked

Run this query to check:

```sql
-- Check if column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'product_supplier_mapping'
AND column_name = 'supplier_product_code';
```

You should see:

```
column_name           | data_type
----------------------|-------------------
supplier_product_code | character varying
```

## 📝 What This Does

- ✅ Adds `supplier_product_code` column to store supplier's SKU
- ✅ Optional field - products can have it or not
- ✅ Indexed for fast searches
- ✅ Stores primary supplier's product code
- ✅ SKU field disabled until supplier is selected

## 🚀 How to Use (After Migration)

### In ProductForm (EditProductPage):

1. **Select Primary Supplier** → Choose one supplier from dropdown
2. **Enter Supplier SKU** → Input field next to supplier dropdown
3. **Example**:
   ```
   Supplier:          [Pharma Corp ▼        ]
   Supplier SKU:      [PC-PARA-500-TP       ]
   ```
4. **Save** → Supplier and SKU are saved together

### Benefits:

- **Primary Supplier Tracking** → Store main supplier for each product
- **Easy Ordering** → Search by either your SKU or supplier's SKU
- **Better Integration** → Match supplier catalogs and invoices
- **Inventory Management** → Link supplier deliveries to correct products

## 📊 Example Use Case

**Scenario**: You sell Paracetamol 500mg

**Your Internal SKU**: PARA-500
**Primary Supplier**: Pharma Corp
**Supplier's SKU**: PC-PARA-500-TP

**When ordering from Pharma Corp**:

- You receive invoice with code: PC-PARA-500-TP
- System knows this is your PARA-500
- Auto-matches to correct product ✅

## ⚠️ Important Notes

- **No downtime required** - safe, non-breaking change
- **Optional field** - products don't need to have supplier SKUs
- **Existing data** - no impact on current products
- **Frontend ready** - UI already supports this feature

## 🔙 Rollback (if needed)

If you need to remove this feature, run:

```sql
-- Drop the index
DROP INDEX IF EXISTS idx_product_supplier_mapping_supplier_code;

-- Remove the column
ALTER TABLE product_supplier_mapping
DROP COLUMN IF EXISTS supplier_product_code;
```

## 📚 Full Documentation

For detailed information, see:

- `SUPPLIER_SKU_MIGRATION_GUIDE.md` - Complete migration guide
- `SUPPLIER_SKU_IMPLEMENTATION_SUMMARY.md` - Full implementation details

---

**Status**: Ready to apply ✅
**Risk**: Low
**Time**: < 1 minute
**Downtime**: None
