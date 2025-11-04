-- Rollback: Remove money submission tracking from B2B quotes
-- Purpose: Rollback migration that added money submission tracking
-- Date: 2025-11-04

-- Drop indexes first
DROP INDEX IF EXISTS idx_b2b_quotes_money_submitted;
DROP INDEX IF EXISTS idx_b2b_quotes_money_submitted_at;
DROP INDEX IF EXISTS idx_b2b_quotes_money_submitted_by;
DROP INDEX IF EXISTS idx_b2b_quotes_accountant_received_by;

-- Drop columns
ALTER TABLE b2b_quotes
DROP COLUMN IF EXISTS money_submitted_to_accountant,
DROP COLUMN IF EXISTS money_submitted_at,
DROP COLUMN IF EXISTS money_submitted_by,
DROP COLUMN IF EXISTS accountant_received_by,
DROP COLUMN IF EXISTS money_submitted_note;
