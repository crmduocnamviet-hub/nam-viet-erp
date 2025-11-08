-- =====================================================
-- ROLLBACK SALARY MANAGEMENT SYSTEM
-- Script để xóa toàn bộ hệ thống quản lý lương
-- =====================================================

-- WARNING: Script này sẽ XÓA TOÀN BỘ dữ liệu lương!
-- Chỉ chạy khi cần rollback hoặc reset hệ thống

-- =====================================================
-- 1. DROP VIEWS
-- =====================================================

DROP VIEW IF EXISTS public.employees_with_salary CASCADE;
DROP VIEW IF EXISTS public.salary_grade_statistics CASCADE;
DROP VIEW IF EXISTS public.salary_grades_with_allowances CASCADE;

-- =====================================================
-- 2. DROP TRIGGERS
-- =====================================================

DROP TRIGGER IF EXISTS trigger_update_total_salary_on_grade ON public.salary_grades;
DROP TRIGGER IF EXISTS trigger_update_total_salary_on_allowance ON public.salary_grade_allowances;
DROP TRIGGER IF EXISTS trigger_log_salary_grade_change ON public.employees;

-- =====================================================
-- 3. DROP FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS calculate_total_salary(UUID);
DROP FUNCTION IF EXISTS update_total_salary_on_grade_change();
DROP FUNCTION IF EXISTS update_total_salary_on_allowance_change();
DROP FUNCTION IF EXISTS log_salary_grade_change();
DROP FUNCTION IF EXISTS assign_salary_grade_to_employee(VARCHAR, UUID);

-- =====================================================
-- 4. REMOVE COLUMN FROM EMPLOYEES
-- =====================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'employees'
        AND column_name = 'salary_grade_id'
    ) THEN
        -- Remove foreign key constraint first
        ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_salary_grade_id_fkey;

        -- Remove column
        ALTER TABLE public.employees DROP COLUMN IF EXISTS salary_grade_id;

        RAISE NOTICE '✓ Removed salary_grade_id column from employees table';
    END IF;
END $$;

-- =====================================================
-- 5. DROP TABLES
-- =====================================================

DROP TABLE IF EXISTS public.employee_salary_history CASCADE;
DROP TABLE IF EXISTS public.salary_grade_allowances CASCADE;
DROP TABLE IF EXISTS public.salary_grades CASCADE;

-- =====================================================
-- 6. VERIFY CLEANUP
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Verifying cleanup...';

    -- Check tables removed
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salary_grades') THEN
        RAISE NOTICE '✓ Table salary_grades removed';
    ELSE
        RAISE WARNING '✗ Table salary_grades still exists';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'salary_grade_allowances') THEN
        RAISE NOTICE '✓ Table salary_grade_allowances removed';
    ELSE
        RAISE WARNING '✗ Table salary_grade_allowances still exists';
    END IF;

    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'employee_salary_history') THEN
        RAISE NOTICE '✓ Table employee_salary_history removed';
    ELSE
        RAISE WARNING '✗ Table employee_salary_history still exists';
    END IF;

    -- Check views removed
    IF NOT EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'salary_grades_with_allowances') THEN
        RAISE NOTICE '✓ View salary_grades_with_allowances removed';
    ELSE
        RAISE WARNING '✗ View salary_grades_with_allowances still exists';
    END IF;

    -- Check column removed from employees
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'employees'
        AND column_name = 'salary_grade_id'
    ) THEN
        RAISE NOTICE '✓ Column salary_grade_id removed from employees';
    ELSE
        RAISE WARNING '✗ Column salary_grade_id still exists in employees';
    END IF;

    RAISE NOTICE 'Rollback completed!';
END $$;

-- =====================================================
-- CONFIRMATION MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SALARY MANAGEMENT SYSTEM ROLLBACK COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'All salary management tables, views, functions, and triggers have been removed.';
    RAISE NOTICE 'To restore the system, run the migration scripts again:';
    RAISE NOTICE '  1. 20250108_create_salary_management.sql';
    RAISE NOTICE '  2. 20250108_link_employees_to_salary_grades.sql';
    RAISE NOTICE '';
END $$;
