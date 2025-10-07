-- Migration: Restructure product_lots and inventory tables
-- Date: 2025-10-07
-- Description:
--   1. Add lot_id foreign key to inventory table
--   2. Simplify product_lots table to only essential fields
--   3. Move quantity tracking to inventory table only

-- Step 1: Add lot_id column to inventory table
ALTER TABLE inventory
ADD COLUMN lot_id INTEGER;

-- Step 2: Add foreign key constraint
ALTER TABLE inventory
ADD CONSTRAINT fk_inventory_lot
FOREIGN KEY (lot_id)
REFERENCES product_lots(id)
ON DELETE SET NULL;

-- Step 3: Create index for performance
CREATE INDEX idx_inventory_lot_id ON inventory(lot_id);

-- Step 4: Drop unnecessary columns from product_lots table
-- (Keep only: id, lot_number, product_id, batch_code, expiry_date, received_date, created_at, updated_at)

ALTER TABLE product_lots
DROP COLUMN IF EXISTS warehouse_id,
DROP COLUMN IF EXISTS quantity_received,
DROP COLUMN IF EXISTS quantity_available,
DROP COLUMN IF EXISTS quantity_reserved,
DROP COLUMN IF EXISTS quantity_sold,
DROP COLUMN IF EXISTS quantity_damaged,
DROP COLUMN IF EXISTS quantity_returned,
DROP COLUMN IF EXISTS unit_price_before_vat,
DROP COLUMN IF EXISTS unit_price_with_vat,
DROP COLUMN IF EXISTS final_unit_cost,
DROP COLUMN IF EXISTS shelf_location,
DROP COLUMN IF EXISTS has_vat_invoice,
DROP COLUMN IF EXISTS manufacturing_date;

-- Step 5: Drop any check constraints on product_lots that reference removed columns
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'product_lots'::regclass
        AND contype = 'c'
    LOOP
        EXECUTE 'ALTER TABLE product_lots DROP CONSTRAINT IF EXISTS ' || constraint_name || ' CASCADE';
    END LOOP;
END $$;

-- Step 6: Add received_date if it doesn't exist
ALTER TABLE product_lots
ADD COLUMN IF NOT EXISTS received_date DATE;

-- Step 7: Add batch_code if it doesn't exist
ALTER TABLE product_lots
ADD COLUMN IF NOT EXISTS batch_code VARCHAR(255);

-- Step 8: Update inventory records to link to lots (if you have existing data)
-- This is a placeholder - you'll need to define the logic based on your data
-- Example: Link inventory to default lot for each product/warehouse
-- UPDATE inventory i
-- SET lot_id = (
--     SELECT id
--     FROM product_lots pl
--     WHERE pl.product_id = i.product_id
--     AND pl.lot_number = 'Mặc định'
--     LIMIT 1
-- );

-- Step 9: Create a comment to document the changes
COMMENT ON COLUMN inventory.lot_id IS 'Foreign key to product_lots table. Links inventory to a specific product lot.';
COMMENT ON TABLE product_lots IS 'Stores lot/batch information for products. Quantities are tracked in inventory table.';
