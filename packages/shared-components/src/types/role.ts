// Role Management Types

export interface Role {
  id: string;
  key: string; // unique key like "medical-staff", "delivery-staff"
  title: string; // display name like "Nhân viên Y tế"
  description?: string;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
  is_system_role?: boolean; // roles mặc định không thể xóa
}

export interface CreateRoleInput {
  key: string;
  title: string;
  description?: string;
  permissions: string[];
}

export interface UpdateRoleInput {
  title?: string;
  description?: string;
  permissions?: string[];
}

// Predefined system roles that cannot be deleted
export const SYSTEM_ROLES = [
  "super-admin",
  "admin",
  "sales-manager",
  "medical-staff",
  "inventory-manager",
  "inventory-staff",
  "warehouse-manager",
  "warehouse-staff",
  "delivery-staff",
  "sales-staff",
  "marketing-manager",
  "accountant",
] as const;

export type SystemRoleKey = (typeof SYSTEM_ROLES)[number];
