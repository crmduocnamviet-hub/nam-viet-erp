import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// State interface
export interface VATInvoiceState {
  // VAT Invoice In data
  vatInvoicesIn: any[];
  currentVATInvoiceIn: any | null;
  isLoadingVATInvoicesIn: boolean;
  isLoadingVATInvoiceIn: boolean;

  // VAT Invoice Out data
  vatInvoicesOut: any[];
  currentVATInvoiceOut: any | null;
  isLoadingVATInvoicesOut: boolean;
  isLoadingVATInvoiceOut: boolean;

  // VAT Inventory Summary
  vatInventorySummary: any[];
  isLoadingVATSummary: boolean;

  // Common state
  isSaving: boolean;
  error: string | null;

  // Actions - Invoice In
  setVATInvoicesIn: (invoices: any[]) => void;
  setCurrentVATInvoiceIn: (invoice: any | null) => void;
  setLoadingVATInvoicesIn: (isLoading: boolean) => void;
  setLoadingVATInvoiceIn: (isLoading: boolean) => void;

  // Actions - Invoice Out
  setVATInvoicesOut: (invoices: any[]) => void;
  setCurrentVATInvoiceOut: (invoice: any | null) => void;
  setLoadingVATInvoicesOut: (isLoading: boolean) => void;
  setLoadingVATInvoiceOut: (isLoading: boolean) => void;

  // Actions - Summary
  setVATInventorySummary: (summary: any[]) => void;
  setLoadingVATSummary: (isLoading: boolean) => void;

  // Common Actions
  setSaving: (isSaving: boolean) => void;
  setError: (error: string | null) => void;

  // API Actions - Invoice In
  fetchVATInvoicesIn: (
    filters?: any,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchVATInvoiceInById: (
    id: number,
  ) => Promise<{ data: any | null; error: any }>;
  createVATInvoiceIn: (
    invoiceData: any,
  ) => Promise<{ data: any | null; error: any }>;
  createBulkVATInvoicesIn: (
    invoices: any[],
  ) => Promise<{ data: any[] | null; error: any }>;
  updateVATInvoiceIn: (
    id: number,
    updates: any,
  ) => Promise<{ data: any | null; error: any }>;
  deleteVATInvoiceIn: (id: number) => Promise<{ error: any }>;

  // API Actions - Invoice Out
  fetchVATInvoicesOut: (
    filters?: any,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchVATInvoiceOutById: (
    id: number,
  ) => Promise<{ data: any | null; error: any }>;
  fetchVATInvoicesOutByB2BQuote: (
    b2bQuoteId: number,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchVATInvoicesOutBySaleOrder: (
    saleOrderId: string,
  ) => Promise<{ data: any[] | null; error: any }>;
  createVATInvoiceOut: (
    invoiceData: any,
  ) => Promise<{ data: any | null; error: any }>;
  createBulkVATInvoicesOut: (
    invoices: any[],
  ) => Promise<{ data: any[] | null; error: any }>;
  updateVATInvoiceOut: (
    id: number,
    updates: any,
  ) => Promise<{ data: any | null; error: any }>;
  issueVATInvoice: (
    id: number,
    invoiceDate?: string,
  ) => Promise<{ data: any[] | null; error: any }>;
  cancelVATInvoiceOut: (
    id: number,
  ) => Promise<{ data: any | null; error: any }>;
  deleteVATInvoiceOut: (id: number) => Promise<{ error: any }>;

  // API Actions - Summary
  fetchVATInventorySummary: (
    filters?: any,
  ) => Promise<{ data: any[] | null; error: any }>;
  fetchVATStatsByWarehouse: (
    warehouseId: number,
  ) => Promise<{ data: any | null; error: any }>;
  fetchOverallVATStats: () => Promise<{ data: any | null; error: any }>;

  // Utility
  clearCurrentVATInvoiceIn: () => void;
  clearCurrentVATInvoiceOut: () => void;
  clearError: () => void;
}

// Create store
export const useVATInvoiceStore = create<VATInvoiceState>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      vatInvoicesIn: [],
      currentVATInvoiceIn: null,
      isLoadingVATInvoicesIn: false,
      isLoadingVATInvoiceIn: false,
      vatInvoicesOut: [],
      currentVATInvoiceOut: null,
      isLoadingVATInvoicesOut: false,
      isLoadingVATInvoiceOut: false,
      vatInventorySummary: [],
      isLoadingVATSummary: false,
      isSaving: false,
      error: null,

      // Simple setters - Invoice In
      setVATInvoicesIn: (invoices) =>
        set(
          (state) => {
            state.vatInvoicesIn = invoices;
          },
          false,
          "setVATInvoicesIn",
        ),

      setCurrentVATInvoiceIn: (invoice) =>
        set(
          (state) => {
            state.currentVATInvoiceIn = invoice;
          },
          false,
          "setCurrentVATInvoiceIn",
        ),

      setLoadingVATInvoicesIn: (isLoading) =>
        set(
          (state) => {
            state.isLoadingVATInvoicesIn = isLoading;
          },
          false,
          "setLoadingVATInvoicesIn",
        ),

      setLoadingVATInvoiceIn: (isLoading) =>
        set(
          (state) => {
            state.isLoadingVATInvoiceIn = isLoading;
          },
          false,
          "setLoadingVATInvoiceIn",
        ),

      // Simple setters - Invoice Out
      setVATInvoicesOut: (invoices) =>
        set(
          (state) => {
            state.vatInvoicesOut = invoices;
          },
          false,
          "setVATInvoicesOut",
        ),

      setCurrentVATInvoiceOut: (invoice) =>
        set(
          (state) => {
            state.currentVATInvoiceOut = invoice;
          },
          false,
          "setCurrentVATInvoiceOut",
        ),

      setLoadingVATInvoicesOut: (isLoading) =>
        set(
          (state) => {
            state.isLoadingVATInvoicesOut = isLoading;
          },
          false,
          "setLoadingVATInvoicesOut",
        ),

      setLoadingVATInvoiceOut: (isLoading) =>
        set(
          (state) => {
            state.isLoadingVATInvoiceOut = isLoading;
          },
          false,
          "setLoadingVATInvoiceOut",
        ),

      // Simple setters - Summary
      setVATInventorySummary: (summary) =>
        set(
          (state) => {
            state.vatInventorySummary = summary;
          },
          false,
          "setVATInventorySummary",
        ),

      setLoadingVATSummary: (isLoading) =>
        set(
          (state) => {
            state.isLoadingVATSummary = isLoading;
          },
          false,
          "setLoadingVATSummary",
        ),

      // Common setters
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

      // API Actions - Invoice In
      fetchVATInvoicesIn: async (filters?: any) => {
        const { setLoadingVATInvoicesIn, setVATInvoicesIn, setError } = get();

        setLoadingVATInvoicesIn(true);
        setError(null);

        try {
          const { getAllVATInvoicesIn } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getAllVATInvoicesIn(filters);

          if (error) {
            setError(error.message || "Failed to fetch VAT invoices in");
            setVATInvoicesIn([]);
            return { data: null, error };
          }

          setVATInvoicesIn(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch VAT invoices in";
          setError(errorMsg);
          setVATInvoicesIn([]);
          return { data: null, error };
        } finally {
          setLoadingVATInvoicesIn(false);
        }
      },

      fetchVATInvoiceInById: async (id: number) => {
        const { setLoadingVATInvoiceIn, setCurrentVATInvoiceIn, setError } =
          get();

        setLoadingVATInvoiceIn(true);
        setError(null);

        try {
          const { getVATInvoiceInById } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getVATInvoiceInById(id);

          if (error) {
            setError(error.message || "Failed to fetch VAT invoice in");
            setCurrentVATInvoiceIn(null);
            return { data: null, error };
          }

          setCurrentVATInvoiceIn(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch VAT invoice in";
          setError(errorMsg);
          setCurrentVATInvoiceIn(null);
          return { data: null, error };
        } finally {
          setLoadingVATInvoiceIn(false);
        }
      },

      createVATInvoiceIn: async (invoiceData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createVATInvoiceIn } = await import("@nam-viet-erp/services");
          const { data, error } = await createVATInvoiceIn(invoiceData);

          if (error) {
            setError(error.message || "Failed to create VAT invoice in");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create VAT invoice in";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      createBulkVATInvoicesIn: async (invoices: any[]) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createBulkVATInvoicesIn } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await createBulkVATInvoicesIn(invoices);

          if (error) {
            setError(error.message || "Failed to create bulk VAT invoices in");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to create bulk VAT invoices in";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updateVATInvoiceIn: async (id: number, updates: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateVATInvoiceIn } = await import("@nam-viet-erp/services");
          const { data, error } = await updateVATInvoiceIn(id, updates);

          if (error) {
            setError(error.message || "Failed to update VAT invoice in");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update VAT invoice in";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deleteVATInvoiceIn: async (id: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteVATInvoiceIn } = await import("@nam-viet-erp/services");
          const { error } = await deleteVATInvoiceIn(id);

          if (error) {
            setError(error.message || "Failed to delete VAT invoice in");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete VAT invoice in";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      // API Actions - Invoice Out
      fetchVATInvoicesOut: async (filters?: any) => {
        const { setLoadingVATInvoicesOut, setVATInvoicesOut, setError } = get();

        setLoadingVATInvoicesOut(true);
        setError(null);

        try {
          const { getAllVATInvoicesOut } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getAllVATInvoicesOut(filters);

          if (error) {
            setError(error.message || "Failed to fetch VAT invoices out");
            setVATInvoicesOut([]);
            return { data: null, error };
          }

          setVATInvoicesOut(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch VAT invoices out";
          setError(errorMsg);
          setVATInvoicesOut([]);
          return { data: null, error };
        } finally {
          setLoadingVATInvoicesOut(false);
        }
      },

      fetchVATInvoiceOutById: async (id: number) => {
        const { setLoadingVATInvoiceOut, setCurrentVATInvoiceOut, setError } =
          get();

        setLoadingVATInvoiceOut(true);
        setError(null);

        try {
          const { getVATInvoiceOutById } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getVATInvoiceOutById(id);

          if (error) {
            setError(error.message || "Failed to fetch VAT invoice out");
            setCurrentVATInvoiceOut(null);
            return { data: null, error };
          }

          setCurrentVATInvoiceOut(data);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to fetch VAT invoice out";
          setError(errorMsg);
          setCurrentVATInvoiceOut(null);
          return { data: null, error };
        } finally {
          setLoadingVATInvoiceOut(false);
        }
      },

      fetchVATInvoicesOutByB2BQuote: async (b2bQuoteId: number) => {
        const { setVATInvoicesOut, setError } = get();

        setError(null);

        try {
          const { getVATInvoicesOutByB2BQuote } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getVATInvoicesOutByB2BQuote(b2bQuoteId);

          if (error) {
            setError(
              error.message || "Failed to fetch VAT invoices by B2B quote",
            );
            return { data: null, error };
          }

          setVATInvoicesOut(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch VAT invoices by B2B quote";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchVATInvoicesOutBySaleOrder: async (saleOrderId: string) => {
        const { setVATInvoicesOut, setError } = get();

        setError(null);

        try {
          const { getVATInvoicesOutBySaleOrder } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } =
            await getVATInvoicesOutBySaleOrder(saleOrderId);

          if (error) {
            setError(
              error.message || "Failed to fetch VAT invoices by sale order",
            );
            return { data: null, error };
          }

          setVATInvoicesOut(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch VAT invoices by sale order";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      createVATInvoiceOut: async (invoiceData: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createVATInvoiceOut } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await createVATInvoiceOut(invoiceData);

          if (error) {
            setError(error.message || "Failed to create VAT invoice out");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to create VAT invoice out";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      createBulkVATInvoicesOut: async (invoices: any[]) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { createBulkVATInvoicesOut } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await createBulkVATInvoicesOut(invoices);

          if (error) {
            setError(error.message || "Failed to create bulk VAT invoices out");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to create bulk VAT invoices out";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      updateVATInvoiceOut: async (id: number, updates: any) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { updateVATInvoiceOut } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await updateVATInvoiceOut(id, updates);

          if (error) {
            setError(error.message || "Failed to update VAT invoice out");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to update VAT invoice out";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      issueVATInvoice: async (id: number, invoiceDate?: string) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { issueVATInvoice } = await import("@nam-viet-erp/services");
          const { data, error } = await issueVATInvoice(id, invoiceDate);

          if (error) {
            setError(error.message || "Failed to issue VAT invoice");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to issue VAT invoice";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      cancelVATInvoiceOut: async (id: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { cancelVATInvoiceOut } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await cancelVATInvoiceOut(id);

          if (error) {
            setError(error.message || "Failed to cancel VAT invoice out");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to cancel VAT invoice out";
          setError(errorMsg);
          return { data: null, error };
        } finally {
          setSaving(false);
        }
      },

      deleteVATInvoiceOut: async (id: number) => {
        const { setSaving, setError } = get();

        setSaving(true);
        setError(null);

        try {
          const { deleteVATInvoiceOut } = await import(
            "@nam-viet-erp/services"
          );
          const { error } = await deleteVATInvoiceOut(id);

          if (error) {
            setError(error.message || "Failed to delete VAT invoice out");
            return { error };
          }

          return { error: null };
        } catch (error: any) {
          const errorMsg = error?.message || "Failed to delete VAT invoice out";
          setError(errorMsg);
          return { error };
        } finally {
          setSaving(false);
        }
      },

      // API Actions - Summary
      fetchVATInventorySummary: async (filters?: any) => {
        const { setLoadingVATSummary, setVATInventorySummary, setError } =
          get();

        setLoadingVATSummary(true);
        setError(null);

        try {
          const { getVATInventorySummary } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getVATInventorySummary(filters);

          if (error) {
            setError(error.message || "Failed to fetch VAT inventory summary");
            setVATInventorySummary([]);
            return { data: null, error };
          }

          setVATInventorySummary(data || []);
          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch VAT inventory summary";
          setError(errorMsg);
          setVATInventorySummary([]);
          return { data: null, error };
        } finally {
          setLoadingVATSummary(false);
        }
      },

      fetchVATStatsByWarehouse: async (warehouseId: number) => {
        const { setError } = get();

        setError(null);

        try {
          const { getVATStatsByWarehouse } = await import(
            "@nam-viet-erp/services"
          );
          const { data, error } = await getVATStatsByWarehouse(warehouseId);

          if (error) {
            setError(error.message || "Failed to fetch VAT stats by warehouse");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch VAT stats by warehouse";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      fetchOverallVATStats: async () => {
        const { setError } = get();

        setError(null);

        try {
          const { getOverallVATStats } = await import("@nam-viet-erp/services");
          const { data, error } = await getOverallVATStats();

          if (error) {
            setError(error.message || "Failed to fetch overall VAT stats");
            return { data: null, error };
          }

          return { data, error: null };
        } catch (error: any) {
          const errorMsg =
            error?.message || "Failed to fetch overall VAT stats";
          setError(errorMsg);
          return { data: null, error };
        }
      },

      // Utility
      clearCurrentVATInvoiceIn: () =>
        set(
          (state) => {
            state.currentVATInvoiceIn = null;
          },
          false,
          "clearCurrentVATInvoiceIn",
        ),

      clearCurrentVATInvoiceOut: () =>
        set(
          (state) => {
            state.currentVATInvoiceOut = null;
          },
          false,
          "clearCurrentVATInvoiceOut",
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
      name: "VATInvoiceStore",
    },
  ),
);

// Selectors
export const useVATInvoicesIn = () =>
  useVATInvoiceStore((state) => state.vatInvoicesIn);
export const useCurrentVATInvoiceIn = () =>
  useVATInvoiceStore((state) => state.currentVATInvoiceIn);
export const useVATInvoicesOut = () =>
  useVATInvoiceStore((state) => state.vatInvoicesOut);
export const useCurrentVATInvoiceOut = () =>
  useVATInvoiceStore((state) => state.currentVATInvoiceOut);
export const useVATInventorySummary = () =>
  useVATInvoiceStore((state) => state.vatInventorySummary);
export const useIsLoadingVATInvoicesIn = () =>
  useVATInvoiceStore((state) => state.isLoadingVATInvoicesIn);
export const useIsLoadingVATInvoiceIn = () =>
  useVATInvoiceStore((state) => state.isLoadingVATInvoiceIn);
export const useIsLoadingVATInvoicesOut = () =>
  useVATInvoiceStore((state) => state.isLoadingVATInvoicesOut);
export const useIsLoadingVATInvoiceOut = () =>
  useVATInvoiceStore((state) => state.isLoadingVATInvoiceOut);
export const useIsLoadingVATSummary = () =>
  useVATInvoiceStore((state) => state.isLoadingVATSummary);
export const useIsSavingVATInvoice = () =>
  useVATInvoiceStore((state) => state.isSaving);
export const useVATInvoiceError = () =>
  useVATInvoiceStore((state) => state.error);
