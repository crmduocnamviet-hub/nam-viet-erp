import { supabase } from "./supabase";

// ==================== EMPLOYEE ROLES ====================

export const getEmployeeRoles = async (filters?: {
  isActive?: boolean;
  isSystem?: boolean;
}) => {
  let query = supabase
    .from("employee_roles")
    .select("*")
    .order("display_order", { ascending: true })
    .order("role_name", { ascending: true });

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  if (filters?.isSystem !== undefined) {
    query = query.eq("is_system", filters.isSystem);
  }

  const response = await query;
  return response;
};

export const getEmployeeRoleById = async (id: string) => {
  const response = await supabase
    .from("employee_roles")
    .select("*")
    .eq("id", id)
    .single();

  return response;
};

export const getEmployeeRoleByKey = async (roleKey: string) => {
  const response = await supabase
    .from("employee_roles")
    .select("*")
    .eq("role_key", roleKey)
    .single();

  return response;
};

export const createEmployeeRole = async (data: {
  role_key: string;
  role_name: string;
  description?: string;
  display_order?: number;
}) => {
  const response = await supabase
    .from("employee_roles")
    .insert({
      role_key: data.role_key,
      role_name: data.role_name,
      description: data.description,
      display_order: data.display_order || 999,
      is_system: false,
      is_active: true,
    })
    .select()
    .single();

  return response;
};

export const updateEmployeeRole = async (
  id: string,
  data: {
    role_key?: string;
    role_name?: string;
    description?: string;
    display_order?: number;
    is_active?: boolean;
  },
) => {
  const response = await supabase
    .from("employee_roles")
    .update(data)
    .eq("id", id)
    .select()
    .single();

  return response;
};

export const deleteEmployeeRole = async (id: string) => {
  // Note: System roles are protected by database trigger
  const response = await supabase.from("employee_roles").delete().eq("id", id);

  return response;
};

export const toggleEmployeeRoleStatus = async (id: string) => {
  // Get current status
  const { data: currentRole } = await supabase
    .from("employee_roles")
    .select("is_active")
    .eq("id", id)
    .single();

  if (!currentRole) {
    return { data: null, error: { message: "Employee role not found" } };
  }

  // Toggle status
  const response = await supabase
    .from("employee_roles")
    .update({ is_active: !currentRole.is_active })
    .eq("id", id)
    .select()
    .single();

  return response;
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get role options for Select/Checkbox components
 * Returns active roles formatted for Ant Design components
 */
export const getRoleOptionsFromDB = async () => {
  const { data, error } = await getEmployeeRoles({ isActive: true });

  if (error || !data) {
    return [];
  }

  return data.map((role) => ({
    value: role.role_key,
    label: role.role_name,
  }));
};

/**
 * Get role name by role key
 */
export const getRoleNameByKey = async (roleKey: string): Promise<string> => {
  const { data } = await supabase.rpc("get_role_name", {
    p_role_key: roleKey,
  });

  return data || roleKey;
};

/**
 * Format array of role keys to display names
 */
export const formatRoleTitlesFromDB = async (
  roleKeys?: string[] | null,
): Promise<string> => {
  if (!roleKeys || roleKeys.length === 0) return "Tất cả";

  const promises = roleKeys.map((key) => getRoleNameByKey(key));
  const names = await Promise.all(promises);

  return names.join(", ");
};

/**
 * Check if a role key already exists
 */
export const checkRoleKeyExists = async (roleKey: string): Promise<boolean> => {
  const { data } = await supabase
    .from("employee_roles")
    .select("id")
    .eq("role_key", roleKey)
    .maybeSingle();

  return !!data;
};
