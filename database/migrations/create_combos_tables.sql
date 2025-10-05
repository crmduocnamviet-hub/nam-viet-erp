-- =====================================================
-- COMBO TABLES MIGRATION
-- =====================================================
-- This migration creates tables for product combo/bundle functionality
-- allowing customers to buy multiple products together at a discounted price
-- =====================================================

-- Create combos table
CREATE TABLE IF NOT EXISTS public.combos (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    combo_price NUMERIC(10, 2) NOT NULL CHECK (combo_price >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments to combos table
COMMENT ON TABLE public.combos IS 'Product bundles/packages with discounted pricing';
COMMENT ON COLUMN public.combos.id IS 'Unique identifier for the combo';
COMMENT ON COLUMN public.combos.name IS 'Name of the combo (e.g., "Flu Care Package")';
COMMENT ON COLUMN public.combos.description IS 'Description of the combo and its benefits';
COMMENT ON COLUMN public.combos.combo_price IS 'Discounted price for buying all products together';
COMMENT ON COLUMN public.combos.is_active IS 'Whether this combo is currently available';
COMMENT ON COLUMN public.combos.image_url IS 'URL to combo promotional image';

-- Create combo_items table (junction table linking combos to products)
CREATE TABLE IF NOT EXISTS public.combo_items (
    id BIGSERIAL PRIMARY KEY,
    combo_id BIGINT NOT NULL REFERENCES public.combos(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(combo_id, product_id)
);

-- Add comments to combo_items table
COMMENT ON TABLE public.combo_items IS 'Links combos to their constituent products with quantities';
COMMENT ON COLUMN public.combo_items.id IS 'Unique identifier for the combo item';
COMMENT ON COLUMN public.combo_items.combo_id IS 'Reference to the combo';
COMMENT ON COLUMN public.combo_items.product_id IS 'Reference to the product included in combo';
COMMENT ON COLUMN public.combo_items.quantity IS 'How many units of this product are in the combo';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_combos_is_active ON public.combos(is_active);
CREATE INDEX IF NOT EXISTS idx_combos_created_at ON public.combos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_combo_items_combo_id ON public.combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_combo_items_product_id ON public.combo_items(product_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_combos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_update_combos_updated_at ON public.combos;
CREATE TRIGGER trigger_update_combos_updated_at
    BEFORE UPDATE ON public.combos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_combos_updated_at();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Example combo: Flu Care Package
INSERT INTO public.combos (name, description, combo_price, is_active)
VALUES (
    'Combo Chăm Sóc Cảm Cúm',
    'Gói combo chăm sóc toàn diện cho người bị cảm cúm, bao gồm thuốc hạ sốt và vitamin tăng cường sức đề kháng',
    180000,
    true
) ON CONFLICT DO NOTHING;

-- Note: You'll need to add combo_items after creating the combo
-- Example:
-- INSERT INTO public.combo_items (combo_id, product_id, quantity)
-- VALUES
--     (1, 10, 2),  -- 2 boxes of Paracetamol
--     (1, 25, 1),  -- 1 bottle of Vitamin C
--     (1, 33, 1);  -- 1 box of Throat lozenges

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.combos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to all active combos
CREATE POLICY "Allow public read access to active combos"
    ON public.combos
    FOR SELECT
    USING (is_active = true);

-- Policy: Allow authenticated users to read all combos
CREATE POLICY "Allow authenticated read access to all combos"
    ON public.combos
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role full access to combos
CREATE POLICY "Allow service role full access to combos"
    ON public.combos
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Policy: Allow read access to combo_items when parent combo is accessible
CREATE POLICY "Allow public read access to combo_items"
    ON public.combo_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.combos
            WHERE combos.id = combo_items.combo_id
            AND combos.is_active = true
        )
    );

-- Policy: Allow authenticated users to read all combo_items
CREATE POLICY "Allow authenticated read access to all combo_items"
    ON public.combo_items
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow service role full access to combo_items
CREATE POLICY "Allow service role full access to combo_items"
    ON public.combo_items
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Grant usage on sequences
GRANT USAGE ON SEQUENCE public.combos_id_seq TO authenticated, anon, service_role;
GRANT USAGE ON SEQUENCE public.combo_items_id_seq TO authenticated, anon, service_role;

-- Grant table permissions
GRANT SELECT ON public.combos TO anon;
GRANT ALL ON public.combos TO authenticated, service_role;

GRANT SELECT ON public.combo_items TO anon;
GRANT ALL ON public.combo_items TO authenticated, service_role;

-- =====================================================
-- USEFUL VIEWS (Optional)
-- =====================================================

-- View to see combos with their total original price calculated
CREATE OR REPLACE VIEW public.combos_with_pricing AS
SELECT
    c.id,
    c.name,
    c.description,
    c.combo_price,
    c.is_active,
    c.image_url,
    c.created_at,
    c.updated_at,
    COALESCE(SUM(p.retail_price * ci.quantity), 0) AS original_price,
    COALESCE(SUM(p.retail_price * ci.quantity), 0) - c.combo_price AS discount_amount,
    CASE
        WHEN COALESCE(SUM(p.retail_price * ci.quantity), 0) > 0
        THEN ROUND(((COALESCE(SUM(p.retail_price * ci.quantity), 0) - c.combo_price) / COALESCE(SUM(p.retail_price * ci.quantity), 0) * 100)::numeric, 2)
        ELSE 0
    END AS discount_percentage,
    COUNT(ci.id) AS item_count
FROM public.combos c
LEFT JOIN public.combo_items ci ON c.id = ci.combo_id
LEFT JOIN public.products p ON ci.product_id = p.id
GROUP BY c.id, c.name, c.description, c.combo_price, c.is_active, c.image_url, c.created_at, c.updated_at;

COMMENT ON VIEW public.combos_with_pricing IS 'Combos with calculated original price, discount amount, and percentage';

-- Grant view permissions
GRANT SELECT ON public.combos_with_pricing TO anon, authenticated, service_role;
