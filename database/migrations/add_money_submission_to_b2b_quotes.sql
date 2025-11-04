-- Add money submission tracking to B2B quotes
-- Purpose: Track when delivery staff submits collected money to accountant
-- Date: 2025-11-04

-- Add columns for tracking money submission to accountant
ALTER TABLE b2b_quotes
ADD COLUMN IF NOT EXISTS money_submitted_to_accountant BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS money_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS money_submitted_by UUID REFERENCES employees(employee_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS accountant_received_by UUID REFERENCES employees(employee_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS money_submitted_note TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_money_submitted ON b2b_quotes(money_submitted_to_accountant);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_money_submitted_at ON b2b_quotes(money_submitted_at);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_money_submitted_by ON b2b_quotes(money_submitted_by);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_accountant_received_by ON b2b_quotes(accountant_received_by);

-- Add comments
COMMENT ON COLUMN b2b_quotes.money_submitted_to_accountant IS 'Nhân viên giao hàng đã nộp tiền cho kế toán chưa';
COMMENT ON COLUMN b2b_quotes.money_submitted_at IS 'Thời gian nhân viên giao hàng nộp tiền cho kế toán';
COMMENT ON COLUMN b2b_quotes.money_submitted_by IS 'Nhân viên giao hàng nộp tiền (thường là delivery_employee_id)';
COMMENT ON COLUMN b2b_quotes.accountant_received_by IS 'Kế toán nhận tiền';
COMMENT ON COLUMN b2b_quotes.money_submitted_note IS 'Ghi chú khi nộp tiền (số tiền thực tế, phương thức thanh toán, v.v.)';
