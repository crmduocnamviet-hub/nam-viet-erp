-- =====================================================
-- SALES COMBO ITEMS TABLE MIGRATION
-- =====================================================
-- This migration creates a table to track combo items in sales orders
-- allowing us to record which specific products were part of a combo
-- when it was sold, for inventory management and reporting
-- =====================================================

-- Create sales_combo_items table
CREATE TABLE IF NOT EXISTS public.sales_combo_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.sales_orders(order_id) ON DELETE CASCADE,
    combo_id BIGINT NOT NULL REFERENCES public.combos(id) ON DELETE RESTRICT,
    product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(18, 2) NOT NULL CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments to sales_combo_items table
COMMENT ON TABLE public.sales_combo_items IS 'Tracks individual products sold as part of combos in sales orders';
COMMENT ON COLUMN public.sales_combo_items.id IS 'Unique identifier for the sales combo item';
COMMENT ON COLUMN public.sales_combo_items.order_id IS 'Reference to the sales order';
COMMENT ON COLUMN public.sales_combo_items.combo_id IS 'Reference to the combo that was sold';
COMMENT ON COLUMN public.sales_combo_items.product_id IS 'Reference to the product that was part of the combo';
COMMENT ON COLUMN public.sales_combo_items.quantity IS 'Quantity of this product sold as part of the combo';
COMMENT ON COLUMN public.sales_combo_items.unit_price IS 'Price allocated to this product from the combo price';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_combo_items_order_id ON public.sales_combo_items(order_id);
CREATE INDEX IF NOT EXISTS idx_sales_combo_items_combo_id ON public.sales_combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_sales_combo_items_product_id ON public.sales_combo_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_combo_items_created_at ON public.sales_combo_items(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on table
ALTER TABLE public.sales_combo_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all sales combo items
CREATE POLICY "Allow authenticated read access to sales_combo_items"
    ON public.sales_combo_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert sales combo items
CREATE POLICY "Allow authenticated insert access to sales_combo_items"
    ON public.sales_combo_items
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow service role full access to sales_combo_items
CREATE POLICY "Allow service role full access to sales_combo_items"
    ON public.sales_combo_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant table permissions
GRANT SELECT, INSERT ON public.sales_combo_items TO authenticated, service_role;
GRANT ALL ON public.sales_combo_items TO service_role;

-- -- =====================================================
-- -- USEFUL VIEWS (Optional)
-- -- =====================================================

-- -- View to see sales combo items with all related information
-- CREATE OR REPLACE VIEW public.sales_combo_items_detailed AS
-- SELECT
--     sci.id,
--     sci.order_id,
--     sci.combo_id,
--     c.name AS combo_name,
--     sci.product_id,
--     p.name AS product_name,
--     p.product_code,
--     sci.quantity,
--     sci.unit_price,
--     sci.quantity * sci.unit_price AS total_price,
--     sci.created_at,
--     so.order_datetime AS order_date,
--     so.patient_id
-- FROM public.sales_combo_items sci
-- LEFT JOIN public.combos c ON sci.combo_id = c.id
-- LEFT JOIN public.products p ON sci.product_id = p.id
-- LEFT JOIN public.sales_orders so ON sci.order_id = so.order_id;

-- COMMENT ON VIEW public.sales_combo_items_detailed IS 'Sales combo items with detailed product and combo information';

-- -- Grant view permissions
-- GRANT SELECT ON public.sales_combo_items_detailed TO authenticated, service_role;
