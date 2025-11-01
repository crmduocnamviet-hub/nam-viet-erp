import { useQuery } from "..";
import { FETCH_QUERY_KEY } from "../constants";
import {
  getAllVATInvoicesIn,
  getVATInvoiceInById,
  getAllVATInvoicesOut,
  getVATInvoiceOutById,
  getVATInventorySummary,
  createBulkVATInvoicesIn,
  createBulkVATInvoicesOut,
} from "@nam-viet-erp/services";
import useSubmitQuery from "./useSubmitQuery";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";
import useFetchStore from "../fetchStore";
import { getQueryKey } from "./useQuery";
import { useVATInvoiceStore } from "../vatInvoiceStore";

// Hook to fetch VAT invoices in
export const useVATInvoicesIn = (filters?: any) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VAT_INVOICES_IN, filters],
    queryFn: async () => {
      const { data } = await getAllVATInvoicesIn(filters);
      if (data) {
        useVATInvoiceStore.getState().setVATInvoicesIn(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch single VAT invoice in by ID
export const useVATInvoiceIn = (id: number) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.VAT_INVOICE_IN, id],
    queryFn: async () => {
      const { data } = await getVATInvoiceInById(id);
      if (data) {
        useVATInvoiceStore.getState().setCurrentVATInvoiceIn(data);
      }
      return data;
    },
  });
};

// Hook to fetch VAT invoices out
export const useVATInvoicesOut = (filters?: any) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VAT_INVOICES_OUT, filters],
    queryFn: async () => {
      const { data } = await getAllVATInvoicesOut(filters);
      if (data) {
        useVATInvoiceStore.getState().setVATInvoicesOut(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch single VAT invoice out by ID
export const useVATInvoiceOut = (id: number) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.VAT_INVOICE_OUT, id],
    queryFn: async () => {
      const { data } = await getVATInvoiceOutById(id);
      if (data) {
        useVATInvoiceStore.getState().setCurrentVATInvoiceOut(data);
      }
      return data;
    },
  });
};

// Hook to fetch VAT inventory summary
export const useVATInventorySummary = (filters?: any) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VAT_INVENTORY_SUMMARY, filters],
    queryFn: async () => {
      const { data } = await getVATInventorySummary(filters);
      if (data) {
        useVATInvoiceStore.getState().setVATInventorySummary(data);
      }
      return data || [];
    },
  });
};

// Hook to create VAT invoice in
export const useCreateVATInvoiceIn = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_IN])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_VAT_INVOICE_IN],
    onSubmit: async (invoiceData: any) => {
      const result = await useVATInvoiceStore
        .getState()
        .createVATInvoiceIn(invoiceData);
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

  return { createVATInvoiceIn: submit, isLoading };
};

// Hook to update VAT invoice in
export const useUpdateVATInvoiceIn = ({
  invoiceId,
  onSuccess,
  onError,
}: {
  invoiceId: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_IN])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_VAT_INVOICE_IN, invoiceId],
    onSubmit: async (updates: any) => {
      const result = await useVATInvoiceStore
        .getState()
        .updateVATInvoiceIn(invoiceId, updates);
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

  return { updateVATInvoiceIn: submit, isLoading };
};

// Hook to create VAT invoice out
export const useCreateVATInvoiceOut = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_OUT])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_VAT_INVOICE_OUT],
    onSubmit: async (invoiceData: any) => {
      const result = await useVATInvoiceStore
        .getState()
        .createVATInvoiceOut(invoiceData);
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

  return { createVATInvoiceOut: submit, isLoading };
};

// Hook to delete VAT invoice in
export const useDeleteVATInvoiceIn = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_IN])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_VAT_INVOICE_IN],
    onSubmit: async (invoiceId: number) => {
      const result = await useVATInvoiceStore
        .getState()
        .deleteVATInvoiceIn(invoiceId);
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

  return { deleteVATInvoiceIn: submit, isLoading };
};

// Hook to update VAT invoice out
export const useUpdateVATInvoiceOut = ({
  invoiceId,
  onSuccess,
  onError,
}: {
  invoiceId: number;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_OUT])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_VAT_INVOICE_OUT, invoiceId],
    onSubmit: async (updates: any) => {
      const result = await useVATInvoiceStore
        .getState()
        .updateVATInvoiceOut(invoiceId, updates);
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

  return { updateVATInvoiceOut: submit, isLoading };
};

// Hook to issue VAT invoice
export const useIssueVATInvoice = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_OUT])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.ISSUE_VAT_INVOICE],
    onSubmit: async ({
      id,
      invoiceDate,
    }: {
      id: number;
      invoiceDate?: string;
    }) => {
      const result = await useVATInvoiceStore
        .getState()
        .issueVATInvoice(id, invoiceDate);
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

  return { issueVATInvoice: submit, isLoading };
};

// Hook to cancel VAT invoice out
export const useCancelVATInvoiceOut = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_OUT])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CANCEL_VAT_INVOICE_OUT],
    onSubmit: async (invoiceId: number) => {
      const result = await useVATInvoiceStore
        .getState()
        .cancelVATInvoiceOut(invoiceId);
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

  return { cancelVATInvoiceOut: submit, isLoading };
};

// Hook to delete VAT invoice out
export const useDeleteVATInvoiceOut = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetch = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VAT_INVOICES_OUT])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_VAT_INVOICE_OUT],
    onSubmit: async (invoiceId: number) => {
      const result = await useVATInvoiceStore
        .getState()
        .deleteVATInvoiceOut(invoiceId);
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

  return { deleteVATInvoiceOut: submit, isLoading };
};

// Hook to fetch VAT invoices out by B2B quote
export const useVATInvoicesOutByB2BQuote = (b2bQuoteId: number) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VAT_INVOICES_OUT, "b2b", b2bQuoteId],
    queryFn: async () => {
      const { data } = await useVATInvoiceStore
        .getState()
        .fetchVATInvoicesOutByB2BQuote(b2bQuoteId);
      return data || [];
    },
  });
};

// Hook to fetch VAT invoices out by sale order
export const useVATInvoicesOutBySaleOrder = (saleOrderId: string) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VAT_INVOICES_OUT, "sale", saleOrderId],
    queryFn: async () => {
      const { data } = await useVATInvoiceStore
        .getState()
        .fetchVATInvoicesOutBySaleOrder(saleOrderId);
      return data || [];
    },
  });
};
