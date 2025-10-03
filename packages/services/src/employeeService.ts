import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Get all employees with optional filtering
export const getEmployees = async (filters?: {
  search?: string;
  roleName?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) => {
  let query = supabase.from("employees").select("*");

  if (filters?.search) {
    query = query.or(
      `full_name.ilike.%${filters.search}%,employee_code.ilike.%${filters.search}%`
    );
  }

  if (filters?.roleName) {
    query = query.eq("role_name", filters.roleName);
  }

  if (filters?.isActive !== undefined) {
    query = query.eq("is_active", filters.isActive);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(
      filters.offset,
      filters.offset + (filters.limit || 10) - 1
    );
  }

  const response = await query.order("full_name", { ascending: true });
  return response;
};

// Get employee by ID
export const getEmployeeById = async (
  employeeId: string
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  const response = await supabase
    .from("employees")
    .select("*")
    .eq("employee_id", employeeId)
    .single();

  return response;
};

// Get employee by employee code
export const getEmployeeByCode = async (
  employeeCode: string
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  const response = await supabase
    .from("employees")
    .select("*")
    .eq("employee_code", employeeCode)
    .single();

  return response;
};

// Get employee by user ID (for current authenticated user)
export const getEmployeeByUserId = async (
  userId: string
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  const response = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  return response;
};

// Get current employee (uses current authenticated user)
export const getCurrentEmployee = async (): Promise<
  PostgrestSingleResponse<IEmployee | null>
> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: null,
      error: {
        message: "No authenticated user",
        details: "",
        hint: "",
        code: "UNAUTHENTICATED",
        name: "AuthenticationError",
      },
      count: null,
      status: 401,
      statusText: "Unauthorized",
    };
  }

  return getEmployeeByUserId(user.id);
};

// Create new employee
export const createEmployee = async (
  employee: Omit<IEmployee, "employee_id">
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  const response = await supabase
    .from("employees")
    .insert(employee)
    .select()
    .single();

  return response;
};

// Update employee
export const updateEmployee = async (
  employeeId: string,
  updates: Partial<Omit<IEmployee, "employee_id">>
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  const response = await supabase
    .from("employees")
    .update(updates)
    .eq("employee_id", employeeId)
    .select()
    .single();

  return response;
};

// Delete employee (soft delete by setting is_active to false)
export const deleteEmployee = async (
  employeeId: string
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  const response = await supabase
    .from("employees")
    .update({ is_active: false })
    .eq("employee_id", employeeId)
    .select()
    .single();

  return response;
};

// Hard delete employee (permanent removal)
export const hardDeleteEmployee = async (
  employeeId: string
): Promise<PostgrestSingleResponse<null>> => {
  const response = await supabase
    .from("employees")
    .delete()
    .eq("employee_id", employeeId);

  return response;
};

// Get employees by role
export const getEmployeesByRole = async (roleName: string) => {
  const response = await supabase
    .from("employees")
    .select("*")
    .eq("role_name", roleName)
    .eq("is_active", true)
    .order("full_name", { ascending: true });

  return response;
};

// Get all doctors (BacSi)
export const getDoctors = async () => {
  return getEmployeesByRole("BacSi");
};

// Get all pharmacists (DuocSi)
export const getPharmacists = async () => {
  return getEmployeesByRole("DuocSi");
};

// Get all receptionists (LeTan)
export const getReceptionists = async () => {
  return getEmployeesByRole("LeTan");
};

// Get active employees count by role
export const getEmployeeCountByRole = async () => {
  const response = await supabase
    .from("employees")
    .select("role_name")
    .eq("is_active", true);

  if (response.error) {
    return response;
  }

  const counts = response.data?.reduce((acc, emp) => {
    acc[emp.role_name] = (acc[emp.role_name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return { data: counts, error: null };
};

// Activate/Deactivate employee
export const toggleEmployeeStatus = async (
  employeeId: string
): Promise<PostgrestSingleResponse<IEmployee | null>> => {
  // First get current status
  const { data: currentEmployee } = await getEmployeeById(employeeId);

  if (!currentEmployee) {
    throw new Error("Employee not found");
  }

  const response = await supabase
    .from("employees")
    .update({ is_active: !currentEmployee.is_active })
    .eq("employee_id", employeeId)
    .select()
    .single();

  return response;
};
