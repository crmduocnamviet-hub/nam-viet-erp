# Product Lot Management Migration Guide

## Overview

This guide explains how to migrate your Supabase database to support the new lot management system where quantities are stored in `product_lots` table per warehouse.

## Migration Steps

### Method 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Migration Script**
   - Copy the entire content from `migrate-lot-management-refactor.sql`
   - Paste into the SQL editor
   - Click "Run" or press `Ctrl/Cmd + Enter`

4. **Verify the Migration**

   ```sql
   -- Check if indexes were created
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename IN ('product_lots', 'products')
   AND indexname LIKE '%lot%';

   -- Check if functions were created
   SELECT routine_name, routine_type
   FROM information_schema.routines
   WHERE routine_name IN ('migrate_inventory_to_lots', 'remove_all_lots');
   ```

5. **Optional: Migrate Existing Products**
   If you have products with `enable_lot_management = TRUE`:
   ```sql
   DO $$
   DECLARE
     v_product RECORD;
     v_result JSON;
   BEGIN
     FOR v_product IN
       SELECT id, name
       FROM products
       WHERE enable_lot_management = TRUE
     LOOP
       v_result := migrate_inventory_to_lots(v_product.id);
       RAISE NOTICE 'Product %: % - Result: %',
         v_product.id,
         v_product.name,
         v_result::text;
     END LOOP;
   END $$;
   ```

### Method 2: Using Supabase CLI

1. **Install Supabase CLI**

   ```bash
   npm install -g supabase
   ```

2. **Apply migration**
   ```bash
   supabase db push --file apps/cms/src/database/migrate-lot-management-refactor.sql
   ```

### Method 3: Using psql

```bash
psql "your-connection-string" -f apps/cms/src/database/migrate-lot-management-refactor.sql
```

## What the Migration Does

1. **Creates Indexes** for better performance
2. **Creates Helper Functions**:
   - `migrate_inventory_to_lots(product_id)` - Copy inventory to lots
   - `remove_all_lots(product_id)` - Delete all lots

## Verification

```sql
-- Check products with lot management
SELECT id, name, enable_lot_management
FROM products
WHERE enable_lot_management = TRUE;

-- Check created lots
SELECT pl.*, p.name, w.name
FROM product_lots pl
JOIN products p ON pl.product_id = p.id
JOIN warehouses w ON pl.warehouse_id = w.id;
```

## Troubleshooting

**Error: "product_lots table missing warehouse_id"**
→ Run `lot-management-v2.sql` first

**Lots not appearing**
→ Check if inventory has quantity > 0
→ Verify `enable_lot_management = TRUE`
