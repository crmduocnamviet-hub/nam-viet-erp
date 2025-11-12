-- Migration: Link employees table to permission_roles table
-- Date: 2025-01-13
-- Description: Add permission_role_id to employees table to link with permission_roles

-- Step 1: Add permission_role_id column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS permission_role_id UUID;

-- Step 2: Add foreign key constraint to permission_roles
ALTER TABLE public.employees
ADD CONSTRAINT fk_employees_permission_role
FOREIGN KEY (permission_role_id)
REFERENCES public.permission_roles(id)
ON DELETE SET NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employees_permission_role_id
ON public.employees(permission_role_id);

-- Step 4: Migrate existing data (map role_name to permission_role_id)
-- This is a one-time data migration based on common role names

-- Update employees with role_name 'BacSi' to link to 'doctor' permission role
UPDATE public.employees e
SET permission_role_id = (
    SELECT id FROM public.permission_roles
    WHERE role_key = 'medical-staff'
    LIMIT 1
)
WHERE e.role_name = 'BacSi' AND e.permission_role_id IS NULL;

-- Update employees with role_name 'DuocSi' to link to 'pharmacist' permission role
UPDATE public.employees e
SET permission_role_id = (
    SELECT id FROM public.permission_roles
    WHERE role_key = 'inventory-staff'
    LIMIT 1
)
WHERE e.role_name = 'DuocSi' AND e.permission_role_id IS NULL;

-- Update employees with role_name 'LeTan' to link to 'receptionist/sales-staff' permission role
UPDATE public.employees e
SET permission_role_id = (
    SELECT id FROM public.permission_roles
    WHERE role_key = 'sales-staff'
    LIMIT 1
)
WHERE e.role_name = 'LeTan' AND e.permission_role_id IS NULL;

-- Update employees with role_name 'KeToan' to link to 'accountant' permission role
UPDATE public.employees e
SET permission_role_id = (
    SELECT id FROM public.permission_roles
    WHERE role_key = 'accountant'
    LIMIT 1
)
WHERE e.role_name = 'KeToan' AND e.permission_role_id IS NULL;

-- Update employees with role_name 'QuanLy' to link to 'admin' permission role
UPDATE public.employees e
SET permission_role_id = (
    SELECT id FROM public.permission_roles
    WHERE role_key = 'admin'
    LIMIT 1
)
WHERE e.role_name = 'QuanLy' AND e.permission_role_id IS NULL;

-- Step 5: Add comment to document the relationship
COMMENT ON COLUMN public.employees.permission_role_id IS 'Foreign key to permission_roles table - determines employee system permissions';

-- Step 6: Drop the role_name column as it's now replaced by permission_role_id
-- Note: We keep it commented out for now in case of rollback needs
-- ALTER TABLE public.employees DROP COLUMN IF EXISTS role_name;

COMMENT ON COLUMN public.employees.role_name IS 'DEPRECATED: Use permission_role_id instead. This field is kept for backward compatibility only.';

-- Step 6.5: Create function to auto-sync permissions when permission_role_id changes
CREATE OR REPLACE FUNCTION sync_employee_permissions_on_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If permission_role_id changed, sync employee permissions with role permissions
    IF (TG_OP = 'UPDATE' AND NEW.permission_role_id IS DISTINCT FROM OLD.permission_role_id)
       OR (TG_OP = 'INSERT' AND NEW.permission_role_id IS NOT NULL) THEN

        -- Get permissions from the new role and set to employee
        NEW.permissions := (
            SELECT permissions
            FROM public.permission_roles
            WHERE id = NEW.permission_role_id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 6.6: Create trigger to auto-sync permissions
DROP TRIGGER IF EXISTS trigger_sync_employee_permissions ON public.employees;
CREATE TRIGGER trigger_sync_employee_permissions
    BEFORE INSERT OR UPDATE OF permission_role_id ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION sync_employee_permissions_on_role_change();

COMMENT ON FUNCTION sync_employee_permissions_on_role_change() IS 'Automatically sync employee permissions array with role permissions when permission_role_id changes';

-- Step 7: Create view to get employee with role information
CREATE OR REPLACE VIEW employee_with_role AS
SELECT
    e.employee_id,
    e.full_name,
    e.employee_code,
    e.is_active,
    e.user_id,
    e.permissions as individual_permissions,
    e.warehouse_id,
    e.permission_role_id,
    pr.role_key,
    pr.role_title,
    pr.permissions as role_permissions,
    -- Merge individual permissions with role permissions (remove duplicates)
    ARRAY(
        SELECT DISTINCT unnest(
            COALESCE(e.permissions, ARRAY[]::TEXT[]) ||
            COALESCE(pr.permissions, ARRAY[]::TEXT[])
        )
    ) as all_permissions
FROM public.employees e
LEFT JOIN public.permission_roles pr ON e.permission_role_id = pr.id;

-- Grant permissions on the view
GRANT SELECT ON employee_with_role TO authenticated;

COMMENT ON VIEW employee_with_role IS 'View combining employee data with their permission role, including merged permissions from both individual and role-based (deprecated role_name field removed)';
