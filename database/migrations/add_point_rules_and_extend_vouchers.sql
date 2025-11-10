-- Migration: Add Point Rules Table and Extend Vouchers for Point Redemption
-- Description: Create point accumulation/redemption rules and extend vouchers to support point redemption with time limits
-- Date: 2025-01-XX

-- ============================================
-- 1. CREATE POINT RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.point_rules (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE NOT NULL, -- Default rule for all branches
    
    -- Point Accumulation Rules (Quy tắc Tích Điểm)
    accumulation_spend_amount NUMERIC(15, 2) NOT NULL, -- Số tiền chi tiêu (e.g., 100000)
    accumulation_points_earned INTEGER NOT NULL, -- Số điểm nhận được (e.g., 1)
    -- Example: 1 point per 100,000 VND spent
    
    -- Point Redemption Rules (Quy tắc Đổi Điểm)
    redemption_points_required INTEGER NOT NULL, -- Số điểm cần để đổi (e.g., 25)
    redemption_voucher_value NUMERIC(15, 2) NOT NULL, -- Giá trị voucher (e.g., 25000)
    -- Example: 25 points = 25,000 VND voucher
    
    -- Branch/Warehouse Application
    applies_to_all_branches BOOLEAN DEFAULT FALSE NOT NULL,
    warehouse_ids BIGINT[], -- Array of warehouse IDs if not applies_to_all_branches
    
    -- Voucher Settings
    voucher_validity_days INTEGER DEFAULT 30 NOT NULL, -- Số ngày có hiệu lực của voucher
    voucher_min_points INTEGER DEFAULT 10, -- Minimum points required to redeem
    
    -- Metadata
    created_by UUID REFERENCES public.employees(employee_id) ON DELETE SET NULL,
    notes TEXT,
    
    -- Constraints
    CONSTRAINT check_accumulation_positive CHECK (accumulation_spend_amount > 0 AND accumulation_points_earned > 0),
    CONSTRAINT check_redemption_positive CHECK (redemption_points_required > 0 AND redemption_voucher_value > 0),
    CONSTRAINT check_voucher_validity CHECK (voucher_validity_days > 0),
    CONSTRAINT check_warehouse_ids CHECK (
        (applies_to_all_branches = TRUE AND warehouse_ids IS NULL) OR
        (applies_to_all_branches = FALSE AND warehouse_ids IS NOT NULL AND array_length(warehouse_ids, 1) > 0)
    )
);

-- Add comments
COMMENT ON TABLE public.point_rules IS 'Quy tắc tích điểm và đổi điểm cho khách hàng';
COMMENT ON COLUMN public.point_rules.name IS 'Tên quy tắc';
COMMENT ON COLUMN public.point_rules.is_default IS 'Quy tắc mặc định áp dụng cho tất cả chi nhánh';
COMMENT ON COLUMN public.point_rules.accumulation_spend_amount IS 'Số tiền chi tiêu để tích điểm (VND)';
COMMENT ON COLUMN public.point_rules.accumulation_points_earned IS 'Số điểm nhận được khi chi tiêu đủ số tiền';
COMMENT ON COLUMN public.point_rules.redemption_points_required IS 'Số điểm cần để đổi voucher';
COMMENT ON COLUMN public.point_rules.redemption_voucher_value IS 'Giá trị voucher nhận được (VND)';
COMMENT ON COLUMN public.point_rules.warehouse_ids IS 'Danh sách ID kho/chi nhánh áp dụng quy tắc';
COMMENT ON COLUMN public.point_rules.voucher_validity_days IS 'Số ngày có hiệu lực của voucher sau khi đổi điểm';

-- Create indexes
CREATE INDEX idx_point_rules_is_active ON public.point_rules(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_point_rules_is_default ON public.point_rules(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_point_rules_created_at ON public.point_rules(created_at DESC);

-- ============================================
-- 2. EXTEND VOUCHERS TABLE FOR POINT REDEMPTION
-- ============================================
-- Add columns to vouchers table for point redemption tracking
ALTER TABLE public.vouchers
    ADD COLUMN IF NOT EXISTS point_rule_id BIGINT REFERENCES public.point_rules(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS redeemed_by_patient_id UUID REFERENCES public.patients(patient_id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS is_point_voucher BOOLEAN DEFAULT FALSE NOT NULL; -- Flag to identify point-redeemed vouchers

-- Add comments
COMMENT ON COLUMN public.vouchers.point_rule_id IS 'ID của quy tắc tích điểm được sử dụng để đổi voucher';
COMMENT ON COLUMN public.vouchers.redeemed_by_patient_id IS 'ID bệnh nhân đã đổi điểm để lấy voucher';
COMMENT ON COLUMN public.vouchers.points_used IS 'Số điểm đã sử dụng để đổi voucher';
COMMENT ON COLUMN public.vouchers.redeemed_at IS 'Thời điểm đổi điểm thành voucher';
COMMENT ON COLUMN public.vouchers.expires_at IS 'Thời điểm hết hạn sử dụng voucher';
COMMENT ON COLUMN public.vouchers.is_point_voucher IS 'Cờ xác định voucher được đổi từ điểm';

-- Create indexes for point vouchers
CREATE INDEX IF NOT EXISTS idx_vouchers_point_rule_id ON public.vouchers(point_rule_id) WHERE point_rule_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_redeemed_by_patient ON public.vouchers(redeemed_by_patient_id) WHERE redeemed_by_patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vouchers_is_point_voucher ON public.vouchers(is_point_voucher) WHERE is_point_voucher = TRUE;
CREATE INDEX IF NOT EXISTS idx_vouchers_expires_at ON public.vouchers(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 3. CREATE FUNCTION TO UPDATE UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_point_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_point_rules_updated_at
    BEFORE UPDATE ON public.point_rules
    FOR EACH ROW
    EXECUTE FUNCTION public.update_point_rules_updated_at();

-- ============================================
-- 4. CREATE FUNCTION TO ENSURE ONLY ONE DEFAULT RULE
-- ============================================
CREATE OR REPLACE FUNCTION public.ensure_single_default_point_rule()
RETURNS TRIGGER AS $$
BEGIN
    -- If this rule is being set as default, unset all other defaults
    IF NEW.is_default = TRUE THEN
        UPDATE public.point_rules
        SET is_default = FALSE
        WHERE id != NEW.id AND is_default = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_point_rule
    BEFORE INSERT OR UPDATE ON public.point_rules
    FOR EACH ROW
    WHEN (NEW.is_default = TRUE)
    EXECUTE FUNCTION public.ensure_single_default_point_rule();

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON TABLE public.point_rules TO anon;
GRANT ALL ON TABLE public.point_rules TO authenticated;
GRANT ALL ON TABLE public.point_rules TO service_role;

GRANT ALL ON SEQUENCE public.point_rules_id_seq TO anon;
GRANT ALL ON SEQUENCE public.point_rules_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.point_rules_id_seq TO service_role;

-- ============================================
-- 6. INSERT DEFAULT POINT RULE (Optional)
-- ============================================
-- Uncomment to create a default rule on migration
/*
INSERT INTO public.point_rules (
    name,
    description,
    is_active,
    is_default,
    accumulation_spend_amount,
    accumulation_points_earned,
    redemption_points_required,
    redemption_voucher_value,
    applies_to_all_branches,
    voucher_validity_days,
    voucher_min_points
) VALUES (
    'Quy tắc Chung (Mặc định)',
    'Quy tắc tích điểm mặc định cho tất cả chi nhánh',
    TRUE,
    TRUE,
    100000,  -- 1 point per 100,000 VND
    1,
    25,      -- 25 points = 25,000 VND
    25000,
    TRUE,
    30,      -- Voucher valid for 30 days
    10       -- Minimum 10 points to redeem
);
*/

