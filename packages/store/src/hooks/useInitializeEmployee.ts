import { useEffect, useCallback, useRef } from "react";
import { useEmployeeStore } from "../employeeStore";
import { useAuthStore } from "../authStore";
import { getEmployeeByUserId } from "@nam-viet-erp/services";
import { ROLE_PERMISSIONS } from "@nam-viet-erp/shared-components";

/**
 * Hook to initialize employee data on app mount
 * This hook automatically fetches employee data when a user is authenticated
 *
 * @example
 * ```tsx
 * import { useInitializeEmployee } from '@nam-viet-erp/store';
 * import { getEmployeeByUserId } from '@nam-viet-erp/services';
 *
 * function App() {
 *   useInitializeEmployee(getEmployeeByUserId);
 *   return <YourApp />;
 * }
 * ```
 */
export function useInitializeEmployee() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = !!user?.id;
  const employee = useEmployeeStore((state) => state.employee);
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);
  const setLoading = useEmployeeStore((state) => state.setLoading);
  const setError = useEmployeeStore((state) => state.setError);

  // Track if fetch is in progress to prevent duplicate calls
  const isFetchingRef = useRef(false);
  const fetchedUserIdRef = useRef<string | null>(null);

  const fetchEmployee = useCallback(async () => {
    // Skip if not authenticated
    if (!isAuthenticated || !user?.id) {
      return;
    }

    // Skip if already fetching
    if (isFetchingRef.current) {
      console.log(
        "[useInitializeEmployee] Fetch already in progress, skipping",
      );
      return;
    }

    // Skip if already fetched for this user
    if (fetchedUserIdRef.current === user.id && employee?.user_id === user.id) {
      console.log(
        "[useInitializeEmployee] Employee already loaded for this user, skipping",
      );
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      console.log(
        "[useInitializeEmployee] Fetching employee for user:",
        user.id,
      );

      const { data: employeeData, error: employeeError } =
        await getEmployeeByUserId(user.id);

      if (employeeError || !employeeData) {
        throw new Error(
          employeeError?.message || "Failed to fetch employee data",
        );
      }

      setEmployee(employeeData);

      // Calculate permissions based on role
      const rolePermissions =
        ROLE_PERMISSIONS[
          employeeData.role_name as keyof typeof ROLE_PERMISSIONS
        ] || [];
      setPermissions(employeeData.permissions || rolePermissions);

      fetchedUserIdRef.current = user.id;
      setLoading(false);
    } catch (error: any) {
      console.error("[useInitializeEmployee] Error fetching employee:", error);
      setError(error.message || "Failed to fetch employee data");
      setLoading(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [
    user?.id,
    isAuthenticated,
    employee?.user_id,
    setLoading,
    setError,
    setEmployee,
    setPermissions,
  ]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchEmployee();
    }
  }, [isAuthenticated, user?.id, fetchEmployee]);

  return { refetch: fetchEmployee };
}

/**
 * Hook to initialize employee with custom fetch logic
 * Provides more control over when and how to fetch employee data
 *
 * @example
 * ```tsx
 * import { useInitializeEmployeeWithFetch } from '@nam-viet-erp/store';
 *
 * function App() {
 *   const { fetchEmployee, isLoading } = useInitializeEmployeeWithFetch();
 *
 *   useEffect(() => {
 *     fetchEmployee(async (userId) => {
 *       const response = await fetch(`/api/employees/${userId}`);
 *       return response.json();
 *     });
 *   }, []);
 *
 *   return isLoading ? <Loading /> : <YourApp />;
 * }
 * ```
 */
export function useInitializeEmployeeWithFetch() {
  const user = useAuthStore((state) => state.user);
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);
  const setLoading = useEmployeeStore((state) => state.setLoading);
  const setError = useEmployeeStore((state) => state.setError);
  const isLoading = useEmployeeStore((state) => state.isLoading);
  const error = useEmployeeStore((state) => state.error);

  const fetchEmployee = useCallback(
    async (
      getEmployeeAPI: (userId: string) => Promise<{ data: any; error?: any }>,
    ) => {
      if (!user?.id) {
        setError("No user found");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: employee, error: employeeError } = await getEmployeeAPI(
          user.id,
        );

        if (employeeError || !employee) {
          throw new Error(
            employeeError?.message || "Failed to fetch employee data",
          );
        }

        setEmployee(employee);

        // Calculate permissions based on role
        const rolePermissions =
          ROLE_PERMISSIONS[
            employee.role_name as keyof typeof ROLE_PERMISSIONS
          ] || [];
        setPermissions(rolePermissions);

        setLoading(false);
        return employee;
      } catch (error: any) {
        console.error("[useInitializeEmployeeWithFetch] Error:", error);
        setError(error.message || "Failed to fetch employee data");
        setLoading(false);
        return null;
      }
    },
    [user?.id],
  );

  return {
    fetchEmployee,
    isLoading,
    error,
  };
}

/**
 * Hook to refresh employee data
 * Useful for manual refresh operations
 *
 * @example
 * ```tsx
 * import { useRefreshEmployee } from '@nam-viet-erp/store';
 *
 * function EmployeeProfile() {
 *   const { refreshEmployee, isLoading } = useRefreshEmployee(getEmployeeByUserId);
 *
 *   return (
 *     <div>
 *       <button onClick={refreshEmployee} disabled={isLoading}>
 *         Refresh Profile
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRefreshEmployee(
  getEmployeeAPI: (userId: string) => Promise<{ data: any; error?: any }>,
) {
  const user = useAuthStore((state) => state.user);
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);
  const setLoading = useEmployeeStore((state) => state.setLoading);
  const setError = useEmployeeStore((state) => state.setError);
  const isLoading = useEmployeeStore((state) => state.isLoading);

  const refreshEmployee = useCallback(async () => {
    if (!user?.id) {
      console.warn("[useRefreshEmployee] No user found");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: employee, error: employeeError } = await getEmployeeAPI(
        user.id,
      );

      if (employeeError || !employee) {
        throw new Error(
          employeeError?.message || "Failed to refresh employee data",
        );
      }

      setEmployee(employee);

      if (employee.permissions && Array.isArray(employee.permissions)) {
        setPermissions(employee.permissions);
      }

      setLoading(false);
    } catch (error: any) {
      console.error("[useRefreshEmployee] Error:", error);
      setError(error.message || "Failed to refresh employee data");
      setLoading(false);
    }
  }, [user?.id, getEmployeeAPI]);

  return {
    refreshEmployee,
    isLoading,
  };
}
