-- Rollback Migration: Remove vat_percent column from products table
-- Purpose: Rollback the VAT percentage feature if needed
-- Date: 2025-10-25

-- Drop the check constraint first
ALTER TABLE products
DROP CONSTRAINT IF EXISTS check_product_vat_percent_valid;

-- Remove the vat_percent column
ALTER TABLE products
DROP COLUMN IF EXISTS vat_percent;
