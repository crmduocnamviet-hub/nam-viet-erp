-- ============================================
-- CREATE WAREHOUSE TRANSFERS FEATURE
-- ============================================
-- This migration creates tables and functions for managing
-- warehouse transfers between main warehouse and pharmacies
-- ============================================

-- ============================================
-- 1. CREATE TRANSFER STATUS ENUM
-- ============================================

DO $$ BEGIN
    CREATE TYPE transfer_status AS ENUM (
        'draft',        -- Bản nháp, chưa gửi
        'pending',      -- Chờ duyệt
        'approved',     -- Đã duyệt, chờ xuất kho
        'in_transit',   -- Đang vận chuyển
        'completed',    -- Đã hoàn thành
        'cancelled'     -- Đã hủy
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. CREATE warehouse_transfers TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id BIGSERIAL PRIMARY KEY,

    -- Transfer information
    transfer_number VARCHAR(50) UNIQUE NOT NULL,

    -- Warehouse information
    from_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    to_warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,

    -- Status and dates
    status transfer_status DEFAULT 'draft' NOT NULL,
    transfer_date DATE DEFAULT CURRENT_DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,

    -- User tracking
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    received_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Approval and completion dates
    approved_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,

    -- Notes
    notes TEXT,
    rejection_reason TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT different_warehouses CHECK (from_warehouse_id != to_warehouse_id)
);

-- Add comments
COMMENT ON TABLE warehouse_transfers IS 'Stores warehouse transfer orders from main warehouse to pharmacies';
COMMENT ON COLUMN warehouse_transfers.transfer_number IS 'Unique transfer number, auto-generated (e.g., WT-2025-001)';
COMMENT ON COLUMN warehouse_transfers.status IS 'Transfer status: draft, pending, approved, in_transit, completed, cancelled';

-- ============================================
-- 3. CREATE warehouse_transfer_items TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS warehouse_transfer_items (
    id BIGSERIAL PRIMARY KEY,

    -- Transfer reference
    transfer_id BIGINT NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,

    -- Product information
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    lot_id INTEGER REFERENCES product_lots(id) ON DELETE SET NULL,

    -- Quantities
    quantity_requested NUMERIC(10,2) NOT NULL CHECK (quantity_requested > 0),
    quantity_sent NUMERIC(10,2) DEFAULT 0 CHECK (quantity_sent >= 0),
    quantity_received NUMERIC(10,2) DEFAULT 0 CHECK (quantity_received >= 0),

    -- Unit price for reference
    unit_price NUMERIC(15,2),

    -- Notes
    notes TEXT,
    damage_notes TEXT, -- Ghi chú về hàng hỏng/thiếu

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_quantities CHECK (
        quantity_sent <= quantity_requested
        AND quantity_received <= quantity_sent
    ),

    -- Unique constraint: one product/lot per transfer
    CONSTRAINT unique_product_lot_per_transfer UNIQUE (transfer_id, product_id, lot_id)
);

-- Add comments
COMMENT ON TABLE warehouse_transfer_items IS 'Stores line items for each warehouse transfer';
COMMENT ON COLUMN warehouse_transfer_items.quantity_requested IS 'Quantity requested by receiving warehouse';
COMMENT ON COLUMN warehouse_transfer_items.quantity_sent IS 'Actual quantity sent from source warehouse';
COMMENT ON COLUMN warehouse_transfer_items.quantity_received IS 'Actual quantity received at destination warehouse';

-- ============================================
-- 4. CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_from_warehouse
    ON warehouse_transfers(from_warehouse_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_to_warehouse
    ON warehouse_transfers(to_warehouse_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_status
    ON warehouse_transfers(status);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_transfer_date
    ON warehouse_transfers(transfer_date DESC);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_created_by
    ON warehouse_transfers(created_by);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_items_transfer_id
    ON warehouse_transfer_items(transfer_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_items_product_id
    ON warehouse_transfer_items(product_id);

CREATE INDEX IF NOT EXISTS idx_warehouse_transfer_items_lot_id
    ON warehouse_transfer_items(lot_id);

-- ============================================
-- 5. CREATE FUNCTION: Generate Transfer Number
-- ============================================

CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    current_year TEXT;
    sequence_num INTEGER;
BEGIN
    -- Get current year
    current_year := TO_CHAR(NOW(), 'YYYY');

    -- Get next sequence number for this year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(transfer_number FROM 'WT-' || current_year || '-(\d+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM warehouse_transfers
    WHERE transfer_number LIKE 'WT-' || current_year || '-%';

    -- Format: WT-2025-001
    new_number := 'WT-' || current_year || '-' || LPAD(sequence_num::TEXT, 3, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_transfer_number() IS 'Generates unique transfer number in format WT-YYYY-NNN';

-- ============================================
-- 6. CREATE TRIGGER: Auto-generate Transfer Number
-- ============================================

CREATE OR REPLACE FUNCTION set_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.transfer_number IS NULL OR NEW.transfer_number = '' THEN
        NEW.transfer_number := generate_transfer_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_transfer_number ON warehouse_transfers;
CREATE TRIGGER trigger_set_transfer_number
    BEFORE INSERT ON warehouse_transfers
    FOR EACH ROW
    EXECUTE FUNCTION set_transfer_number();

-- ============================================
-- 7. CREATE TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_warehouse_transfer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_warehouse_transfer_timestamp ON warehouse_transfers;
CREATE TRIGGER trigger_update_warehouse_transfer_timestamp
    BEFORE UPDATE ON warehouse_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_transfer_timestamp();

DROP TRIGGER IF EXISTS trigger_update_warehouse_transfer_items_timestamp ON warehouse_transfer_items;
CREATE TRIGGER trigger_update_warehouse_transfer_items_timestamp
    BEFORE UPDATE ON warehouse_transfer_items
    FOR EACH ROW
    EXECUTE FUNCTION update_warehouse_transfer_timestamp();

-- ============================================
-- 8. CREATE FUNCTION: Update Inventory on Transfer
-- ============================================

CREATE OR REPLACE FUNCTION process_warehouse_transfer_inventory(
    p_transfer_id BIGINT,
    p_action TEXT -- 'send' or 'receive'
)
RETURNS VOID AS $$
DECLARE
    v_transfer RECORD;
    v_item RECORD;
BEGIN
    -- Get transfer details
    SELECT * INTO v_transfer
    FROM warehouse_transfers
    WHERE id = p_transfer_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer ID % not found', p_transfer_id;
    END IF;

    -- Process based on action
    IF p_action = 'send' THEN
        -- Deduct inventory from source warehouse
        FOR v_item IN
            SELECT * FROM warehouse_transfer_items
            WHERE transfer_id = p_transfer_id
        LOOP
            -- Update product_lots quantity
            IF v_item.lot_id IS NOT NULL THEN
                UPDATE product_lots
                SET quantity = quantity - v_item.quantity_sent
                WHERE id = v_item.lot_id
                AND warehouse_id = v_transfer.from_warehouse_id;
            END IF;

            -- Update inventory
            UPDATE inventory
            SET quantity = quantity - v_item.quantity_sent
            WHERE product_id = v_item.product_id
            AND warehouse_id = v_transfer.from_warehouse_id;

            -- Insert into inventory if not exists
            IF NOT FOUND THEN
                INSERT INTO inventory (product_id, warehouse_id, quantity)
                VALUES (v_item.product_id, v_transfer.from_warehouse_id, -v_item.quantity_sent);
            END IF;
        END LOOP;

        -- Update transfer status and timestamp
        UPDATE warehouse_transfers
        SET status = 'in_transit',
            sent_at = NOW()
        WHERE id = p_transfer_id;

    ELSIF p_action = 'receive' THEN
        -- Add inventory to destination warehouse
        FOR v_item IN
            SELECT wti.*, pl.lot_number, pl.expiry_date, pl.batch_code
            FROM warehouse_transfer_items wti
            LEFT JOIN product_lots pl ON wti.lot_id = pl.id
            WHERE wti.transfer_id = p_transfer_id
        LOOP
            -- Create or update lot in destination warehouse
            IF v_item.lot_id IS NOT NULL THEN
                -- Check if lot exists in destination warehouse
                DECLARE
                    v_dest_lot_id INTEGER;
                BEGIN
                    SELECT id INTO v_dest_lot_id
                    FROM product_lots
                    WHERE product_id = v_item.product_id
                    AND warehouse_id = v_transfer.to_warehouse_id
                    AND lot_number = v_item.lot_number;

                    IF FOUND THEN
                        -- Update existing lot
                        UPDATE product_lots
                        SET quantity = quantity + v_item.quantity_received
                        WHERE id = v_dest_lot_id;
                    ELSE
                        -- Create new lot in destination warehouse
                        INSERT INTO product_lots (
                            product_id,
                            warehouse_id,
                            lot_number,
                            batch_code,
                            expiry_date,
                            quantity,
                            received_date
                        )
                        VALUES (
                            v_item.product_id,
                            v_transfer.to_warehouse_id,
                            v_item.lot_number,
                            v_item.batch_code,
                            v_item.expiry_date,
                            v_item.quantity_received,
                            CURRENT_DATE
                        );
                    END IF;
                END;
            END IF;

            -- Update inventory
            UPDATE inventory
            SET quantity = quantity + v_item.quantity_received
            WHERE product_id = v_item.product_id
            AND warehouse_id = v_transfer.to_warehouse_id;

            -- Insert into inventory if not exists
            IF NOT FOUND THEN
                INSERT INTO inventory (product_id, warehouse_id, quantity)
                VALUES (v_item.product_id, v_transfer.to_warehouse_id, v_item.quantity_received);
            END IF;
        END LOOP;

        -- Update transfer status and timestamp
        UPDATE warehouse_transfers
        SET status = 'completed',
            received_at = NOW(),
            actual_delivery_date = CURRENT_DATE
        WHERE id = p_transfer_id;

    ELSE
        RAISE EXCEPTION 'Invalid action: %. Must be "send" or "receive"', p_action;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_warehouse_transfer_inventory IS 'Updates inventory when transfer is sent or received';

-- ============================================
-- 9. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfer_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON warehouse_transfers;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON warehouse_transfer_items;

-- Create policies
CREATE POLICY "Enable read access for authenticated users"
    ON warehouse_transfers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON warehouse_transfers FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON warehouse_transfers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
    ON warehouse_transfers FOR DELETE
    TO authenticated
    USING (true);

-- Policies for warehouse_transfer_items
CREATE POLICY "Enable read access for authenticated users"
    ON warehouse_transfer_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON warehouse_transfer_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON warehouse_transfer_items FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
    ON warehouse_transfer_items FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- 10. CREATE SAMPLE DATA (Optional - Comment out in production)
-- ============================================

-- Uncomment below to insert sample data for testing

/*
-- Insert sample transfer
INSERT INTO warehouse_transfers (
    from_warehouse_id,
    to_warehouse_id,
    status,
    notes
)
VALUES (
    1, -- Main warehouse
    2, -- Pharmacy 1
    'draft',
    'Initial test transfer'
);

-- Insert sample transfer items
INSERT INTO warehouse_transfer_items (
    transfer_id,
    product_id,
    quantity_requested,
    unit_price
)
SELECT
    1, -- transfer_id
    id,
    10,
    retail_price
FROM products
LIMIT 5;
*/

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE '✓ warehouse_transfers table created';
    RAISE NOTICE '✓ warehouse_transfer_items table created';
    RAISE NOTICE '✓ Indexes created';
    RAISE NOTICE '✓ Functions created';
    RAISE NOTICE '✓ Triggers created';
    RAISE NOTICE '✓ RLS policies enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'Warehouse Transfer feature is ready to use!';
END $$;
