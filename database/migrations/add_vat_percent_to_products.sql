-- Migration: Add vat_percent column to products table
-- Purpose: Enable per-product VAT percentage management
-- Date: 2025-10-25

-- Add vat_percent column to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS vat_percent DECIMAL(5,2) DEFAULT 5.00;

-- Add comment for documentation
COMMENT ON COLUMN products.vat_percent IS 'VAT percentage applied to this product (0%, 1%, 2%, 3%, 5%)';

-- Add check constraint to ensure valid VAT percentages
ALTER TABLE products
ADD CONSTRAINT check_product_vat_percent_valid
CHECK (vat_percent IN (0, 1, 2, 3, 5));

-- Update existing records to have default VAT of 5%
UPDATE products
SET vat_percent = 5.00
WHERE vat_percent IS NULL;
