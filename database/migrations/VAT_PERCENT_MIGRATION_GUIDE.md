# VAT Percent Migration Guide

## Overview

This migration adds a `vat_percent` column to the `products` table to support per-product VAT percentage management. Each product can now have its own VAT percentage which will be automatically applied when adding the product to B2B orders.

## Migration Details

**Date**: 2025-10-25
**Table Affected**: `products`
**Column Added**: `vat_percent DECIMAL(5,2) DEFAULT 5.00`

## Features

- Per-product VAT percentage selection (0%, 1%, 2%, 3%, 5%)
- Default VAT of 5% for all products
- Data validation constraint to ensure only valid VAT values
- Backwards compatible with existing data

## Migration Steps

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the entire content from `add_vat_percent_to_products.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

4. **Verify the Migration**

   ```sql
   -- Check if column was added
   SELECT column_name, data_type, column_default
   FROM information_schema.columns
   WHERE table_name = 'products'
   AND column_name = 'vat_percent';

   -- Check if constraint was created
   SELECT constraint_name, constraint_type
   FROM information_schema.table_constraints
   WHERE table_name = 'products'
   AND constraint_name = 'check_product_vat_percent_valid';

   -- Verify existing data was updated
   SELECT vat_percent, COUNT(*) as count
   FROM products
   GROUP BY vat_percent;
   ```

### Method 2: Using Supabase CLI

1. **Install Supabase CLI** (if not already installed)

   ```bash
   npm install -g supabase
   ```

2. **Apply migration**
   ```bash
   supabase db push --file database/migrations/add_vat_percent_to_products.sql
   ```

### Method 3: Using psql

```bash
psql "your-connection-string" -f database/migrations/add_vat_percent_to_products.sql
```

## What the Migration Does

1. **Adds vat_percent column** to `products` table
   - Type: `DECIMAL(5,2)`
   - Default: `5.00` (5%)
   - Allows NULL initially for safety

2. **Adds column comment** for documentation

3. **Creates check constraint** to ensure only valid VAT percentages (0%, 1%, 2%, 3%, 5%)

4. **Updates existing records** to have default VAT of 5%

## Rollback

If you need to rollback this migration:

```bash
# Using Supabase Dashboard: Run rollback_add_vat_percent_to_products.sql
# OR using psql:
psql "your-connection-string" -f database/migrations/rollback_add_vat_percent_to_products.sql
```

## Verification Queries

```sql
-- View the updated table structure
\d products

-- Check all products with their VAT percentages
SELECT
  id,
  name,
  sku,
  wholesale_price,
  vat_percent,
  manufacturer
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- Group products by VAT percentage
SELECT
  vat_percent,
  COUNT(*) as product_count,
  AVG(wholesale_price) as avg_price
FROM products
GROUP BY vat_percent
ORDER BY vat_percent;
```

## Impact Assessment

- **Existing Data**: All existing products will be updated to have 5% VAT
- **Application Code**: Frontend updated with VAT field in ProductForm
- **TypeScript Interfaces**: `IProduct` interface updated with `vat_percent?: number`
- **Order Creation**: When adding products to B2B orders, the product's VAT percentage is automatically used
- **Calculations**: Order totals include per-product VAT in calculation flow

## Testing

After migration, test the following:

1. ✅ Edit a product and change its VAT percentage (in EditProductPage)
2. ✅ Create a new product with a specific VAT percentage
3. ✅ Add product to B2B order and verify VAT is automatically applied
4. ✅ Verify VAT calculation in order summary
5. ✅ Check that only valid VAT values (0, 1, 2, 3, 5) can be saved
6. ✅ Test PDF export includes VAT breakdown

## Troubleshooting

**Error: "column vat_percent already exists"**
→ Migration already applied, no action needed

**Error: "constraint check_vat_percent_valid already exists"**
→ Constraint already created, skip or drop first

**VAT values not showing in UI**
→ Clear browser cache and verify frontend deployment

**Invalid VAT percentage error**
→ Check constraint is working - only 0, 1, 2, 3, 5 are allowed

## Support

For issues or questions, check:

- Application logs for errors
- Supabase dashboard for query performance
- TypeScript compiler for type mismatches

---

**Migration Status**: Ready to apply
**Risk Level**: Low (non-breaking change with default values)
**Estimated Time**: < 1 minute
**Requires Downtime**: No
