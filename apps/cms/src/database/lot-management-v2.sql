-- =====================================================
-- LOT MANAGEMENT SYSTEM V2
-- =====================================================
-- Comprehensive lot/batch tracking system for warehouse management
-- Implements all 4 "NÚT" (buttons) from requirements:
-- NÚT 1: Auto-generate purchase orders (already implemented)
-- NÚT 2: Auto-input lot number & expiry via OCR/camera
-- NÚT 3: Barcode/QR verification
-- NÚT 4: VAT invoice reconciliation
-- =====================================================

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Table 1: Product Lots (Lô Hàng)
-- Tracks each individual lot/batch with full lifecycle
CREATE TABLE IF NOT EXISTS public.product_lots (
    id SERIAL PRIMARY KEY,

    -- Product & Location
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    warehouse_id INTEGER NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,

    -- Lot Identification (NÚT 2)
    lot_number VARCHAR(100) NOT NULL,
    batch_code VARCHAR(100), -- Alternative batch identifier
    serial_number VARCHAR(100), -- For serialized items

    -- Dates
    manufacturing_date DATE,
    expiry_date DATE,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Quantities
    quantity_received INTEGER NOT NULL CHECK (quantity_received >= 0),
    quantity_available INTEGER NOT NULL CHECK (quantity_available >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
    quantity_damaged INTEGER NOT NULL DEFAULT 0 CHECK (quantity_damaged >= 0),
    quantity_returned INTEGER NOT NULL DEFAULT 0 CHECK (quantity_returned >= 0),

    -- Cost Calculation (Giá vốn sau chiết khấu)
    unit_price_before_vat DECIMAL(18, 2) NOT NULL, -- Giá chưa VAT
    vat_percent DECIMAL(5, 2) DEFAULT 10,
    unit_price_with_vat DECIMAL(18, 2) NOT NULL, -- Giá có VAT
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    final_unit_cost DECIMAL(18, 2) NOT NULL, -- Giá vốn cuối cùng (95k/chai trong ví dụ)

    -- Purchase Information
    purchase_order_id INTEGER REFERENCES public.purchase_orders(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES public.suppliers(id) ON DELETE SET NULL,

    -- VAT Tracking (NÚT 4)
    has_vat_invoice BOOLEAN DEFAULT FALSE,
    vat_invoice_received INTEGER DEFAULT 0, -- Số lượng có hóa đơn VAT
    vat_invoice_sold INTEGER DEFAULT 0, -- Số lượng đã bán có VAT

    -- Barcode/QR (NÚT 3)
    barcode VARCHAR(255),
    qr_code TEXT,

    -- Shelf Location (Vị trí kệ)
    shelf_location VARCHAR(100),
    aisle VARCHAR(50),
    rack VARCHAR(50),
    level VARCHAR(50),

    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'reserved', 'expired', 'recalled',
        'damaged', 'depleted', 'on_shelf'
    )),

    -- Quality Control
    quality_status VARCHAR(50) DEFAULT 'passed' CHECK (quality_status IN (
        'passed', 'pending', 'failed', 'quarantine'
    )),
    quality_notes TEXT,

    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES public.employees(employee_id),
    updated_by UUID REFERENCES public.employees(employee_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT check_quantity_balance CHECK (
        quantity_available + quantity_reserved + quantity_sold +
        quantity_damaged + quantity_returned <= quantity_received
    ),
    CONSTRAINT check_vat_balance CHECK (
        vat_invoice_sold <= vat_invoice_received
    )
);

CREATE INDEX idx_product_lots_product_id ON public.product_lots(product_id);
CREATE INDEX idx_product_lots_warehouse_id ON public.product_lots(warehouse_id);
CREATE INDEX idx_product_lots_lot_number ON public.product_lots(lot_number);
CREATE INDEX idx_product_lots_expiry_date ON public.product_lots(expiry_date);
CREATE INDEX idx_product_lots_status ON public.product_lots(status);
CREATE INDEX idx_product_lots_barcode ON public.product_lots(barcode) WHERE barcode IS NOT NULL;

COMMENT ON TABLE public.product_lots IS 'Individual lot/batch tracking with full lifecycle management';
COMMENT ON COLUMN public.product_lots.final_unit_cost IS 'Final cost after all discounts and promotions (Giá vốn)';
COMMENT ON COLUMN public.product_lots.vat_invoice_received IS 'Quantity covered by VAT invoice (NÚT 4)';

-- =====================================================
-- Table 2: VAT Invoices (Hóa Đơn VAT)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vat_invoices (
    id SERIAL PRIMARY KEY,

    -- Invoice Details
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_series VARCHAR(50),
    invoice_symbol VARCHAR(50),
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('purchase', 'sales')),
    invoice_date DATE NOT NULL,

    -- Related Parties
    supplier_id INTEGER REFERENCES public.suppliers(id) ON DELETE SET NULL,
    customer_id INTEGER REFERENCES public.b2b_customers(customer_id) ON DELETE SET NULL,

    -- Financial Details
    subtotal DECIMAL(18, 2) NOT NULL CHECK (subtotal >= 0), -- Tổng chưa VAT
    vat_rate DECIMAL(5, 2) DEFAULT 10,
    vat_amount DECIMAL(18, 2) NOT NULL CHECK (vat_amount >= 0),
    total_with_vat DECIMAL(18, 2) NOT NULL CHECK (total_with_vat >= 0),
    discount_amount DECIMAL(18, 2) DEFAULT 0,

    -- Document Management
    pdf_url TEXT,
    pdf_uploaded_at TIMESTAMPTZ,
    original_filename VARCHAR(255),

    -- OCR/AI Processing (NÚT 2)
    ocr_status VARCHAR(50) DEFAULT 'pending' CHECK (ocr_status IN (
        'pending', 'processing', 'completed', 'failed', 'manual'
    )),
    ocr_data JSONB, -- Extracted lot numbers, expiry dates, etc.
    ocr_confidence DECIMAL(5, 2), -- OCR confidence score
    ocr_processed_at TIMESTAMPTZ,
    ocr_error TEXT,

    -- Reconciliation (NÚT 4)
    reconciliation_status VARCHAR(50) DEFAULT 'pending' CHECK (reconciliation_status IN (
        'pending', 'matched', 'partial', 'discrepancy', 'resolved'
    )),
    discrepancy_notes TEXT,

    -- Payment & Settlement
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN (
        'unpaid', 'partial', 'paid', 'overdue'
    )),
    payment_due_date DATE,
    payment_date DATE,

    -- Metadata
    notes TEXT,
    created_by UUID REFERENCES public.employees(employee_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vat_invoices_type ON public.vat_invoices(invoice_type);
CREATE INDEX idx_vat_invoices_number ON public.vat_invoices(invoice_number);
CREATE INDEX idx_vat_invoices_date ON public.vat_invoices(invoice_date DESC);
CREATE INDEX idx_vat_invoices_supplier ON public.vat_invoices(supplier_id);
CREATE INDEX idx_vat_invoices_customer ON public.vat_invoices(customer_id);
CREATE INDEX idx_vat_invoices_ocr_status ON public.vat_invoices(ocr_status);

COMMENT ON TABLE public.vat_invoices IS 'VAT invoice management with OCR and reconciliation (NÚT 2, NÚT 4)';
COMMENT ON COLUMN public.vat_invoices.ocr_data IS 'AI/OCR extracted data: lot numbers, expiry dates, quantities';

-- =====================================================
-- Table 3: VAT Invoice Items (Chi tiết HĐ VAT)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vat_invoice_items (
    id SERIAL PRIMARY KEY,

    vat_invoice_id INTEGER NOT NULL REFERENCES public.vat_invoices(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    lot_id INTEGER REFERENCES public.product_lots(id) ON DELETE SET NULL,

    -- Item Details
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(18, 2) NOT NULL CHECK (unit_price >= 0),

    -- Discounts
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(18, 2) DEFAULT 0,
    promotion_type VARCHAR(100), -- e.g., "Mua 10 tặng 1"

    -- Pricing
    subtotal DECIMAL(18, 2) NOT NULL,
    vat_rate DECIMAL(5, 2) DEFAULT 10,
    vat_amount DECIMAL(18, 2) NOT NULL,
    total_with_vat DECIMAL(18, 2) NOT NULL,

    -- Lot Information (from OCR/Manual input)
    lot_number VARCHAR(100),
    expiry_date DATE,

    -- Supplier Product Mapping
    supplier_product_code VARCHAR(100),
    supplier_product_name VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vat_invoice_items_invoice ON public.vat_invoice_items(vat_invoice_id);
CREATE INDEX idx_vat_invoice_items_product ON public.vat_invoice_items(product_id);
CREATE INDEX idx_vat_invoice_items_lot ON public.vat_invoice_items(lot_id);

COMMENT ON TABLE public.vat_invoice_items IS 'Line items in VAT invoices with lot tracking';

-- =====================================================
-- Table 4: Lot Movements (Di chuyển lô)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lot_movements (
    id SERIAL PRIMARY KEY,

    lot_id INTEGER NOT NULL REFERENCES public.product_lots(id) ON DELETE CASCADE,

    -- Movement Type
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'received',      -- Nhận hàng
        'shelved',       -- Lên kệ
        'reserved',      -- Đặt trước
        'picked',        -- Lấy hàng
        'packed',        -- Đóng gói
        'shipped',       -- Giao hàng
        'delivered',     -- Giao thành công
        'returned',      -- Trả lại
        'damaged',       -- Hư hỏng
        'expired',       -- Hết hạn
        'adjusted',      -- Điều chỉnh
        'transferred'    -- Chuyển kho
    )),

    quantity INTEGER NOT NULL,

    -- Location Tracking
    from_warehouse_id INTEGER REFERENCES public.warehouses(id),
    to_warehouse_id INTEGER REFERENCES public.warehouses(id),
    from_location VARCHAR(200), -- Vị trí cũ (kệ, hàng, tầng)
    to_location VARCHAR(200),   -- Vị trí mới

    -- Related Documents
    order_id INTEGER,
    order_type VARCHAR(50), -- 'pos', 'b2b', 'transfer', 'adjustment'
    purchase_vat_invoice_id INTEGER REFERENCES public.vat_invoices(id),
    sales_vat_invoice_id INTEGER REFERENCES public.vat_invoices(id),

    -- Barcode Verification (NÚT 3)
    verified_by_barcode BOOLEAN DEFAULT FALSE,
    barcode_scanned VARCHAR(255),
    verification_status VARCHAR(50) CHECK (verification_status IN (
        'matched', 'mismatched', 'not_verified'
    )),

    -- Quality & Condition
    condition_before VARCHAR(50),
    condition_after VARCHAR(50),
    quality_check_passed BOOLEAN,

    -- Metadata
    reason TEXT,
    notes TEXT,
    performed_by UUID REFERENCES public.employees(employee_id),
    verified_by UUID REFERENCES public.employees(employee_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lot_movements_lot ON public.lot_movements(lot_id);
CREATE INDEX idx_lot_movements_type ON public.lot_movements(movement_type);
CREATE INDEX idx_lot_movements_date ON public.lot_movements(created_at DESC);
CREATE INDEX idx_lot_movements_order ON public.lot_movements(order_id, order_type);

COMMENT ON TABLE public.lot_movements IS 'Complete audit trail for lot movements with barcode verification';

-- =====================================================
-- Table 5: VAT Warehouse (Kho VAT ảo)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.vat_warehouse (
    id SERIAL PRIMARY KEY,

    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    lot_id INTEGER NOT NULL REFERENCES public.product_lots(id) ON DELETE CASCADE,
    purchase_vat_invoice_id INTEGER NOT NULL REFERENCES public.vat_invoices(id) ON DELETE CASCADE,

    -- Tracking
    quantity_in INTEGER NOT NULL DEFAULT 0 CHECK (quantity_in >= 0),
    quantity_sold INTEGER NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_in - quantity_sold) STORED,

    -- Linked Sales Invoices
    sales_vat_invoices JSONB DEFAULT '[]'::jsonb, -- Array of {invoice_id, quantity, date}

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(lot_id, purchase_vat_invoice_id)
);

CREATE INDEX idx_vat_warehouse_product ON public.vat_warehouse(product_id);
CREATE INDEX idx_vat_warehouse_lot ON public.vat_warehouse(lot_id);
CREATE INDEX idx_vat_warehouse_purchase_invoice ON public.vat_warehouse(purchase_vat_invoice_id);

COMMENT ON TABLE public.vat_warehouse IS 'Virtual warehouse for VAT invoice tracking (NÚT 4)';
COMMENT ON COLUMN public.vat_warehouse.sales_vat_invoices IS 'Array of linked sales VAT invoices';

-- =====================================================
-- Table 6: Barcode Verification Log (NÚT 3)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.barcode_verifications (
    id SERIAL PRIMARY KEY,

    -- Scan Details
    barcode_scanned VARCHAR(255) NOT NULL,
    scan_type VARCHAR(50) CHECK (scan_type IN ('barcode', 'qr_code', 'manual')),

    -- Product Match
    product_id INTEGER REFERENCES public.products(id),
    lot_id INTEGER REFERENCES public.product_lots(id),
    match_status VARCHAR(50) NOT NULL CHECK (match_status IN (
        'matched', 'not_found', 'multiple_matches', 'error'
    )),

    -- Order Verification
    order_id INTEGER,
    order_type VARCHAR(50),
    in_order BOOLEAN,

    -- Context
    verification_context VARCHAR(50) CHECK (verification_context IN (
        'receiving', 'picking', 'packing', 'shipping', 'inventory_check'
    )),

    -- Location
    warehouse_id INTEGER REFERENCES public.warehouses(id),

    -- Metadata
    scanned_by UUID REFERENCES public.employees(employee_id),
    device_info JSONB, -- Device type, browser, location, etc.
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_barcode_verifications_barcode ON public.barcode_verifications(barcode_scanned);
CREATE INDEX idx_barcode_verifications_product ON public.barcode_verifications(product_id);
CREATE INDEX idx_barcode_verifications_lot ON public.barcode_verifications(lot_id);
CREATE INDEX idx_barcode_verifications_date ON public.barcode_verifications(scanned_at DESC);

COMMENT ON TABLE public.barcode_verifications IS 'Barcode/QR scan verification log (NÚT 3)';

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get Available Lots with FIFO/FEFO
CREATE OR REPLACE FUNCTION get_available_lots_v2(
    p_product_id INTEGER,
    p_warehouse_id INTEGER,
    p_required_quantity INTEGER DEFAULT NULL,
    p_strategy VARCHAR(10) DEFAULT 'FEFO', -- FIFO or FEFO
    p_require_vat BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    lot_id INTEGER,
    lot_number VARCHAR(100),
    expiry_date DATE,
    shelf_location VARCHAR(100),
    quantity_available INTEGER,
    vat_available INTEGER,
    unit_cost DECIMAL(18, 2),
    days_until_expiry INTEGER,
    recommended_quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pl.id,
        pl.lot_number,
        pl.expiry_date,
        pl.shelf_location,
        pl.quantity_available,
        CASE
            WHEN vw.id IS NOT NULL THEN vw.quantity_available
            ELSE 0
        END::INTEGER as vat_available,
        pl.final_unit_cost,
        CASE
            WHEN pl.expiry_date IS NOT NULL
            THEN (pl.expiry_date - CURRENT_DATE)::INTEGER
            ELSE NULL
        END as days_until_expiry,
        CASE
            WHEN p_required_quantity IS NOT NULL THEN
                LEAST(pl.quantity_available, p_required_quantity)
            ELSE pl.quantity_available
        END as recommended_quantity
    FROM public.product_lots pl
    LEFT JOIN public.vat_warehouse vw ON vw.lot_id = pl.id
    WHERE pl.product_id = p_product_id
        AND pl.warehouse_id = p_warehouse_id
        AND pl.status = 'active'
        AND pl.quantity_available > 0
        AND (pl.expiry_date IS NULL OR pl.expiry_date > CURRENT_DATE)
        AND (NOT p_require_vat OR vw.quantity_available > 0)
    ORDER BY
        CASE
            WHEN p_strategy = 'FEFO' THEN pl.expiry_date
            WHEN p_strategy = 'FIFO' THEN pl.received_date
        END ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_lots_v2 IS 'Get available lots with FIFO/FEFO strategy and VAT filtering';

-- Function: Reserve Lot Quantity
CREATE OR REPLACE FUNCTION reserve_lot_quantity_v2(
    p_lot_id INTEGER,
    p_quantity INTEGER,
    p_order_id INTEGER,
    p_order_type VARCHAR(50),
    p_employee_id UUID,
    p_shelf_location VARCHAR(100) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_available INTEGER;
    v_result JSONB;
BEGIN
    -- Check available quantity
    SELECT quantity_available INTO v_available
    FROM public.product_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF v_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient quantity',
            'available', v_available,
            'requested', p_quantity
        );
    END IF;

    -- Update lot quantities
    UPDATE public.product_lots
    SET
        quantity_available = quantity_available - p_quantity,
        quantity_reserved = quantity_reserved + p_quantity,
        status = CASE
            WHEN quantity_available - p_quantity = 0 THEN 'reserved'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_lot_id;

    -- Record movement
    INSERT INTO public.lot_movements (
        lot_id, movement_type, quantity, order_id, order_type,
        to_location, performed_by
    ) VALUES (
        p_lot_id, 'reserved', p_quantity, p_order_id, p_order_type,
        p_shelf_location, p_employee_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'lot_id', p_lot_id,
        'reserved_quantity', p_quantity
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Sell Lot with VAT Tracking
CREATE OR REPLACE FUNCTION sell_lot_quantity_v2(
    p_lot_id INTEGER,
    p_quantity INTEGER,
    p_order_id INTEGER,
    p_order_type VARCHAR(50),
    p_sales_vat_invoice_id INTEGER DEFAULT NULL,
    p_employee_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_reserved INTEGER;
    v_vat_available INTEGER;
    v_purchase_vat_id INTEGER;
    v_result JSONB;
BEGIN
    -- Check reserved quantity
    SELECT quantity_reserved INTO v_reserved
    FROM public.product_lots
    WHERE id = p_lot_id
    FOR UPDATE;

    IF v_reserved < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Insufficient reserved quantity',
            'reserved', v_reserved,
            'requested', p_quantity
        );
    END IF;

    -- If VAT invoice required, check VAT warehouse
    IF p_sales_vat_invoice_id IS NOT NULL THEN
        SELECT
            vw.quantity_available,
            vw.purchase_vat_invoice_id
        INTO v_vat_available, v_purchase_vat_id
        FROM public.vat_warehouse vw
        WHERE vw.lot_id = p_lot_id
        LIMIT 1;

        IF v_vat_available < p_quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'Insufficient VAT invoice coverage',
                'vat_available', COALESCE(v_vat_available, 0),
                'requested', p_quantity
            );
        END IF;

        -- Update VAT warehouse
        UPDATE public.vat_warehouse
        SET
            quantity_sold = quantity_sold + p_quantity,
            sales_vat_invoices = sales_vat_invoices || jsonb_build_object(
                'invoice_id', p_sales_vat_invoice_id,
                'quantity', p_quantity,
                'date', CURRENT_DATE
            )
        WHERE lot_id = p_lot_id;
    END IF;

    -- Update lot quantities
    UPDATE public.product_lots
    SET
        quantity_reserved = quantity_reserved - p_quantity,
        quantity_sold = quantity_sold + p_quantity,
        vat_invoice_sold = CASE
            WHEN p_sales_vat_invoice_id IS NOT NULL
            THEN vat_invoice_sold + p_quantity
            ELSE vat_invoice_sold
        END,
        status = CASE
            WHEN quantity_available = 0 AND quantity_reserved - p_quantity = 0
            THEN 'depleted'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = p_lot_id;

    -- Record movement with VAT linkage
    INSERT INTO public.lot_movements (
        lot_id, movement_type, quantity, order_id, order_type,
        purchase_vat_invoice_id, sales_vat_invoice_id, performed_by
    ) VALUES (
        p_lot_id, 'sold', p_quantity, p_order_id, p_order_type,
        v_purchase_vat_id, p_sales_vat_invoice_id, p_employee_id
    );

    RETURN jsonb_build_object(
        'success', true,
        'lot_id', p_lot_id,
        'sold_quantity', p_quantity,
        'purchase_vat_invoice', v_purchase_vat_id,
        'sales_vat_invoice', p_sales_vat_invoice_id
    );
END;
$$ LANGUAGE plpgsql;

-- Function: Verify Barcode (NÚT 3)
CREATE OR REPLACE FUNCTION verify_barcode_v2(
    p_barcode VARCHAR(255),
    p_order_id INTEGER DEFAULT NULL,
    p_order_type VARCHAR(50) DEFAULT NULL,
    p_context VARCHAR(50) DEFAULT 'inventory_check',
    p_employee_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_product_id INTEGER;
    v_lot_id INTEGER;
    v_in_order BOOLEAN := FALSE;
    v_match_status VARCHAR(50);
    v_result JSONB;
BEGIN
    -- Find product by barcode
    SELECT id INTO v_product_id
    FROM public.products
    WHERE barcode = p_barcode OR qr_code = p_barcode
    LIMIT 1;

    -- Find lot by barcode
    SELECT id INTO v_lot_id
    FROM public.product_lots
    WHERE barcode = p_barcode OR qr_code = p_barcode
    LIMIT 1;

    -- Determine match status
    IF v_product_id IS NOT NULL OR v_lot_id IS NOT NULL THEN
        v_match_status := 'matched';
    ELSE
        v_match_status := 'not_found';
    END IF;

    -- Check if in order (if order provided)
    IF p_order_id IS NOT NULL AND v_product_id IS NOT NULL THEN
        CASE p_order_type
            WHEN 'purchase' THEN
                SELECT EXISTS(
                    SELECT 1 FROM public.purchase_order_items
                    WHERE po_id = p_order_id AND product_id = v_product_id
                ) INTO v_in_order;
            WHEN 'pos', 'b2b' THEN
                -- Check in order items table
                SELECT EXISTS(
                    SELECT 1 FROM public.order_items
                    WHERE order_id = p_order_id AND product_id = v_product_id
                ) INTO v_in_order;
        END CASE;
    END IF;

    -- Log verification
    INSERT INTO public.barcode_verifications (
        barcode_scanned, product_id, lot_id, match_status,
        order_id, order_type, in_order, verification_context,
        scanned_by
    ) VALUES (
        p_barcode, v_product_id, v_lot_id, v_match_status,
        p_order_id, p_order_type, v_in_order, p_context,
        p_employee_id
    );

    -- Build result
    v_result := jsonb_build_object(
        'success', v_match_status = 'matched',
        'match_status', v_match_status,
        'product_id', v_product_id,
        'lot_id', v_lot_id,
        'in_order', v_in_order
    );

    -- Add product details if found
    IF v_product_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'product', (
                SELECT jsonb_build_object(
                    'id', id,
                    'name', name,
                    'sku', sku,
                    'barcode', barcode
                )
                FROM public.products
                WHERE id = v_product_id
            )
        );
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verify_barcode_v2 IS 'Verify barcode and check against order (NÚT 3)';

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_product_lots_updated_at ON public.product_lots;
CREATE TRIGGER trigger_product_lots_updated_at
    BEFORE UPDATE ON public.product_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_vat_invoices_updated_at ON public.vat_invoices;
CREATE TRIGGER trigger_vat_invoices_updated_at
    BEFORE UPDATE ON public.vat_invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_vat_warehouse_updated_at ON public.vat_warehouse;
CREATE TRIGGER trigger_vat_warehouse_updated_at
    BEFORE UPDATE ON public.vat_warehouse
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.product_lots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lot_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_warehouse ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barcode_verifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated read" ON public.product_lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON public.product_lots FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.vat_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON public.vat_invoices FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.vat_invoice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON public.vat_invoice_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.lot_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON public.lot_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.vat_warehouse FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON public.vat_warehouse FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON public.barcode_verifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON public.barcode_verifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
