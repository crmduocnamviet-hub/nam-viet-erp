-- Rollback Migration: Remove patient_points_history table
-- Description: Rollback script to remove patient points history table and related objects
-- Date: 2025-01-18

-- Drop view
DROP VIEW IF EXISTS patient_points_summary;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_log_patient_points_change ON patients;

-- Drop function
DROP FUNCTION IF EXISTS log_patient_points_change();

-- Drop indexes (they will be dropped automatically with the table, but listing for clarity)
DROP INDEX IF EXISTS idx_patient_points_history_patient_id;
DROP INDEX IF EXISTS idx_patient_points_history_created_at;
DROP INDEX IF EXISTS idx_patient_points_history_transaction_type;
DROP INDEX IF EXISTS idx_patient_points_history_reference;
DROP INDEX IF EXISTS idx_patient_points_history_expires_at;

-- Drop table
DROP TABLE IF EXISTS patient_points_history;

-- Drop ENUM types
DROP TYPE IF EXISTS points_transaction_type;
DROP TYPE IF EXISTS points_reference_type;

-- Note: This rollback will delete all points history data
-- Make sure to backup the data before running this rollback
