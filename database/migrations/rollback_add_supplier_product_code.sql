-- Rollback Migration: Remove supplier_product_code from product_supplier_mapping table
-- Purpose: Rollback supplier-specific SKU feature if needed
-- Date: 2025-10-25

-- Drop the index first
DROP INDEX IF EXISTS idx_product_supplier_mapping_supplier_code;

-- Remove the supplier_product_code column
ALTER TABLE product_supplier_mapping
DROP COLUMN IF EXISTS supplier_product_code;
