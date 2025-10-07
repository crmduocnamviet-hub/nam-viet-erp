import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface WarehouseState {
  // Warehouse data
  warehouses: any[];
  isLoadingWarehouses: boolean;
  error: string | null;

  // Actions
  setWarehouses: (warehouses: any[]) => void;
  setLoadingWarehouses: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchWarehouses: () => Promise<{ data: any[] | null; error: any }>;

  // Utility
  clearError: () => void;
}

// Create store
export const useWarehouseStore = create<WarehouseState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      warehouses: [],
      isLoadingWarehouses: false,
      error: null,

      // Simple setters
      setWarehouses: (warehouses) =>
        set(
          (state) => {
            state.warehouses = warehouses;
          },
          false,
          "setWarehouses"
        ),

      setLoadingWarehouses: (isLoading) =>
        set(
          (state) => {
            state.isLoadingWarehouses = isLoading;
          },
          false,
          "setLoadingWarehouses"
        ),

      setError: (error) =>
        set(
          (state) => {
            state.error = error;
          },
          false,
          "setError"
        ),

      // API Actions
      fetchWarehouses: async () => {
        const { setLoadingWarehouses, setWarehouses, setError } = get();

        setLoadingWarehouses(true);
        setError(null);

        try {
          const { getWarehouse } = await import("@nam-viet-erp/services");
          const { data, error } = await getWarehouse();

          if (error) {
            setError(error.message || "Failed to fetch warehouses");
            setWarehouses([]);
            return { data: null, error };
          }

          setWarehouses(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch warehouses";
          setError(errorMsg);
          setWarehouses([]);
          return { data: null, error };
        } finally {
          setLoadingWarehouses(false);
        }
      },

      // Utility
      clearError: () =>
        set(
          (state) => {
            state.error = null;
          },
          false,
          "clearError"
        ),
    })),
    {
      name: "WarehouseStore",
    }
  )
);

// Selectors
export const useWarehouses = () => useWarehouseStore((state) => state.warehouses);
export const useIsLoadingWarehouses = () => useWarehouseStore((state) => state.isLoadingWarehouses);
export const useWarehouseError = () => useWarehouseStore((state) => state.error);
