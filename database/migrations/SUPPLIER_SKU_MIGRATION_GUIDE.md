# Supplier-Specific SKU Migration Guide

## Overview

This migration adds support for supplier-specific SKU/product codes in the `product_supplier_mapping` table. Each supplier can have their own SKU for the same product.

## Migration Details

**Date**: 2025-10-25
**Table Affected**: `product_supplier_mapping`
**Column Added**: `supplier_product_code VARCHAR(100)`

## Use Case

A product may be sold by multiple suppliers, and each supplier may use a different SKU/product code for the same product. This feature allows you to:

- Store each supplier's unique SKU for a product
- Look up products by supplier-specific codes
- Track supplier-specific information

### Example

**Product**: Paracetamol 500mg
**Your SKU**: PARA-500

**Suppliers**:

- Supplier A uses code: SUP-A-12345
- Supplier B uses code: SUPB-PARA-500
- Supplier C uses code: C-54321

## Migration Steps

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the entire content from `add_supplier_product_code_to_product_supplier_mapping.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

4. **Verify the Migration**

   ```sql
   -- Check if column was added
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'product_supplier_mapping'
   AND column_name = 'supplier_product_code';

   -- Check if index was created
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'product_supplier_mapping'
   AND indexname = 'idx_product_supplier_mapping_supplier_code';
   ```

### Method 2: Using Supabase CLI

```bash
supabase db push --file database/migrations/add_supplier_product_code_to_product_supplier_mapping.sql
```

### Method 3: Using psql

```bash
psql "your-connection-string" -f database/migrations/add_supplier_product_code_to_product_supplier_mapping.sql
```

## What the Migration Does

1. **Adds supplier_product_code column** to `product_supplier_mapping` table
   - Type: `VARCHAR(100)`
   - Nullable: Yes (optional field)
   - Allows each supplier to have their own SKU for a product

2. **Adds column comment** for documentation

3. **Creates index** for faster lookups by supplier product code

## Frontend Implementation

### ProductForm Component

The ProductForm now includes:

1. **Multi-Select for Suppliers**
   - Select multiple suppliers for a product

2. **SKU Input for Each Supplier**
   - After selecting suppliers, input fields appear for each supplier
   - Enter the supplier-specific SKU for each supplier
   - Format: `[Supplier Name] | [SKU Input Field]`

3. **Auto-Save**
   - Supplier SKU mappings are automatically saved with the product

### How to Use (User Perspective)

1. **Edit/Create Product** → Go to EditProductPage
2. **Select Suppliers** → Choose one or more suppliers from dropdown
3. **Enter Supplier SKUs** → Below the supplier dropdown, enter each supplier's SKU
4. **Save Product** → All mappings are saved automatically

## Database Schema

### Product Supplier Mapping Table

```sql
product_supplier_mapping (
  id                    SERIAL PRIMARY KEY,
  product_id            INTEGER REFERENCES products(id),
  supplier_id           INTEGER REFERENCES suppliers(id),
  is_primary            BOOLEAN DEFAULT FALSE,
  supplier_product_code VARCHAR(100), -- Supplier's SKU/product code
  unit_price            DECIMAL(10,2),
  lead_time_days        INTEGER,
  created_at            TIMESTAMP DEFAULT NOW(),
  updated_at            TIMESTAMP DEFAULT NOW()
)
```

## Verification Queries

```sql
-- View all product-supplier mappings with SKUs
SELECT
  p.name as product_name,
  p.sku as internal_sku,
  s.name as supplier_name,
  psm.supplier_product_code as supplier_sku,
  psm.is_primary
FROM product_supplier_mapping psm
JOIN products p ON psm.product_id = p.id
JOIN suppliers s ON psm.supplier_id = s.id
ORDER BY p.name, s.name;

-- Find products by supplier SKU
SELECT
  p.*,
  s.name as supplier_name,
  psm.supplier_product_code
FROM products p
JOIN product_supplier_mapping psm ON p.id = psm.product_id
JOIN suppliers s ON psm.supplier_id = s.id
WHERE psm.supplier_product_code = 'SUP-A-12345';

-- Check products with multiple suppliers
SELECT
  p.id,
  p.name,
  COUNT(psm.id) as supplier_count,
  STRING_AGG(s.name || ': ' || COALESCE(psm.supplier_product_code, 'N/A'), ', ') as suppliers_and_skus
FROM products p
JOIN product_supplier_mapping psm ON p.id = psm.product_id
JOIN suppliers s ON psm.supplier_id = s.id
GROUP BY p.id, p.name
HAVING COUNT(psm.id) > 1
ORDER BY supplier_count DESC;
```

## Rollback

If you need to rollback this migration:

```sql
-- Drop the index first
DROP INDEX IF EXISTS idx_product_supplier_mapping_supplier_code;

-- Remove the supplier_product_code column
ALTER TABLE product_supplier_mapping
DROP COLUMN IF EXISTS supplier_product_code;
```

Or run: `rollback_add_supplier_product_code.sql`

## Impact Assessment

- **Existing Data**: No data loss - column is nullable
- **Application Code**: Frontend updated with supplier SKU UI
- **TypeScript Interfaces**: Already supports `supplier_product_code`
- **Performance**: Index added for fast lookups

## Testing Checklist

- [ ] Run migration in Supabase
- [ ] Verify column exists
- [ ] Verify index exists
- [ ] Edit a product and add multiple suppliers
- [ ] Enter different SKUs for each supplier
- [ ] Save and verify SKUs are stored
- [ ] Edit product again and verify SKUs are loaded
- [ ] Test supplier SKU lookup queries

## API/Service Layer

The following services already support supplier SKU:

- `getProductSupplierMappings(productId)` - Returns mappings with SKUs
- `createProductSupplierMapping(mapping)` - Create with supplier_product_code
- `updateProductSupplierMapping(id, updates)` - Update supplier_product_code

## Troubleshooting

**Error: "column supplier_product_code already exists"**
→ Column already exists, migration is safe to skip

**SKUs not saving**
→ Check browser console for errors
→ Verify `supplier_sku_mappings` state is being passed in form submission

**SKUs not loading on edit**
→ Check `getProductSupplierMappings` returns data
→ Verify `supplier_product_code` field exists in response

## Support

For issues or questions:

- Check migration file: `add_supplier_product_code_to_product_supplier_mapping.sql`
- Check rollback file: `rollback_add_supplier_product_code.sql`
- Review supplier service: `packages/services/src/supplierService.ts`

---

**Migration Status**: Ready to apply
**Risk Level**: Low (non-breaking change, nullable column)
**Estimated Time**: < 1 minute
**Requires Downtime**: No
