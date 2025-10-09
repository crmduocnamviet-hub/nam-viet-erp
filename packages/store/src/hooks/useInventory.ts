import { FETCH_QUERY_KEY, useQuery } from "..";

export const useInventoryOfWarehouseByLotId = (lotId: number) => {
  const { data, isLoading, isError, error, refetch } = useQuery<IInventory[]>({
    key: [FETCH_QUERY_KEY.INVENTORY_BY_LOT, lotId!],
    queryFn: async () => {
      // const result = await fetchInventoryByLotId(lotId);
      // return result as IInventory[];
      return null;
    },
  });

  return { data, isLoading, isError, error, refetch };
};
