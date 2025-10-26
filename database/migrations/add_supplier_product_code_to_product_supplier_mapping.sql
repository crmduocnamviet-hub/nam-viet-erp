-- Migration: Add supplier_product_code to product_supplier_mapping table
-- Purpose: Store supplier-specific SKU for each product-supplier relationship
-- Date: 2025-10-25

-- Add supplier_product_code column if it doesn't exist
ALTER TABLE product_supplier_mapping
ADD COLUMN IF NOT EXISTS supplier_product_code VARCHAR(100);

-- Add comment for documentation
COMMENT ON COLUMN product_supplier_mapping.supplier_product_code IS 'Supplier-specific SKU/product code for this product';

-- Add index for faster lookups by supplier product code
CREATE INDEX IF NOT EXISTS idx_product_supplier_mapping_supplier_code
ON product_supplier_mapping(supplier_product_code);
