import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export interface Employee {
  employee_id: string;
  full_name: string;
  email?: string;
  role_name: string;
  employee_code: string;
  phone_number?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  warehouse_id?: number;
}

interface EmployeeState {
  employee: Employee | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setEmployee: (employee: Employee | null) => void;
  setPermissions: (permissions: string[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearEmployee: () => void;
  updateEmployee: (updates: Partial<Employee>) => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
}

export const useEmployeeStore = create<EmployeeState>()(
  devtools(
    persist(
      immer((set, get) => ({
        employee: null,
        permissions: [],
        isLoading: false,
        error: null,

        setEmployee: (employee) =>
          set(
            (state) => {
              state.employee = employee;
              state.error = null;
            },
            false,
            "setEmployee",
          ),

        setPermissions: (permissions) =>
          set(
            (state) => {
              state.permissions = permissions;
            },
            false,
            "setPermissions",
          ),

        setLoading: (isLoading) =>
          set(
            (state) => {
              state.isLoading = isLoading;
            },
            false,
            "setLoading",
          ),

        setError: (error) =>
          set(
            (state) => {
              state.error = error;
            },
            false,
            "setError",
          ),

        clearEmployee: () =>
          set(
            (state) => {
              state.employee = null;
              state.permissions = [];
              state.error = null;
            },
            false,
            "clearEmployee",
          ),

        updateEmployee: (updates) =>
          set(
            (state) => {
              if (state.employee) {
                Object.assign(state.employee, updates);
              }
            },
            false,
            "updateEmployee",
          ),

        hasPermission: (permission) => {
          const { employee, permissions } = get();
          // Super-admin always has all permissions
          if (employee?.role_name === "super-admin") {
            return true;
          }
          return permissions.includes(permission);
        },

        hasAnyPermission: (requiredPermissions) => {
          const { employee, permissions } = get();
          // Super-admin always has all permissions
          if (employee?.role_name === "super-admin") {
            return true;
          }
          return requiredPermissions.some((perm) => permissions.includes(perm));
        },

        hasAllPermissions: (requiredPermissions) => {
          const { employee, permissions } = get();
          // Super-admin always has all permissions
          if (employee?.role_name === "super-admin") {
            return true;
          }
          return requiredPermissions.every((perm) =>
            permissions.includes(perm),
          );
        },
      })),
      {
        name: "employee-storage",
        partialize: (state) => ({
          employee: state.employee,
          permissions: state.permissions,
        }),
      },
    ),
    {
      name: "EmployeeStore",
    },
  ),
);

// Selectors
export const useEmployee = () => useEmployeeStore((state) => state.employee);
export const usePermissions = () =>
  useEmployeeStore((state) => state.permissions);
export const useEmployeeLoading = () =>
  useEmployeeStore((state) => state.isLoading);
export const useEmployeeError = () => useEmployeeStore((state) => state.error);
export const useHasPermission = (permission: string) =>
  useEmployeeStore((state) => state.hasPermission(permission));
export const useHasAnyPermission = (permissions: string[]) =>
  useEmployeeStore((state) => state.hasAnyPermission(permissions));
export const useHasAllPermissions = (permissions: string[]) =>
  useEmployeeStore((state) => state.hasAllPermissions(permissions));
