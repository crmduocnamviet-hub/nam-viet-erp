-- =====================================================
-- KPI & COMMISSION MANAGEMENT SYSTEM
-- Hệ thống quản lý KPI và Hoa hồng
-- =====================================================

-- =====================================================
-- 1. TẠO BẢNG KPI_POLICIES (Chính sách KPI)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.kpi_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    kpi_type VARCHAR(50) NOT NULL, -- 'revenue', 'orders', 'customers', 'products_sold', 'custom'
    calculation_logic JSONB, -- Lưu cấu hình tính toán phức tạp
    target_value BIGINT, -- Mục tiêu cần đạt (nếu có)
    measurement_period VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
    applicable_roles TEXT[], -- Danh sách roles áp dụng KPI này
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_kpi_name UNIQUE (name)
);

-- Comments
COMMENT ON TABLE public.kpi_policies IS 'Bảng lưu các chính sách KPI';
COMMENT ON COLUMN public.kpi_policies.kpi_type IS 'Loại KPI: revenue (doanh thu), orders (đơn hàng), customers (khách hàng), products_sold (sản phẩm bán), custom (tùy chỉnh)';
COMMENT ON COLUMN public.kpi_policies.calculation_logic IS 'Logic tính toán KPI (JSON). VD: {"conditions": {"status": ["delivered", "paid"]}, "sum_field": "total_amount"}';
COMMENT ON COLUMN public.kpi_policies.measurement_period IS 'Chu kỳ đo lường: daily, weekly, monthly, quarterly, yearly';
COMMENT ON COLUMN public.kpi_policies.applicable_roles IS 'Danh sách role_name áp dụng KPI này';

-- =====================================================
-- 2. TẠO BẢNG COMMISSION_POLICIES (Chính sách Hoa hồng)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.commission_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(255) NOT NULL,
    kpi_id UUID REFERENCES public.kpi_policies(id) ON DELETE CASCADE,
    commission_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed', 'tiered'
    commission_rate NUMERIC(10, 2), -- Tỷ lệ % hoặc số tiền cố định
    tiers JSONB, -- Nếu là tiered: [{"from": 0, "to": 10000000, "rate": 1}, {"from": 10000000, "to": null, "rate": 2}]
    min_threshold BIGINT, -- Ngưỡng tối thiểu để nhận hoa hồng
    max_commission BIGINT, -- Giới hạn hoa hồng tối đa
    applicable_roles TEXT[], -- Danh sách roles áp dụng
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_commission_policy_name UNIQUE (policy_name)
);

-- Comments
COMMENT ON TABLE public.commission_policies IS 'Bảng lưu các chính sách hoa hồng dựa trên KPI';
COMMENT ON COLUMN public.commission_policies.commission_type IS 'Loại hoa hồng: percentage (%), fixed (cố định), tiered (theo bậc)';
COMMENT ON COLUMN public.commission_policies.commission_rate IS 'Tỷ lệ % (VD: 2.5 = 2.5%) hoặc số tiền cố định';
COMMENT ON COLUMN public.commission_policies.tiers IS 'Cấu hình bậc thang (nếu commission_type = tiered). VD: [{"from": 0, "to": 10000000, "rate": 1}, {"from": 10000000, "rate": 2}]';
COMMENT ON COLUMN public.commission_policies.min_threshold IS 'Ngưỡng KPI tối thiểu để nhận hoa hồng (VD: phải đạt 5 triệu doanh thu mới có hoa hồng)';
COMMENT ON COLUMN public.commission_policies.max_commission IS 'Giới hạn hoa hồng tối đa trong kỳ';

-- =====================================================
-- 3. TẠO BẢNG EMPLOYEE_KPI_RESULTS (Kết quả KPI nhân viên)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.employee_kpi_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    kpi_id UUID NOT NULL REFERENCES public.kpi_policies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    actual_value BIGINT NOT NULL, -- Giá trị thực tế đạt được
    target_value BIGINT, -- Mục tiêu (copy từ kpi_policies hoặc custom)
    achievement_rate NUMERIC(5, 2), -- % đạt được = (actual_value / target_value) * 100
    commission_earned BIGINT DEFAULT 0, -- Hoa hồng kiếm được trong kỳ
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint: 1 employee chỉ có 1 record cho 1 KPI trong 1 kỳ
    CONSTRAINT unique_employee_kpi_period UNIQUE (employee_id, kpi_id, period_start, period_end)
);

-- Comments
COMMENT ON TABLE public.employee_kpi_results IS 'Bảng lưu kết quả KPI của từng nhân viên theo kỳ';
COMMENT ON COLUMN public.employee_kpi_results.actual_value IS 'Giá trị KPI thực tế đạt được (VD: doanh thu 15 triệu)';
COMMENT ON COLUMN public.employee_kpi_results.achievement_rate IS 'Tỷ lệ % hoàn thành mục tiêu';
COMMENT ON COLUMN public.employee_kpi_results.commission_earned IS 'Tổng hoa hồng kiếm được từ KPI này trong kỳ';

-- =====================================================
-- 4. TẠO INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_kpi_policies_active ON public.kpi_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_policies_type ON public.kpi_policies(kpi_type);
CREATE INDEX IF NOT EXISTS idx_commission_policies_active ON public.commission_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_policies_kpi ON public.commission_policies(kpi_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpi_results_employee ON public.employee_kpi_results(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpi_results_kpi ON public.employee_kpi_results(kpi_id);
CREATE INDEX IF NOT EXISTS idx_employee_kpi_results_period ON public.employee_kpi_results(period_start, period_end);

-- =====================================================
-- 5. TẠO FUNCTION ĐỂ TỰ ĐỘNG TÍNH ACHIEVEMENT_RATE
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_achievement_rate()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.target_value IS NOT NULL AND NEW.target_value > 0 THEN
        NEW.achievement_rate := ROUND((NEW.actual_value::NUMERIC / NEW.target_value::NUMERIC) * 100, 2);
    ELSE
        NEW.achievement_rate := NULL;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_calculate_achievement_rate
    BEFORE INSERT OR UPDATE OF actual_value, target_value ON public.employee_kpi_results
    FOR EACH ROW
    EXECUTE FUNCTION calculate_achievement_rate();

-- =====================================================
-- 6. TẠO VIEW ĐỂ XEM KPI VÀ COMMISSION
-- =====================================================

-- View: KPI với Commission Policies
CREATE OR REPLACE VIEW kpi_with_commission_policies AS
SELECT
    kpi.id as kpi_id,
    kpi.name as kpi_name,
    kpi.description,
    kpi.kpi_type,
    kpi.target_value as default_target,
    kpi.measurement_period,
    kpi.applicable_roles as kpi_applicable_roles,
    kpi.is_active as kpi_is_active,
    -- Commission policies
    COALESCE(
        json_agg(
            json_build_object(
                'id', cp.id,
                'policy_name', cp.policy_name,
                'commission_type', cp.commission_type,
                'commission_rate', cp.commission_rate,
                'tiers', cp.tiers,
                'min_threshold', cp.min_threshold,
                'max_commission', cp.max_commission,
                'applicable_roles', cp.applicable_roles,
                'is_active', cp.is_active
            ) ORDER BY cp.created_at
        ) FILTER (WHERE cp.id IS NOT NULL),
        '[]'::json
    ) as commission_policies
FROM public.kpi_policies kpi
LEFT JOIN public.commission_policies cp ON kpi.id = cp.kpi_id
GROUP BY kpi.id, kpi.name, kpi.description, kpi.kpi_type, kpi.target_value,
         kpi.measurement_period, kpi.applicable_roles, kpi.is_active;

COMMENT ON VIEW kpi_with_commission_policies IS 'View hiển thị KPI kèm danh sách commission policies';

-- View: Employee KPI Performance
CREATE OR REPLACE VIEW employee_kpi_performance AS
SELECT
    ekr.id,
    ekr.employee_id,
    e.full_name,
    e.role_name,
    ekr.kpi_id,
    kpi.name as kpi_name,
    kpi.kpi_type,
    ekr.period_start,
    ekr.period_end,
    ekr.actual_value,
    ekr.target_value,
    ekr.achievement_rate,
    ekr.commission_earned,
    ekr.notes,
    ekr.created_at
FROM public.employee_kpi_results ekr
JOIN public.employees e ON ekr.employee_id = e.employee_id
JOIN public.kpi_policies kpi ON ekr.kpi_id = kpi.id
ORDER BY ekr.period_start DESC, e.full_name;

COMMENT ON VIEW employee_kpi_performance IS 'View hiển thị hiệu suất KPI của nhân viên';

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================
ALTER TABLE public.kpi_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_kpi_results ENABLE ROW LEVEL SECURITY;

-- Admin có thể làm mọi thứ
CREATE POLICY "Admin can do everything on kpi_policies"
    ON public.kpi_policies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role_name IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can do everything on commission_policies"
    ON public.commission_policies
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role_name IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can do everything on employee_kpi_results"
    ON public.employee_kpi_results
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role_name IN ('super-admin', 'admin')
        )
    );

-- Nhân viên có thể xem (readonly)
CREATE POLICY "Employees can view kpi_policies"
    ON public.kpi_policies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Employees can view commission_policies"
    ON public.commission_policies
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
        )
    );

-- Nhân viên chỉ xem KPI results của chính mình
CREATE POLICY "Employees can view their own kpi_results"
    ON public.employee_kpi_results
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.employee_id = employee_kpi_results.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- =====================================================
-- 8. GRANT PERMISSIONS
-- =====================================================
GRANT SELECT ON public.kpi_policies TO authenticated;
GRANT SELECT ON public.commission_policies TO authenticated;
GRANT SELECT ON public.employee_kpi_results TO authenticated;
GRANT SELECT ON kpi_with_commission_policies TO authenticated;
GRANT SELECT ON employee_kpi_performance TO authenticated;

GRANT ALL ON public.kpi_policies TO service_role;
GRANT ALL ON public.commission_policies TO service_role;
GRANT ALL ON public.employee_kpi_results TO service_role;

-- =====================================================
-- 9. SAMPLE DATA (Optional)
-- =====================================================

-- Sample KPI: Doanh thu trong tháng
INSERT INTO public.kpi_policies (name, description, kpi_type, calculation_logic, target_value, measurement_period, applicable_roles, is_active)
VALUES (
    'Doanh thu trong tháng',
    'Tổng doanh thu từ các đơn hàng đã giao và đã thanh toán',
    'revenue',
    '{"conditions": {"status": ["delivered"], "payment_status": ["paid"]}, "sum_field": "total_amount"}'::jsonb,
    50000000,
    'monthly',
    ARRAY['sales-staff', 'sales-manager'],
    true
) ON CONFLICT (name) DO NOTHING;

-- Sample KPI: Số đơn hàng hoàn thành
INSERT INTO public.kpi_policies (name, description, kpi_type, calculation_logic, target_value, measurement_period, applicable_roles, is_active)
VALUES (
    'Số đơn hàng hoàn thành',
    'Tổng số đơn hàng đã giao thành công',
    'orders',
    '{"conditions": {"status": ["delivered"]}, "count": true}'::jsonb,
    100,
    'monthly',
    ARRAY['sales-staff'],
    true
) ON CONFLICT (name) DO NOTHING;

-- Sample Commission Policy: Hoa hồng theo doanh thu
DO $$
DECLARE
    kpi_revenue_id UUID;
BEGIN
    SELECT id INTO kpi_revenue_id
    FROM public.kpi_policies
    WHERE name = 'Doanh thu trong tháng';

    IF kpi_revenue_id IS NOT NULL THEN
        INSERT INTO public.commission_policies (
            policy_name,
            kpi_id,
            commission_type,
            tiers,
            min_threshold,
            max_commission,
            applicable_roles,
            is_active
        ) VALUES (
            'Hoa hồng doanh thu bậc thang',
            kpi_revenue_id,
            'tiered',
            '[
                {"from": 0, "to": 30000000, "rate": 1.0, "description": "Dưới 30 triệu: 1%"},
                {"from": 30000000, "to": 50000000, "rate": 1.5, "description": "30-50 triệu: 1.5%"},
                {"from": 50000000, "to": 100000000, "rate": 2.0, "description": "50-100 triệu: 2%"},
                {"from": 100000000, "to": null, "rate": 2.5, "description": "Trên 100 triệu: 2.5%"}
            ]'::jsonb,
            10000000,
            10000000,
            ARRAY['sales-staff', 'sales-manager'],
            true
        ) ON CONFLICT (policy_name) DO NOTHING;
    END IF;
END $$;

-- =====================================================
-- 10. VERIFY MIGRATION
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE 'Verifying KPI & Commission system...';

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'kpi_policies') THEN
        RAISE NOTICE '✓ Table kpi_policies created';
    ELSE
        RAISE EXCEPTION '✗ Table kpi_policies NOT created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'commission_policies') THEN
        RAISE NOTICE '✓ Table commission_policies created';
    ELSE
        RAISE EXCEPTION '✗ Table commission_policies NOT created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employee_kpi_results') THEN
        RAISE NOTICE '✓ Table employee_kpi_results created';
    ELSE
        RAISE EXCEPTION '✗ Table employee_kpi_results NOT created';
    END IF;

    RAISE NOTICE 'KPI & Commission system migration completed successfully!';
END $$;
