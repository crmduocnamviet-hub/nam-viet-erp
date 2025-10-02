-- Migration: Add b2b.notification permission
-- Description: Adds permission for B2B dashboard realtime notifications
-- Date: 2025-01-02

-- Add the b2b.notification permission to the permissions table
INSERT INTO permissions (name, description, module)
VALUES (
  'b2b.notification',
  'Receive realtime notifications for B2B quotes and orders',
  'b2b'
)
ON CONFLICT (name) DO NOTHING;

-- Optional: Grant this permission to specific roles
-- Uncomment and modify the role names as needed

-- Note: super-admin role automatically gets ALL permissions via Object.keys(PERMISSIONS)
-- No need to manually grant to super-admin in database

-- Example: Grant to admin role
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.name = 'admin'
-- AND p.name = 'b2b.notification'
-- ON CONFLICT DO NOTHING;

-- Example: Grant to sales staff role
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.name = 'sales_staff'
-- AND p.name = 'b2b.notification'
-- ON CONFLICT DO NOTHING;

-- Example: Grant to inventory staff role
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.name = 'inventory_staff'
-- AND p.name = 'b2b.notification'
-- ON CONFLICT DO NOTHING;

-- Example: Grant to admin role
-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.name = 'admin'
-- AND p.name = 'b2b.notification'
-- ON CONFLICT DO NOTHING;

-- Verify the permission was added
SELECT * FROM permissions WHERE name = 'b2b.notification';
