-- =====================================================
-- LINK EMPLOYEES TO SALARY GRADES
-- Liên kết nhân viên với ngạch lương
-- =====================================================

-- =====================================================
-- 1. THÊM COLUMN SALARY_GRADE_ID VÀO EMPLOYEES
-- =====================================================

-- Thêm cột salary_grade_id vào bảng employees (nếu chưa có)
DO $$
    BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'employees'
        AND column_name = 'salary_grade_id'
    ) THEN
        ALTER TABLE public.employees
        ADD COLUMN salary_grade_id UUID REFERENCES public.salary_grades(id) ON DELETE SET NULL;

        COMMENT ON COLUMN public.employees.salary_grade_id IS 'Ngạch lương của nhân viên (foreign key to salary_grades)';
    END IF;
END $$;

-- Thêm index cho performance
CREATE INDEX IF NOT EXISTS idx_employees_salary_grade_id ON public.employees(salary_grade_id);

-- =====================================================
-- 2. TẠO VIEW ĐỂ XEM NHÂN VIÊN VỚI THÔNG TIN LƯƠNG
-- =====================================================

CREATE OR REPLACE VIEW employees_with_salary AS
SELECT
    e.employee_id,
    e.full_name,
    e.employee_code,
    e.role_name,
    e.is_active,
    e.user_id,
    e.warehouse_id,
    e.salary_grade_id,
    -- Salary grade info
    sg.grade_name,
    sg.base_salary,
    sg.total_salary,
    sg.description as salary_description,
    -- Allowances
    COALESCE(
        json_agg(
            json_build_object(
                'id', sga.id,
                'name', sga.name,
                'amount', sga.amount
            ) ORDER BY sga.created_at
        ) FILTER (WHERE sga.id IS NOT NULL),
        '[]'::json
    ) as allowances
FROM public.employees e
LEFT JOIN public.salary_grades sg ON e.salary_grade_id = sg.id
LEFT JOIN public.salary_grade_allowances sga ON sg.id = sga.salary_grade_id
GROUP BY
    e.employee_id, e.full_name, e.employee_code, e.role_name,
    e.is_active, e.user_id, e.warehouse_id,
    e.salary_grade_id, sg.grade_name, sg.base_salary, sg.total_salary,
    sg.description;

COMMENT ON VIEW employees_with_salary IS 'View hiển thị nhân viên kèm thông tin ngạch lương và phụ cấp';

-- -- =====================================================
-- -- 3. TẠO VIEW THỐNG KÊ LƯƠNG THEO NGẠCH
-- -- =====================================================

CREATE OR REPLACE VIEW salary_grade_statistics AS
SELECT
    sg.id as salary_grade_id,
    sg.grade_name,
    sg.base_salary,
    sg.total_salary,
    sg.is_active,
    COUNT(DISTINCT e.employee_id) as employee_count,
    COUNT(DISTINCT sga.id) as allowance_count,
    COALESCE(SUM(sga.amount), 0) as total_allowances,
    -- Tổng chi phí lương cho tất cả nhân viên trong ngạch này
    sg.total_salary * COUNT(DISTINCT e.employee_id) as total_payroll_cost
FROM public.salary_grades sg
LEFT JOIN public.employees e ON sg.id = e.salary_grade_id AND e.is_active = true
LEFT JOIN public.salary_grade_allowances sga ON sg.id = sga.salary_grade_id
GROUP BY sg.id, sg.grade_name, sg.base_salary, sg.total_salary, sg.is_active
ORDER BY sg.base_salary DESC;

COMMENT ON VIEW salary_grade_statistics IS 'View thống kê số lượng nhân viên và chi phí theo từng ngạch lương';

-- -- =====================================================
-- -- 4. TẠO FUNCTION ĐỂ GÁN NGẠCH LƯƠNG CHO NHÂN VIÊN
-- -- =====================================================

CREATE OR REPLACE FUNCTION assign_salary_grade_to_employee(
    p_employee_id VARCHAR,
    new_salary_grade_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    grade_exists BOOLEAN;
    employee_exists BOOLEAN;
BEGIN
    -- Kiểm tra salary grade có tồn tại không
    SELECT EXISTS(
        SELECT 1 FROM public.salary_grades
        WHERE id = new_salary_grade_id AND is_active = true
    ) INTO grade_exists;

    IF NOT grade_exists THEN
        RAISE EXCEPTION 'Salary grade % does not exist or is not active', new_salary_grade_id;
    END IF;

    -- Kiểm tra employee có tồn tại không
    SELECT EXISTS(
        SELECT 1 FROM public.employees WHERE employee_id = p_employee_id
    ) INTO employee_exists;

    IF NOT employee_exists THEN
        RAISE EXCEPTION 'Employee % does not exist', p_employee_id;
    END IF;

    -- Cập nhật salary_grade_id cho employee
    UPDATE public.employees
    SET salary_grade_id = new_salary_grade_id
    WHERE employee_id = p_employee_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_salary_grade_to_employee IS 'Gán ngạch lương cho nhân viên';

-- =====================================================
-- 5. TẠO FUNCTION LỊCH SỬ THAY ĐỔI LƯƠNG (Optional)
-- =====================================================

-- Bảng lưu lịch sử thay đổi ngạch lương
CREATE TABLE IF NOT EXISTS public.employee_salary_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL,
    old_salary_grade_id UUID REFERENCES public.salary_grades(id) ON DELETE SET NULL,
    new_salary_grade_id UUID REFERENCES public.salary_grades(id) ON DELETE SET NULL,
    old_total_salary BIGINT,
    new_total_salary BIGINT,
    change_reason TEXT,
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.employee_salary_history IS 'Lịch sử thay đổi ngạch lương của nhân viên';

-- Index
CREATE INDEX IF NOT EXISTS idx_salary_history_employee_id ON public.employee_salary_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_history_changed_at ON public.employee_salary_history(changed_at DESC);

-- Trigger để tự động log khi salary_grade_id thay đổi
CREATE OR REPLACE FUNCTION log_salary_grade_change()
RETURNS TRIGGER AS $$
DECLARE
    old_total BIGINT;
    new_total BIGINT;
BEGIN
    -- Chỉ log nếu salary_grade_id thực sự thay đổi
    IF OLD.salary_grade_id IS DISTINCT FROM NEW.salary_grade_id THEN
        -- Lấy total_salary cũ
        IF OLD.salary_grade_id IS NOT NULL THEN
            SELECT total_salary INTO old_total
            FROM public.salary_grades
            WHERE id = OLD.salary_grade_id;
        END IF;

        -- Lấy total_salary mới
        IF NEW.salary_grade_id IS NOT NULL THEN
            SELECT total_salary INTO new_total
            FROM public.salary_grades
            WHERE id = NEW.salary_grade_id;
        END IF;

        -- Insert vào history
        INSERT INTO public.employee_salary_history (
            employee_id,
            old_salary_grade_id,
            new_salary_grade_id,
            old_total_salary,
            new_total_salary,
            changed_by
        ) VALUES (
            NEW.employee_id,
            OLD.salary_grade_id,
            NEW.salary_grade_id,
            old_total,
            new_total,
            auth.uid()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger
DROP TRIGGER IF EXISTS trigger_log_salary_grade_change ON public.employees;
CREATE TRIGGER trigger_log_salary_grade_change
    AFTER UPDATE OF salary_grade_id ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION log_salary_grade_change();

-- =====================================================
-- 6. RLS POLICIES CHO HISTORY TABLE
-- =====================================================

ALTER TABLE public.employee_salary_history ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả
CREATE POLICY "Admin can view all salary history"
    ON public.employee_salary_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role_name IN ('super-admin', 'admin')
        )
    );

-- Nhân viên chỉ có thể xem lịch sử lương của chính mình
CREATE POLICY "Employees can view their own salary history"
    ON public.employee_salary_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.employee_id = employee_salary_history.employee_id
            AND employees.user_id = auth.uid()
        )
    );

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON employees_with_salary TO authenticated;
GRANT SELECT ON salary_grade_statistics TO authenticated;
GRANT SELECT ON public.employee_salary_history TO authenticated;

GRANT ALL ON public.employee_salary_history TO service_role;

-- =====================================================
-- 8. SAMPLE DATA - GÁN NGẠCH LƯƠNG CHO NHÂN VIÊN MẪU
-- =====================================================

-- Ví dụ: Gán ngạch lương cho một số nhân viên
-- (Chỉ chạy nếu có dữ liệu mẫu)

/*
DO $$
DECLARE
    grade_a_id UUID;
    grade_b_id UUID;
BEGIN
    -- Lấy ID của các ngạch lương
    SELECT id INTO grade_a_id FROM public.salary_grades WHERE grade_name LIKE 'Ngạch A%' LIMIT 1;
    SELECT id INTO grade_b_id FROM public.salary_grades WHERE grade_name LIKE 'Ngạch B%' LIMIT 1;

    -- Gán ngạch A cho admin/manager roles
    UPDATE public.employees
    SET salary_grade_id = grade_a_id
    WHERE role_name IN ('admin', 'sales-manager', 'inventory-manager')
    AND salary_grade_id IS NULL;

    -- Gán ngạch B cho staff roles
    UPDATE public.employees
    SET salary_grade_id = grade_b_id
    WHERE role_name IN ('sales-staff', 'inventory-staff')
    AND salary_grade_id IS NULL;

    RAISE NOTICE 'Sample salary grades assigned to employees';
END $$;
*/

-- =====================================================
-- 9. VERIFY MIGRATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verifying employee-salary linkage...';

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'employees'
        AND column_name = 'salary_grade_id'
    ) THEN
        RAISE NOTICE '✓ Column salary_grade_id added to employees table';
    ELSE
        RAISE EXCEPTION '✗ Column salary_grade_id NOT added';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_views
        WHERE schemaname = 'public'
        AND viewname = 'employees_with_salary'
    ) THEN
        RAISE NOTICE '✓ View employees_with_salary created';
    ELSE
        RAISE EXCEPTION '✗ View employees_with_salary NOT created';
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employee_salary_history') THEN
        RAISE NOTICE '✓ Table employee_salary_history created';
    ELSE
        RAISE EXCEPTION '✗ Table employee_salary_history NOT created';
    END IF;

    RAISE NOTICE 'Employee-salary linkage migration completed successfully!';
END $$;
