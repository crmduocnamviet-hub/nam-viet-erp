-- =====================================================
-- Employee Roles Management Migration
-- =====================================================
-- Description: Creates table for dynamic employee role management
-- instead of hardcoded roles. Supports creating custom roles
-- like intern-delivery-staff, senior-delivery-staff, etc.
-- Created: 2025-01-10
-- =====================================================

-- ===================
-- 1. Main Table
-- ===================

-- Employee Roles Table
-- Stores all employee roles (both system and custom)
CREATE TABLE IF NOT EXISTS public.employee_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(100) NOT NULL UNIQUE,
    role_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 999,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_role_key UNIQUE (role_key),
    CONSTRAINT unique_role_name UNIQUE (role_name)
);

-- ===================
-- 2. Indexes
-- ===================

-- Index for active roles
CREATE INDEX IF NOT EXISTS idx_employee_roles_active
ON public.employee_roles(is_active);

-- Index for system roles
CREATE INDEX IF NOT EXISTS idx_employee_roles_system
ON public.employee_roles(is_system);

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_employee_roles_order
ON public.employee_roles(display_order, role_name);

-- ===================
-- 3. Triggers
-- ===================

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_employee_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_employee_roles
    BEFORE UPDATE ON public.employee_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_roles_timestamp();

-- Prevent deletion of system roles
CREATE OR REPLACE FUNCTION prevent_system_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system = true THEN
        RAISE EXCEPTION 'Cannot delete system role: %', OLD.role_name;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_delete_system_roles
    BEFORE DELETE ON public.employee_roles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_system_role_deletion();

-- ===================
-- 4. RLS Policies
-- ===================

-- Enable RLS
ALTER TABLE public.employee_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read roles
CREATE POLICY "Allow authenticated users to read employee roles"
ON public.employee_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow admins to insert roles
CREATE POLICY "Allow admins to insert employee roles"
ON public.employee_roles
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow admins to update roles
CREATE POLICY "Allow admins to update employee roles"
ON public.employee_roles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow admins to delete non-system roles
CREATE POLICY "Allow admins to delete non-system roles"
ON public.employee_roles
FOR DELETE
TO authenticated
USING (is_system = false);

-- ===================
-- 5. Migrate Hardcoded Roles
-- ===================

-- Insert existing system roles from hardcoded constants
INSERT INTO public.employee_roles (
    role_key,
    role_name,
    description,
    is_system,
    is_active,
    display_order
) VALUES
(
    'sales-staff',
    'Nhân viên bán hàng',
    'Nhân viên phụ trách bán hàng trực tiếp cho khách hàng',
    true,
    true,
    1
),
(
    'sales-manager',
    'Quản lý bán hàng',
    'Quản lý đội ngũ bán hàng và chiến lược kinh doanh',
    true,
    true,
    2
),
(
    'inventory-staff',
    'Nhân viên kho',
    'Nhân viên quản lý và kiểm soát hàng tồn kho',
    true,
    true,
    3
),
(
    'inventory-manager',
    'Quản lý kho',
    'Quản lý toàn bộ hoạt động kho vận',
    true,
    true,
    4
),
(
    'delivery-staff',
    'Nhân viên giao hàng',
    'Nhân viên phụ trách giao hàng cho khách hàng',
    true,
    true,
    5
),
(
    'admin',
    'Quản trị viên',
    'Quản trị viên hệ thống với quyền truy cập đầy đủ',
    true,
    true,
    6
),
(
    'super-admin',
    'Quản trị viên cấp cao',
    'Quản trị viên cấp cao nhất với tất cả quyền hạn',
    true,
    true,
    7
)
ON CONFLICT (role_key) DO NOTHING;

-- ===================
-- 6. Sample Custom Roles
-- ===================

-- Insert some example custom roles
INSERT INTO public.employee_roles (
    role_key,
    role_name,
    description,
    is_system,
    is_active,
    display_order
) VALUES
(
    'intern-delivery-staff',
    'Thực tập sinh giao hàng',
    'Nhân viên thực tập phụ trách giao hàng',
    false,
    true,
    101
),
(
    'senior-delivery-staff',
    'Nhân viên giao hàng cao cấp',
    'Nhân viên giao hàng có kinh nghiệm, phụ trách các đơn hàng quan trọng',
    false,
    true,
    102
),
(
    'customer-service',
    'Nhân viên chăm sóc khách hàng',
    'Nhân viên hỗ trợ và chăm sóc khách hàng',
    false,
    true,
    103
),
(
    'accountant',
    'Nhân viên kế toán',
    'Nhân viên quản lý tài chính và kế toán',
    false,
    true,
    104
)
ON CONFLICT (role_key) DO NOTHING;

-- ===================
-- 7. Helper Functions
-- ===================

-- Function to get role name by key
CREATE OR REPLACE FUNCTION get_role_name(p_role_key VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_role_name VARCHAR;
BEGIN
    SELECT role_name INTO v_role_name
    FROM public.employee_roles
    WHERE role_key = p_role_key
    AND is_active = true;

    RETURN COALESCE(v_role_name, p_role_key);
END;
$$ LANGUAGE plpgsql;

-- Function to get all active roles
CREATE OR REPLACE FUNCTION get_active_roles()
RETURNS TABLE (
    role_key VARCHAR,
    role_name VARCHAR,
    description TEXT,
    is_system BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT er.role_key, er.role_name, er.description, er.is_system
    FROM public.employee_roles er
    WHERE er.is_active = true
    ORDER BY er.display_order, er.role_name;
END;
$$ LANGUAGE plpgsql;

-- ===================
-- 8. Comments
-- ===================

COMMENT ON TABLE public.employee_roles IS
'Stores all employee roles (system and custom) for dynamic role management';

COMMENT ON COLUMN public.employee_roles.role_key IS
'Unique identifier for the role (e.g., "sales-staff", "intern-delivery-staff")';

COMMENT ON COLUMN public.employee_roles.role_name IS
'Display name of the role in Vietnamese';

COMMENT ON COLUMN public.employee_roles.is_system IS
'Flag indicating if this is a system role (cannot be deleted)';

COMMENT ON COLUMN public.employee_roles.is_active IS
'Flag indicating if this role is currently active and available for assignment';

COMMENT ON COLUMN public.employee_roles.display_order IS
'Order in which roles should be displayed in UI (lower = higher priority)';

COMMENT ON FUNCTION get_role_name IS
'Returns the display name for a given role key, falls back to role_key if not found';

COMMENT ON FUNCTION get_active_roles IS
'Returns all active roles ordered by display_order and name';
