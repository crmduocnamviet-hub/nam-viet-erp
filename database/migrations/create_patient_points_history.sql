-- Migration: Create patient_points_history table
-- Description: Track all patient loyalty points transactions (earn, redeem, adjust, expire)
-- Date: 2025-01-18

-- Create ENUM type for transaction types
DO $$ BEGIN
    CREATE TYPE points_transaction_type AS ENUM (
        'earn',        -- Points earned from purchases
        'redeem',      -- Points redeemed/used
        'adjustment',  -- Manual adjustment by staff
        'expire',      -- Points expired
        'refund'       -- Points refunded from canceled orders
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create ENUM type for reference types
DO $$ BEGIN
    CREATE TYPE points_reference_type AS ENUM (
        'order',       -- From sales order
        'visit',       -- From medical visit
        'manual',      -- Manual adjustment
        'promotion',   -- From promotion/campaign
        'birthday',    -- Birthday bonus
        'referral',    -- Referral reward
        'system'       -- System adjustment
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create patient_points_history table
CREATE TABLE IF NOT EXISTS patient_points_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Patient reference
    patient_id UUID NOT NULL,

    -- Transaction details
    transaction_type points_transaction_type NOT NULL,
    points_amount INTEGER NOT NULL, -- Positive for earn, negative for redeem

    -- Balance snapshots
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    -- Reference to source of transaction
    reference_type points_reference_type NOT NULL,
    reference_id UUID, -- Could be order_id, visit_id, etc.

    -- Additional information
    description TEXT, -- Human-readable description
    notes TEXT, -- Internal notes

    -- Expiration tracking (for earned points)
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Audit fields
    created_by UUID, -- Employee who created this transaction
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT fk_patient
        FOREIGN KEY (patient_id)
        REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_created_by
        FOREIGN KEY (created_by)
        REFERENCES employees(employee_id)
        ON DELETE SET NULL,

    -- Check constraints
    CONSTRAINT check_balance_calculation
        CHECK (balance_after = balance_before + points_amount),

    CONSTRAINT check_balance_non_negative
        CHECK (balance_after >= 0)
);

-- Create indexes for better query performance
CREATE INDEX idx_patient_points_history_patient_id
    ON patient_points_history(patient_id);

CREATE INDEX idx_patient_points_history_created_at
    ON patient_points_history(created_at DESC);

CREATE INDEX idx_patient_points_history_transaction_type
    ON patient_points_history(transaction_type);

CREATE INDEX idx_patient_points_history_reference
    ON patient_points_history(reference_type, reference_id);

CREATE INDEX idx_patient_points_history_expires_at
    ON patient_points_history(expires_at)
    WHERE expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE patient_points_history IS 'Records all loyalty points transactions for patients';
COMMENT ON COLUMN patient_points_history.transaction_type IS 'Type of transaction: earn, redeem, adjustment, expire, refund';
COMMENT ON COLUMN patient_points_history.points_amount IS 'Amount of points (positive for earn, negative for redeem)';
COMMENT ON COLUMN patient_points_history.balance_before IS 'Patient points balance before this transaction';
COMMENT ON COLUMN patient_points_history.balance_after IS 'Patient points balance after this transaction';
COMMENT ON COLUMN patient_points_history.reference_type IS 'What caused this transaction: order, visit, manual, etc.';
COMMENT ON COLUMN patient_points_history.reference_id IS 'ID of the related entity (order_id, visit_id, etc.)';
COMMENT ON COLUMN patient_points_history.expires_at IS 'Expiration date for earned points (NULL for redeemed/adjusted points)';

-- Create function to automatically add points history when points change
CREATE OR REPLACE FUNCTION log_patient_points_change()
RETURNS TRIGGER AS $$
DECLARE
    old_points INTEGER;
    new_points INTEGER;
    points_diff INTEGER;
BEGIN
    -- Only log if loyalty_points actually changed
    IF OLD.loyalty_points IS DISTINCT FROM NEW.loyalty_points THEN
        old_points := COALESCE(OLD.loyalty_points, 0);
        new_points := COALESCE(NEW.loyalty_points, 0);
        points_diff := new_points - old_points;

        -- Insert history record
        INSERT INTO patient_points_history (
            patient_id,
            transaction_type,
            points_amount,
            balance_before,
            balance_after,
            reference_type,
            description
        ) VALUES (
            NEW.patient_id,
            CASE
                WHEN points_diff > 0 THEN 'earn'::points_transaction_type
                ELSE 'redeem'::points_transaction_type
            END,
            points_diff,
            old_points,
            new_points,
            'system'::points_reference_type,
            CASE
                WHEN points_diff > 0 THEN 'Points earned'
                ELSE 'Points redeemed'
            END
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically log points changes
DROP TRIGGER IF EXISTS trigger_log_patient_points_change ON patients;
CREATE TRIGGER trigger_log_patient_points_change
    AFTER UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION log_patient_points_change();

-- Create view for easy querying of points history
CREATE OR REPLACE VIEW patient_points_summary AS
SELECT
    p.patient_id,
    p.full_name,
    p.phone_number,
    p.loyalty_points AS current_balance,
    COALESCE(SUM(CASE WHEN h.transaction_type = 'earn' THEN h.points_amount ELSE 0 END), 0) AS total_earned,
    COALESCE(SUM(CASE WHEN h.transaction_type = 'redeem' THEN ABS(h.points_amount) ELSE 0 END), 0) AS total_redeemed,
    COALESCE(SUM(CASE WHEN h.transaction_type = 'expire' THEN ABS(h.points_amount) ELSE 0 END), 0) AS total_expired,
    COUNT(h.id) AS transaction_count,
    MAX(h.created_at) AS last_transaction_at
FROM patients p
LEFT JOIN patient_points_history h ON p.patient_id = h.patient_id
GROUP BY p.patient_id, p.full_name, p.phone_number, p.loyalty_points;

COMMENT ON VIEW patient_points_summary IS 'Summary view of patient points with total earned, redeemed, and expired points';

-- Grant permissions (adjust according to your roles)
-- GRANT SELECT, INSERT ON patient_points_history TO authenticated;
-- GRANT SELECT ON patient_points_summary TO authenticated;
