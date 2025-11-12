/**
 * Employee Role Types
 *
 * Types for dynamic employee role management system
 */

/**
 * Employee Role - Vai trò nhân viên
 * Stored in database for dynamic role management
 */
export interface EmployeeRole {
  id: string;
  role_key: string; // Unique key (e.g., "sales-staff", "intern-delivery-staff")
  role_name: string; // Display name (e.g., "Nhân viên bán hàng")
  description?: string;
  is_system: boolean; // System roles cannot be deleted
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Role Option - For Select/Checkbox components
 */
export interface RoleOption {
  value: string; // role_key
  label: string; // role_name
}

/**
 * Create Employee Role Data
 */
export interface CreateEmployeeRoleData {
  role_key: string;
  role_name: string;
  description?: string;
  display_order?: number;
}

/**
 * Update Employee Role Data
 */
export interface UpdateEmployeeRoleData {
  role_key?: string;
  role_name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}
