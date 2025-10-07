-- Rollback Migration: Restructure product_lots and inventory tables
-- Date: 2025-10-07
-- Description: Rollback script to restore original schema

-- WARNING: This rollback will result in data loss for:
-- - inventory.lot_id associations
-- - All removed product_lots columns data

-- Step 1: Remove lot_id from inventory table
ALTER TABLE inventory
DROP COLUMN IF EXISTS lot_id CASCADE;

-- Step 2: Re-add columns to product_lots (you'll need to restore data separately)
ALTER TABLE product_lots
ADD COLUMN IF NOT EXISTS warehouse_id INTEGER,
ADD COLUMN IF NOT EXISTS quantity_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_reserved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_damaged INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quantity_returned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_price_before_vat NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS unit_price_with_vat NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS final_unit_cost NUMERIC(15,2),
ADD COLUMN IF NOT EXISTS shelf_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS has_vat_invoice BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS manufacturing_date DATE;

-- Step 3: Re-add foreign key for warehouse_id
ALTER TABLE product_lots
ADD CONSTRAINT fk_product_lots_warehouse
FOREIGN KEY (warehouse_id)
REFERENCES warehouses(id)
ON DELETE CASCADE;

-- Step 4: Re-add check constraint for quantity balance
ALTER TABLE product_lots
ADD CONSTRAINT check_quantity_balance
CHECK (
    quantity_available + quantity_reserved + quantity_sold +
    COALESCE(quantity_damaged, 0) + COALESCE(quantity_returned, 0) <= quantity_received
);

-- Note: Data restoration must be done separately from backups
