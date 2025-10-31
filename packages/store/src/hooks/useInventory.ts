import {
  addWarehouseTransferItem,
  approveWarehouseTransfer,
  cancelWarehouseTransfer,
  deleteWarehouseTransferItem,
  getWarehouseTransferById,
  receiveWarehouseTransfer,
  sendWarehouseTransfer,
  submitWarehouseTransfer,
} from "@nam-viet-erp/services";
import { FETCH_QUERY_KEY, useQuery, useSubmitQuery } from "..";

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

export const useTransferProduct = () => {};

export const useTransferProductData = (transferId: number) => {
  return useQuery<IWarehouseTransferWithDetails>({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId],
    disableCache: true,
    async queryFn() {
      const { data } = await getWarehouseTransferById(transferId);
      return data;
    },
  });
};

export const useSubmitWarehouseTransfer = (
  transferId: number,
  options?: { onSuccess?: () => void; onError?: (error: any) => void },
) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId, "submit"],
    onSubmit: () => submitWarehouseTransfer(transferId),
    ...options,
  });
};

export const useApproveWarehouseTransfer = (
  transferId: number,
  options?: { onSuccess?: () => void; onError?: (error: any) => void },
) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId, "approve"],
    onSubmit: () => approveWarehouseTransfer(transferId),
    ...options,
  });
};

export const useCancelWarehouseTransfer = (
  transferId: number,
  options?: { onSuccess?: () => void; onError?: (error: any) => void },
) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId, "cancel"],
    onSubmit: (rejectionReason?: string) =>
      cancelWarehouseTransfer(transferId, rejectionReason),
    ...options,
  });
};

export const useSendWarehouseTransfer = (
  transferId: number,
  options?: { onSuccess?: () => void; onError?: (error: any) => void },
) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId, "send"],
    onSubmit: async (sendData: ISendWarehouseTransfer) => {
      const res = await sendWarehouseTransfer(transferId, sendData);
      return res;
    },
    ...options,
  });
};

export const useReceiveWarehouseTransfer = (
  transferId: number,
  options?: { onSuccess?: () => void; onError?: (error: any) => void },
) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId, "receive"],
    onSubmit: (receiveData: IReceiveWarehouseTransfer) =>
      receiveWarehouseTransfer(transferId, receiveData),
    ...options,
  });
};

export const useAddWarehouseTransferItem = (
  transferId: number,
  options?: { onSuccess?: () => void; onError?: (error: any) => void },
) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, transferId, "addItem"],
    onSubmit: (itemData: {
      product_id: number;
      lot_id?: number | null;
      quantity_requested: number;
      unit_price?: number;
      notes?: string;
    }) => addWarehouseTransferItem(transferId, itemData),
    ...options,
  });
};

export const useDeleteWarehouseTransferItem = (options?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery({
    key: [FETCH_QUERY_KEY.TRANSFER, "deleteItem"],
    onSubmit: (itemId: number) => deleteWarehouseTransferItem(itemId),
    ...options,
  });
};
