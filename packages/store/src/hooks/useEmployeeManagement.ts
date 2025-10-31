import { useQuery } from "..";
import { FETCH_QUERY_KEY } from "../constants";
import { getEmployees, getEmployeeById } from "@nam-viet-erp/services";
import useSubmitQuery from "./useSubmitQuery";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";
import useFetchStore from "../fetchStore";
import { getQueryKey } from "./useQuery";
import { useEmployeeManagementStore } from "../employeeManagementStore";

// Hook to fetch all employees
export const useEmployees = (filters?: any) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.EMPLOYEES, filters],
    queryFn: async () => {
      const { data } = await getEmployees(filters);
      if (data) {
        useEmployeeManagementStore.getState().setEmployees(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch single employee by ID (for management purposes)
// Note: useEmployee() from employeeStore is for current logged-in employee
export const useEmployeeById = (employeeId: string) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.EMPLOYEE, employeeId],
    queryFn: async () => {
      const { data } = await getEmployeeById(employeeId);
      if (data) {
        useEmployeeManagementStore.getState().setCurrentEmployee(data);
      }
      return data;
    },
  });
};

// Hook to create employee
export const useCreateEmployee = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.EMPLOYEES])]?.fetch ??
      null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_EMPLOYEE],
    onSubmit: async (employeeData: any) => {
      const result = await useEmployeeManagementStore
        .getState()
        .createEmployee(employeeData);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetch?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { createEmployee: submit, isLoading };
};

// Hook to update employee
export const useUpdateEmployee = ({
  employeeId,
  onSuccess,
  onError,
}: {
  employeeId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.EMPLOYEES])]?.fetch ??
      null,
  );
  const refetchEmployee = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.EMPLOYEE, employeeId])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_EMPLOYEE, employeeId],
    onSubmit: async (updates: any) => {
      const result = await useEmployeeManagementStore
        .getState()
        .updateEmployee(employeeId, updates);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetch?.();
      refetchEmployee?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { updateEmployee: submit, isLoading };
};

// Hook to delete employee
export const useDeleteEmployee = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.EMPLOYEES])]?.fetch ??
      null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_EMPLOYEE],
    onSubmit: async (employeeId: string) => {
      const result = await useEmployeeManagementStore
        .getState()
        .deleteEmployee(employeeId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      refetch?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { deleteEmployee: submit, isLoading };
};
