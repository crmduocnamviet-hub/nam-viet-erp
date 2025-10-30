-- ============================================
-- CREATE VAT INVOICE TRACKING TABLES
-- ============================================
-- This migration creates tables for tracking VAT invoices
-- for both incoming (purchases) and outgoing (sales) transactions
-- ============================================

-- ============================================
-- 1. CREATE vat_invoices_in (Hóa đơn nhập VAT)
-- ============================================

CREATE TABLE IF NOT EXISTS vat_invoices_in (
    id BIGSERIAL PRIMARY KEY,

    -- Invoice information
    invoice_no VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,

    -- Warehouse and product information
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_lot_id INTEGER REFERENCES product_lots(id) ON DELETE SET NULL,

    -- Quantity and pricing
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15,2),
    total_amount NUMERIC(15,2),
    vat_amount NUMERIC(15,2),
    vat_percent NUMERIC(5,2) DEFAULT 0,

    -- Supplier information (optional)
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    purchase_order_id BIGINT REFERENCES purchase_orders(id) ON DELETE SET NULL,

    -- Additional info
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add comments
COMMENT ON TABLE vat_invoices_in IS 'Stores VAT invoice information for incoming goods (purchases)';
COMMENT ON COLUMN vat_invoices_in.invoice_no IS 'VAT invoice number from supplier';
COMMENT ON COLUMN vat_invoices_in.invoice_date IS 'Date on the VAT invoice';
COMMENT ON COLUMN vat_invoices_in.quantity IS 'Quantity on the invoice';
COMMENT ON COLUMN vat_invoices_in.vat_amount IS 'VAT amount on the invoice';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_invoice_no
    ON vat_invoices_in(invoice_no);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_invoice_date
    ON vat_invoices_in(invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_warehouse_id
    ON vat_invoices_in(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_product_id
    ON vat_invoices_in(product_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_product_lot_id
    ON vat_invoices_in(product_lot_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_supplier_id
    ON vat_invoices_in(supplier_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_in_created_at
    ON vat_invoices_in(created_at DESC);

-- ============================================
-- 2. CREATE vat_invoices_out (Hóa đơn xuất VAT)
-- ============================================

CREATE TYPE vat_invoice_status AS ENUM ('pending', 'done', 'cancelled');

CREATE TABLE IF NOT EXISTS vat_invoices_out (
    id BIGSERIAL PRIMARY KEY,

    -- Invoice information
    invoice_no VARCHAR(100),
    invoice_date DATE,

    -- Warehouse and product information
    warehouse_id BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_lot_id INTEGER REFERENCES product_lots(id) ON DELETE SET NULL,

    -- Quantity and pricing
    quantity NUMERIC(10,2) NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(15,2),
    total_amount NUMERIC(15,2),
    vat_amount NUMERIC(15,2),
    vat_percent NUMERIC(5,2) DEFAULT 0,

    -- Reference to source transaction
    b2b_quote_id BIGINT REFERENCES b2b_quotes(id) ON DELETE SET NULL,
    sale_order_id BIGINT REFERENCES sales_orders(order_id) ON DELETE SET NULL,

    -- Status
    status vat_invoice_status DEFAULT 'pending' NOT NULL,

    -- Additional info
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Constraint: must have either b2b_quote_id or sale_order_id
    CONSTRAINT must_have_source CHECK (
        b2b_quote_id IS NOT NULL OR sale_order_id IS NOT NULL
    )
);

-- Add comments
COMMENT ON TABLE vat_invoices_out IS 'Stores VAT invoice information for outgoing goods (sales)';
COMMENT ON COLUMN vat_invoices_out.invoice_no IS 'VAT invoice number (optional, generated when status is done)';
COMMENT ON COLUMN vat_invoices_out.invoice_date IS 'Date of VAT invoice issuance';
COMMENT ON COLUMN vat_invoices_out.status IS 'pending: not yet issued, done: invoice issued, cancelled: cancelled';
COMMENT ON COLUMN vat_invoices_out.b2b_quote_id IS 'Reference to B2B order if applicable';
COMMENT ON COLUMN vat_invoices_out.sale_order_id IS 'Reference to POS sale if applicable';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_invoice_no
    ON vat_invoices_out(invoice_no);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_invoice_date
    ON vat_invoices_out(invoice_date DESC);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_warehouse_id
    ON vat_invoices_out(warehouse_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_product_id
    ON vat_invoices_out(product_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_product_lot_id
    ON vat_invoices_out(product_lot_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_b2b_quote_id
    ON vat_invoices_out(b2b_quote_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_sale_order_id
    ON vat_invoices_out(sale_order_id);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_status
    ON vat_invoices_out(status);

CREATE INDEX IF NOT EXISTS idx_vat_invoices_out_created_at
    ON vat_invoices_out(created_at DESC);

-- ============================================
-- 3. CREATE TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_vat_invoice_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vat_invoices_in
DROP TRIGGER IF EXISTS trigger_update_vat_invoices_in_timestamp ON vat_invoices_in;
CREATE TRIGGER trigger_update_vat_invoices_in_timestamp
    BEFORE UPDATE ON vat_invoices_in
    FOR EACH ROW
    EXECUTE FUNCTION update_vat_invoice_timestamp();

-- Trigger for vat_invoices_out
DROP TRIGGER IF EXISTS trigger_update_vat_invoices_out_timestamp ON vat_invoices_out;
CREATE TRIGGER trigger_update_vat_invoices_out_timestamp
    BEFORE UPDATE ON vat_invoices_out
    FOR EACH ROW
    EXECUTE FUNCTION update_vat_invoice_timestamp();

-- ============================================
-- 4. CREATE FUNCTION: Generate VAT Invoice Number
-- ============================================

CREATE OR REPLACE FUNCTION generate_vat_invoice_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
BEGIN
    -- Get current year and month
    current_year := TO_CHAR(NOW(), 'YYYY');
    current_month := TO_CHAR(NOW(), 'MM');

    -- Get next sequence number for this month
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(invoice_no FROM 'VAT-' || current_year || current_month || '-(\d+)')
            AS INTEGER
        )
    ), 0) + 1
    INTO sequence_num
    FROM vat_invoices_out
    WHERE invoice_no LIKE 'VAT-' || current_year || current_month || '-%';

    -- Format: VAT-YYYYMM-NNNN
    new_number := 'VAT-' || current_year || current_month || '-' || LPAD(sequence_num::TEXT, 4, '0');

    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_vat_invoice_number() IS 'Generates unique VAT invoice number in format VAT-YYYYMM-NNNN';

-- ============================================
-- 5. CREATE VIEW: VAT Inventory Summary
-- ============================================

CREATE OR REPLACE VIEW vat_inventory_summary AS
SELECT
    w.id AS warehouse_id,
    w.name AS warehouse_name,
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    p.barcode,
    pl.id AS lot_id,
    pl.lot_number,
    pl.expiry_date,

    -- Total IN
    COALESCE(SUM(vi_in.quantity), 0) AS total_vat_in,

    -- Total OUT
    COALESCE(SUM(CASE WHEN vi_out.status = 'done' THEN vi_out.quantity ELSE 0 END), 0) AS total_vat_out,

    -- Pending OUT
    COALESCE(SUM(CASE WHEN vi_out.status = 'pending' THEN vi_out.quantity ELSE 0 END), 0) AS pending_vat_out,

    -- Current VAT inventory
    COALESCE(SUM(vi_in.quantity), 0) -
    COALESCE(SUM(CASE WHEN vi_out.status = 'done' THEN vi_out.quantity ELSE 0 END), 0) AS current_vat_inventory,

    -- Physical inventory (from product_lots or inventory table)
    COALESCE(pl.quantity, 0) AS physical_inventory,

    -- Difference
    (COALESCE(SUM(vi_in.quantity), 0) -
     COALESCE(SUM(CASE WHEN vi_out.status = 'done' THEN vi_out.quantity ELSE 0 END), 0)) -
    COALESCE(pl.quantity, 0) AS inventory_difference

FROM warehouses w
CROSS JOIN products p
LEFT JOIN product_lots pl ON p.id = pl.product_id AND w.id = pl.warehouse_id
LEFT JOIN vat_invoices_in vi_in ON
    w.id = vi_in.warehouse_id AND
    p.id = vi_in.product_id AND
    (pl.id IS NULL OR pl.id = vi_in.product_lot_id)
LEFT JOIN vat_invoices_out vi_out ON
    w.id = vi_out.warehouse_id AND
    p.id = vi_out.product_id AND
    (pl.id IS NULL OR pl.id = vi_out.product_lot_id)
GROUP BY
    w.id, w.name,
    p.id, p.name, p.sku, p.barcode,
    pl.id, pl.lot_number, pl.expiry_date, pl.quantity
HAVING
    COALESCE(SUM(vi_in.quantity), 0) > 0 OR
    COALESCE(SUM(CASE WHEN vi_out.status = 'done' THEN vi_out.quantity ELSE 0 END), 0) > 0 OR
    COALESCE(pl.quantity, 0) > 0;

COMMENT ON VIEW vat_inventory_summary IS 'Summary view showing VAT inventory vs physical inventory with differences';

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE vat_invoices_in ENABLE ROW LEVEL SECURITY;
ALTER TABLE vat_invoices_out ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vat_invoices_in;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vat_invoices_in;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON vat_invoices_in;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vat_invoices_in;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vat_invoices_out;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vat_invoices_out;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON vat_invoices_out;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON vat_invoices_out;

-- Policies for vat_invoices_in
CREATE POLICY "Enable read access for authenticated users"
    ON vat_invoices_in FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON vat_invoices_in FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON vat_invoices_in FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
    ON vat_invoices_in FOR DELETE
    TO authenticated
    USING (true);

-- Policies for vat_invoices_out
CREATE POLICY "Enable read access for authenticated users"
    ON vat_invoices_out FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON vat_invoices_out FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON vat_invoices_out FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
    ON vat_invoices_out FOR DELETE
    TO authenticated
    USING (true);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✓ vat_invoices_in table created';
    RAISE NOTICE '✓ vat_invoices_out table created';
    RAISE NOTICE '✓ vat_invoice_status enum created';
    RAISE NOTICE '✓ Indexes created';
    RAISE NOTICE '✓ Triggers created';
    RAISE NOTICE '✓ Functions created';
    RAISE NOTICE '✓ Views created';
    RAISE NOTICE '✓ RLS policies enabled';
    RAISE NOTICE '';
    RAISE NOTICE 'VAT Invoice Tracking feature is ready to use!';
END $$;
