-- Add warehouse and delivery staff to B2B quotes
-- Purpose: Track warehouse staff and delivery staff assigned to each B2B order
-- Date: 2025-10-26

ALTER TABLE b2b_quotes
ADD COLUMN IF NOT EXISTS warehouse_employee_id UUID REFERENCES employees(employee_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS delivery_employee_id UUID REFERENCES employees(employee_id) ON DELETE SET NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_warehouse_employee ON b2b_quotes(warehouse_employee_id);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_delivery_employee ON b2b_quotes(delivery_employee_id);

-- Add comments
COMMENT ON COLUMN b2b_quotes.warehouse_employee_id IS 'Nhân viên kho được giao xử lý đơn hàng này';
COMMENT ON COLUMN b2b_quotes.delivery_employee_id IS 'Nhân viên giao hàng được phân công cho đơn hàng này';
