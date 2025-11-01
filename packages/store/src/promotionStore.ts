import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface PromotionState {
  // Promotion data
  promotions: any[];
  currentPromotion: any | null;
  vouchers: any[];
  activePromotions: any[];
  promoCodes: any[];
  filterOptions: { categories: any[]; manufacturers: any[] } | null;
  isLoadingPromotions: boolean;
  isLoadingPromotion: boolean;
  isLoadingVouchers: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  setPromotions: (promotions: any[]) => void;
  setCurrentPromotion: (promotion: any | null) => void;
  setVouchers: (vouchers: any[]) => void;
  setActivePromotions: (promotions: any[]) => void;
  setPromoCodes: (codes: any[]) => void;
  setFilterOptions: (options: {
    categories: any[];
    manufacturers: any[];
  }) => void;
  setLoadingPromotions: (isLoading: boolean) => void;
  setLoadingPromotion: (isLoading: boolean) => void;
  setLoadingVouchers: (isLoading: boolean) => void;
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions
  fetchPromotions: () => Promise<{ data: any[] | null; error: any }>;
  fetchPromotionById: (id: string) => Promise<{ data: any | null; error: any }>;
  createPromotion: (
    promotionData: any,
  ) => Promise<{ data: any | null; error: any }>;
  updatePromotion: (
    id: string,
    promotionData: any,
  ) => Promise<{ data: any | null; error: any }>;
  deletePromotion: (id: number) => Promise<{ error: any }>;
  fetchVouchers: (
    promoId: string,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchVouchersWithPromotion: () => Promise<{ data: any[] | null; error: any }>;
  createVoucher: (voucherData: any) => Promise<{ error: any }>;
  updateVoucher: (
    id: number,
    voucherData: any,
  ) => Promise<{ data: any | null; error: any }>;
  deleteVoucher: (id: number) => Promise<{ error: any }>;
  fetchActivePromotions: () => Promise<{ data: any[] | null; error: any }>;
  fetchPromoCodes: () => Promise<{ data: any[] | null; error: any }>;
  validatePromoCode: (
    promoCode: string,
  ) => Promise<{ data: any | null; error: any }>;
  applyPromoCode: (
    promoCode: string,
    orderValue: number,
    items?: any[],
  ) => Promise<{
    discountAmount: number;
    promoCode: string | null;
    promoName: string | null;
    error: any;
  }>;
  fetchFilterOptions: () => Promise<{
    data: { categories: any[]; manufacturers: any[] } | null;
    error: any;
  }>;

  // Utility
  clearCurrentPromotion: () => void;
  clearError: () => void;
}

// Create store
export const usePromotionStore = create<PromotionState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      promotions: [],
      currentPromotion: null,
      vouchers: [],
      activePromotions: [],
      promoCodes: [],
      filterOptions: null,
      isLoadingPromotions: false,
      isLoadingPromotion: false,
      isLoadingVouchers: false,
      isSaving: false,
      error: null,

      // Simple setters
      setPromotions: (promotions) =>
        set(
          (state) => {
            state.promotions = promotions;
          },
          false,
          "setPromotions",
        ),

      setCurrentPromotion: (promotion) =>
        set(
          (state) => {
            state.currentPromotion = promotion;
          },
          false,
          "setCurrentPromotion",
        ),

      setVouchers: (vouchers) =>
        set(
          (state) => {
            state.vouchers = vouchers;
          },
          false,
          "setVouchers",
        ),

      setActivePromotions: (promotions) =>
        set(
          (state) => {
            state.activePromotions = promotions;
          },
          false,
          "setActivePromotions",
        ),

      setPromoCodes: (codes) =>
        set(
          (state) => {
            state.promoCodes = codes;
          },
          false,
          "setPromoCodes",
        ),

      setFilterOptions: (options) =>
        set(
          (state) => {
            state.filterOptions = options;
          },
          false,
          "setFilterOptions",
        ),

      setLoadingPromotions: (isLoading) =>
        set(
          (state) => {
            state.isLoadingPromotions = isLoading;
          },
          false,
          "setLoadingPromotions",
        ),

      setLoadingPromotion: (isLoading) =>
        set(
          (state) => {
            state.isLoadingPromotion = isLoading;
          },
          false,
          "setLoadingPromotion",
        ),

      setLoadingVouchers: (isLoading) =>
        set(
          (state) => {
            state.isLoadingVouchers = isLoading;
          },
          false,
          "setLoadingVouchers",
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
      fetchPromotions: async () => {
        const { setLoadingPromotions, setPromotions, setError } = get();

        setLoadingPromotions(true);
        setError(null);

        try {
          const { getPromotions } = await import("@nam-viet-erp/services");
          const { data, error } = await getPromotions();

          if (error) {
            setError(error.message || "Failed to fetch promotions");
            setPromotions([]);
            return { data: null, error };
          }

          setPromotions(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch promotions";
          setError(errorMsg);
          setPromotions([]);
          return { data: null, error };
        } finally {
          setLoadingPromotions(false);
        }
      },

      fetchPromotionById: async (id: string) => {
        const { setLoadingPromotion, setCurrentPromotion, setError } = get();

        setLoadingPromotion(true);
        setError(null);

        try {
          const { getPromotionDetail } = await import("@nam-viet-erp/services");
          const data = await getPromotionDetail(id);

          setCurrentPromotion(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch promotion";
          setError(errorMsg);
          setCurrentPromotion(null);
          return { data: null, error };
        } finally {
          setLoadingPromotion(false);
        }
      },

      createPromotion: async (promotionData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createPromotion } = await import("@nam-viet-erp/services");
          const { data, error } = await createPromotion(promotionData);

          if (error) {
            setError(error.message || "Failed to create promotion");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create promotion";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updatePromotion: async (id: string, promotionData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updatePromotion } = await import("@nam-viet-erp/services");
          const { error } = await updatePromotion(id, promotionData);

          if (error) {
            setError(error.message || "Failed to update promotion");
            return { data: null, error };
          }

          return { data: null, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update promotion";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deletePromotion: async (id: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deletePromotion } = await import("@nam-viet-erp/services");
          const { error } = await deletePromotion(id);

          if (error) {
            setError(error.message || "Failed to delete promotion");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete promotion";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      fetchVouchers: async (promoId: string) => {
        const { setLoadingVouchers, setVouchers, setError } = get();

        setLoadingVouchers(true);
        setError(null);

        try {
          const { getVouchers } = await import("@nam-viet-erp/services");
          const data = await getVouchers(promoId);

          setVouchers(data || []);
          return { data: data || [], error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch vouchers";
          setError(errorMsg);
          setVouchers([]);
          return { data: null, error };
        } finally {
          setLoadingVouchers(false);
        }
      },

      fetchVouchersWithPromotion: async () => {
        const { setLoadingVouchers, setVouchers, setError } = get();

        setLoadingVouchers(true);
        setError(null);

        try {
          const { getVouchersWithPromotion } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getVouchersWithPromotion();

          if (error) {
            setError(error.message || "Failed to fetch vouchers");
            setVouchers([]);
            return { data: null, error };
          }

          setVouchers(data || []);
          return { data: data || [], error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch vouchers";
          setError(errorMsg);
          setVouchers([]);
          return { data: null, error };
        } finally {
          setLoadingVouchers(false);
        }
      },

      createVoucher: async (voucherData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createVoucher } = await import("@nam-viet-erp/services");
          const { error } = await createVoucher(voucherData);

          if (error) {
            setError(error.message || "Failed to create voucher");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create voucher";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      updateVoucher: async (id: number, voucherData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateVoucher } = await import("@nam-viet-erp/services");
          const { data, error } = await updateVoucher(id, voucherData);

          if (error) {
            setError(error.message || "Failed to update voucher");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update voucher";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deleteVoucher: async (id: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteVoucher } = await import("@nam-viet-erp/services");
          const { error } = await deleteVoucher(id);

          if (error) {
            setError(error.message || "Failed to delete voucher");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete voucher";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      fetchActivePromotions: async () => {
        const { setActivePromotions, setError } = get();

        setError(null);

        try {
          const { getActivePromotions } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getActivePromotions();

          if (error) {
            setError(error.message || "Failed to fetch active promotions");
            setActivePromotions([]);
            return { data: null, error };
          }

          setActivePromotions(data || []);
          return { data: data || [], error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch active promotions";
          setError(errorMsg);
          setActivePromotions([]);
          return { data: null, error };
        }
      },

      fetchPromoCodes: async () => {
        const { setPromoCodes, setError } = get();

        setError(null);

        try {
          const { getPromoCodes } = await import("@nam-viet-erp/services");
          const { data, error } = await getPromoCodes();

          if (error) {
            setError(error.message || "Failed to fetch promo codes");
            setPromoCodes([]);
            return { data: null, error };
          }

          setPromoCodes(data || []);
          return { data: data || [], error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch promo codes";
          setError(errorMsg);
          setPromoCodes([]);
          return { data: null, error };
        }
      },

      validatePromoCode: async (promoCode: string) => {
        const { setError } = get();

        setError(null);

        try {
          const { validatePromoCode } = await import("@nam-viet-erp/services");
          const result = await validatePromoCode(promoCode);

          if (result.error) {
            return { data: null, error: result.error };
          }

          return result;
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to validate promo code";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      applyPromoCode: async (
        promoCode: string,
        orderValue: number,
        items?: any[],
      ) => {
        const { setError } = get();

        setError(null);

        try {
          const { applyPromoCode } = await import("@nam-viet-erp/services");
          const result = await applyPromoCode(promoCode, orderValue, items);

          if (result.error) {
            setError(result.error.message || "Failed to apply promo code");
          }

          return result;
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to apply promo code";
          setError(errorMsg);
          return {
            discountAmount: 0,
            promoCode: null,
            promoName: null,
            error,
          };
        }
      },

      fetchFilterOptions: async () => {
        const { setFilterOptions, setError } = get();

        setError(null);

        try {
          const { getPromotionFilterOptions } = await import(
            "@nam-viet-erp/services"
          );
          const data = await getPromotionFilterOptions();

          setFilterOptions(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch filter options";
          setError(errorMsg);
          setFilterOptions(null);
          return { data: null, error };
        }
      },

      // Utility
      clearCurrentPromotion: () =>
        set(
          (state) => {
            state.currentPromotion = null;
          },
          false,
          "clearCurrentPromotion",
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
      name: "PromotionStore",
    },
  ),
);

// Selectors
export const usePromotions = () =>
  usePromotionStore((state) => state.promotions);
export const useCurrentPromotion = () =>
  usePromotionStore((state) => state.currentPromotion);
export const useVouchers = () => usePromotionStore((state) => state.vouchers);
export const useActivePromotions = () =>
  usePromotionStore((state) => state.activePromotions);
export const usePromoCodes = () =>
  usePromotionStore((state) => state.promoCodes);
export const usePromotionFilterOptions = () =>
  usePromotionStore((state) => state.filterOptions);
export const useIsLoadingPromotions = () =>
  usePromotionStore((state) => state.isLoadingPromotions);
export const useIsLoadingPromotion = () =>
  usePromotionStore((state) => state.isLoadingPromotion);
export const useIsLoadingVouchers = () =>
  usePromotionStore((state) => state.isLoadingVouchers);
export const useIsSavingPromotion = () =>
  usePromotionStore((state) => state.isSaving);
export const usePromotionError = () =>
  usePromotionStore((state) => state.error);
