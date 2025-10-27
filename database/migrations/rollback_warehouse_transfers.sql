-- ============================================
-- ROLLBACK WAREHOUSE TRANSFERS FEATURE
-- ============================================
-- This script removes all warehouse transfer tables and related objects
-- ============================================

-- Drop policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON warehouse_transfers;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON warehouse_transfer_items;

-- Drop tables (cascade will drop foreign key constraints)
DROP TABLE IF EXISTS warehouse_transfer_items CASCADE;
DROP TABLE IF EXISTS warehouse_transfers CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS process_warehouse_transfer_inventory(BIGINT, TEXT);
DROP FUNCTION IF EXISTS update_warehouse_transfer_timestamp();
DROP FUNCTION IF EXISTS set_transfer_number();
DROP FUNCTION IF EXISTS generate_transfer_number();

-- Drop type
DROP TYPE IF EXISTS transfer_status;

-- Notify completion
DO $$
BEGIN
    RAISE NOTICE '✓ Warehouse transfer tables dropped';
    RAISE NOTICE '✓ Functions dropped';
    RAISE NOTICE '✓ Type dropped';
    RAISE NOTICE '';
    RAISE NOTICE 'Warehouse Transfer feature has been rolled back successfully!';
END $$;
