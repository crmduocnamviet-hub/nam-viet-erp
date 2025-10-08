import { FETCH_QUERY_KEY, useQuery } from "..";
import { fetchProductLot } from "@nam-viet-erp/services";

export const useProductLot = (lotId: number) => {
  const { data, isLoading, isError, error } = useQuery<IProductLot>({
    key: [FETCH_QUERY_KEY.PRODUCT_LOT, lotId!],
    queryFn: async () => {
      const result = await fetchProductLot(lotId);
      if (!result) throw new Error("Không tìm thấy thông tin lô hàng");
      return result;
    },
  });

  return { data, isLoading, isError, error };
};
