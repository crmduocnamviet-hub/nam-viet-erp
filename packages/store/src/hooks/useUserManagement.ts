import { useQuery } from "..";
import { FETCH_QUERY_KEY } from "../constants";
import { getUsers, getUserById } from "@nam-viet-erp/services";
import useSubmitQuery from "./useSubmitQuery";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";
import useFetchStore from "../fetchStore";
import { getQueryKey } from "./useQuery";
import { useUserManagementStore } from "../userManagementStore";

// Hook to fetch all users
export const useUsers = (filters?: any) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.USERS, filters],
    queryFn: async () => {
      const { data } = await getUsers(filters);
      if (data) {
        useUserManagementStore.getState().setUsers(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch single user by ID (for management purposes)
// Note: useUser() from authStore is for current logged-in user
export const useUserById = (userId: string) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.USER, userId],
    queryFn: async () => {
      const { data } = await getUserById(userId);
      if (data) {
        useUserManagementStore.getState().setCurrentUser(data);
      }
      return data;
    },
  });
};

// Hook to create user account
export const useCreateUser = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.USERS])]?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_USER],
    onSubmit: async (userData: any) => {
      const result = await useUserManagementStore
        .getState()
        .createUserAccount(userData);
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

  return { createUser: submit, isLoading };
};

// Hook to update user account
export const useUpdateUser = ({
  userId,
  onSuccess,
  onError,
}: {
  userId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.USERS])]?.fetch ?? null,
  );
  const refetchUser = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.USER, userId])]?.fetch ??
      null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_USER, userId],
    onSubmit: async (updates: any) => {
      const result = await useUserManagementStore
        .getState()
        .updateUserAccount(userId, updates);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetch?.();
      refetchUser?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { updateUser: submit, isLoading };
};

// Hook to delete user account
export const useDeleteUser = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.USERS])]?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_USER],
    onSubmit: async (userId: string) => {
      const result = await useUserManagementStore
        .getState()
        .deleteUserAccount(userId);
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

  return { deleteUser: submit, isLoading };
};
