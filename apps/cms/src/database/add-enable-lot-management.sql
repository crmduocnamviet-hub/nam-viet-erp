-- Add enable_lot_management field to products table
-- This field determines whether a product requires lot/batch tracking

-- Add the column to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS enable_lot_management BOOLEAN DEFAULT FALSE;

-- Add comment to explain the field
COMMENT ON COLUMN products.enable_lot_management IS 'Flag to enable lot/batch tracking for this product. When true, the product requires lot number, expiry date, and other lot-specific information during receiving and selling.';

-- Create index for faster filtering of lot-managed products
CREATE INDEX IF NOT EXISTS idx_products_enable_lot_management
ON products(enable_lot_management)
WHERE enable_lot_management = TRUE;

-- Update existing products that might need lot management (based on common patterns)
-- This is optional - you can manually update products as needed
-- UPDATE products
-- SET enable_lot_management = TRUE
-- WHERE category IN ('Thuốc', 'Thực phẩm chức năng', 'Mỹ phẩm')
-- OR name ILIKE '%thuốc%'
-- OR name ILIKE '%vitamin%';
