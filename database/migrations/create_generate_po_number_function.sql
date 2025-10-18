-- Create function to generate unique purchase order numbers
-- Format: PO-YYYYMMDD-XXXX (e.g., PO-20251011-0001)

CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS TEXT AS $$
DECLARE
  today_prefix TEXT;
  next_number INTEGER;
  new_po_number TEXT;
BEGIN
  -- Generate today's prefix (PO-YYYYMMDD)
  today_prefix := 'PO-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

  -- Find the highest number for today
  SELECT COALESCE(
    MAX(
      CASE
        WHEN purchase_orders.po_number ~ ('^' || today_prefix || '-[0-9]+$')
        THEN CAST(SPLIT_PART(purchase_orders.po_number, '-', 3) AS INTEGER)
        ELSE 0
      END
    ),
    0
  ) INTO next_number
  FROM purchase_orders
  WHERE purchase_orders.po_number LIKE today_prefix || '%';

  -- Increment and format with leading zeros
  new_po_number := today_prefix || '-' || LPAD((next_number + 1)::TEXT, 4, '0');

  RETURN new_po_number;
END;
$$ LANGUAGE plpgsql;

-- Example output:
-- PO-20251011-0001
-- PO-20251011-0002
-- PO-20251012-0001 (resets daily)

-- Test the function (optional, can be commented out)
-- SELECT generate_po_number();
