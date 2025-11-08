-- =====================================================
-- TEST SCRIPT FOR SALARY MANAGEMENT MIGRATION
-- Verify that all tables, views, and functions work correctly
-- =====================================================

-- =====================================================
-- 1. TEST TABLES
-- =====================================================

-- Check if tables exist
SELECT
    'salary_grades' as table_name,
    EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'salary_grades'
    ) as exists;

SELECT
    'salary_grade_allowances' as table_name,
    EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'salary_grade_allowances'
    ) as exists;

SELECT
    'employee_salary_history' as table_name,
    EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'employee_salary_history'
    ) as exists;

-- Check if salary_grade_id column exists in employees
SELECT
    'employees.salary_grade_id' as column_name,
    EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'employees'
        AND column_name = 'salary_grade_id'
    ) as exists;

-- =====================================================
-- 2. TEST VIEWS
-- =====================================================

-- Test salary_grades_with_allowances view
SELECT COUNT(*) as salary_grades_count
FROM salary_grades_with_allowances;

-- Test employees_with_salary view
SELECT COUNT(*) as employees_with_salary_count
FROM employees_with_salary;

-- Test salary_grade_statistics view
SELECT COUNT(*) as salary_grade_statistics_count
FROM salary_grade_statistics;

-- =====================================================
-- 3. TEST DATA
-- =====================================================

-- Check sample salary grades
SELECT
    grade_name,
    base_salary,
    total_salary,
    is_active
FROM salary_grades
ORDER BY base_salary DESC;

-- Check allowances detail
SELECT
    sg.grade_name,
    sga.name as allowance_name,
    sga.amount as allowance_amount
FROM salary_grades sg
JOIN salary_grade_allowances sga ON sg.id = sga.salary_grade_id
ORDER BY sg.base_salary DESC, sga.name;

-- =====================================================
-- 4. TEST AUTO-CALCULATION
-- =====================================================

-- Test that total_salary is calculated correctly
SELECT
    grade_name,
    base_salary,
    (
        SELECT COALESCE(SUM(amount), 0)
        FROM salary_grade_allowances
        WHERE salary_grade_id = sg.id
    ) as calculated_allowances_sum,
    total_salary,
    (base_salary + (
        SELECT COALESCE(SUM(amount), 0)
        FROM salary_grade_allowances
        WHERE salary_grade_id = sg.id
    )) as expected_total,
    CASE
        WHEN total_salary = (base_salary + (
            SELECT COALESCE(SUM(amount), 0)
            FROM salary_grade_allowances
            WHERE salary_grade_id = sg.id
        )) THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as test_result
FROM salary_grades sg;

-- =====================================================
-- 5. TEST FUNCTIONS
-- =====================================================

-- Test calculate_total_salary function
SELECT
    grade_name,
    calculate_total_salary(id) as calculated_total,
    total_salary as actual_total,
    CASE
        WHEN calculate_total_salary(id) = total_salary THEN '✓ PASS'
        ELSE '✗ FAIL'
    END as test_result
FROM salary_grades;

-- =====================================================
-- 6. TEST STATISTICS
-- =====================================================

-- Overall statistics
SELECT
    'Total Salary Grades' as metric,
    COUNT(*) as value
FROM salary_grades
UNION ALL
SELECT
    'Active Salary Grades',
    COUNT(*)
FROM salary_grades WHERE is_active = true
UNION ALL
SELECT
    'Total Allowances',
    COUNT(*)
FROM salary_grade_allowances
UNION ALL
SELECT
    'Employees with Salary Grade',
    COUNT(*)
FROM employees WHERE salary_grade_id IS NOT NULL;

-- Payroll cost summary
SELECT
    grade_name,
    employee_count,
    total_salary,
    total_payroll_cost
FROM salary_grade_statistics
ORDER BY total_payroll_cost DESC;

-- =====================================================
-- 7. TEST QUERIES FROM README
-- =====================================================

-- Query 1: Tổng chi phí lương của công ty
SELECT
    COALESCE(SUM(sg.total_salary), 0) as total_monthly_payroll
FROM employees e
JOIN salary_grades sg ON e.salary_grade_id = sg.id
WHERE e.is_active = true;

-- Query 2: Danh sách nhân viên theo ngạch lương
SELECT
    sg.grade_name,
    COUNT(e.employee_id) as employee_count,
    sg.total_salary,
    sg.total_salary * COUNT(e.employee_id) as grade_payroll_cost
FROM salary_grades sg
LEFT JOIN employees e ON sg.id = e.salary_grade_id AND e.is_active = true
GROUP BY sg.id, sg.grade_name, sg.total_salary
ORDER BY sg.base_salary DESC;

-- =====================================================
-- 8. SUMMARY
-- =====================================================

DO $$
DECLARE
    v_salary_grades_count INT;
    v_allowances_count INT;
    v_employees_with_grade_count INT;
BEGIN
    SELECT COUNT(*) INTO v_salary_grades_count FROM salary_grades;
    SELECT COUNT(*) INTO v_allowances_count FROM salary_grade_allowances;
    SELECT COUNT(*) INTO v_employees_with_grade_count FROM employees WHERE salary_grade_id IS NOT NULL;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SALARY MANAGEMENT MIGRATION TEST SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Salary Grades: %', v_salary_grades_count;
    RAISE NOTICE 'Total Allowances: %', v_allowances_count;
    RAISE NOTICE 'Employees with Salary Grade: %', v_employees_with_grade_count;
    RAISE NOTICE '';

    IF v_salary_grades_count >= 4 THEN
        RAISE NOTICE '✓ Sample data created successfully';
    ELSE
        RAISE WARNING '✗ Expected at least 4 salary grades';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE 'Migration test completed!';
    RAISE NOTICE '';
END $$;
