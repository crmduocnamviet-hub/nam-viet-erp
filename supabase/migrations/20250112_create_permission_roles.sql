-- Migration: Create Permission Roles System
-- Description: Quản lý vai trò và phân quyền trong hệ thống

-- ============================================
-- TABLE: permission_roles
-- ============================================
CREATE TABLE IF NOT EXISTS public.permission_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(100) NOT NULL UNIQUE,
    role_title VARCHAR(255) NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}', -- Array of permission keys
    is_system_role BOOLEAN DEFAULT false, -- System roles cannot be deleted
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 999,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_permission_roles_key ON public.permission_roles(role_key);
CREATE INDEX idx_permission_roles_active ON public.permission_roles(is_active);
CREATE INDEX idx_permission_roles_system ON public.permission_roles(is_system_role);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE public.permission_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all roles
CREATE POLICY "Allow read permission_roles for authenticated users"
    ON public.permission_roles
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow admins to insert roles
CREATE POLICY "Allow insert permission_roles for admins"
    ON public.permission_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- Policy: Allow admins to update roles
CREATE POLICY "Allow update permission_roles for admins"
    ON public.permission_roles
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- Policy: Allow admins to delete non-system roles
CREATE POLICY "Allow delete permission_roles for admins"
    ON public.permission_roles
    FOR DELETE
    TO authenticated
    USING (
        is_system_role = false
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('super-admin', 'admin')
        )
    );

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger: Auto update updated_at timestamp
CREATE OR REPLACE FUNCTION update_permission_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_permission_roles_updated_at
    BEFORE UPDATE ON public.permission_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_permission_roles_updated_at();

-- Trigger: Prevent deletion of system roles
CREATE OR REPLACE FUNCTION prevent_system_permission_role_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.is_system_role = true THEN
        RAISE EXCEPTION 'Cannot delete system role: %', OLD.role_title;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_system_permission_role_deletion
    BEFORE DELETE ON public.permission_roles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_system_permission_role_deletion();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function: Get role by key
CREATE OR REPLACE FUNCTION get_permission_role_by_key(p_role_key VARCHAR)
RETURNS TABLE (
    id UUID,
    role_key VARCHAR,
    role_title VARCHAR,
    description TEXT,
    permissions TEXT[],
    is_system_role BOOLEAN,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.role_key,
        pr.role_title,
        pr.description,
        pr.permissions,
        pr.is_system_role,
        pr.is_active
    FROM public.permission_roles pr
    WHERE pr.role_key = p_role_key
    AND pr.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all active roles
CREATE OR REPLACE FUNCTION get_active_permission_roles()
RETURNS TABLE (
    id UUID,
    role_key VARCHAR,
    role_title VARCHAR,
    permissions TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.role_key,
        pr.role_title,
        pr.permissions
    FROM public.permission_roles pr
    WHERE pr.is_active = true
    ORDER BY pr.display_order ASC, pr.role_title ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED DATA: Migrate existing system roles
-- ============================================

INSERT INTO public.permission_roles (role_key, role_title, description, permissions, is_system_role, display_order, is_active) VALUES
-- Super Admin
('super-admin', 'Quản trị viên cấp cao', 'Toàn quyền truy cập hệ thống', ARRAY[
    'auth.login', 'auth.logout', 'auth.register',
    'dashboard.view', 'management.access',
    'pos.access', 'pos.create', 'pos.view', 'pos.edit', 'pos.delete',
    'b2b.access', 'b2b.create', 'b2b.view', 'b2b.edit', 'b2b.delete',
    'medical.access', 'medical.create', 'medical.view', 'medical.edit', 'medical.delete',
    'inventory.access', 'inventory.create', 'inventory.view', 'inventory.edit', 'inventory.delete',
    'warehouse.access', 'warehouse.create', 'warehouse.view', 'warehouse.edit', 'warehouse.delete',
    'delivery.access', 'delivery.view', 'delivery.edit',
    'financial.access', 'financial.create', 'financial.view', 'financial.edit', 'financial.delete',
    'marketing.access', 'marketing.create', 'marketing.view', 'marketing.edit', 'marketing.delete',
    'users.view', 'users.create', 'users.edit', 'users.delete',
    'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
    'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
    'settings.access', 'settings.edit'
], true, 1, true),

-- Admin
('admin', 'Quản trị viên', 'Quản lý toàn bộ hệ thống', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view', 'management.access',
    'pos.access', 'pos.create', 'pos.view', 'pos.edit', 'pos.delete',
    'b2b.access', 'b2b.create', 'b2b.view', 'b2b.edit', 'b2b.delete',
    'medical.access', 'medical.view', 'medical.edit',
    'inventory.access', 'inventory.create', 'inventory.view', 'inventory.edit', 'inventory.delete',
    'warehouse.access', 'warehouse.view', 'warehouse.edit',
    'financial.access', 'financial.view', 'financial.edit',
    'marketing.access', 'marketing.create', 'marketing.view', 'marketing.edit',
    'users.view', 'users.create', 'users.edit',
    'employees.view', 'employees.create', 'employees.edit',
    'roles.view'
], true, 2, true),

-- Sales Manager
('sales-manager', 'Quản lý Bán hàng', 'Quản lý đội ngũ bán hàng', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view', 'management.access',
    'pos.access', 'pos.create', 'pos.view', 'pos.edit',
    'b2b.access', 'b2b.create', 'b2b.view', 'b2b.edit',
    'inventory.access', 'inventory.view',
    'marketing.access', 'marketing.view',
    'employees.view'
], true, 3, true),

-- Medical Staff
('medical-staff', 'Nhân viên Y tế', 'Nhân viên phòng khám', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view',
    'medical.access', 'medical.create', 'medical.view', 'medical.edit',
    'inventory.access', 'inventory.view'
], true, 4, true),

-- Inventory Manager
('inventory-manager', 'Quản lý Kho', 'Quản lý kho hàng', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view', 'management.access',
    'inventory.access', 'inventory.create', 'inventory.view', 'inventory.edit', 'inventory.delete',
    'warehouse.access', 'warehouse.view', 'warehouse.edit',
    'b2b.access', 'b2b.view'
], true, 5, true),

-- Inventory Staff
('inventory-staff', 'Nhân viên Kho', 'Nhân viên quản lý kho', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view',
    'inventory.access', 'inventory.create', 'inventory.view', 'inventory.edit',
    'warehouse.access', 'warehouse.view'
], true, 6, true),

-- Warehouse Manager
('warehouse-manager', 'Quản lý Kho vận', 'Quản lý kho vận và logistics', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view', 'management.access',
    'warehouse.access', 'warehouse.create', 'warehouse.view', 'warehouse.edit', 'warehouse.delete',
    'delivery.access', 'delivery.view', 'delivery.edit',
    'inventory.access', 'inventory.view'
], true, 7, true),

-- Warehouse Staff
('warehouse-staff', 'Nhân viên Kho vận', 'Nhân viên kho vận', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view',
    'warehouse.access', 'warehouse.view', 'warehouse.edit',
    'delivery.access', 'delivery.view'
], true, 8, true),

-- Delivery Staff
('delivery-staff', 'Nhân viên Giao hàng', 'Nhân viên giao hàng', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view',
    'delivery.access', 'delivery.view', 'delivery.edit'
], true, 9, true),

-- Sales Staff
('sales-staff', 'Nhân viên Bán hàng', 'Nhân viên bán hàng', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view',
    'pos.access', 'pos.create', 'pos.view',
    'b2b.access', 'b2b.view',
    'inventory.access', 'inventory.view',
    'marketing.access', 'marketing.view'
], true, 10, true),

-- Marketing Manager
('marketing-manager', 'Quản lý Marketing', 'Quản lý marketing và khuyến mãi', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view', 'management.access',
    'marketing.access', 'marketing.create', 'marketing.view', 'marketing.edit', 'marketing.delete',
    'pos.access', 'pos.view',
    'b2b.access', 'b2b.view'
], true, 11, true),

-- Accountant
('accountant', 'Kế toán', 'Kế toán viên', ARRAY[
    'auth.login', 'auth.logout',
    'dashboard.view', 'management.access',
    'financial.access', 'financial.create', 'financial.view', 'financial.edit',
    'pos.access', 'pos.view',
    'b2b.access', 'b2b.view',
    'inventory.access', 'inventory.view'
], true, 12, true);

-- Add comment
COMMENT ON TABLE public.permission_roles IS 'Bảng quản lý vai trò và phân quyền trong hệ thống';
COMMENT ON COLUMN public.permission_roles.role_key IS 'Mã định danh vai trò (unique)';
COMMENT ON COLUMN public.permission_roles.permissions IS 'Mảng các permission keys';
COMMENT ON COLUMN public.permission_roles.is_system_role IS 'Vai trò hệ thống không thể xóa';
