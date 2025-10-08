import { useEffect } from "react";
import { useInventoryStore } from "../inventoryStore";
import { useEmployeeStore } from "../employeeStore";

/**
 * Hook to initialize inventory data on app mount
 * This hook automatically fetches inventory for the employee's assigned warehouse
 * if the employee has inventory permissions
 *
 * @example
 * ```tsx
 * import { useInitializeInventory } from '@nam-viet-erp/store';
 *
 * function App() {
 *   useInitializeInventory();
 *   return <YourApp />;
 * }
 * ```
 */
export function useInitializeInventory() {
  const employee = useEmployeeStore((state) => state.employee);
  const hasPermission = useEmployeeStore((state) => state.hasPermission);
  const fetchInventory = useInventoryStore((state) => state.fetchInventory);
  const setError = useInventoryStore((state) => state.setError);

  useEffect(() => {
    // Only fetch if employee data is loaded
    if (!employee?.warehouse_id) {
      console.log("[useInitializeInventory] No warehouse assigned to employee");
      return;
    }

    // Check if employee has inventory permissions
    const hasInventoryPermission =
      hasPermission("inventory.read") ||
      hasPermission("inventory.view") ||
      hasPermission("products.view");

    if (!hasInventoryPermission) {
      console.log(
        "[useInitializeInventory] Employee does not have inventory permissions"
      );
      return;
    }

    const initializeInventory = async () => {
      try {
        console.log(
          `[useInitializeInventory] Fetching inventory for warehouse ${employee.warehouse_id}`
        );

        await fetchInventory(employee.warehouse_id);
      } catch (error: any) {
        console.error(
          "[useInitializeInventory] Error fetching inventory:",
          error
        );
        setError(error.message || "Failed to fetch inventory");
      }
    };

    initializeInventory();
  }, [employee?.warehouse_id, hasPermission, fetchInventory, setError]);
}

/**
 * Hook to refresh inventory data
 * Useful for manual refresh operations
 *
 * @example
 * ```tsx
 * import { useRefreshInventory } from '@nam-viet-erp/store';
 *
 * function InventoryPage() {
 *   const { refreshInventory, isLoading } = useRefreshInventory();
 *
 *   return (
 *     <div>
 *       <button onClick={refreshInventory} disabled={isLoading}>
 *         Refresh Inventory
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRefreshInventory() {
  const refreshInventory = useInventoryStore((state) => state.refreshInventory);
  const isLoading = useInventoryStore((state) => state.isLoadingInventory);

  return {
    refreshInventory,
    isLoading,
  };
}
