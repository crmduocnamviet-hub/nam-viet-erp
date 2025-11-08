-- =====================================================
-- SALARY MANAGEMENT SYSTEM - MIGRATION
-- Tạo bảng quản lý Ngạch lương và Phụ cấp
-- =====================================================

-- =====================================================
-- 1. TẠO BẢNG SALARY_GRADES (Ngạch lương)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.salary_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_name VARCHAR(255) NOT NULL,
    base_salary BIGINT NOT NULL CHECK (base_salary >= 0),
    description TEXT,
    total_salary BIGINT DEFAULT 0, -- Sẽ được tự động tính
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_grade_name UNIQUE (grade_name)
);

-- Comments
COMMENT ON TABLE public.salary_grades IS 'Bảng quản lý ngạch lương của nhân viên';
COMMENT ON COLUMN public.salary_grades.grade_name IS 'Tên ngạch lương (VD: Ngạch A - Nhân viên cấp cao)';
COMMENT ON COLUMN public.salary_grades.base_salary IS 'Lương cơ bản (VNĐ)';
COMMENT ON COLUMN public.salary_grades.total_salary IS 'Tổng lương = base_salary + sum(allowances), tự động tính';
COMMENT ON COLUMN public.salary_grades.is_active IS 'Ngạch lương có đang được áp dụng không';

-- =====================================================
-- 2. TẠO BẢNG SALARY_GRADE_ALLOWANCES (Phụ cấp)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.salary_grade_allowances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salary_grade_id UUID NOT NULL REFERENCES public.salary_grades(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    amount BIGINT NOT NULL CHECK (amount >= 0),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_allowance_per_grade UNIQUE (salary_grade_id, name)
);

-- Comments
COMMENT ON TABLE public.salary_grade_allowances IS 'Bảng quản lý các khoản phụ cấp cho từng ngạch lương';
COMMENT ON COLUMN public.salary_grade_allowances.salary_grade_id IS 'ID của ngạch lương (foreign key)';
COMMENT ON COLUMN public.salary_grade_allowances.name IS 'Tên phụ cấp (VD: Phụ cấp xăng xe, Phụ cấp điện thoại)';
COMMENT ON COLUMN public.salary_grade_allowances.amount IS 'Số tiền phụ cấp (VNĐ)';

-- =====================================================
-- 3. TẠO INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_salary_grades_active ON public.salary_grades(is_active);
CREATE INDEX IF NOT EXISTS idx_salary_grades_created_at ON public.salary_grades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_allowances_salary_grade_id ON public.salary_grade_allowances(salary_grade_id);

-- =====================================================
-- 4. TẠO FUNCTION ĐỂ TỰ ĐỘNG CẬP NHẬT TOTAL_SALARY
-- =====================================================

-- Function để tính tổng lương
CREATE OR REPLACE FUNCTION calculate_total_salary(grade_id UUID)
RETURNS BIGINT AS $$
DECLARE
    total BIGINT;
    base BIGINT;
    allowances_sum BIGINT;
BEGIN
    -- Lấy lương cơ bản
    SELECT base_salary INTO base
    FROM public.salary_grades
    WHERE id = grade_id;

    -- Tính tổng phụ cấp
    SELECT COALESCE(SUM(amount), 0) INTO allowances_sum
    FROM public.salary_grade_allowances
    WHERE salary_grade_id = grade_id;

    -- Tổng lương = lương cơ bản + tổng phụ cấp
    total := COALESCE(base, 0) + allowances_sum;

    RETURN total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_total_salary IS 'Tính tổng lương = base_salary + sum(allowances)';

-- =====================================================
-- 5. TẠO TRIGGER ĐỂ TỰ ĐỘNG CẬP NHẬT TOTAL_SALARY
-- =====================================================

-- Function trigger khi base_salary thay đổi
CREATE OR REPLACE FUNCTION update_total_salary_on_grade_change()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_salary := calculate_total_salary(NEW.id);
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger khi INSERT/UPDATE salary_grades
CREATE TRIGGER trigger_update_total_salary_on_grade
    BEFORE INSERT OR UPDATE OF base_salary ON public.salary_grades
    FOR EACH ROW
    EXECUTE FUNCTION update_total_salary_on_grade_change();

-- Function trigger khi allowances thay đổi
CREATE OR REPLACE FUNCTION update_total_salary_on_allowance_change()
RETURNS TRIGGER AS $$
DECLARE
    grade_id UUID;
BEGIN
    -- Xác định grade_id từ OLD hoặc NEW record
    IF TG_OP = 'DELETE' THEN
        grade_id := OLD.salary_grade_id;
    ELSE
        grade_id := NEW.salary_grade_id;
    END IF;

    -- Cập nhật total_salary của salary_grade
    UPDATE public.salary_grades
    SET
        total_salary = calculate_total_salary(grade_id),
        updated_at = NOW()
    WHERE id = grade_id;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger khi INSERT/UPDATE/DELETE allowances
CREATE TRIGGER trigger_update_total_salary_on_allowance
    AFTER INSERT OR UPDATE OF amount OR DELETE ON public.salary_grade_allowances
    FOR EACH ROW
    EXECUTE FUNCTION update_total_salary_on_allowance_change();

-- =====================================================
-- 6. TẠO VIEW ĐỂ QUERY DỄ DÀNG
-- =====================================================

-- View kết hợp salary_grade với allowances
CREATE OR REPLACE VIEW salary_grades_with_allowances AS
SELECT
    sg.id,
    sg.grade_name,
    sg.base_salary,
    sg.description,
    sg.total_salary,
    sg.is_active,
    sg.created_at,
    sg.updated_at,
    -- Aggregated allowances data
    COALESCE(
        json_agg(
            json_build_object(
                'id', sga.id,
                'name', sga.name,
                'amount', sga.amount,
                'description', sga.description
            ) ORDER BY sga.created_at
        ) FILTER (WHERE sga.id IS NOT NULL),
        '[]'::json
    ) as allowances,
    COUNT(sga.id) as allowances_count,
    COALESCE(SUM(sga.amount), 0) as allowances_total
FROM public.salary_grades sg
LEFT JOIN public.salary_grade_allowances sga ON sg.id = sga.salary_grade_id
GROUP BY sg.id, sg.grade_name, sg.base_salary, sg.description, sg.total_salary,
         sg.is_active, sg.created_at, sg.updated_at;

COMMENT ON VIEW salary_grades_with_allowances IS 'View hiển thị ngạch lương kèm danh sách phụ cấp (JSON)';

-- =====================================================
-- 7. RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.salary_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_grade_allowances ENABLE ROW LEVEL SECURITY;

-- Policy: Admin có thể làm mọi thứ
CREATE POLICY "Admin can do everything on salary_grades"
    ON public.salary_grades
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role_name IN ('super-admin', 'admin')
        )
    );

CREATE POLICY "Admin can do everything on salary_grade_allowances"
    ON public.salary_grade_allowances
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role_name IN ('super-admin', 'admin')
        )
    );

-- Policy: Nhân viên có thể xem salary grades (readonly)
CREATE POLICY "Employees can view salary_grades"
    ON public.salary_grades
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
        )
    );

CREATE POLICY "Employees can view salary_grade_allowances"
    ON public.salary_grade_allowances
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
        )
    );

-- =====================================================
-- 8. INSERT SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Ngạch A - Nhân viên cấp cao
INSERT INTO public.salary_grades (grade_name, base_salary, description, is_active)
VALUES (
    'Ngạch A - Nhân viên cấp cao',
    15000000,
    'Dành cho nhân viên quản lý cấp cao',
    true
) ON CONFLICT (grade_name) DO NOTHING
RETURNING id;

-- Lấy ID vừa tạo (hoặc dùng trong script)
DO $$
DECLARE
    grade_a_id UUID;
    grade_b_id UUID;
    grade_c_id UUID;
    grade_d_id UUID;
BEGIN
    -- Ngạch A
    SELECT id INTO grade_a_id
    FROM public.salary_grades
    WHERE grade_name = 'Ngạch A - Nhân viên cấp cao';

    IF grade_a_id IS NOT NULL THEN
        INSERT INTO public.salary_grade_allowances (salary_grade_id, name, amount)
        VALUES
            (grade_a_id, 'Phụ cấp xăng xe', 2000000),
            (grade_a_id, 'Phụ cấp điện thoại', 500000),
            (grade_a_id, 'Phụ cấp ăn trưa', 1000000)
        ON CONFLICT (salary_grade_id, name) DO NOTHING;
    END IF;

    -- Ngạch B
    INSERT INTO public.salary_grades (grade_name, base_salary, description, is_active)
    VALUES (
        'Ngạch B - Nhân viên trung cấp',
        10000000,
        'Dành cho nhân viên có kinh nghiệm',
        true
    ) ON CONFLICT (grade_name) DO NOTHING
    RETURNING id INTO grade_b_id;

    SELECT id INTO grade_b_id
    FROM public.salary_grades
    WHERE grade_name = 'Ngạch B - Nhân viên trung cấp';

    IF grade_b_id IS NOT NULL THEN
        INSERT INTO public.salary_grade_allowances (salary_grade_id, name, amount)
        VALUES
            (grade_b_id, 'Phụ cấp xăng xe', 1000000),
            (grade_b_id, 'Phụ cấp điện thoại', 300000),
            (grade_b_id, 'Phụ cấp ăn trưa', 800000)
        ON CONFLICT (salary_grade_id, name) DO NOTHING;
    END IF;

    -- Ngạch C
    INSERT INTO public.salary_grades (grade_name, base_salary, description, is_active)
    VALUES (
        'Ngạch C - Nhân viên',
        7000000,
        'Dành cho nhân viên mới vào',
        true
    ) ON CONFLICT (grade_name) DO NOTHING
    RETURNING id INTO grade_c_id;

    SELECT id INTO grade_c_id
    FROM public.salary_grades
    WHERE grade_name = 'Ngạch C - Nhân viên';

    IF grade_c_id IS NOT NULL THEN
        INSERT INTO public.salary_grade_allowances (salary_grade_id, name, amount)
        VALUES
            (grade_c_id, 'Phụ cấp ăn trưa', 500000)
        ON CONFLICT (salary_grade_id, name) DO NOTHING;
    END IF;

    -- Ngạch D
    INSERT INTO public.salary_grades (grade_name, base_salary, description, is_active)
    VALUES (
        'Ngạch D - Thử việc',
        5000000,
        'Dành cho nhân viên đang trong thời gian thử việc',
        true
    ) ON CONFLICT (grade_name) DO NOTHING;
END $$;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions cho authenticated users
GRANT SELECT ON public.salary_grades TO authenticated;
GRANT SELECT ON public.salary_grade_allowances TO authenticated;
GRANT SELECT ON salary_grades_with_allowances TO authenticated;

-- Grant full permissions cho service role
GRANT ALL ON public.salary_grades TO service_role;
GRANT ALL ON public.salary_grade_allowances TO service_role;

-- =====================================================
-- 10. VERIFY MIGRATION
-- =====================================================

-- Kiểm tra các bảng đã được tạo
DO $$
BEGIN
    RAISE NOTICE 'Checking tables...';

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salary_grades') THEN
        RAISE NOTICE '✓ Table salary_grades created successfully';
    ELSE
        RAISE EXCEPTION '✗ Table salary_grades NOT created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salary_grade_allowances') THEN
        RAISE NOTICE '✓ Table salary_grade_allowances created successfully';
    ELSE
        RAISE EXCEPTION '✗ Table salary_grade_allowances NOT created';
    END IF;

    RAISE NOTICE 'Migration completed successfully!';
END $$;
