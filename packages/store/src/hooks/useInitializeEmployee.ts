import { useEffect, useCallback } from "react";
import { useEmployeeStore } from "../employeeStore";
import { useAuthStore } from "../authStore";
import { getEmployeeByUserId } from "@nam-viet-erp/services";

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
  const setEmployee = useEmployeeStore((state) => state.setEmployee);
  const setPermissions = useEmployeeStore((state) => state.setPermissions);
  const setLoading = useEmployeeStore((state) => state.setLoading);
  const setError = useEmployeeStore((state) => state.setError);

  const fetchEmployee = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: employee, error: employeeError } =
        await getEmployeeByUserId(user.id);

      if (employeeError || !employee) {
        throw new Error(
          employeeError?.message || "Failed to fetch employee data"
        );
      }

      setEmployee(employee);

      // Set permissions if available
      if (employee.permissions && Array.isArray(employee.permissions)) {
        setPermissions(employee.permissions);
      }

      setLoading(false);
    } catch (error: any) {
      console.error("[useInitializeEmployee] Error fetching employee:", error);
      setError(error.message || "Failed to fetch employee data");
      setLoading(false);
    }
  }, [user?.id, isAuthenticated]);

  useEffect(() => {
    fetchEmployee();
  }, []);

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
      getEmployeeAPI: (userId: string) => Promise<{ data: any; error?: any }>
    ) => {
      if (!user?.id) {
        setError("No user found");
        return null;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: employee, error: employeeError } = await getEmployeeAPI(
          user.id
        );

        if (employeeError || !employee) {
          throw new Error(
            employeeError?.message || "Failed to fetch employee data"
          );
        }

        setEmployee(employee);

        // Set permissions if available
        if (employee.permissions && Array.isArray(employee.permissions)) {
          setPermissions(employee.permissions);
        }

        setLoading(false);
        return employee;
      } catch (error: any) {
        console.error("[useInitializeEmployeeWithFetch] Error:", error);
        setError(error.message || "Failed to fetch employee data");
        setLoading(false);
        return null;
      }
    },
    [user?.id]
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
  getEmployeeAPI: (userId: string) => Promise<{ data: any; error?: any }>
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
        user.id
      );

      if (employeeError || !employee) {
        throw new Error(
          employeeError?.message || "Failed to refresh employee data"
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
