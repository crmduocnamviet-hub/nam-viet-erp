import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface InventoryState {
  // Inventory data
  inventory: IInventoryWithProduct[];
  isLoadingInventory: boolean;
  error: string | null;
  warehouseId: number | null;

  // Actions
  setInventory: (inventory: IInventoryWithProduct[]) => void;
  setLoadingInventory: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setWarehouseId: (warehouseId: number | null) => void;
  fetchInventory: (warehouseId: number) => Promise<void>;
  refreshInventory: () => Promise<void>;
  clearInventory: () => void;
  updateInventoryQuantities: (updates: {
    productId: number;
    quantityChange: number;
  }[]) => void;
}

// Create store
export const useInventoryStore = create<InventoryState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        inventory: [],
        isLoadingInventory: false,
        error: null,
        warehouseId: null,

        // Actions
        setInventory: (inventory) =>
          set(
            (state) => {
              state.inventory = inventory;
            },
            false,
            "setInventory"
          ),

        setLoadingInventory: (isLoading) =>
          set(
            (state) => {
              state.isLoadingInventory = isLoading;
            },
            false,
            "setLoadingInventory"
          ),

        setError: (error) =>
          set(
            (state) => {
              state.error = error;
            },
            false,
            "setError"
          ),

        setWarehouseId: (warehouseId) =>
          set(
            (state) => {
              state.warehouseId = warehouseId;
            },
            false,
            "setWarehouseId"
          ),

        fetchInventory: async (warehouseId: number) => {
          const state = get();
          const {
            setLoadingInventory,
            setInventory,
            setError,
            setWarehouseId,
          } = get();

          // Prevent duplicate requests if already loading
          if (state.isLoadingInventory) {
            console.log(
              "[fetchInventory] Request already in progress, skipping..."
            );
            return;
          }

          setLoadingInventory(true);
          setError(null);
          setWarehouseId(warehouseId);

          try {
            // Import dynamically to avoid circular dependencies
            const { getInventoryByWarehouse } = await import(
              "@nam-viet-erp/services"
            );
            const { data: inventory, error } = await getInventoryByWarehouse(
              warehouseId
            );

            if (error) {
              console.error("Error fetching inventory:", error);
              setError(error.message || "Failed to fetch inventory");
              setInventory([]);
            } else {
              setInventory(inventory || []);
            }
          } catch (error: any) {
            console.error("Error fetching inventory:", error);
            setError(error?.message || "Failed to fetch inventory");
            setInventory([]);
          } finally {
            setLoadingInventory(false);
          }
        },

        refreshInventory: async () => {
          const state = get();

          // Prevent duplicate requests if already loading
          if (state.isLoadingInventory) {
            console.log(
              "[refreshInventory] Request already in progress, skipping..."
            );
            return;
          }

          const { warehouseId, setLoadingInventory, setInventory, setError } =
            get();

          if (!warehouseId) {
            console.log("[refreshInventory] No warehouse ID set, skipping...");
            return;
          }

          setLoadingInventory(true);
          setError(null);

          try {
            // Import dynamically to avoid circular dependencies
            const { getInventoryByWarehouse } = await import(
              "@nam-viet-erp/services"
            );
            const { data: inventory, error } = await getInventoryByWarehouse(
              warehouseId
            );

            if (error) {
              console.error("Error refreshing inventory:", error);
              setError(error.message || "Failed to refresh inventory");
            } else {
              setInventory(inventory || []);
            }
          } catch (error: any) {
            console.error("Error refreshing inventory:", error);
            setError(error?.message || "Failed to refresh inventory");
          } finally {
            setLoadingInventory(false);
          }
        },

        clearInventory: () =>
          set(
            (state) => {
              state.inventory = [];
              state.warehouseId = null;
              state.error = null;
            },
            false,
            "clearInventory"
          ),

        updateInventoryQuantities: (updates) =>
          set(
            (state) => {
              updates.forEach(({ productId, quantityChange }) => {
                const inventoryItem = state.inventory.find(
                  (item) => item.products?.id === productId
                );
                if (inventoryItem) {
                  inventoryItem.quantity =
                    (inventoryItem.quantity || 0) + quantityChange;
                }
              });
            },
            false,
            "updateInventoryQuantities"
          ),
      })),
      {
        name: "inventory-storage",
        // Only persist inventory and warehouseId, not loading/error states
        partialize: (state) => ({
          inventory: state.inventory,
          warehouseId: state.warehouseId,
        }),
      }
    ),
    {
      name: "InventoryStore",
    }
  )
);

// Selectors
export const useInventory = () => useInventoryStore((state) => state.inventory);
export const useIsLoadingInventory = () =>
  useInventoryStore((state) => state.isLoadingInventory);
export const useInventoryError = () =>
  useInventoryStore((state) => state.error);
export const useInventoryWarehouseId = () =>
  useInventoryStore((state) => state.warehouseId);
