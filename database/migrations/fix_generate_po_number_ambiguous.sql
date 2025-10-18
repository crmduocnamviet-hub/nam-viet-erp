-- Fix "column reference po_number is ambiguous" error
-- by explicitly qualifying the column name

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    po_number TEXT;
BEGIN
    -- Get the next number based on existing PO numbers
    -- FIX: Explicitly qualify po_number with table name
    SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_orders.po_number FROM 'PO-(.*)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM public.purchase_orders
    WHERE purchase_orders.po_number ~ '^PO-[0-9]+$';

    -- Format as PO-XXXXX (5 digits, zero-padded)
    po_number := 'PO-' || LPAD(next_number::TEXT, 5, '0');

    RETURN po_number;
END;
$$ LANGUAGE plpgsql;

-- Test the function
-- SELECT generate_po_number();
