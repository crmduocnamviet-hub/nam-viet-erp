-- Migration: Add unique constraint for lot_number within warehouse and product
-- Date: 2025-10-09
-- Description: Ensure lot_number cannot be duplicated within the same warehouse for the same product

-- Add unique constraint
ALTER TABLE product_lots
ADD CONSTRAINT unique_lot_number_per_warehouse_product
UNIQUE (product_id, warehouse_id, lot_number);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_product_lots_unique_check
ON product_lots(product_id, warehouse_id, lot_number);

COMMENT ON CONSTRAINT unique_lot_number_per_warehouse_product ON product_lots
IS 'Ensures lot_number is unique per product per warehouse';
