-- ============================================
-- ROLLBACK VAT INVOICE TRACKING
-- ============================================
-- This script removes VAT invoice tracking tables and related objects
-- ============================================

-- Drop policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vat_invoices_in;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vat_invoices_in;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON vat_invoices_in;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vat_invoices_in;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vat_invoices_out;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vat_invoices_out;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON vat_invoices_out;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vat_invoices_out;

-- Drop view
DROP VIEW IF EXISTS vat_inventory_summary;

-- Drop tables
DROP TABLE IF EXISTS vat_invoices_out CASCADE;
DROP TABLE IF EXISTS vat_invoices_in CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS generate_vat_invoice_number();
DROP FUNCTION IF EXISTS update_vat_invoice_timestamp();

-- Drop type
DROP TYPE IF EXISTS vat_invoice_status;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✓ VAT invoice tracking tables dropped';
    RAISE NOTICE '✓ Views dropped';
    RAISE NOTICE '✓ Functions dropped';
    RAISE NOTICE '✓ Types dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'VAT Invoice Tracking has been rolled back successfully!';
END $$;
