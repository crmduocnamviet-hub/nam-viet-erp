-- Create supplier_promotions table
-- Purpose: Manage supplier discount and promotional programs
-- Date: 2025-10-25

CREATE TABLE IF NOT EXISTS supplier_promotions (
  id BIGSERIAL PRIMARY KEY,

  -- Basic Information
  supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Promotion Type
  promotion_type VARCHAR(50) NOT NULL CHECK (promotion_type IN (
    'buy_x_get_y',      -- Mua X tặng Y
    'percentage_discount', -- Giảm giá theo %
    'fixed_discount',   -- Giảm giá cố định
    'post_payment_discount' -- Chiết khấu trả sau
  )),

  -- Promotion Values (JSON for flexibility)
  promotion_config JSONB NOT NULL DEFAULT '{}',
  -- Examples:
  -- For buy_x_get_y: {"buy_quantity": 10, "get_quantity": 1}
  -- For percentage_discount: {"discount_percent": 5, "applies_to": "all_or_specific"}
  -- For fixed_discount: {"discount_amount": 50000, "min_order_value": 1000000}
  -- For post_payment_discount: {"discount_percent": 3, "payment_days": 30}

  -- Time Period
  start_date DATE NOT NULL,
  end_date DATE,

  -- Application Scope
  applies_to_all_products BOOLEAN DEFAULT true,
  product_ids BIGINT[], -- Specific products if applies_to_all_products = false

  -- Conditions
  min_order_quantity INTEGER DEFAULT 0,
  min_order_value DECIMAL(15,2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Priority (for stacking promotions)
  priority INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(employee_id),

  -- Notes
  internal_notes TEXT
);

-- Indexes
CREATE INDEX idx_supplier_promotions_supplier_id ON supplier_promotions(supplier_id);
CREATE INDEX idx_supplier_promotions_dates ON supplier_promotions(start_date, end_date);
CREATE INDEX idx_supplier_promotions_active ON supplier_promotions(is_active);
CREATE INDEX idx_supplier_promotions_type ON supplier_promotions(promotion_type);

-- Comments
COMMENT ON TABLE supplier_promotions IS 'Manages promotional programs and discounts from suppliers';
COMMENT ON COLUMN supplier_promotions.promotion_type IS 'Type of promotion: buy_x_get_y, percentage_discount, fixed_discount, post_payment_discount';
COMMENT ON COLUMN supplier_promotions.promotion_config IS 'JSON configuration specific to promotion type';
COMMENT ON COLUMN supplier_promotions.applies_to_all_products IS 'If true, applies to all products from supplier';
COMMENT ON COLUMN supplier_promotions.product_ids IS 'Array of product IDs if promotion applies to specific products only';
COMMENT ON COLUMN supplier_promotions.priority IS 'Higher priority promotions are applied first when stacking';

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_supplier_promotions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_promotions_updated_at
  BEFORE UPDATE ON supplier_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_supplier_promotions_updated_at();

-- RLS Policies (if using Row Level Security)
-- ALTER TABLE supplier_promotions ENABLE ROW LEVEL SECURITY;

-- Sample data (optional - remove in production)
-- INSERT INTO supplier_promotions (supplier_id, name, promotion_type, promotion_config, start_date, end_date) VALUES
-- (1, 'Mua 10 tặng 1', 'buy_x_get_y', '{"buy_quantity": 10, "get_quantity": 1}', '2025-01-01', '2025-12-31'),
-- (1, 'Chiết khấu 5% thanh toán trong 30 ngày', 'post_payment_discount', '{"discount_percent": 5, "payment_days": 30}', '2025-01-01', '2025-12-31');
