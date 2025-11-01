import { useQuery } from "..";
import { FETCH_QUERY_KEY } from "../constants";
import {
  getPromotions,
  getPromotionDetail,
  getVouchers,
  getVouchersWithPromotion,
  getActivePromotions,
  getPromoCodes,
  getPromotionFilterOptions,
} from "@nam-viet-erp/services";
import useSubmitQuery from "./useSubmitQuery";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";
import useFetchStore from "../fetchStore";
import { getQueryKey } from "./useQuery";
import { usePromotionStore } from "../promotionStore";

// Hook to fetch all promotions
export const usePromotions = () => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.PROMOTIONS],
    queryFn: async () => {
      const { data } = await getPromotions();
      if (data) {
        usePromotionStore.getState().setPromotions(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch single promotion by ID
export const usePromotion = (id: string) => {
  return useQuery<any>({
    key: [FETCH_QUERY_KEY.PROMOTION, id],
    queryFn: async () => {
      const data = await getPromotionDetail(id);
      if (data) {
        usePromotionStore.getState().setCurrentPromotion(data);
      }
      return data;
    },
  });
};

// Hook to fetch vouchers for a promotion
export const useVouchers = (promoId: string) => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VOUCHERS, promoId],
    queryFn: async () => {
      const data = await getVouchers(promoId);
      if (data) {
        usePromotionStore.getState().setVouchers(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch all vouchers with promotion info
export const useVouchersWithPromotion = () => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.VOUCHERS_WITH_PROMOTION],
    queryFn: async () => {
      const { data } = await getVouchersWithPromotion();
      if (data) {
        usePromotionStore.getState().setVouchers(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch active promotions
export const useActivePromotions = () => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.ACTIVE_PROMOTIONS],
    queryFn: async () => {
      const { data } = await getActivePromotions();
      if (data) {
        usePromotionStore.getState().setActivePromotions(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch promo codes
export const usePromoCodes = () => {
  return useQuery<any[]>({
    key: [FETCH_QUERY_KEY.PROMO_CODES],
    queryFn: async () => {
      const { data } = await getPromoCodes();
      if (data) {
        usePromotionStore.getState().setPromoCodes(data);
      }
      return data || [];
    },
  });
};

// Hook to fetch filter options (categories and manufacturers)
export const usePromotionFilterOptions = () => {
  return useQuery<{ categories: any[]; manufacturers: any[] }>({
    key: [FETCH_QUERY_KEY.PROMOTION_FILTER_OPTIONS],
    queryFn: async () => {
      const data = await getPromotionFilterOptions();
      if (data) {
        usePromotionStore.getState().setFilterOptions(data);
      }
      return data;
    },
  });
};

// Hook to create promotion
export const useCreatePromotion = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetchPromotions = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PROMOTIONS])]?.fetch ??
      null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_PROMOTION],
    onSubmit: async (promotionData: any) => {
      const result = await usePromotionStore
        .getState()
        .createPromotion(promotionData);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetchPromotions?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { createPromotion: submit, isLoading };
};

// Hook to update promotion
export const useUpdatePromotion = ({
  promotionId,
  onSuccess,
  onError,
}: {
  promotionId: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetchPromotions = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PROMOTIONS])]?.fetch ??
      null,
  );
  const refetchPromotion = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PROMOTION, promotionId])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_PROMOTION, promotionId],
    onSubmit: async (promotionData: any) => {
      const result = await usePromotionStore
        .getState()
        .updatePromotion(promotionId, promotionData);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      refetchPromotions?.();
      refetchPromotion?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { updatePromotion: submit, isLoading };
};

// Hook to delete promotion
export const useDeletePromotion = ({
  onSuccess,
  onError,
}: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetchPromotions = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.PROMOTIONS])]?.fetch ??
      null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_PROMOTION],
    onSubmit: async (promotionId: number) => {
      const result = await usePromotionStore
        .getState()
        .deletePromotion(promotionId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      refetchPromotions?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { deletePromotion: submit, isLoading };
};

// Hook to create voucher
export const useCreateVoucher = ({
  promoId,
  onSuccess,
  onError,
}: {
  promoId?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetchVouchers = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VOUCHERS, promoId || ""])]
        ?.fetch ?? null,
  );
  const refetchVouchersWithPromotion = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VOUCHERS_WITH_PROMOTION])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.CREATE_VOUCHER],
    onSubmit: async (voucherData: any) => {
      const result = await usePromotionStore
        .getState()
        .createVoucher(voucherData);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      if (promoId) refetchVouchers?.();
      refetchVouchersWithPromotion?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { createVoucher: submit, isLoading };
};

// Hook to update voucher
export const useUpdateVoucher = ({
  promoId,
  onSuccess,
  onError,
}: {
  promoId?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetchVouchers = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VOUCHERS, promoId || ""])]
        ?.fetch ?? null,
  );
  const refetchVouchersWithPromotion = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VOUCHERS_WITH_PROMOTION])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_VOUCHER],
    onSubmit: async ({ id, voucherData }: { id: number; voucherData: any }) => {
      const result = await usePromotionStore
        .getState()
        .updateVoucher(id, voucherData);
      if (result.error) throw result.error;
      return result.data;
    },
    onSuccess: () => {
      if (promoId) refetchVouchers?.();
      refetchVouchersWithPromotion?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { updateVoucher: submit, isLoading };
};

// Hook to delete voucher
export const useDeleteVoucher = ({
  promoId,
  onSuccess,
  onError,
}: {
  promoId?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const refetchVouchers = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VOUCHERS, promoId || ""])]
        ?.fetch ?? null,
  );
  const refetchVouchersWithPromotion = useFetchStore(
    (state) =>
      state.fetchData?.[getQueryKey([FETCH_QUERY_KEY.VOUCHERS_WITH_PROMOTION])]
        ?.fetch ?? null,
  );

  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.DELETE_VOUCHER],
    onSubmit: async (voucherId: number) => {
      const result = await usePromotionStore
        .getState()
        .deleteVoucher(voucherId);
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      if (promoId) refetchVouchers?.();
      refetchVouchersWithPromotion?.();
      onSuccess?.();
    },
    onError: (error) => {
      onError?.(error);
    },
  });

  return { deleteVoucher: submit, isLoading };
};

// Hook to validate promo code
export const useValidatePromoCode = () => {
  const validate = async (promoCode: string) => {
    return await usePromotionStore.getState().validatePromoCode(promoCode);
  };

  return { validate };
};

// Hook to apply promo code
export const useApplyPromoCode = () => {
  const apply = async (
    promoCode: string,
    orderValue: number,
    items?: any[],
  ) => {
    return await usePromotionStore
      .getState()
      .applyPromoCode(promoCode, orderValue, items);
  };

  return { apply };
};
