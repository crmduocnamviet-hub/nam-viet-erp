-- B2B Quotation System Database Schema
-- Created for Nam Viet ERP - B2B Quote Management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: B2B Customers
CREATE TABLE IF NOT EXISTS public.b2b_customers (
    customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_name VARCHAR(255) NOT NULL,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    contact_person VARCHAR(255),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    tax_code VARCHAR(50),
    customer_type VARCHAR(50) NOT NULL DEFAULT 'other' CHECK (customer_type IN ('hospital', 'pharmacy', 'clinic', 'distributor', 'other')),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms_days INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: B2B Quotes (Main quote table)
CREATE TABLE IF NOT EXISTS public.b2b_quotes (
    quote_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE NOT NULL, -- BG-2024-01-001 format
    customer_name VARCHAR(255) NOT NULL,
    customer_code VARCHAR(50),
    customer_contact_person VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    customer_address TEXT,
    quote_stage VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (quote_stage IN ('draft', 'sent', 'negotiating', 'accepted', 'rejected', 'expired')),
    total_value DECIMAL(15,2) NOT NULL DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_percent DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    quote_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    notes TEXT,
    terms_conditions TEXT,
    created_by_employee_id UUID NOT NULL REFERENCES public.employees(employee_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Optional foreign key to b2b_customers if customer exists
    b2b_customer_id UUID REFERENCES public.b2b_customers(customer_id) ON DELETE SET NULL
);

-- Table: B2B Quote Items (Line items for each quote)
CREATE TABLE IF NOT EXISTS public.b2b_quote_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES public.b2b_quotes(quote_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES public.products(id),
    product_name VARCHAR(255) NOT NULL, -- Snapshot of product name at time of quote
    product_sku VARCHAR(100),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(15,2) NOT NULL CHECK (unit_price >= 0),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_b2b_customers_code ON public.b2b_customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_b2b_customers_name ON public.b2b_customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_b2b_customers_type ON public.b2b_customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_b2b_customers_active ON public.b2b_customers(is_active);

CREATE INDEX IF NOT EXISTS idx_b2b_quotes_number ON public.b2b_quotes(quote_number);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_stage ON public.b2b_quotes(quote_stage);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_customer ON public.b2b_quotes(customer_name);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_employee ON public.b2b_quotes(created_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_date ON public.b2b_quotes(quote_date);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_valid_until ON public.b2b_quotes(valid_until);

CREATE INDEX IF NOT EXISTS idx_b2b_quote_items_quote ON public.b2b_quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_b2b_quote_items_product ON public.b2b_quote_items(product_id);

-- Create trigger function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_b2b_customers_updated_at
    BEFORE UPDATE ON public.b2b_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_b2b_quotes_updated_at
    BEFORE UPDATE ON public.b2b_quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger function to calculate quote totals
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
    quote_subtotal DECIMAL(15,2) := 0;
    quote_discount DECIMAL(15,2) := 0;
    quote_tax DECIMAL(15,2) := 0;
    quote_total DECIMAL(15,2) := 0;
    quote_discount_percent DECIMAL(5,2) := 0;
    quote_tax_percent DECIMAL(5,2) := 0;
BEGIN
    -- Get quote-level discount and tax percentages
    SELECT discount_percent, tax_percent
    INTO quote_discount_percent, quote_tax_percent
    FROM public.b2b_quotes
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    -- Calculate subtotal from all items for this quote
    SELECT COALESCE(SUM(subtotal), 0)
    INTO quote_subtotal
    FROM public.b2b_quote_items
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    -- Calculate discount amount
    quote_discount := quote_subtotal * (quote_discount_percent / 100);

    -- Calculate tax amount (on subtotal minus discount)
    quote_tax := (quote_subtotal - quote_discount) * (quote_tax_percent / 100);

    -- Calculate total
    quote_total := quote_subtotal - quote_discount + quote_tax;

    -- Update the quote with calculated totals
    UPDATE public.b2b_quotes
    SET
        subtotal = quote_subtotal,
        discount_amount = quote_discount,
        tax_amount = quote_tax,
        total_value = quote_total,
        updated_at = NOW()
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger function to calculate line item subtotal
CREATE OR REPLACE FUNCTION calculate_line_item_subtotal()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate subtotal for the line item
    NEW.subtotal := (NEW.quantity * NEW.unit_price) - NEW.discount_amount;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic calculations
CREATE TRIGGER calculate_b2b_quote_item_subtotal
    BEFORE INSERT OR UPDATE ON public.b2b_quote_items
    FOR EACH ROW EXECUTE FUNCTION calculate_line_item_subtotal();

CREATE TRIGGER calculate_b2b_quote_totals_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.b2b_quote_items
    FOR EACH ROW EXECUTE FUNCTION calculate_quote_totals();

CREATE TRIGGER calculate_b2b_quote_totals_on_quote_change
    AFTER UPDATE OF discount_percent, tax_percent ON public.b2b_quotes
    FOR EACH ROW EXECUTE FUNCTION calculate_quote_totals();

-- Insert sample B2B customer types for reference
INSERT INTO public.b2b_customers (customer_name, customer_code, customer_type, contact_person, phone_number, email) VALUES
('Bệnh viện Đa khoa Thành phố', 'BVTP001', 'hospital', 'Nguyễn Văn A', '0901234567', 'procurement@bvtp.com'),
('Nhà thuốc Thu Cúc', 'NTTC001', 'pharmacy', 'Trần Thị B', '0902345678', 'manager@thucuc.com'),
('Phòng khám Đa khoa An Khang', 'PKAK001', 'clinic', 'Lê Văn C', '0903456789', 'admin@ankhang.com'),
('Công ty TNHH Dược phẩm Minh Hạnh', 'DPMT001', 'distributor', 'Phạm Thị D', '0904567890', 'sales@minhhanh.com')
ON CONFLICT (customer_code) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_quotes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.b2b_quote_items TO authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

-- Create RLS policies (Row Level Security) if needed
-- ALTER TABLE public.b2b_quotes ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own quotes" ON public.b2b_quotes
--     FOR SELECT USING (created_by_employee_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE public.b2b_customers IS 'B2B customers for wholesale quotations and orders';
COMMENT ON TABLE public.b2b_quotes IS 'B2B quotations with 7-stage lifecycle from draft to accepted/rejected';
COMMENT ON TABLE public.b2b_quote_items IS 'Line items for B2B quotes with product details and pricing';

COMMENT ON COLUMN public.b2b_quotes.quote_stage IS 'Quote lifecycle: draft, sent, negotiating, accepted, rejected, expired';
COMMENT ON COLUMN public.b2b_quotes.quote_number IS 'Auto-generated quote number in format BG-YYYY-MM-NNN';
COMMENT ON COLUMN public.b2b_quotes.valid_until IS 'Quote expiration date';

-- Success message
SELECT 'B2B Quotation System database schema created successfully!' as message;