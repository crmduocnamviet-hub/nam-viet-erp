-- Add Accountant (Kế toán) Role
-- Purpose: Document the addition of the Accountant role to the system
-- Date: 2025-10-26
--
-- The employees table already supports this role via the role_name column (TEXT field)
-- This file serves as documentation and provides sample data insertion

-- Role name: 'KeToan' (Kế toán - Accountant)
--
-- Permissions for Accountant role typically include:
-- - finance.view: View financial reports
-- - finance.manage: Manage financial transactions
-- - transactions.create: Create financial transactions
-- - transactions.approve: Approve transactions
-- - reports.financial: Access financial reports
-- - b2b.view: View B2B orders for accounting purposes
-- - invoices.manage: Manage invoices and VAT

-- Example: Insert a sample accountant employee
-- IMPORTANT: Only run this if you want to create a sample accountant
-- Uncomment the following lines to create a sample accountant:

/*
INSERT INTO employees (
  employee_id,
  full_name,
  employee_code,
  role_name,
  is_active
) VALUES (
  gen_random_uuid(),
  'Nguyễn Thị Lan', -- Sample name
  'KT001', -- Accountant code
  'KeToan', -- Role name
  true -- Active
);
*/

-- Comment: The accountant role has been added to the system
-- Users can now create employees with role_name = 'KeToan'
-- The getAccountants() function is available in employeeService.ts
