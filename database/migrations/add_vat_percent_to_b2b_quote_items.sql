-- Migration: Add vat_percent column to b2b_quote_items table
-- Purpose: Store VAT percentage per quote item (inherited from product, can be overridden)
-- Date: 2025-10-25
-- Note: Run this AFTER add_vat_percent_to_products.sql

-- Add vat_percent column to b2b_quote_items
ALTER TABLE b2b_quote_items
ADD COLUMN IF NOT EXISTS vat_percent DECIMAL(5,2) DEFAULT 5.00;

-- Add comment for documentation
COMMENT ON COLUMN b2b_quote_items.vat_percent IS 'VAT percentage for this quote item (inherited from product, can be overridden)';

-- Add check constraint to ensure valid VAT percentages
ALTER TABLE b2b_quote_items
ADD CONSTRAINT check_b2b_quote_item_vat_percent_valid
CHECK (vat_percent IN (0, 1, 2, 3, 5));

-- Update existing records to have default VAT of 5%
UPDATE b2b_quote_items
SET vat_percent = 5.00
WHERE vat_percent IS NULL;
