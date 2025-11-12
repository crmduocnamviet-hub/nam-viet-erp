/**
 * Permission Role Service
 *
 * Service to manage permission roles in Supabase
 */

import { supabase } from "./supabase";

export interface PermissionRole {
  id: string;
  role_key: string;
  role_title: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePermissionRoleInput {
  role_key: string;
  role_title: string;
  description?: string;
  permissions: string[];
  is_system_role?: boolean;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdatePermissionRoleInput {
  role_title?: string;
  description?: string;
  permissions?: string[];
  is_active?: boolean;
  display_order?: number;
}

// ============================================
// GET Operations
// ============================================

/**
 * Get all permission roles
 */
export const getPermissionRoles = async (filters?: {
  isActive?: boolean;
  isSystem?: boolean;
}) => {
  let query = supabase
    .from("permission_roles")
    .select("*")
    .order("display_order", { ascending: true })
    .order("role_title", { ascending: true });

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  if (filters?.isSystem !== undefined) {
    query = query.eq("is_system_role", filters.isSystem);
  }

  return await query;
};

/**
 * Get permission role by ID
 */
export const getPermissionRoleById = async (id: string) => {
  return await supabase
    .from("permission_roles")
    .select("*")
    .eq("id", id)
    .single();
};

/**
 * Get permission role by key
 */
export const getPermissionRoleByKey = async (roleKey: string) => {
  return await supabase
    .from("permission_roles")
    .select("*")
    .eq("role_key", roleKey)
    .single();
};

/**
 * Check if permission role key exists
 */
export const checkPermissionRoleKeyExists = async (
  roleKey: string,
): Promise<boolean> => {
  const { data, error } = await supabase
    .from("permission_roles")
    .select("id")
    .eq("role_key", roleKey)
    .maybeSingle();

  if (error) {
    console.error("Error checking role key:", error);
    return false;
  }

  return !!data;
};

// ============================================
// CREATE Operation
// ============================================

/**
 * Create new permission role
 */
export const createPermissionRole = async (data: CreatePermissionRoleInput) => {
  // Check if role key already exists
  const exists = await checkPermissionRoleKeyExists(data.role_key);
  if (exists) {
    return {
      data: null,
      error: { message: "Role key already exists" },
    };
  }

  return await supabase
    .from("permission_roles")
    .insert([
      {
        role_key: data.role_key,
        role_title: data.role_title,
        description: data.description,
        permissions: data.permissions || [],
        is_system_role: data.is_system_role || false,
        is_active: data.is_active !== undefined ? data.is_active : true,
        display_order: data.display_order || 999,
      },
    ])
    .select()
    .single();
};

// ============================================
// UPDATE Operation
// ============================================

/**
 * Update permission role
 */
export const updatePermissionRole = async (
  id: string,
  data: UpdatePermissionRoleInput,
) => {
  const updateData: any = {};

  if (data.role_title !== undefined) updateData.role_title = data.role_title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.permissions !== undefined) updateData.permissions = data.permissions;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.display_order !== undefined)
    updateData.display_order = data.display_order;

  return await supabase
    .from("permission_roles")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();
};

/**
 * Update role permissions only
 */
export const updateRolePermissions = async (
  id: string,
  permissions: string[],
) => {
  return await supabase
    .from("permission_roles")
    .update({ permissions })
    .eq("id", id)
    .select()
    .single();
};

/**
 * Toggle role active status
 */
export const toggleRoleActiveStatus = async (id: string, isActive: boolean) => {
  return await supabase
    .from("permission_roles")
    .update({ is_active: isActive })
    .eq("id", id)
    .select()
    .single();
};

// ============================================
// DELETE Operation
// ============================================

/**
 * Delete permission role
 * Note: System roles cannot be deleted (handled by database trigger)
 */
export const deletePermissionRole = async (id: string) => {
  return await supabase.from("permission_roles").delete().eq("id", id);
};

// ============================================
// HELPER Functions
// ============================================

/**
 * Get role options for dropdown
 */
export const getRoleOptions = async () => {
  const { data, error } = await getPermissionRoles({ isActive: true });

  if (error || !data) {
    return [];
  }

  return data.map((role) => ({
    value: role.role_key,
    label: role.role_title,
  }));
};

/**
 * Format role title from key
 */
export const formatRoleTitle = (roleKey: string): string => {
  return roleKey
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
