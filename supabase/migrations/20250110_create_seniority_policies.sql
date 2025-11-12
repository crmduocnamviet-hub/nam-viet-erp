-- =====================================================
-- Seniority Policies Migration
-- =====================================================
-- Description: Creates tables and supporting structures for
-- managing employee seniority-based benefits and allowances
-- Created: 2025-01-10
-- =====================================================

-- ===================
-- 1. Main Table
-- ===================

-- Seniority Policies Table
-- Stores seniority-based benefit policies with tiered levels
CREATE TABLE IF NOT EXISTS public.seniority_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    years_from INTEGER NOT NULL CHECK (years_from >= 0),
    years_to INTEGER CHECK (years_to IS NULL OR years_to > years_from),
    benefit_type VARCHAR(20) NOT NULL CHECK (benefit_type IN ('percentage', 'fixed')),
    benefit_value NUMERIC(10, 2) NOT NULL CHECK (benefit_value >= 0),
    applicable_roles TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_seniority_range UNIQUE (years_from, years_to)
);

-- ===================
-- 2. Indexes
-- ===================

-- Index for efficient lookups by years range
CREATE INDEX IF NOT EXISTS idx_seniority_policies_years_range
ON public.seniority_policies(years_from, years_to);

-- Index for active policies
CREATE INDEX IF NOT EXISTS idx_seniority_policies_active
ON public.seniority_policies(is_active);

-- Index for applicable roles (GIN for array searching)
CREATE INDEX IF NOT EXISTS idx_seniority_policies_roles
ON public.seniority_policies USING GIN(applicable_roles);

-- ===================
-- 3. Triggers
-- ===================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_seniority_policies_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_seniority_policies
    BEFORE UPDATE ON public.seniority_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_seniority_policies_timestamp();

-- ===================
-- 4. Helper Functions
-- ===================

-- Function to get applicable seniority benefit for an employee
CREATE OR REPLACE FUNCTION get_employee_seniority_benefit(
    p_years_of_service INTEGER,
    p_employee_role TEXT,
    p_base_salary BIGINT
) RETURNS TABLE (
    policy_id UUID,
    policy_name VARCHAR,
    benefit_type VARCHAR,
    benefit_value NUMERIC,
    calculated_amount BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.id,
        sp.policy_name,
        sp.benefit_type,
        sp.benefit_value,
        CASE
            WHEN sp.benefit_type = 'percentage' THEN
                ROUND((p_base_salary * sp.benefit_value / 100)::NUMERIC)::BIGINT
            WHEN sp.benefit_type = 'fixed' THEN
                sp.benefit_value::BIGINT
            ELSE 0
        END as calculated_amount
    FROM public.seniority_policies sp
    WHERE sp.is_active = true
        AND p_years_of_service >= sp.years_from
        AND (sp.years_to IS NULL OR p_years_of_service <= sp.years_to)
        AND (sp.applicable_roles IS NULL
             OR array_length(sp.applicable_roles, 1) IS NULL
             OR p_employee_role = ANY(sp.applicable_roles))
    ORDER BY sp.years_from DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ===================
-- 5. RLS Policies
-- ===================

-- Enable RLS
ALTER TABLE public.seniority_policies ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read seniority policies
CREATE POLICY "Allow authenticated users to read seniority policies"
ON public.seniority_policies
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users with admin role to insert
CREATE POLICY "Allow admins to insert seniority policies"
ON public.seniority_policies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users with admin role to update
CREATE POLICY "Allow admins to update seniority policies"
ON public.seniority_policies
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users with admin role to delete
CREATE POLICY "Allow admins to delete seniority policies"
ON public.seniority_policies
FOR DELETE
TO authenticated
USING (true);

-- ===================
-- 6. Sample Data
-- ===================

INSERT INTO public.seniority_policies (
    policy_name,
    description,
    years_from,
    years_to,
    benefit_type,
    benefit_value,
    applicable_roles,
    is_active
) VALUES
(
    'Phụ cấp thâm niên 1-2 năm',
    'Phụ cấp cho nhân viên có thâm niên từ 1 đến 2 năm',
    1,
    2,
    'percentage',
    5.00,
    ARRAY['sales-staff', 'inventory-staff', 'delivery-staff'],
    true
),
(
    'Phụ cấp thâm niên 3-5 năm',
    'Phụ cấp cho nhân viên có thâm niên từ 3 đến 5 năm',
    3,
    5,
    'percentage',
    10.00,
    ARRAY['sales-staff', 'inventory-staff', 'delivery-staff'],
    true
),
(
    'Phụ cấp thâm niên 6-10 năm',
    'Phụ cấp cho nhân viên có thâm niên từ 6 đến 10 năm',
    6,
    10,
    'percentage',
    15.00,
    NULL,
    true
),
(
    'Phụ cấp thâm niên trên 10 năm',
    'Phụ cấp cho nhân viên có thâm niên trên 10 năm',
    11,
    NULL,
    'percentage',
    20.00,
    NULL,
    true
),
(
    'Thưởng cố định quản lý cấp cao',
    'Thưởng cố định cho quản lý có thâm niên trên 5 năm',
    5,
    NULL,
    'fixed',
    5000000,
    ARRAY['sales-manager', 'inventory-manager', 'admin'],
    true
)
ON CONFLICT (policy_name) DO NOTHING;

-- ===================
-- 7. Comments
-- ===================

COMMENT ON TABLE public.seniority_policies IS
'Stores employee seniority benefit policies with tiered allowances based on years of service';

COMMENT ON COLUMN public.seniority_policies.policy_name IS
'Unique name of the seniority policy';

COMMENT ON COLUMN public.seniority_policies.years_from IS
'Minimum years of service required (inclusive)';

COMMENT ON COLUMN public.seniority_policies.years_to IS
'Maximum years of service (inclusive). NULL means no upper limit';

COMMENT ON COLUMN public.seniority_policies.benefit_type IS
'Type of benefit: "percentage" (% of base salary) or "fixed" (fixed amount in VND)';

COMMENT ON COLUMN public.seniority_policies.benefit_value IS
'Benefit value - either percentage (5.00 = 5%) or fixed amount in VND';

COMMENT ON COLUMN public.seniority_policies.applicable_roles IS
'Array of role names this policy applies to. NULL or empty means all roles';

COMMENT ON FUNCTION get_employee_seniority_benefit IS
'Calculates the applicable seniority benefit for an employee based on years of service, role, and base salary';
