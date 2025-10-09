import { FETCH_QUERY_KEY, useQuery, useSubmitQuery } from "..";
import {
  fetchProductLot,
  getProductLots,
  updateProductLotQuantity,
} from "@nam-viet-erp/services";
import { FETCH_SUBMIT_QUERY_KEY } from "../constants";

export const useProductLot = (lotId: number | null) => {
  const { data, isLoading, isError, error, refetch } =
    useQuery<IProductLot | null>({
      key: [FETCH_QUERY_KEY.PRODUCT_LOT, lotId!],
      queryFn: async () => {
        // Handle default lot (lotId is null)
        if (!lotId) {
          return null;
        }

        const result = await fetchProductLot(lotId);
        if (!result) throw new Error("Không tìm thấy thông tin lô hàng");
        return result;
      },
      // Don't fetch if lotId is null (default lot)
      disableCache: !lotId,
    });

  return { data, isLoading, isError, error, refetch };
};

export const useFilterProductLot = (
  productId: number,
  filterWarehoused?: string | number,
) => {
  const { data, isLoading, isError, error, refetch } = useQuery<IProductLot[]>({
    key: [FETCH_QUERY_KEY.PRODUCT_LOT, productId!, filterWarehoused],
    queryFn: async () => {
      const result = await getProductLots({
        productId: productId,
        warehouseId: (filterWarehoused === "all"
          ? undefined
          : filterWarehoused) as never,
      });
      ((ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
      })(1000);
      return result.data;
    },
    gcTime: 0, // Don't cache - always fetch fresh data after mutations
    disableCache: true,
  });

  return { data, isLoading, isError, error, refetch };
};

export const useUpdateQuantityByLot = ({
  lotId,
  onError,
  onSuccess,
}: {
  lotId: number | null;
  onError?: (e) => any;
  onSuccess?: () => any;
}) => {
  const { submit, isLoading } = useSubmitQuery({
    key: [FETCH_SUBMIT_QUERY_KEY.UPDATE_INVENTORY_BY_LOT, lotId],
    onSubmit: async (params: {
      lotId: number | null;
      productId: number;
      warehouseId: number;
      newQuantityAvailable: number;
    }) => {
      try {
        const { error } = await updateProductLotQuantity({
          lotId: params.lotId,
          productId: params.productId,
          warehouseId: params.warehouseId,
          newQuantityAvailable: params.newQuantityAvailable,
        });

        if (error) {
          throw error;
        }

        return { error: null };
      } catch (error: any) {
        throw error;
      }
    },
    onError(e) {
      onError?.(e);
    },
    onSuccess: () => {
      //Refetch product with inventory
      //   refetchProductWithInventory?.();
      //Run if success
      onSuccess?.();
    },
  });

  return { submit, isLoading };
};

const useDeleteProductLot = () => {};
