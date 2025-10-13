import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface PurchaseOrderState {
  // Purchase order data
  purchaseOrders: any[];
  suppliers: any[];
  products: any[];
  b2bWarehouse: any | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setPurchaseOrders: (orders: any[]) => void;
  setSuppliers: (suppliers: any[]) => void;
  setProducts: (products: any[]) => void;
  setB2bWarehouse: (warehouse: any | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchPurchaseOrders: (filters?: {
    status?: string | string[];
    supplierId?: number;
    startDate?: string;
    endDate?: string;
  }) => Promise<{ data: any[] | null; error: any }>;

  fetchSuppliers: () => Promise<{ data: any[] | null; error: any }>;
  fetchProducts: () => Promise<{ data: any[] | null; error: any }>;
  fetchB2bWarehouse: () => Promise<{ data: any | null; error: any }>;

  receivePurchaseOrderItems: (
    poId: number,
    items: Array<{
      itemId: number;
      quantityToReceive: number;
      lotNumber?: string;
      expirationDate?: string;
      shelfLocation?: string;
    }>,
    receivedBy: string | null,
  ) => Promise<{ success: boolean; error: any }>;

  createDirectPurchaseImport: (
    order: any,
    items: Array<{
      product_id: number;
      quantity: number;
      lot_number?: string;
      expiration_date?: string;
      shelf_location?: string;
    }>,
    warehouseId: number,
  ) => Promise<{ success: boolean; data?: any; error: any }>;

  // Utility
  clearError: () => void;
}

// Create store
export const usePurchaseOrderStore = create<PurchaseOrderState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      purchaseOrders: [],
      suppliers: [],
      products: [],
      b2bWarehouse: null,
      isLoading: false,
      error: null,

      // Simple setters
      setPurchaseOrders: (orders) =>
        set(
          (state) => {
            state.purchaseOrders = orders;
          },
          false,
          "setPurchaseOrders",
        ),

      setSuppliers: (suppliers) =>
        set(
          (state) => {
            state.suppliers = suppliers;
          },
          false,
          "setSuppliers",
        ),

      setProducts: (products) =>
        set(
          (state) => {
            state.products = products;
          },
          false,
          "setProducts",
        ),

      setB2bWarehouse: (warehouse) =>
        set(
          (state) => {
            state.b2bWarehouse = warehouse;
          },
          false,
          "setB2bWarehouse",
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

      // API Actions
      fetchPurchaseOrders: async (filters) => {
        const { setLoading, setPurchaseOrders, setError } = get();

        setLoading(true);
        setError(null);

        try {
          const { getPurchaseOrders } = await import("@nam-viet-erp/services");
          const { data, error } = await getPurchaseOrders(filters);

          if (error) {
            setError(error.message || "Failed to fetch purchase orders");
            setPurchaseOrders([]);
            return { data: null, error };
          }

          setPurchaseOrders(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch purchase orders";
          setError(errorMsg);
          setPurchaseOrders([]);
          return { data: null, error };
        } finally {
          setLoading(false);
        }
      },

      fetchSuppliers: async () => {
        const { setLoading, setSuppliers, setError } = get();

        setLoading(true);
        setError(null);

        try {
          const { supabase } = await import(
            "@nam-viet-erp/services/src/supabase"
          );
          const { data, error } = await supabase
            .from("suppliers")
            .select("*")
            .order("name");

          if (error) {
            setError(error.message || "Failed to fetch suppliers");
            setSuppliers([]);
            return { data: null, error };
          }

          setSuppliers(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch suppliers";
          setError(errorMsg);
          setSuppliers([]);
          return { data: null, error };
        } finally {
          setLoading(false);
        }
      },

      fetchProducts: async () => {
        const { setLoading, setProducts, setError } = get();

        setLoading(true);
        setError(null);

        try {
          const { supabase } = await import(
            "@nam-viet-erp/services/src/supabase"
          );
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("name");

          if (error) {
            setError(error.message || "Failed to fetch products");
            setProducts([]);
            return { data: null, error };
          }

          setProducts(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch products";
          setError(errorMsg);
          setProducts([]);
          return { data: null, error };
        } finally {
          setLoading(false);
        }
      },

      fetchB2bWarehouse: async () => {
        const { setLoading, setB2bWarehouse, setError } = get();

        setLoading(true);
        setError(null);

        try {
          const { supabase } = await import(
            "@nam-viet-erp/services/src/supabase"
          );

          // Try to find B2B warehouse
          const { data: warehouseData, error: warehouseError } = await supabase
            .from("warehouses")
            .select("*")
            .ilike("name", "%b2b%")
            .single();

          if (warehouseData) {
            setB2bWarehouse(warehouseData);
            return { data: warehouseData, error: null };
          }

          // Fallback: get first warehouse if B2B not found
          if (warehouseError) {
            const { data: firstWarehouse, error: firstError } = await supabase
              .from("warehouses")
              .select("*")
              .limit(1)
              .single();

            if (firstError) {
              setError(firstError.message || "Failed to fetch warehouse");
              setB2bWarehouse(null);
              return { data: null, error: firstError };
            }

            setB2bWarehouse(firstWarehouse);
            return { data: firstWarehouse, error: null };
          }

          return { data: null, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch B2B warehouse";
          setError(errorMsg);
          setB2bWarehouse(null);
          return { data: null, error };
        } finally {
          setLoading(false);
        }
      },

      receivePurchaseOrderItems: async (poId, items, receivedBy) => {
        const { setLoading, setError } = get();

        setLoading(true);
        setError(null);

        try {
          const { receivePurchaseOrderItems } = await import(
            "@nam-viet-erp/services"
          );
          const result = await receivePurchaseOrderItems(
            poId,
            items,
            receivedBy,
          );

          return { success: result.success, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to receive purchase order items";
          setError(errorMsg);
          return { success: false, error };
        } finally {
          setLoading(false);
        }
      },

      createDirectPurchaseImport: async (order, items, warehouseId) => {
        const { setLoading, setError } = get();

        setLoading(true);
        setError(null);

        try {
          const { createDirectPurchaseImport } = await import(
            "@nam-viet-erp/services"
          );
          const result = await createDirectPurchaseImport(
            order,
            items,
            warehouseId,
          );

          return { success: result.success, data: result, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to create direct purchase import";
          setError(errorMsg);
          return { success: false, error };
        } finally {
          setLoading(false);
        }
      },

      // Utility
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
      name: "PurchaseOrderStore",
    },
  ),
);

// Selectors
export const usePurchaseOrders = () =>
  usePurchaseOrderStore((state) => state.purchaseOrders);
export const useSuppliers = () =>
  usePurchaseOrderStore((state) => state.suppliers);
export const useProducts = () =>
  usePurchaseOrderStore((state) => state.products);
export const useB2bWarehouse = () =>
  usePurchaseOrderStore((state) => state.b2bWarehouse);
export const useIsPurchaseOrderLoading = () =>
  usePurchaseOrderStore((state) => state.isLoading);
export const usePurchaseOrderError = () =>
  usePurchaseOrderStore((state) => state.error);
