import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface UserManagementState {
  // User data
  users: any[];
  currentUser: any | null;
  isLoadingUsers: boolean;
  isLoadingUser: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setUsers: (users: any[]) => void;
  setCurrentUser: (user: any | null) => void;
  setLoadingUsers: (isLoading: boolean) => void;
  setLoadingUser: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchUsers: (filters?: any) => Promise<{ data: any[] | null; error: any }>;
  fetchUserById: (userId: string) => Promise<{ data: any | null; error: any }>;
  createUserAccount: (
    userData: any,
  ) => Promise<{ data: any | null; error: any }>;
  updateUserAccount: (
    userId: string,
    updates: any,
  ) => Promise<{ data: any | null; error: any }>;
  deleteUserAccount: (userId: string) => Promise<{ error: any }>;
  searchUsersForLinking: (
    searchTerm: string,
  ) => Promise<{ data: any[] | null; error: any }>;

  // Utility
  clearCurrentUser: () => void;
  clearError: () => void;
}

// Create store
export const useUserManagementStore = create<UserManagementState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      users: [],
      currentUser: null,
      isLoadingUsers: false,
      isLoadingUser: false,
      isSaving: false,
      error: null,

      // Simple setters
      setUsers: (users) =>
        set(
          (state) => {
            state.users = users;
          },
          false,
          "setUsers",
        ),

      setCurrentUser: (user) =>
        set(
          (state) => {
            state.currentUser = user;
          },
          false,
          "setCurrentUser",
        ),

      setLoadingUsers: (isLoading) =>
        set(
          (state) => {
            state.isLoadingUsers = isLoading;
          },
          false,
          "setLoadingUsers",
        ),

      setLoadingUser: (isLoading) =>
        set(
          (state) => {
            state.isLoadingUser = isLoading;
          },
          false,
          "setLoadingUser",
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
      fetchUsers: async (filters?: any) => {
        const { setLoadingUsers, setUsers, setError } = get();

        setLoadingUsers(true);
        setError(null);

        try {
          const { getUsers } = await import("@nam-viet-erp/services");
          const { data, error } = await getUsers(filters);

          if (error) {
            setError(error.message || "Failed to fetch users");
            setUsers([]);
            return { data: null, error };
          }

          setUsers(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch users";
          setError(errorMsg);
          setUsers([]);
          return { data: null, error };
        } finally {
          setLoadingUsers(false);
        }
      },

      fetchUserById: async (userId: string) => {
        const { setLoadingUser, setCurrentUser, setError } = get();

        setLoadingUser(true);
        setError(null);

        try {
          const { getUserById } = await import("@nam-viet-erp/services");
          const { data, error } = await getUserById(userId);

          if (error) {
            setError(error.message || "Failed to fetch user");
            setCurrentUser(null);
            return { data: null, error };
          }

          setCurrentUser(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch user";
          setError(errorMsg);
          setCurrentUser(null);
          return { data: null, error };
        } finally {
          setLoadingUser(false);
        }
      },

      createUserAccount: async (userData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createUserAccount } = await import("@nam-viet-erp/services");
          const { data, error } = await createUserAccount(userData);

          if (error) {
            setError(error.message || "Failed to create user account");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create user account";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updateUserAccount: async (userId: string, updates: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateUserAccount } = await import("@nam-viet-erp/services");
          const { data, error } = await updateUserAccount(userId, updates);

          if (error) {
            setError(error.message || "Failed to update user account");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update user account";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deleteUserAccount: async (userId: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteUserAccount } = await import("@nam-viet-erp/services");
          const { error } = await deleteUserAccount(userId);

          if (error) {
            setError(error.message || "Failed to delete user account");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete user account";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      searchUsersForLinking: async (searchTerm: string) => {
        const { setError } = get();

        setError(null);

        try {
          const { searchUsersForLinking } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await searchUsersForLinking(searchTerm);

          if (error) {
            setError(error.message || "Failed to search users");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to search users";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      // Utility
      clearCurrentUser: () =>
        set(
          (state) => {
            state.currentUser = null;
          },
          false,
          "clearCurrentUser",
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
      name: "UserManagementStore",
    },
  ),
);

// Selectors - Use these to access store state directly (without fetching)
// For fetching data, use hooks from useUserManagement.ts instead
// Note: useUser() from authStore is for current logged-in user
export const useUsersFromStore = () =>
  useUserManagementStore((state) => state.users);
export const useCurrentUserManagement = () =>
  useUserManagementStore((state) => state.currentUser);
export const useIsLoadingUsersFromStore = () =>
  useUserManagementStore((state) => state.isLoadingUsers);
export const useIsLoadingUserManagement = () =>
  useUserManagementStore((state) => state.isLoadingUser);
export const useIsSavingUserManagement = () =>
  useUserManagementStore((state) => state.isSaving);
export const useUserManagementError = () =>
  useUserManagementStore((state) => state.error);
