import {
  default as _useQuery,
  setQueryData as _setQueryData,
  getQueryData as _getQueryData,
} from "./hooks/useQuery";

import { default as _useSubmitQuery } from "./hooks/useSubmitQuery";

// Export all stores
export * from "./authStore";
export * from "./employeeStore";
export * from "./uiStore";
export * from "./b2bOrderStore";
export * from "./posStore";
export * from "./comboStore";
export * from "./inventoryStore";
export * from "./productStore";
export * from "./warehouseStore";
export * from "./lotManagementStore";
export * from "./fetchStore";
export * from "./fetchSubmitStore";
export * from "./entityStore"; // New normalized entity store

export { FETCH_QUERY_KEY } from "./constants";

// Export services
export * from "./services/employeeService";

// Export hooks
export * from "./hooks/useInitializeEmployee";
export * from "./hooks/useInitializeB2BOrder";
export * from "./hooks/useInitializeInventory";
export * from "./hooks/useInventory";
export * from "./hooks/useProductLot";
export * from "./hooks/useProduct";
export * from "./hooks/useB2BOrder";

export const useQuery = _useQuery;
export const setQueryData = _setQueryData;
export const getQueryData = _getQueryData;
export const useSubmitQuery = _useSubmitQuery;

// Re-export zustand for convenience
export { create } from "zustand";
export { devtools, persist, subscribeWithSelector } from "zustand/middleware";
export { immer } from "zustand/middleware/immer";
