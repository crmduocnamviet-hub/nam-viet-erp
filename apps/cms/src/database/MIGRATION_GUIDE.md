# Warehouse Management Migration Guide

## Overview
This guide explains how to run the warehouse management features migration to add auto-generate purchase orders functionality.

## Migration File
- **File**: `add-warehouse-management-fields.sql`
- **Purpose**: Adds warehouse management fields to existing tables without creating new tables or affecting existing data

## What This Migration Does

### 1. Updates `products` table
- Adds `min_stock` (minimum stock level that triggers auto-ordering)
- Adds `max_stock` (target stock level for restocking)
- Adds `batch_number` (current batch/lot number)
- Adds `expiry_date` (expiry date for current batch)
- Adds `supplier_id` (reference to primary supplier)

### 2. Updates `suppliers` table
- Adds missing fields: `code`, `phone`, `email`, `address`, `tax_code`, `contact_person`, `payment_terms`, `notes`, `is_active`, `updated_at`

### 3. Creates `product_supplier_mapping` table (NEW)
- Maps internal products to supplier product codes
- Supports AI OCR matching for invoice processing
- Tracks cost price, lead time, and minimum order quantity per supplier

### 4. Updates `purchase_orders` table
- Adds `po_number` (unique PO number in format PO-00001)
- Adds `order_date`, `expected_delivery_date`, `total_amount`, `updated_at`
- Auto-generates PO numbers for existing orders

### 5. Creates `purchase_order_items` table (NEW)
- Line items for purchase orders
- Tracks ordered quantity vs received quantity
- Links to products and purchase orders

## How to Run the Migration

### Option 1: Supabase SQL Editor (Recommended)
1. Log in to your Supabase project dashboard
2. Go to the SQL Editor
3. Copy the entire contents of `add-warehouse-management-fields.sql`
4. Paste into a new query
5. Click "Run" to execute

### Option 2: psql Command Line
```bash
psql -h your-db-host -U postgres -d your-database -f add-warehouse-management-fields.sql
```

## Post-Migration Steps

### 1. Set Min/Max Stock Levels
After running the migration, you need to set min_stock and max_stock values for products:

```sql
-- Example: Set min/max stock for specific products
UPDATE products
SET min_stock = 10, max_stock = 50
WHERE id = 1;

-- Or bulk update based on product type
UPDATE products
SET min_stock = 5, max_stock = 30
WHERE product_type = 'medicine';
```

### 2. Assign Suppliers to Products
```sql
-- Assign primary supplier to products
UPDATE products
SET supplier_id = 1
WHERE category = 'Thuốc kháng sinh';
```

### 3. Test Auto-Generate Function
1. Navigate to Purchase Orders page in the app
2. Click "Tạo Dự trù & Lên Đơn hàng Loạt" button
3. System will scan inventory and create draft purchase orders for products below min_stock

## Verification

After migration, verify the changes:

```sql
-- Check if new columns exist in products table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name IN ('min_stock', 'max_stock', 'batch_number', 'expiry_date', 'supplier_id');

-- Check if new tables were created
SELECT table_name
FROM information_schema.tables
WHERE table_name IN ('product_supplier_mapping', 'purchase_order_items');

-- Check if PO numbers were generated
SELECT id, po_number, created_at
FROM purchase_orders
LIMIT 10;
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove added columns from products
ALTER TABLE products
DROP COLUMN IF EXISTS min_stock,
DROP COLUMN IF EXISTS max_stock,
DROP COLUMN IF EXISTS batch_number,
DROP COLUMN IF EXISTS expiry_date,
DROP COLUMN IF EXISTS supplier_id;

-- Drop new tables
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS product_supplier_mapping;

-- Remove added columns from purchase_orders
ALTER TABLE purchase_orders
DROP COLUMN IF EXISTS po_number,
DROP COLUMN IF EXISTS order_date,
DROP COLUMN IF EXISTS expected_delivery_date,
DROP COLUMN IF EXISTS total_amount,
DROP COLUMN IF EXISTS updated_at;
```

## Next Steps

After successful migration:
1. Configure min/max stock levels for your products
2. Assign primary suppliers to products
3. Test the auto-generate purchase orders feature
4. Proceed with implementing the remaining warehouse features:
   - NÚT 2: OCR/AI for batch number and expiry date input
   - NÚT 3: Barcode scanning for order verification
   - NÚT 4: VAT invoice reconciliation

## Support

If you encounter any issues during migration:
1. Check the Supabase logs for detailed error messages
2. Verify that all referenced tables exist (products, suppliers, purchase_orders)
3. Ensure you have proper database permissions
4. Review the migration file for any syntax errors
