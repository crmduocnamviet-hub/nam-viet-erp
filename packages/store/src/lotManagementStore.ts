import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface LotManagementState {
  // Lot data
  lots: any[];
  currentLot: any | null;
  isLoadingLots: boolean;
  isLoadingLot: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setLots: (lots: any[]) => void;
  setCurrentLot: (lot: any | null) => void;
  setLoadingLots: (isLoading: boolean) => void;
  setLoadingLot: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchProductLots: (params: { productId: number; warehouseId?: number }) => Promise<{ data: any[] | null; error: any }>;
  fetchLotById: (lotId: number) => Promise<{ data: any | null; error: any }>;
  createLot: (lotData: any) => Promise<{ data: any | null; error: any }>;
  updateLotQuantity: (params: {
    lotId: number;
    productId: number;
    warehouseId: number;
    newQuantityAvailable: number;
  }) => Promise<{ error: any }>;
  deleteLot: (params: { lotId: number; productId: number; warehouseId: number }) => Promise<{ error: any }>;
  deleteAllLots: (productId: number) => Promise<{ error: any }>;
  updateInventoryQuantity: (params: { productId: number; warehouseId: number; quantity: number }) => Promise<{ error: any }>;
  fetchLotDetailWithInventory: (lotId: number) => Promise<{
    lotDetail: any | null;
    inventory: any[];
    error: any
  }>;
  syncLotQuantityToInventory: (params: { productId: number; warehouseId: number }) => Promise<{
    totalQuantity: number;
    error: any
  }>;

  // Utility
  clearCurrentLot: () => void;
  clearError: () => void;
}

// Create store
export const useLotManagementStore = create<LotManagementState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      lots: [],
      currentLot: null,
      isLoadingLots: false,
      isLoadingLot: false,
      isSaving: false,
      error: null,

      // Simple setters
      setLots: (lots) =>
        set(
          (state) => {
            state.lots = lots;
          },
          false,
          "setLots"
        ),

      setCurrentLot: (lot) =>
        set(
          (state) => {
            state.currentLot = lot;
          },
          false,
          "setCurrentLot"
        ),

      setLoadingLots: (isLoading) =>
        set(
          (state) => {
            state.isLoadingLots = isLoading;
          },
          false,
          "setLoadingLots"
        ),

      setLoadingLot: (isLoading) =>
        set(
          (state) => {
            state.isLoadingLot = isLoading;
          },
          false,
          "setLoadingLot"
        ),

      setSaving: (isSaving) =>
        set(
          (state) => {
            state.isSaving = isSaving;
          },
          false,
          "setSaving"
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
      fetchProductLots: async (params) => {
        const { setLoadingLots, setLots, setError } = get();

        setLoadingLots(true);
        setError(null);

        try {
          const { getProductLots } = await import("@nam-viet-erp/services");
          const { data, error } = await getProductLots(params);

          if (error) {
            setError(error.message || "Failed to fetch product lots");
            setLots([]);
            return { data: null, error };
          }

          setLots(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch product lots";
          setError(errorMsg);
          setLots([]);
          return { data: null, error };
        } finally {
          setLoadingLots(false);
        }
      },

      fetchLotById: async (lotId: number) => {
        const { setLoadingLot, setCurrentLot, setError } = get();

        setLoadingLot(true);
        setError(null);

        try {
          const { getLotById } = await import("@nam-viet-erp/services");
          const { data, error } = await getLotById(lotId);

          if (error) {
            setError(error.message || "Failed to fetch lot");
            setCurrentLot(null);
            return { data: null, error };
          }

          setCurrentLot(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch lot";
          setError(errorMsg);
          setCurrentLot(null);
          return { data: null, error };
        } finally {
          setLoadingLot(false);
        }
      },

      createLot: async (lotData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createProductLotWithInventory } = await import("@nam-viet-erp/services");
          const { data, error } = await createProductLotWithInventory({
            lot_number: lotData.lot_number,
            product_id: lotData.product_id,
            warehouse_id: lotData.warehouse_id,
            batch_code: lotData.batch_code,
            expiry_date: lotData.expiry_date,
            received_date: lotData.received_date,
            quantity: lotData.quantity_available || 0,
          });

          if (error) {
            setError(error.message || "Failed to create lot");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create lot";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updateLotQuantity: async (params) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateProductLotQuantity } = await import("@nam-viet-erp/services");
          const { error } = await updateProductLotQuantity({
            lotId: params.lotId,
            productId: params.productId,
            warehouseId: params.warehouseId,
            newQuantityAvailable: params.newQuantityAvailable,
          });

          if (error) {
            setError(error.message || "Failed to update lot quantity");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update lot quantity";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      deleteLot: async (params) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteProductLot } = await import("@nam-viet-erp/services");
          const { error } = await deleteProductLot(params);

          if (error) {
            setError(error.message || "Failed to delete lot");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete lot";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      deleteAllLots: async (productId: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteAllProductLots } = await import("@nam-viet-erp/services");
          const { error } = await deleteAllProductLots(productId);

          if (error) {
            setError(error.message || "Failed to delete all lots");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete all lots";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      updateInventoryQuantity: async (params) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateInventoryQuantity } = await import("@nam-viet-erp/services");
          const { error } = await updateInventoryQuantity(params);

          if (error) {
            setError(error.message || "Failed to update inventory");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update inventory";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      fetchLotDetailWithInventory: async (lotId: number) => {
        const { setLoadingLot, setError } = get();

        setLoadingLot(true);
        setError(null);

        try {
          const { fetchLotDetailWithInventory } = await import("@nam-viet-erp/services");
          const { lotDetail, inventory, error } = await fetchLotDetailWithInventory(lotId);

          if (error) {
            setError(error.message || "Failed to fetch lot details");
            return { lotDetail: null, inventory: [], error };
          }

          return { lotDetail, inventory, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch lot details";
          setError(errorMsg);
          return { lotDetail: null, inventory: [], error };
        } finally {
          setLoadingLot(false);
        }
      },

      syncLotQuantityToInventory: async (params) => {
        const { setError } = get();

        try {
          const { syncLotQuantityToInventory } = await import("@nam-viet-erp/services");
          const { totalQuantity, error } = await syncLotQuantityToInventory(params);

          if (error) {
            setError(error.message || "Failed to sync lot quantity to inventory");
            return { totalQuantity: 0, error };
          }

          return { totalQuantity, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to sync lot quantity to inventory";
          setError(errorMsg);
          return { totalQuantity: 0, error };
        }
      },

      // Utility
      clearCurrentLot: () =>
        set(
          (state) => {
            state.currentLot = null;
          },
          false,
          "clearCurrentLot"
        ),

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
      name: "LotManagementStore",
    }
  )
);

// Selectors
export const useLots = () => useLotManagementStore((state) => state.lots);
export const useCurrentLot = () => useLotManagementStore((state) => state.currentLot);
export const useIsLoadingLots = () => useLotManagementStore((state) => state.isLoadingLots);
export const useIsLoadingLot = () => useLotManagementStore((state) => state.isLoadingLot);
export const useIsSavingLot = () => useLotManagementStore((state) => state.isSaving);
export const useLotError = () => useLotManagementStore((state) => state.error);
