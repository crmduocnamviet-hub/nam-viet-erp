import { useEmployeeStore } from "../employeeStore";
import { useAuthStore } from "../authStore";

/**
 * Service to fetch and sync employee information with the store
 */

interface EmployeeResponse {
  employee: any;
  permissions: string[];
  error?: any;
}

/**
 * Fetch employee information from the API and update the store
 * @param employeeId - The employee ID to fetch
 * @param getEmployeeAPI - The API function to fetch employee data
 * @param getPermissionsAPI - The API function to fetch permissions
 */
export async function fetchAndSetEmployee(
  employeeId: string,
  getEmployeeAPI: (id: string) => Promise<{ data: any; error?: any }>,
  getPermissionsAPI?: (
    roleId: string,
  ) => Promise<{ data: string[]; error?: any }>,
): Promise<EmployeeResponse> {
  const { setEmployee, setPermissions, setLoading, setError } =
    useEmployeeStore.getState();

  try {
    setLoading(true);
    setError(null);

    // Fetch employee data
    const { data: employee, error: employeeError } =
      await getEmployeeAPI(employeeId);

    if (employeeError || !employee) {
      throw new Error(
        employeeError?.message || "Failed to fetch employee data",
      );
    }

    // Check if employee is super-admin
    let permissions: string[] = [];
    if (employee.role_name === "super-admin") {
      // Super-admin gets all permissions automatically - no need to fetch from database
      // Use wildcard permission - the employeeStore checks role_name and returns true for all permissions
      permissions = ["*"];
      console.log(
        "[Employee Service] Super-admin detected - full permissions granted",
      );
    } else if (getPermissionsAPI && employee.role_id) {
      // Fetch permissions from database for other roles
      const { data: permData, error: permError } = await getPermissionsAPI(
        employee.role_id,
      );
      if (permError) {
        console.warn("Failed to fetch permissions:", permError);
      } else {
        permissions = permData || [];
      }
    }

    // Update store
    setEmployee(employee);
    setPermissions(permissions);
    setLoading(false);

    return { employee, permissions };
  } catch (error: any) {
    console.error("Error fetching employee:", error);
    setError(error.message || "Failed to fetch employee data");
    setLoading(false);
    return { employee: null, permissions: [], error };
  }
}

/**
 * Fetch employee by user ID from auth session
 * @param getUserEmployeeAPI - API function that gets employee by user ID
 */
export async function fetchEmployeeByUserId(
  getUserEmployeeAPI: (userId: string) => Promise<{ data: any; error?: any }>,
): Promise<EmployeeResponse> {
  const { user } = useAuthStore.getState();
  const { setEmployee, setPermissions, setLoading, setError } =
    useEmployeeStore.getState();

  if (!user?.id) {
    const error = "No user found in auth store";
    setError(error);
    return { employee: null, permissions: [], error: new Error(error) };
  }

  try {
    setLoading(true);
    setError(null);

    const { data: employee, error: employeeError } = await getUserEmployeeAPI(
      user.id,
    );

    if (employeeError || !employee) {
      throw new Error(
        employeeError?.message || "Failed to fetch employee data",
      );
    }

    // Check if employee is super-admin
    let permissions: string[] = [];
    if (employee.role_name === "super-admin") {
      // Super-admin gets all permissions automatically - no need to check database
      // Use wildcard permission - the employeeStore checks role_name and returns true for all permissions
      permissions = ["*"];
      console.log(
        "[Employee Service] Super-admin detected - full permissions granted",
      );
    } else if (employee.permissions && Array.isArray(employee.permissions)) {
      // Use permissions from employee data if available
      permissions = employee.permissions;
    }

    // Update store
    setEmployee(employee);
    setPermissions(permissions);
    setLoading(false);

    return {
      employee,
      permissions,
    };
  } catch (error: any) {
    console.error("Error fetching employee by user ID:", error);
    setError(error.message || "Failed to fetch employee data");
    setLoading(false);
    return { employee: null, permissions: [], error };
  }
}

/**
 * Refresh current employee data
 * @param getEmployeeAPI - The API function to fetch employee data
 */
export async function refreshEmployee(
  getEmployeeAPI: (id: string) => Promise<{ data: any; error?: any }>,
): Promise<EmployeeResponse> {
  const { employee } = useEmployeeStore.getState();

  if (!employee?.employee_id) {
    const error = "No employee found in store";
    return { employee: null, permissions: [], error: new Error(error) };
  }

  return fetchAndSetEmployee(employee.employee_id, getEmployeeAPI);
}

/**
 * Clear employee data from store (useful for logout)
 */
export function clearEmployeeData(): void {
  const { clearEmployee } = useEmployeeStore.getState();
  clearEmployee();
}

/**
 * Update employee permissions
 * @param permissions - Array of permission strings
 */
export function updateEmployeePermissions(permissions: string[]): void {
  const { setPermissions } = useEmployeeStore.getState();
  setPermissions(permissions);
}

/**
 * Check if employee has specific permission
 * @param permission - Permission string to check
 */
export function checkPermission(permission: string): boolean {
  const { hasPermission } = useEmployeeStore.getState();
  return hasPermission(permission);
}

/**
 * Check if employee has any of the provided permissions
 * @param permissions - Array of permission strings
 */
export function checkAnyPermission(permissions: string[]): boolean {
  const { hasAnyPermission } = useEmployeeStore.getState();
  return hasAnyPermission(permissions);
}

/**
 * Check if employee has all of the provided permissions
 * @param permissions - Array of permission strings
 */
export function checkAllPermissions(permissions: string[]): boolean {
  const { hasAllPermissions } = useEmployeeStore.getState();
  return hasAllPermissions(permissions);
}

/**
 * Get current employee from store
 */
export function getCurrentEmployee() {
  return useEmployeeStore.getState().employee;
}

/**
 * Get current permissions from store
 */
export function getCurrentPermissions() {
  return useEmployeeStore.getState().permissions;
}
