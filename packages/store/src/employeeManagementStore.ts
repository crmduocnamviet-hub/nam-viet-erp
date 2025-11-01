import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface - extends employee store for management operations
export interface EmployeeManagementState {
  // Employee data
  employees: any[];
  currentEmployee: any | null;
  isLoadingEmployees: boolean;
  isLoadingEmployee: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setEmployees: (employees: any[]) => void;
  setCurrentEmployee: (employee: any | null) => void;
  setLoadingEmployees: (isLoading: boolean) => void;
  setLoadingEmployee: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchEmployees: (
    filters?: any,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchEmployeeById: (
    employeeId: string,
  ) => Promise<{ data: any | null; error: any }>;
  fetchEmployeeByCode: (
    employeeCode: string,
  ) => Promise<{ data: any | null; error: any }>;
  createEmployee: (
    employeeData: any,
  ) => Promise<{ data: any | null; error: any }>;
  updateEmployee: (
    employeeId: string,
    updates: any,
  ) => Promise<{ data: any | null; error: any }>;
  deleteEmployee: (
    employeeId: string,
  ) => Promise<{ data: any | null; error: any }>;
  hardDeleteEmployee: (employeeId: string) => Promise<{ error: any }>;
  fetchEmployeesByRole: (
    roleName: string,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchDoctors: () => Promise<{ data: any[] | null; error: any }>;
  fetchPharmacists: () => Promise<{ data: any[] | null; error: any }>;
  fetchReceptionists: () => Promise<{ data: any[] | null; error: any }>;
  fetchAccountants: () => Promise<{ data: any[] | null; error: any }>;
  fetchEmployeeCountByRole: () => Promise<{ data: any | null; error: any }>;
  toggleEmployeeStatus: (
    employeeId: string,
  ) => Promise<{ data: any | null; error: any }>;

  // Utility
  clearCurrentEmployee: () => void;
  clearError: () => void;
}

// Create store
export const useEmployeeManagementStore = create<EmployeeManagementState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      employees: [],
      currentEmployee: null,
      isLoadingEmployees: false,
      isLoadingEmployee: false,
      isSaving: false,
      error: null,

      // Simple setters
      setEmployees: (employees) =>
        set(
          (state) => {
            state.employees = employees;
          },
          false,
          "setEmployees",
        ),

      setCurrentEmployee: (employee) =>
        set(
          (state) => {
            state.currentEmployee = employee;
          },
          false,
          "setCurrentEmployee",
        ),

      setLoadingEmployees: (isLoading) =>
        set(
          (state) => {
            state.isLoadingEmployees = isLoading;
          },
          false,
          "setLoadingEmployees",
        ),

      setLoadingEmployee: (isLoading) =>
        set(
          (state) => {
            state.isLoadingEmployee = isLoading;
          },
          false,
          "setLoadingEmployee",
        ),

      setSaving: (isSaving) =>
        set(
          (state) => {
            state.isSaving = isSaving;
          },
          false,
          "setSaving",
        ),

      setError: (error) =>
        set(
          (state) => {
            state.error = error;
          },
          false,
          "setError",
        ),

      // API Actions
      fetchEmployees: async (filters?: any) => {
        const { setLoadingEmployees, setEmployees, setError } = get();

        setLoadingEmployees(true);
        setError(null);

        try {
          const { getEmployees } = await import("@nam-viet-erp/services");
          const { data, error } = await getEmployees(filters);

          if (error) {
            setError(error.message || "Failed to fetch employees");
            setEmployees([]);
            return { data: null, error };
          }

          setEmployees(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch employees";
          setError(errorMsg);
          setEmployees([]);
          return { data: null, error };
        } finally {
          setLoadingEmployees(false);
        }
      },

      fetchEmployeeById: async (employeeId: string) => {
        const { setLoadingEmployee, setCurrentEmployee, setError } = get();

        setLoadingEmployee(true);
        setError(null);

        try {
          const { getEmployeeById } = await import("@nam-viet-erp/services");
          const { data, error } = await getEmployeeById(employeeId);

          if (error) {
            setError(error.message || "Failed to fetch employee");
            setCurrentEmployee(null);
            return { data: null, error };
          }

          setCurrentEmployee(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch employee";
          setError(errorMsg);
          setCurrentEmployee(null);
          return { data: null, error };
        } finally {
          setLoadingEmployee(false);
        }
      },

      fetchEmployeeByCode: async (employeeCode: string) => {
        const { setLoadingEmployee, setCurrentEmployee, setError } = get();

        setLoadingEmployee(true);
        setError(null);

        try {
          const { getEmployeeByCode } = await import("@nam-viet-erp/services");
          const { data, error } = await getEmployeeByCode(employeeCode);

          if (error) {
            setError(error.message || "Failed to fetch employee by code");
            setCurrentEmployee(null);
            return { data: null, error };
          }

          setCurrentEmployee(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch employee by code";
          setError(errorMsg);
          setCurrentEmployee(null);
          return { data: null, error };
        } finally {
          setLoadingEmployee(false);
        }
      },

      createEmployee: async (employeeData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createEmployee } = await import("@nam-viet-erp/services");
          const { data, error } = await createEmployee(employeeData);

          if (error) {
            setError(error.message || "Failed to create employee");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create employee";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updateEmployee: async (employeeId: string, updates: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateEmployee } = await import("@nam-viet-erp/services");
          const { data, error } = await updateEmployee(employeeId, updates);

          if (error) {
            setError(error.message || "Failed to update employee");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update employee";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deleteEmployee: async (employeeId: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteEmployee } = await import("@nam-viet-erp/services");
          const { data, error } = await deleteEmployee(employeeId);

          if (error) {
            setError(error.message || "Failed to delete employee");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete employee";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      hardDeleteEmployee: async (employeeId: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { hardDeleteEmployee } = await import("@nam-viet-erp/services");
          const { error } = await hardDeleteEmployee(employeeId);

          if (error) {
            setError(error.message || "Failed to hard delete employee");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to hard delete employee";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      fetchEmployeesByRole: async (roleName: string) => {
        const { setError } = get();

        setError(null);

        try {
          const { getEmployeesByRole } = await import("@nam-viet-erp/services");
          const { data, error } = await getEmployeesByRole(roleName);

          if (error) {
            setError(error.message || "Failed to fetch employees by role");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch employees by role";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchDoctors: async () => {
        const { setError } = get();

        setError(null);

        try {
          const { getDoctors } = await import("@nam-viet-erp/services");
          const { data, error } = await getDoctors();

          if (error) {
            setError(error.message || "Failed to fetch doctors");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch doctors";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchPharmacists: async () => {
        const { setError } = get();

        setError(null);

        try {
          const { getPharmacists } = await import("@nam-viet-erp/services");
          const { data, error } = await getPharmacists();

          if (error) {
            setError(error.message || "Failed to fetch pharmacists");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch pharmacists";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchReceptionists: async () => {
        const { setError } = get();

        setError(null);

        try {
          const { getReceptionists } = await import("@nam-viet-erp/services");
          const { data, error } = await getReceptionists();

          if (error) {
            setError(error.message || "Failed to fetch receptionists");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch receptionists";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchAccountants: async () => {
        const { setError } = get();

        setError(null);

        try {
          const { getAccountants } = await import("@nam-viet-erp/services");
          const { data, error } = await getAccountants();

          if (error) {
            setError(error.message || "Failed to fetch accountants");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch accountants";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchEmployeeCountByRole: async () => {
        const { setError } = get();

        setError(null);

        try {
          const { getEmployeeCountByRole } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getEmployeeCountByRole();

          if (error) {
            setError(error.message || "Failed to fetch employee count by role");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch employee count by role";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      toggleEmployeeStatus: async (employeeId: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { toggleEmployeeStatus } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await toggleEmployeeStatus(employeeId);

          if (error) {
            setError(error.message || "Failed to toggle employee status");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to toggle employee status";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      // Utility
      clearCurrentEmployee: () =>
        set(
          (state) => {
            state.currentEmployee = null;
          },
          false,
          "clearCurrentEmployee",
        ),

      clearError: () =>
        set(
          (state) => {
            state.error = null;
          },
          false,
          "clearError",
        ),
    })),
    {
      name: "EmployeeManagementStore",
    },
  ),
);

// Selectors - Use these to access store state directly (without fetching)
// For fetching data, use hooks from useEmployeeManagement.ts instead
export const useEmployeesFromStore = () =>
  useEmployeeManagementStore((state) => state.employees);
export const useCurrentEmployeeManagement = () =>
  useEmployeeManagementStore((state) => state.currentEmployee);
export const useIsLoadingEmployeesFromStore = () =>
  useEmployeeManagementStore((state) => state.isLoadingEmployees);
export const useIsLoadingEmployeeManagement = () =>
  useEmployeeManagementStore((state) => state.isLoadingEmployee);
export const useIsSavingEmployeeManagement = () =>
  useEmployeeManagementStore((state) => state.isSaving);
export const useEmployeeManagementError = () =>
  useEmployeeManagementStore((state) => state.error);
