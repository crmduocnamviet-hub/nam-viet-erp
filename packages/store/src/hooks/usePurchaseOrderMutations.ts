import useSubmitQuery from "./useSubmitQuery";
import {
  updatePurchaseOrder,
  createSupplier,
  updatePurchaseOrderItem,
  addPurchaseOrderItems,
  deletePurchaseOrderItem,
} from "@nam-viet-erp/services";

interface UpdatePurchaseOrderParams {
  id: number;
  updates: {
    supplier_id?: number;
    order_date?: string;
    expected_delivery_date?: string;
    status?:
      | "draft"
      | "sent"
      | "ordered"
      | "partially_received"
      | "received"
      | "cancelled";
    notes?: string;
    total_amount?: number;
  };
}

// interface CreateSupplierParams {
//   name: string;
//   email?: string | null;
//   phone?: string | null;
//   address?: string | null;
//   tax_code?: string | null;
//   contact_person?: string | null;
//   payment_terms?: string | null;
//   is_active: boolean;
// }

interface UpdatePurchaseOrderItemParams {
  itemId: number;
  quantity: number;
}

interface AddPurchaseOrderItemsParams {
  purchaseOrderId: number;
  items: Array<{
    product_id: number;
    quantity: number;
  }>;
}

interface DeletePurchaseOrderItemParams {
  itemId: number;
}

interface POItem {
  id?: number;
  product_id: number;
  quantity: number;
  received_quantity?: number;
  product?: {
    id: number;
    name: string;
    sku?: string;
    wholesale_price?: number;
  };
  isNew?: boolean;
}

interface SavePurchaseOrderParams {
  purchaseOrderId: number;
  originalItems: POItem[];
  currentItems: POItem[];
  formValues: {
    supplier_id: number | string;
    order_date?: any;
    expected_delivery_date?: any;
    status:
      | "draft"
      | "sent"
      | "ordered"
      | "partially_received"
      | "received"
      | "cancelled";
    notes?: string;
  };
  isCreatingNewSupplier: boolean;
  newSupplierName: string;
}

/**
 * Hook to update a purchase order
 */
export const useUpdatePurchaseOrder = (callbacks?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<UpdatePurchaseOrderParams, any>({
    key: ["update-purchase-order"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const { id, updates } = params;
      const response = await updatePurchaseOrder(id, updates);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Hook to create a new supplier
 */
export const useCreateSupplier = (callbacks?: {
  onSuccess?: (supplier: any) => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<
    Omit<ISupplier, "id" | "created_at" | "updated_at">,
    any
  >({
    key: ["create-supplier"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const response = await createSupplier(params as any);
      if (response.error || !response.data) {
        throw new Error("Không thể tạo nhà cung cấp mới");
      }
      return response.data;
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Hook to update a purchase order item
 */
export const useUpdatePurchaseOrderItem = (callbacks?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<UpdatePurchaseOrderItemParams, any>({
    key: ["update-purchase-order-item"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const { itemId, quantity } = params;
      return await updatePurchaseOrderItem(itemId, quantity);
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Hook to add items to a purchase order
 */
export const useAddPurchaseOrderItems = (callbacks?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<AddPurchaseOrderItemsParams, any>({
    key: ["add-purchase-order-items"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const { purchaseOrderId, items } = params;
      return await addPurchaseOrderItems(purchaseOrderId, items);
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Hook to delete a purchase order item
 */
export const useDeletePurchaseOrderItem = (callbacks?: {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<DeletePurchaseOrderItemParams, any>({
    key: ["delete-purchase-order-item"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const { itemId } = params;
      return await deletePurchaseOrderItem(itemId);
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};

/**
 * Comprehensive hook to handle the entire save purchase order flow
 * This includes:
 * - Creating supplier if needed
 * - Updating purchase order header
 * - Managing items (delete removed, update existing, add new)
 *
 * Usage example:
 * ```typescript
 * const { submit: savePurchaseOrder, isLoading } = useSavePurchaseOrder({
 *   onSuccess: () => navigate('/warehouse/purchase-orders'),
 *   onError: (error) => notification.error({ message: error.message })
 * });
 *
 * await savePurchaseOrder({
 *   purchaseOrderId,
 *   originalItems: purchaseOrder.items,
 *   currentItems: items,
 *   formValues,
 *   isCreatingNewSupplier,
 *   newSupplierName
 * });
 * ```
 */
export const useSavePurchaseOrder = (callbacks?: {
  onSuccess?: (result?: { newSupplierName?: string }) => void;
  onError?: (error: any) => void;
}) => {
  return useSubmitQuery<SavePurchaseOrderParams, { newSupplierName?: string }>({
    key: ["save-purchase-order"],
    onSubmit: async (params) => {
      if (!params) {
        throw new Error("Missing parameters");
      }
      const {
        purchaseOrderId,
        originalItems,
        currentItems,
        formValues,
        isCreatingNewSupplier,
        newSupplierName,
      } = params;
      // Validation: Check if items exist
      if (currentItems.length === 0) {
        throw new Error("Đơn hàng phải có ít nhất một sản phẩm");
      }

      // Validation: Check supplier name if creating new
      if (isCreatingNewSupplier && !newSupplierName.trim()) {
        throw new Error("Vui lòng nhập tên nhà cung cấp");
      }

      // Calculate total amount
      const totalAmount = currentItems.reduce((total, item) => {
        const price = item.product?.wholesale_price || 0;
        return total + price * item.quantity;
      }, 0);

      let supplierId = formValues.supplier_id;
      let createdSupplierName: string | undefined;

      // Step 1: Create new supplier if needed
      if (isCreatingNewSupplier && formValues.supplier_id === "new") {
        const response = await createSupplier({
          name: newSupplierName.trim(),
          email: undefined,
          phone: undefined,
          address: undefined,
          tax_code: undefined,
          contact_person: undefined,
          payment_terms: undefined,
          is_active: true,
        });

        if (response.error || !response.data) {
          throw new Error("Không thể tạo nhà cung cấp mới");
        }

        supplierId = response.data.id;
        createdSupplierName = newSupplierName.trim();
      }

      // Step 2: Update PO header
      const updates = {
        supplier_id: Number(supplierId),
        order_date: formValues.order_date?.format("YYYY-MM-DD"),
        expected_delivery_date:
          formValues.expected_delivery_date?.format("YYYY-MM-DD"),
        status: formValues.status,
        notes: formValues.notes,
        total_amount: totalAmount,
      };

      const poResponse = await updatePurchaseOrder(purchaseOrderId, updates);
      if (poResponse.error) {
        throw poResponse.error;
      }

      // Step 3: Handle items - determine what to delete, update, and add
      const originalItemIds = new Set(
        originalItems
          .map((item: POItem) => item.id)
          .filter((id: number | undefined): id is number => id !== undefined),
      );
      const currentItemIds = new Set(
        currentItems
          .filter((item: POItem) => item.id)
          .map((item: POItem) => item.id)
          .filter((id: number | undefined): id is number => id !== undefined),
      );

      // Delete removed items
      const itemsToDelete = Array.from(originalItemIds).filter(
        (itemId) => !currentItemIds.has(itemId),
      );
      for (const itemId of itemsToDelete) {
        await deletePurchaseOrderItem(itemId as number);
      }

      // Update existing items and add new ones
      for (const item of currentItems) {
        if (item.id && !item.isNew) {
          // Update existing item
          await updatePurchaseOrderItem(item.id, item.quantity);
        } else if (item.isNew) {
          // Add new item
          await addPurchaseOrderItems(purchaseOrderId, [
            { product_id: item.product_id, quantity: item.quantity },
          ]);
        }
      }

      return { newSupplierName: createdSupplierName };
    },
    onSuccess: callbacks?.onSuccess,
    onError: callbacks?.onError,
  });
};
