-- Rollback Migration: Remove vat_percent column from b2b_quote_items table
-- Purpose: Rollback the VAT percentage feature for quote items if needed
-- Date: 2025-10-25

-- Drop the check constraint first
ALTER TABLE b2b_quote_items
DROP CONSTRAINT IF EXISTS check_b2b_quote_item_vat_percent_valid;

-- Remove the vat_percent column
ALTER TABLE b2b_quote_items
DROP COLUMN IF EXISTS vat_percent;
