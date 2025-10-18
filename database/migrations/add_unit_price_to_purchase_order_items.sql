-- Add unit_price column to purchase_order_items if it doesn't exist

-- Check if the column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'purchase_order_items'
        AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE public.purchase_order_items
        ADD COLUMN unit_price DECIMAL(15,2) DEFAULT 0 NOT NULL;

        RAISE NOTICE 'Column unit_price added to purchase_order_items';
    ELSE
        RAISE NOTICE 'Column unit_price already exists in purchase_order_items';
    END IF;
END $$;

-- Verify the column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'purchase_order_items'
ORDER BY ordinal_position;
